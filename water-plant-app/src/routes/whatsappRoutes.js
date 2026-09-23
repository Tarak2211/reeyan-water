const express     = require('express');
const router      = express.Router();
const axios       = require('axios');
const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');
const { body, validationResult } = require('express-validator');

const PDF_DIR = process.env.PDF_DIR || './pdfs';
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

// ── QR URL ────────────────────────────────────────────────────────
function getUPIQRUrl(upiId, name, amount) {
  const upiStr = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  return `https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${encodeURIComponent(upiStr)}&choe=UTF-8`;
}

async function downloadImage(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 6000 });
    return Buffer.from(res.data);
  } catch { return null; }
}

// ════════════════════════════════════════════════════════════════
// GENERATE PDF — Exact Reeyan Bill Format
// ════════════════════════════════════════════════════════════════
async function generatePDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const safe     = (data.billNumber||'bill').replace(/[^a-zA-Z0-9\-_]/g,'_');
      const filename = `receipt-${safe}-${Date.now()}.pdf`;
      const filePath = path.join(PDF_DIR, filename);

      // A5 size, white background
      const doc = new PDFDocument({ margin: 0, size: 'A5' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const W = doc.page.width;   // ~419 pt
      const M = 28;               // margin

      // ── BORDER ───────────────────────────────────────────────
      doc.rect(M - 4, M - 4, W - (M-4)*2, doc.page.height - (M-4)*2)
         .stroke('#1d4ed8');

      // ── TOP HEADER BAND ───────────────────────────────────────
      doc.rect(M, M, W - M*2, 58).fill('#1d4ed8');

      // Company name large
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
         .text('REEYAN', M + 8, M + 6);
      doc.fontSize(8).font('Helvetica')
         .text('MINERAL WATER', M + 8, M + 30);

      // Right side — contact details
      doc.fontSize(7).font('Helvetica')
         .text('Mob: 9712390525 / 9016320650', W - 200, M + 8, { width: 172, align: 'right' })
         .text('G Pay / Phone Pe / Paytm: 9712390525', W - 200, M + 19, { width: 172, align: 'right' })
         .text('Bank: Kalupur Comm. Co-op Bank Ltd.', W - 200, M + 30, { width: 172, align: 'right' })
         .text('Branch: Vatva | IFSC: KCCB0VTV009', W - 200, M + 41, { width: 172, align: 'right' })
         .text('A/c No.: 0092010636', W - 200, M + 52, { width: 172, align: 'right' });

      // ── ADDRESS LINE ──────────────────────────────────────────
      let y = M + 62;
      doc.rect(M, y, W - M*2, 22).fill('#eff6ff');
      doc.fillColor('#1e293b').fontSize(7).font('Helvetica')
         .text(
           'E-22, ગોવિંધ ટ્રેડ, ન્યૂ ગોટન ટ્રેડ ઓફ ઈ., બ્રહ્મ ક. ટ્રો., ઓઢવ-382415, અમદાવાદ-382449',
           M + 4, y + 4, { width: W - M*2 - 8 }
         );

      // ── BILL TO + BILL NO ─────────────────────────────────────
      y += 26;
      doc.fillColor('#374151').fontSize(8.5).font('Helvetica-Bold')
         .text('નામ:', M + 2, y);
      doc.fillColor('#1e293b').font('Helvetica')
         .text(data.customerName || '', M + 26, y, { width: 160 });

      doc.fillColor('#374151').font('Helvetica-Bold')
         .text('બિલ નં:', W - 130, y);
      doc.fillColor('#1d4ed8').font('Helvetica-Bold')
         .text(String(data.billSeq || data.billNumber || ''), W - 90, y);

      y += 14;
      doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold')
         .text('સ.:', M + 2, y);
      doc.fillColor('#1e293b').font('Helvetica')
         .text(data.address || '', M + 18, y, { width: 160 });

      doc.fillColor('#374151').font('Helvetica-Bold')
         .text('તા:', W - 130, y);
      doc.fillColor('#1e293b').font('Helvetica')
         .text(data.billDate || '', W - 108, y);

      // ── DIVIDER ───────────────────────────────────────────────
      y += 16;
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#1d4ed8').lineWidth(1).stroke();

      // ── TABLE ─────────────────────────────────────────────────
      y += 4;
      const cols = { no: M+2, desc: M+18, qty: M+160, rate: M+205, amt: M+248 };
      const colW = { no: 16, desc: 142, qty: 45, rate: 43, amt: W-M-248-4 };

      // Table header
      doc.rect(M, y, W-M*2, 18).fill('#1d4ed8');
      doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold')
         .text('નં.', cols.no,   y+5)
         .text('વિગત', cols.desc, y+5)
         .text('નંગ',  cols.qty,  y+5, { width: colW.qty,  align: 'center' })
         .text('ભાવ',  cols.rate, y+5, { width: colW.rate, align: 'center' })
         .text('રકમ',  cols.amt,  y+5, { width: colW.amt,  align: 'right'  });
      y += 18;

      // Table rows
      const rows = [];

      // Pending row if pendingBefore > 0
      if (Number(data.pendingBefore || 0) > 0) {
        rows.push({ no: '1', desc: 'Pending (બાકી)', qty: '-', rate: '-', amt: `${Number(data.pendingBefore).toFixed(0)}/-`, bold: false, bg: '#fff9f0' });
      }

      // Main delivery row
      rows.push({
        no:   rows.length + 1,
        desc: `જગ - ${data.billDate || ''}`,
        qty:  String(data.jugsDelivered || 0),
        rate: `${Number(data.ratePerUnit || 0).toFixed(0)}`,
        amt:  `${Number(data.amountDue || 0).toFixed(0)}/-`,
        bold: false,
        bg:   '#ffffff',
      });

      if ((data.jamaJugs || 0) > 0) {
        rows.push({ no: rows.length+1, desc: 'જમા જગ', qty: String(data.jamaJugs), rate: '-', amt: '-', bold: false, bg: '#f0fdf4' });
      }
      if ((data.jugsReturned || 0) > 0) {
        rows.push({ no: rows.length+1, desc: 'ખાલી પરત', qty: String(data.jugsReturned), rate: '-', amt: '-', bold: false, bg: '#f8fafc' });
      }

      rows.forEach((r, i) => {
        const rH = 18;
        doc.rect(M, y, W-M*2, rH).fill(r.bg).stroke('#d1d5db');
        doc.fillColor('#1e293b').fontSize(8).font(r.bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(String(r.no),   cols.no,   y+5)
           .text(r.desc,         cols.desc, y+5, { width: colW.desc })
           .text(String(r.qty),  cols.qty,  y+5, { width: colW.qty,  align: 'center' })
           .text(String(r.rate), cols.rate, y+5, { width: colW.rate, align: 'center' })
           .text(r.amt,          cols.amt,  y+5, { width: colW.amt,  align: 'right'  });
        y += rH;
      });

      // ── TOTAL ROW ─────────────────────────────────────────────
      doc.rect(M, y, W-M*2, 22).fill('#1d4ed8');
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text('કુલ', M+4, y+6)
         .text(`₹ ${Number(data.pendingAfter || 0).toFixed(0)}/-`, cols.amt, y+6, { width: colW.amt, align: 'right' });
      y += 22;

      // ── PAYMENT SECTION ───────────────────────────────────────
      y += 6;
      doc.moveTo(M, y).lineTo(W-M, y).strokeColor('#1d4ed8').lineWidth(0.8).stroke();
      y += 6;

      // Left: bank + UPI details
      const upiId   = process.env.UPI_ID   || '9712390525@okbizaxis';
      const upiName = process.env.UPI_NAME || 'Reeyan Mineral Water';
      const amount  = Number(data.pendingAfter || 0).toFixed(2);

      doc.fillColor('#1d4ed8').fontSize(8.5).font('Helvetica-Bold')
         .text('ચૂકવણી માહિતી', M, y);
      y += 12;

      doc.fillColor('#374151').fontSize(7.5).font('Helvetica')
         .text(`Bank: The Kalupur Comm.co-op Bank Ltd.`, M, y)
         .text(`A/c No.: 0092010636  |  IFSC: KCCB0VTV009`, M, y+10)
         .text(`Branch: Vatva, Ahmedabad`, M, y+20)
         .text(`G Pay / Phone Pe / Paytm: 9712390525`, M, y+30)
         .text(`UPI ID: ${upiId}`, M, y+40);

      // Right: QR Code
      const qrBuf = await downloadImage(getUPIQRUrl(upiId, upiName, amount));
      const qrX   = W - M - 105;
      const qrY2  = y - 4;

      if (qrBuf) {
        doc.image(qrBuf, qrX, qrY2, { width: 100, height: 100 });
        doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica')
           .text('Scan to Pay', qrX, qrY2 + 102, { width: 100, align: 'center' });
      } else {
        doc.rect(qrX, qrY2, 100, 100).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#94a3b8').fontSize(8)
           .text('QR Code', qrX, qrY2+44, { width:100, align:'center' });
      }

      y += 56;

      // ── TERMS ─────────────────────────────────────────────────
      doc.moveTo(M, y).lineTo(W-M, y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
      y += 5;
      doc.fillColor('#475569').fontSize(6.5).font('Helvetica')
         .text('• ₹3000 થી વધારે bill માટે cheque/DD સ્વીકારવામાં આવશે.', M, y)
         .text('• ₹79 per 20L jug — 25 jugs થી વધારે order ₹75/- per jug.', M, y+9)
         .text('• ₹75/- penalty — bill ની payment ₹3,000/- થી વધારે delay થાય.', M, y+18)
         .text('• ₹150/- — jug ખોવાઈ ગઈ / loss થઈ ત્યારે વસૂલ કરવામાં આવશે.', M, y+27);

      y += 40;

      // ── FOOTER SIGNATURE ──────────────────────────────────────
      doc.moveTo(M, y).lineTo(W-M, y).strokeColor('#1d4ed8').lineWidth(1).stroke();
      doc.fillColor('#1d4ed8').fontSize(8).font('Helvetica-Bold')
         .text('For, Reeyan Mineral Water', W-170, y+4);
      doc.fillColor('#475569').fontSize(7).font('Helvetica')
         .text('Authorised Signatory', W-150, y+14);

      doc.end();
      stream.on('finish', () => resolve({ filePath, filename }));
      stream.on('error',  reject);
    } catch(e) { reject(e); }
  });
}

