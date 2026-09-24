/**
 * Generates a high-quality thumbnail image (dataURL) and gets metadata (duration)
 * from a video File/Blob, with anti-black-frame detection and mobile GPU frame delay.
 *
 * @param {File|Blob} videoFile 
 * @param {number} seekTimeSec Target snapshot time in seconds (default 1.5s to bypass camera fade-in)
 * @returns {Promise<{ thumbnail: string, duration: number }>}
 */
export function generateVideoThumbnail(videoFile, seekTimeSec = 1.5) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoFile);
    
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';

    // Must be in DOM with realistic dimensions (> 100px) so iOS WebKit decodes frames
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '320px';
    video.style.height = '180px';
    video.style.opacity = '0.001';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    let isDone = false;
    let seekAttempts = 0;

    const cleanup = () => {
      if (isDone) return;
      isDone = true;
      URL.revokeObjectURL(objectUrl);
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    };

    const isFrameBlack = (ctx, width, height) => {
      try {
        const imgData = ctx.getImageData(0, 0, width, height).data;
        let totalLuminance = 0;
        const sampleStep = 60; // Sample every 15th pixel
        for (let i = 0; i < imgData.length; i += sampleStep) {
          totalLuminance += imgData[i] + imgData[i + 1] + imgData[i + 2];
          if (totalLuminance > 100) return false;
        }
        return totalLuminance < 100;
      } catch {
        return false;
      }
    };

    const captureCanvas = () => {
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const canvas = document.createElement('canvas');

        const maxWidth = 480;
        const scale = Math.min(1, maxWidth / width);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Check if the captured frame is completely black
        if (isFrameBlack(ctx, canvas.width, canvas.height) && seekAttempts < 2 && video.duration > 2) {
          seekAttempts++;
          // Seek further into the video (e.g. 2.5s or 40% into video)
          const newTarget = Math.min(seekTimeSec + seekAttempts * 1.5, video.duration * 0.5);
          video.currentTime = newTarget;
          return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const duration = video.duration || 0;

        cleanup();
        resolve({ thumbnail: dataUrl, duration });
      } catch (err) {
        console.warn('Canvas capture error:', err);
        cleanup();
        resolve({
          thumbnail: createFallbackThumbnail(videoFile.name),
          duration: video.duration || 0,
        });
      }
    };

    // Safety timeout after 4 seconds
    const timer = setTimeout(() => {
      captureCanvas();
    }, 4000);

    video.onloadedmetadata = () => {
      try {
        // Target 1.5s or 20% into video to avoid black intro
        const targetTime = video.duration > 3 
          ? Math.min(seekTimeSec, video.duration * 0.3) 
          : Math.max(0.2, video.duration * 0.2);
        video.currentTime = targetTime;
      } catch {
        captureCanvas();
      }
    };

    video.onseeked = () => {
      clearTimeout(timer);
      // Essential for iOS/Android: Wait 250ms for GPU decoder to paint frame to surface
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(() => {
          setTimeout(captureCanvas, 80);
        });
      } else {
        setTimeout(captureCanvas, 250);
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve({
        thumbnail: createFallbackThumbnail(videoFile.name),
        duration: 0,
      });
    };

    video.src = objectUrl;
    video.load();
  });
}

/**
 * Creates a clean canvas placeholder thumbnail with a gradient and video title
 */
function createFallbackThumbnail(title = 'Video') {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 270;
  const ctx = canvas.getContext('2d');

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 480, 270);
  grad.addColorStop(0, '#312e81');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 270);

  // Play icon circle
  ctx.beginPath();
  ctx.arc(240, 120, 36, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.fill();

  // Play triangle
  ctx.beginPath();
  ctx.moveTo(232, 104);
  ctx.lineTo(254, 120);
  ctx.lineTo(232, 136);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Text title
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
  ctx.textAlign = 'center';
  const cleanTitle = title.length > 26 ? title.substring(0, 24) + '...' : title;
  ctx.fillText(cleanTitle, 240, 190);

  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Format bytes into human readable format (MB/GB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  const sec = Math.round(seconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const sPad = s < 10 ? `0${s}` : `${s}`;
  if (m < 60) return `${m}:${sPad}`;
  const h = Math.floor(m / 60);
  const mRem = m % 60;
  const mPad = mRem < 10 ? `0${mRem}` : `${mRem}`;
  return `${h}:${mPad}:${sPad}`;
}
