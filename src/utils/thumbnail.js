/**
 * Fast video thumbnail generation and metadata extraction.
 * Optimized for large files (100MB - 1GB+) with 'metadata' preloading,
 * shallow keyframe seeking (0.5s), and fast safety timeout fallback.
 *
 * @param {File|Blob} videoFile 
 * @param {number} seekTimeSec Target snapshot time (default 0.5s for instant keyframe access)
 * @returns {Promise<{ thumbnail: string, duration: number }>}
 */
export function generateVideoThumbnail(videoFile, seekTimeSec = 0.5) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoFile);
    
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    // Crucial: Use 'metadata' instead of 'auto' so browser only reads MP4 headers (a few KB),
    // NOT the entire 500MB+ video file into RAM!
    video.preload = 'metadata';

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

        // If the captured frame is pitch black, try seeking 1s further once
        if (isFrameBlack(ctx, canvas.width, canvas.height) && seekAttempts < 1 && video.duration > 2) {
          seekAttempts++;
          video.currentTime = Math.min(1.5, video.duration * 0.25);
          return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const duration = video.duration || 0;

        cleanup();
        resolve({ thumbnail: dataUrl, duration });
      } catch (err) {
        console.warn('Canvas capture error:', err);
        cleanup();
        resolve({
          thumbnail: createFastPlaceholderThumbnail(videoFile.name),
          duration: video.duration || 0,
        });
      }
    };

    // Fast safety timeout after 1.5s so slow decoders or unsupported codecs never hang the UI
    const timer = setTimeout(() => {
      captureCanvas();
    }, 1500);

    video.onloadedmetadata = () => {
      try {
        // Shallow seek (0.5s or 10% of short video) lands on earliest keyframe
        const targetTime = video.duration > 1 ? Math.min(seekTimeSec, video.duration * 0.15) : 0.1;
        video.currentTime = targetTime;
      } catch {
        captureCanvas();
      }
    };

    video.onseeked = () => {
      clearTimeout(timer);
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(() => {
          setTimeout(captureCanvas, 40);
        });
      } else {
        setTimeout(captureCanvas, 120);
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve({
        thumbnail: createFastPlaceholderThumbnail(videoFile.name),
        duration: 0,
      });
    };

    video.src = objectUrl;
  });
}

/**
 * Creates an instant, stylish placeholder thumbnail synchronously in < 1ms
 * without waiting for video decoding.
 */
export function createFastPlaceholderThumbnail(title = 'Video') {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');

    // Modern obsidian & indigo tech gradient
    const grad = ctx.createLinearGradient(0, 0, 480, 270);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 270);

    // Glowing circle accent
    ctx.beginPath();
    ctx.arc(240, 115, 38, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.fill();

    // Play icon triangle
    ctx.beginPath();
    ctx.moveTo(233, 98);
    ctx.lineTo(256, 115);
    ctx.lineTo(233, 132);
    ctx.closePath();
    ctx.fillStyle = '#06b6d4';
    ctx.fill();

    // Video title text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    const cleanTitle = title.length > 28 ? title.substring(0, 26) + '...' : title;
    ctx.fillText(cleanTitle, 240, 188);

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return '';
  }
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
