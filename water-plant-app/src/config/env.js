require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  PDF_DIR: process.env.PDF_DIR || './pdfs',
  APP_NAME: process.env.APP_NAME || 'AquaPure Water Plant',
  APP_ADDRESS: process.env.APP_ADDRESS || '123 Water Street, City',
  APP_PHONE: process.env.APP_PHONE || '+91 98765 43210',
  APP_GSTIN: process.env.APP_GSTIN || '',
};
