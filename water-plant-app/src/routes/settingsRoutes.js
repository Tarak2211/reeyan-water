const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const ENV_PATH = path.join(__dirname, '..', '..', '.env');

function readEnv() {
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const map = {};
  raw.split('\n').forEach(line => {
    const m = line.match(/^([^#=\s]+)\s*=\s*"?([^"\n]*)"?/);
    if (m) map[m[1]] = m[2];
  });
  return map;
}

function writeEnvKey(key, value) {
  let raw = fs.readFileSync(ENV_PATH, 'utf8');
  const regex = new RegExp(`^(${key}\\s*=\\s*).*$`, 'm');
  if (regex.test(raw)) {
    raw = raw.replace(regex, `$1"${value}"`);
  } else {
    raw += `\n${key}="${value}"`;
  }
  fs.writeFileSync(ENV_PATH, raw, 'utf8');
  // Update process.env immediately (no restart needed)
  process.env[key] = value;
}

// GET /api/settings/whatsapp — return masked credentials status
router.get('/whatsapp', (req, res) => {
  const env = readEnv();
  const token    = env['WHATSAPP_API_TOKEN']    || '';
  const phoneId  = env['WHATSAPP_PHONE_NUMBER_ID'] || '';
  res.json({
    configured: token && token !== 'your-whatsapp-api-token',
    tokenSet:   !!(token && token !== 'your-whatsapp-api-token'),
    phoneIdSet: !!(phoneId && phoneId !== 'your-phone-number-id'),
    tokenPreview:  token  ? token.slice(0,8)  + '••••••••' : '',
    phoneIdPreview:phoneId? phoneId.slice(0,4) + '••••'    : '',
  });
});

// POST /api/settings/whatsapp — save credentials
router.post('/whatsapp', (req, res) => {
  const { token, phoneNumberId } = req.body;
  if (!token || !phoneNumberId) {
    return res.status(400).json({ success:false, message: 'Token અને Phone Number ID જરૂરી છે' });
  }
  try {
    writeEnvKey('WHATSAPP_API_TOKEN',      token.trim());
    writeEnvKey('WHATSAPP_PHONE_NUMBER_ID', phoneNumberId.trim());
    res.json({ success: true, message: '✅ WhatsApp credentials સચવાઈ ગઈ!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
