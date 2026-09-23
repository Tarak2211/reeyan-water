/**
 * Keep-Alive Ping — prevents Render free tier from sleeping
 * Pings the server every 14 minutes
 */
function startKeepAlive() {
  const serverUrl = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL;
  if (!serverUrl || process.env.NODE_ENV !== 'production') return;

  const https = require('https');
  const http  = require('http');

  const ping = () => {
    const url    = `${serverUrl}/health`;
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      console.log(`[KeepAlive] Pinged ${url} — ${res.statusCode}`);
    });
    req.on('error', () => {});
    req.end();
  };

  // Ping every 14 minutes (Render sleeps at 15 min)
  setInterval(ping, 14 * 60 * 1000);
  console.log('✅ Keep-alive started — server will not sleep');
}

module.exports = { startKeepAlive };
