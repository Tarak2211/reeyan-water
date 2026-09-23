const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PDF_DIR, APP_NAME, APP_ADDRESS, APP_PHONE, APP_GSTIN } = require('../config/env');

// Ensure PDF directory exists
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Generates a delivery receipt PDF for a bill.
 * @param {Object} bill - Bill object with customer and dailyEntry included
 * @returns {string} - Path to the generated PDF file
 */
async function generateDeliveryReceipt(bill) {
  return new Promise((resolve, reject) => {
    const filename = `bill-${bill.billNumber}.pdf`;
    const filePath = path.join(PDF_DIR, filename);
    const doc = new PDFDocument({ margin: 50, size: 'A5' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    const primaryColor = '#1a73e8';
    const lightGray = '#f5f5f5';
    const darkText = '#1a1a1a';
    const mutedText = '#666666';

    // ── Header ──────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);

    doc.fillColor('white')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(APP_NAME, 50, 18, { align: 'center' });

    doc.fontSize(8)
      .font('Helvetica')
      .text(APP_ADDRESS, 50, 42, { align: 'center' })
      .text(`Ph: ${APP_PHONE}${APP_GSTIN ? ' | GSTIN: ' + APP_GSTIN : ''}`, 50, 54, { align: 'center' });

    // ── Bill Title ──────────────────────────────────────────────
    doc.fillColor(primaryColor)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('DELIVERY RECEIPT', 50, 95, { align: 'center' });

    doc.moveTo(50, 115).lineTo(doc.page.width - 50, 115).strokeColor(primaryColor).lineWidth(1.5).stroke();

    // ── Bill Meta ───────────────────────────────────────────────
    const metaY = 125;
    doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold');
    doc.text('Bill No:', 50, metaY);
    doc.text('Date:', 200, metaY);

    doc.font('Helvetica').fillColor(mutedText);
    doc.text(`#${bill.billNumber}`, 90, metaY);
    doc.text(new Date(bill.billDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }), 230, metaY);

    // ── Customer Box ────────────────────────────────────────────
    const custBoxY = 148;
    doc.rect(50, custBoxY, doc.page.width - 100, 55).fill(lightGray);

    doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
      .text('BILL TO', 60, custBoxY + 8);

    doc.fillColor(darkText).fontSize(10).font('Helvetica-Bold')
      .text(bill.customer.name, 60, custBoxY + 20);

    doc.fillColor(mutedText).fontSize(8).font('Helvetica')
      .text(bill.customer.address, 60, custBoxY + 34)
      .text(`Phone: ${bill.customer.phone}`, 60, custBoxY + 46);

    // ── Delivery Table ──────────────────────────────────────────
    const tableTop = 220;
    // Table header
    doc.rect(50, tableTop, doc.page.width - 100, 22).fill(primaryColor);
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, tableTop + 7);
    doc.text('QTY', 230, tableTop + 7, { width: 50, align: 'center' });
    doc.text('RATE', 285, tableTop + 7, { width: 60, align: 'center' });
    doc.text('AMOUNT', 350, tableTop + 7, { width: 60, align: 'right' });

    // Table row
    const rowY = tableTop + 22;
    doc.rect(50, rowY, doc.page.width - 100, 24).fill('white').stroke('#e0e0e0');
    doc.fillColor(darkText).fontSize(9).font('Helvetica');
    doc.text('20L Water Jug (Full)', 60, rowY + 7);
    doc.text(String(bill.jugsDelivered), 230, rowY + 7, { width: 50, align: 'center' });
    doc.text(`₹${Number(bill.ratePerJug).toFixed(2)}`, 285, rowY + 7, { width: 60, align: 'center' });
    doc.text(`₹${Number(bill.amountDue).toFixed(2)}`, 350, rowY + 7, { width: 60, align: 'right' });

    // Returned jugs info row
    const row2Y = rowY + 24;
    doc.rect(50, row2Y, doc.page.width - 100, 24).fill(lightGray).stroke('#e0e0e0');
    doc.fillColor(mutedText).fontSize(8).font('Helvetica');
    doc.text('Empty Jugs Returned', 60, row2Y + 8);
    doc.text(String(bill.dailyEntry.jugsReturned), 230, row2Y + 8, { width: 50, align: 'center' });
    doc.text('—', 285, row2Y + 8, { width: 60, align: 'center' });
    doc.text('—', 350, row2Y + 8, { width: 60, align: 'right' });

    // ── Summary Box ─────────────────────────────────────────────
    const summaryY = row2Y + 40;
    doc.rect(doc.page.width - 200, summaryY, 150, 80).fill(lightGray).stroke('#e0e0e0');

    const lineH = 20;
    const labelX = doc.page.width - 190;
    const valueX = doc.page.width - 60;

    doc.fillColor(mutedText).fontSize(8).font('Helvetica');
    doc.text("Today's Charges:", labelX, summaryY + 8);
    doc.text('Previous Balance:', labelX, summaryY + 8 + lineH);

    doc.fillColor(darkText).font('Helvetica-Bold');
    doc.text(`₹${Number(bill.amountDue).toFixed(2)}`, valueX, summaryY + 8, { align: 'right' });
    doc.text(`₹${Number(bill.pendingBefore).toFixed(2)}`, valueX, summaryY + 8 + lineH, { align: 'right' });

    // Total pending line
    doc.rect(doc.page.width - 200, summaryY + 55, 150, 25).fill(primaryColor);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('TOTAL PENDING:', labelX, summaryY + 62);
    doc.text(`₹${Number(bill.pendingAfter).toFixed(2)}`, valueX, summaryY + 62, { align: 'right' });

    // ── Footer ───────────────────────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e0e0e0').lineWidth(0.5).stroke();

    doc.fillColor(mutedText).fontSize(7).font('Helvetica')
      .text('Thank you for choosing ' + APP_NAME + '. Please pay promptly to avoid service interruption.', 50, footerY + 8, { align: 'center' })
      .text('For queries, contact us at ' + APP_PHONE, 50, footerY + 20, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateDeliveryReceipt };
