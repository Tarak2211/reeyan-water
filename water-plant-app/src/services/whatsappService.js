const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = require('../config/env');

const WA_BASE = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}`;

/**
 * Step 1: Upload PDF to WhatsApp media server and get a media ID.
 */
async function uploadPdfToWhatsApp(pdfPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(pdfPath), {
    contentType: 'application/pdf',
    filename: 'delivery-receipt.pdf',
  });
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'application/pdf');

  const response = await axios.post(`${WA_BASE}/media`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
    },
  });

  return response.data.id; // media ID
}

/**
 * Step 2: Send the uploaded PDF as a document message to a phone number.
 */
async function sendDeliveryReceiptWhatsApp({ toPhone, pdfPath, billNumber, customerName, pendingBalance }) {
  // Normalize phone: ensure it starts with country code, no + or spaces
  const phone = toPhone.replace(/\D/g, '');

  // Upload PDF first
  const mediaId = await uploadPdfToWhatsApp(pdfPath);

  // Build message body
  const bodyText = `Hello ${customerName}! 👋\n\nYour delivery receipt *#${billNumber}* has been generated.\n\n💧 *Total Pending Balance: ₹${Number(pendingBalance).toFixed(2)}*\n\nPlease find your detailed receipt attached. Thank you for choosing us! 🙏`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'document',
    document: {
      id: mediaId,
      filename: `Receipt-${billNumber}.pdf`,
      caption: bodyText,
    },
  };

  const response = await axios.post(`${WA_BASE}/messages`, payload, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

module.exports = { sendDeliveryReceiptWhatsApp };
