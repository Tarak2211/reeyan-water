const prisma = require('../config/database');

// GET /api/reports/daily-summary?date=YYYY-MM-DD
const getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const entries = await prisma.dailyEntry.findMany({
      where: { entryDate: { gte: date, lte: endDate }, status: 'CONFIRMED' },
      include: {
        customer: { select: { name: true } },
        deliveryBoy: { select: { name: true } },
      },
    });

    const summary = {
      date: date.toISOString().split('T')[0],
      totalEntries: entries.length,
      totalJugsDelivered: entries.reduce((s, e) => s + e.jugsDelivered, 0),
      totalJugsReturned: entries.reduce((s, e) => s + e.jugsReturned, 0),
      totalRevenue: entries.reduce((s, e) => s + Number(e.totalCost), 0).toFixed(2),
      entries,
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/customer-ledger/:customerId
const getCustomerLedger = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { from, to } = req.query;

    const where = { customerId };
    if (from || to) {
      where.entryDate = {};
      if (from) where.entryDate.gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); where.entryDate.lte = t; }
    }

    const [customer, entries, payments] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.dailyEntry.findMany({ where, orderBy: { entryDate: 'asc' } }),
      prisma.payment.findMany({ where: { customerId }, orderBy: { paidAt: 'asc' } }),
    ]);

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.json({
      success: true,
      data: {
        customer,
        entries,
        payments,
        currentBalance: customer.pendingBalance,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDailySummary, getCustomerLedger };
