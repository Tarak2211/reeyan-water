require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const hpp         = require('hpp');
const compression = require('compression');
const path        = require('path');

const { PORT, NODE_ENV } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { startKeepAlive } = require('./utils/keepAlive');

const customerRoutes    = require('./routes/customerRoutes');
const deliveryBoyRoutes = require('./routes/deliveryBoyRoutes');
const entryRoutes       = require('./routes/entryRoutes');
const billingRoutes     = require('./routes/billingRoutes');
const reportRoutes      = require('./routes/reportRoutes');
const whatsappRoutes    = require('./routes/whatsappRoutes');
const settingsRoutes    = require('./routes/settingsRoutes');

const app = express();

// ── Security Headers ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ── Compression ───────────────────────────────────────────────────
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));

// ── Rate Limiting ─────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/whatsapp/', rateLimit({ windowMs: 60*60*1000, max: 60 }));

// ── HPP ───────────────────────────────────────────────────────────
app.use(hpp());

// ── Body Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Static Files ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/pdfs',    express.static(path.join(__dirname, '..', 'pdfs')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Reeyan Mineral Water', version: '2.0.0' });
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/customers',     customerRoutes);
app.use('/api/delivery-boys', deliveryBoyRoutes);
app.use('/api/entries',       entryRoutes);
app.use('/api/bills',         billingRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/whatsapp',      whatsappRoutes);
app.use('/api/settings',      settingsRoutes);

// ── Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────
process.on('unhandledRejection', err => console.error('Unhandled:', err.message));
process.on('uncaughtException',  err => { console.error('Uncaught:', err.message); process.exit(1); });

app.listen(PORT, () => {
  console.log(`✅  Reeyan Mineral Water v2.0 — http://localhost:${PORT}`);
  console.log(`🔒  Helmet + RateLimit + HPP + Compression ACTIVE`);
  startKeepAlive(); // prevents Render free tier from sleeping
});

module.exports = app;
