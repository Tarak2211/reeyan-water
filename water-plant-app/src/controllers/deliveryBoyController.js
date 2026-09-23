const prisma = require('../config/database');

// GET /api/delivery-boys
const getAllDeliveryBoys = async (req, res, next) => {
  try {
    const boys = await prisma.deliveryBoy.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: boys });
  } catch (err) {
    next(err);
  }
};

// POST /api/delivery-boys
const createDeliveryBoy = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const boy = await prisma.deliveryBoy.create({ data: { name, phone } });
    res.status(201).json({ success: true, data: boy });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Phone already exists' });
    next(err);
  }
};

// GET /api/delivery-boys/:id/summary?date=YYYY-MM-DD
const getDeliveryBoySummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.dailyEntry.findMany({
      where: {
        deliveryBoyId: id,
        entryDate: { gte: startOfDay, lte: endOfDay },
      },
      include: { customer: { select: { name: true, phone: true } } },
    });

    const summary = {
      date: startOfDay.toISOString().split('T')[0],
      totalDispatched: entries.reduce((s, e) => s + e.jugsDispatched, 0),
      totalDelivered: entries.reduce((s, e) => s + e.jugsDelivered, 0),
      totalReturned: entries.reduce((s, e) => s + e.jugsReturned, 0),
      pendingDeliveries: entries.filter(e => e.status === 'PENDING').length,
      entries,
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllDeliveryBoys, createDeliveryBoy, getDeliveryBoySummary };
