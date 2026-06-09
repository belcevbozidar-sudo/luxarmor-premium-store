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
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Set caching headers (cache forever at CDN level)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    if (name) {
      // RFC 5987 standard for Cyrillic / UTF-8 filenames in HTTP headers.
      // The standard 'filename' attribute must be ASCII-only to prevent Node.js header validation errors.
      const cleanName = name.replace(/["\\]/g, ''); // strip quotes & backslashes
      const encodedName = encodeURIComponent(cleanName);
      res.setHeader('Content-Disposition', `inline; filename="image.jpg"; filename*=UTF-8''${encodedName}.jpg`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err) {
    console.error('Error proxying image:', err);
    res.status(500).send('Internal Server Error');
  }
}
