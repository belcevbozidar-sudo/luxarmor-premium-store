import sharp from 'sharp';

export default async function handler(req, res) {
  const { url, name } = req.query;
  
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Optimize and convert to WebP using sharp
    const optimizedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
    
    // Set headers for WebP format and long-term CDN caching
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    if (name) {
      // RFC 5987 standard for Cyrillic / UTF-8 filenames in HTTP headers
      const cleanName = name.replace(/["\\]/g, ''); // strip quotes & backslashes
      const encodedName = encodeURIComponent(cleanName);
      res.setHeader('Content-Disposition', `inline; filename="${encodedName}.webp"; filename*=UTF-8''${encodedName}.webp`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    
    res.send(optimizedBuffer);
  } catch (err) {
    console.error('Error proxying image:', err);
    res.status(500).send('Internal Server Error');
  }
}