// ── Validation ────────────────────────────────────────────────────
const billValidation = [
  body('phone').trim().matches(/^[0-9+\s\-(). ]{7,20}$/).withMessage('Invalid phone'),
  body('billNumber').trim().isLength({ min:1, max:60 }),
  body('customerName').trim().isLength({ min:1, max:100 }).escape(),
  body('amountDue').isFloat({ min:0 }),
  body('pendingAfter').isFloat({ min:0 }),
];

// ── Meta WhatsApp PDF send ────────────────────────────────────────
async function sendViaMetaAPI(phone, pdfPath, pdfFilename, billNumber, customerName, pendingAfter) {
  const WA_TOKEN    = process.env.WHATSAPP_API_TOKEN;
  const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const FormData    = require('form-data');
  const form        = new FormData();
  form.append('file', fs.createReadStream(pdfPath), { contentType:'application/pdf', filename: pdfFilename });
  form.append('messaging_product','whatsapp');
  form.append('type','application/pdf');
  const uploadRes = await axios.post(
    `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/media`, form,
    { headers: { ...form.getHeaders(), Authorization:`Bearer ${WA_TOKEN}` } }
  );
  const mediaId = uploadRes.data.id;
  let toPhone = phone.replace(/\D/g,'');
  if (toPhone.length===10) toPhone='91'+toPhone;
  const caption =
`💧 *Reeyan Mineral Water*

નમસ્તે *${customerName}* 👋

Bill *#${billNumber}* ની PDF receipt attached છે.
UPI QR code PDF ની અંદર છે — scan કરીને pay કરો!

⚠️ *Total Pending: ₹${Number(pendingAfter).toFixed(0)}/-*

📞 9712390525 | 9016320650`;
  await axios.post(
    `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
    { messaging_product:'whatsapp', recipient_type:'individual', to:toPhone, type:'document',
      document:{ id:mediaId, filename:`Reeyan-Bill-${billNumber}.pdf`, caption } },
    { headers:{ Authorization:`Bearer ${WA_TOKEN}`, 'Content-Type':'application/json' } }
  );
}

async function sendViaTextLink(phone, pdfFilename, billNumber, customerName, data) {
  const WA_TOKEN    = process.env.WHATSAPP_API_TOKEN;
  const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let toPhone = phone.replace(/\D/g,'');
  if (toPhone.length===10) toPhone='91'+toPhone;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT||3000}`;
  const upiId     = process.env.UPI_ID || '9712390525@okbizaxis';
  const msg =
`💧 *Reeyan Mineral Water*
━━━━━━━━━━━━━━━━━━━━
નમસ્તે *${customerName}* 👋

🧾 *Bill No:* #${billNumber}
📅 *તા:* ${data.billDate}
📦 *જગ:* ${data.jugsDelivered} × ₹${Number(data.ratePerUnit||0).toFixed(0)}
━━━━━━━━━━━━━━━━━━━━
💰 *આજ: ₹${Number(data.amountDue||0).toFixed(0)}/-*
⚠️ *કુલ બાકી: ₹${Number(data.pendingAfter||0).toFixed(0)}/-*
━━━━━━━━━━━━━━━━━━━━
💳 *UPI Pay:* ${upiId}
📄 *PDF Bill:* ${serverUrl}/pdfs/${pdfFilename}
━━━━━━━━━━━━━━━━━━━━
📞 9712390525 | 9016320650`;
  await axios.post(
    `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
    { messaging_product:'whatsapp', recipient_type:'individual', to:toPhone, type:'text', text:{ body:msg, preview_url:true } },
    { headers:{ Authorization:`Bearer ${WA_TOKEN}`, 'Content-Type':'application/json' } }
  );
}

// ════════════════════════════════════════════════════════
// POST /api/whatsapp/generate-pdf
// ════════════════════════════════════════════════════════
router.post('/generate-pdf', async (req, res) => {
  try {
    const data = req.body;
    if (!data.billNumber || !data.customerName) {
      return res.status(400).json({ success:false, message:'Data missing' });
    }
    const { filePath } = await generatePDF(data);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`inline; filename="Reeyan-Bill-${data.billNumber}.pdf"`);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-cache, no-store');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    fileStream.on('end', () => { try { fs.unlinkSync(filePath); } catch(_){} });
  } catch(err) {
    console.error('PDF error:', err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ════════════════════════════════════════════════════════
// POST /api/whatsapp/send-bill
// ════════════════════════════════════════════════════════
router.post('/send-bill', billValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success:false, message:errors.array()[0].msg });
  const WA_TOKEN    = process.env.WHATSAPP_API_TOKEN;
  const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!WA_TOKEN||!WA_PHONE_ID||WA_TOKEN==='your-whatsapp-api-token'||WA_PHONE_ID==='your-phone-number-id') {
    return res.status(503).json({ success:false, message:'WhatsApp API credentials not configured' });
  }
  const data = req.body;
  let pdfPath = null;
  try {
    const pdf = await generatePDF(data);
    pdfPath = pdf.filePath;
    try {
      await sendViaMetaAPI(data.phone, pdfPath, pdf.filename, data.billNumber, data.customerName, data.pendingAfter);
      return res.json({ success:true, method:'pdf_document', message:`PDF sent to ${data.customerName}!` });
    } catch(pdfErr) {
      console.warn('PDF send failed, sending link:', pdfErr.message);
      await sendViaTextLink(data.phone, pdf.filename, data.billNumber, data.customerName, data);
      return res.json({ success:true, method:'text_with_link', message:`Message sent to ${data.customerName}!` });
    }
  } catch(err) {
    if (pdfPath && fs.existsSync(pdfPath)) { try { fs.unlinkSync(pdfPath); } catch(_){} }
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error('WhatsApp Error:', errMsg);
    return res.status(500).json({ success:false, message:`Error: ${errMsg}` });
  }
});

// ════════════════════════════════════════════════════════
// POST /api/whatsapp/generate-pdf-save — Save PDF, return filename
// ════════════════════════════════════════════════════════
router.post('/generate-pdf-save', async (req, res) => {
  try {
    const data = req.body;
    if (!data.billNumber || !data.customerName) {
      return res.status(400).json({ success:false, message:'Data missing' });
    }
    const { filePath, filename } = await generatePDF(data);
    // Don't delete — keep for download
    res.json({ success: true, filename, filePath });
  } catch(err) {
    console.error('PDF save error:', err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

module.exports = router;
