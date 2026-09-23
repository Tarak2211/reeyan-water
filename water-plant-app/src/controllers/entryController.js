const prisma = require('../config/database');
const { analyzeJugImage } = require('../services/visionService');
const { generateDeliveryReceipt } = require('../services/pdfService');
const { sendDeliveryReceiptWhatsApp } = require('../services/whatsappService');
const path = require('path');

/**
 * POST /api/entries/upload-image
 * Accepts multipart/form-data with image + customerId + deliveryBoyId + jugsDispatched
 * Runs AI vision, creates entry, generates bill & PDF, sends WhatsApp
 */
const createEntryWithImage = async (req, res, next) => {
  try {
    const { customerId, deliveryBoyId, jugsDispatched, notes } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
    if (!customerId || !deliveryBoyId) {
      return res.status(400).json({ success: false, message: 'customerId and deliveryBoyId are required' });
    }

    // 1. Fetch customer to get rate
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // 2. Run AI Vision
    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;
    const visionResult = await analyzeJugImage(imagePath);

    const jugsDelivered = visionResult.jugsDelivered;
    const jugsReturned = visionResult.jugsReturned;
    const ratePerJug = Number(customer.ratePerJug);
    const totalCost = jugsDelivered * ratePerJug;
    const pendingBefore = Number(customer.pendingBalance);

    // 3. Create DailyEntry + Bill + update customer balance — all in one transaction
    const { entry, bill, updatedCustomer } = await prisma.$transaction(async (tx) => {
      const entry = await tx.dailyEntry.create({
        data: {
          customerId,
          deliveryBoyId,
          jugsDispatched: parseInt(jugsDispatched) || jugsDelivered,
          jugsDelivered,
          jugsReturned,
          ratePerJug,
          totalCost,
          imageUrl,
          aiRawResponse: visionResult.rawResponse,
          status: 'CONFIRMED',
          notes,
        },
      });

      // Generate unique bill number: WP-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const billNumber = `WP-${dateStr}-${entry.id.slice(-4).toUpperCase()}`;

      const bill = await tx.bill.create({
        data: {
          billNumber,
          customerId,
          dailyEntryId: entry.id,
          jugsDelivered,
          ratePerJug,
          amountDue: totalCost,
          pendingBefore,
          pendingAfter: pendingBefore + totalCost,
        },
        include: { customer: true, dailyEntry: true },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: { pendingBalance: { increment: totalCost } },
      });

      return { entry, bill, updatedCustomer };
    });

    // 4. Generate PDF
    const pdfPath = await generateDeliveryReceipt(bill);
    const pdfFilename = path.basename(pdfPath);

    // Update bill with PDF url
    await prisma.bill.update({
      where: { id: bill.id },
      data: { pdfUrl: `/pdfs/${pdfFilename}` },
    });

    // 5. Send WhatsApp (non-blocking — don't fail the request if WA fails)
    let whatsappStatus = 'not_sent';
    try {
      await sendDeliveryReceiptWhatsApp({
        toPhone: customer.phone,
        pdfPath,
        billNumber: bill.billNumber,
        customerName: customer.name,
        pendingBalance: bill.pendingAfter,
      });
      await prisma.bill.update({ where: { id: bill.id }, data: { whatsappSent: true } });
      whatsappStatus = 'sent';
    } catch (waErr) {
      console.error('WhatsApp send failed:', waErr.message);
      whatsappStatus = 'failed';
    }

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      data: {
        entry: { id: entry.id, jugsDelivered, jugsReturned, totalCost },
        bill: { id: bill.id, billNumber: bill.billNumber, pendingAfter: bill.pendingAfter },
        aiResult: { confidence: visionResult.confidence, notes: visionResult.notes },
        pdfUrl: `/pdfs/${pdfFilename}`,
        whatsappStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/entries/manual
 * Manual entry without image (override AI counts)
 */
const createManualEntry = async (req, res, next) => {
  try {
    const { customerId, deliveryBoyId, jugsDispatched, jugsDelivered, jugsReturned, notes } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const ratePerJug = Number(customer.ratePerJug);
    const totalCost = jugsDelivered * ratePerJug;
    const pendingBefore = Number(customer.pendingBalance);

    const { entry, bill } = await prisma.$transaction(async (tx) => {
      const entry = await tx.dailyEntry.create({
        data: {
          customerId, deliveryBoyId,
          jugsDispatched: parseInt(jugsDispatched) || jugsDelivered,
          jugsDelivered: parseInt(jugsDelivered),
          jugsReturned: parseInt(jugsReturned) || 0,
          ratePerJug, totalCost,
          status: 'CONFIRMED', notes,
        },
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const billNumber = `WP-${dateStr}-${entry.id.slice(-4).toUpperCase()}`;

      const bill = await tx.bill.create({
        data: {
          billNumber, customerId, dailyEntryId: entry.id,
          jugsDelivered: parseInt(jugsDelivered),
          ratePerJug, amountDue: totalCost,
          pendingBefore, pendingAfter: pendingBefore + totalCost,
        },
        include: { customer: true, dailyEntry: true },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { pendingBalance: { increment: totalCost } },
      });

      return { entry, bill };
    });

    const pdfPath = await generateDeliveryReceipt(bill);
    const pdfFilename = path.basename(pdfPath);
    await prisma.bill.update({ where: { id: bill.id }, data: { pdfUrl: `/pdfs/${pdfFilename}` } });

    res.status(201).json({
      success: true,
      data: { entry, bill, pdfUrl: `/pdfs/${pdfFilename}` },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/entries?customerId=&date=&deliveryBoyId=
const getEntries = async (req, res, next) => {
  try {
    const { customerId, deliveryBoyId, date, page = 1, limit = 20 } = req.query;
    const where = {};
    if (customerId) where.customerId = customerId;
    if (deliveryBoyId) where.deliveryBoyId = deliveryBoyId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      where.entryDate = { gte: d, lte: end };
    }

    const [entries, total] = await Promise.all([
      prisma.dailyEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { customer: { select: { name: true, phone: true } }, deliveryBoy: { select: { name: true } } },
        orderBy: { entryDate: 'desc' },
      }),
      prisma.dailyEntry.count({ where }),
    ]);

    res.json({ success: true, data: entries, total });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEntryWithImage, createManualEntry, getEntries };
