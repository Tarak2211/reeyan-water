const prisma = require('../config/database');

// GET /api/bills?customerId=&page=&limit=
const getBills = async (req, res, next) => {
  try {
    const { customerId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (customerId) where.customerId = customerId;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { billDate: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({ success: true, data: bills, total });
  } catch (err) {
    next(err);
  }
};

// GET /api/bills/:id
const getBillById = async (req, res, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: { customer: true, dailyEntry: true },
    });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBills, getBillById };
