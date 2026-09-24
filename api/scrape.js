export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  try {
    const targetUrl = decodeURIComponent(url);

    // 1. YOUTUBE SUPPORT (Instant regex, no network scrape required)
    const ytMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return res.status(200).json({
        thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
        title: 'YouTube Video',
        description: 'YouTube Video',
        source: 'youtube'
      });
    }

    // 2. TIKTOK SUPPORT (Official TikTok oEmbed API)
    if (targetUrl.includes('tiktok.com')) {
      try {
        const ttRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`);
        if (ttRes.ok) {
          const ttData = await ttRes.json();
          return res.status(200).json({
            thumbnail: ttData.thumbnail_url || null,
            title: ttData.title || (ttData.author_name ? `TikTok by @${ttData.author_name}` : 'TikTok Video'),
            description: ttData.author_name ? `By @${ttData.author_name} on TikTok` : 'TikTok Video',
            source: 'tiktok'
          });
        }
      } catch (ttErr) {
        console.warn('TikTok oEmbed fallback:', ttErr);
      }
    }

    // 3. SOCIAL MEDIA & GENERAL CRAWLER
    const isMeta = targetUrl.includes('instagram.com') || targetUrl.includes('facebook.com');
    const userAgent = isMeta 
      ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow'
    });

    const html = await response.text();

    const ogImageMatch = html.match(/<meta\s+[^>]*property=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:image|twitter:image)["']/i);
    const ogTitleMatch = html.match(/<meta\s+[^>]*property=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:title|twitter:title)["']/i);
    const ogDescMatch = html.match(/<meta\s+[^>]*property=["'](?:og:description|twitter:description)["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:description|twitter:description)["']/i);
    const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);

    let thumbnail = ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : null;
    let title = ogTitleMatch ? decodeEntities(ogTitleMatch[1]) : (pageTitleMatch ? decodeEntities(pageTitleMatch[1].trim()) : null);
    let description = ogDescMatch ? decodeEntities(ogDescMatch[1]) : null;

    // Fallback for Meta if facebookexternalhit did not find image: try WhatsApp UA
    if (isMeta && !thumbnail) {
      try {
        const waRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'WhatsApp/2.21.12.21 A',
            'Accept': 'text/html,application/xhtml+xml',
          },
          redirect: 'follow'
        });
        const waHtml = await waRes.text();
        const waImg = waHtml.match(/<meta\s+[^>]*property=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i) ||
                      waHtml.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:image|twitter:image)["']/i);
        if (waImg && waImg[1]) {
          thumbnail = waImg[1].replace(/&amp;/g, '&');
        }
      } catch (waErr) {
        console.warn('WhatsApp fallback error:', waErr);
      }
    }

    const isTikTok = targetUrl.includes('tiktok.com');
    const isInstagram = targetUrl.includes('instagram.com');
    const isFacebook = targetUrl.includes('facebook.com');

    return res.status(200).json({
      title: title || (isInstagram ? 'Instagram Reel' : isTikTok ? 'TikTok Video' : isFacebook ? 'Facebook Video' : 'Video'),
      description: description || '',
      thumbnail: thumbnail,
      source: isInstagram ? 'instagram' : isTikTok ? 'tiktok' : isFacebook ? 'facebook' : 'web'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function decodeEntities(encodedString) {
  if (!encodedString) return '';
  const translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  const translate = {
    "nbsp": " ",
    "amp": "&",
    "quot": "\"",
    "lt": "<",
    "gt": ">"
  };
  return encodedString.replace(translate_re, (match, entity) => translate[entity] || match);
}
