const prisma = require('../config/database');
const { validationResult } = require('express-validator');

// GET /api/customers
const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);
    res.json({ success: true, data: customers, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        dailyEntries: { orderBy: { entryDate: 'desc' }, take: 10 },
        payments: { orderBy: { paidAt: 'desc' }, take: 5 },
      },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, phone, address, ratePerJug } = req.body;
    const customer = await prisma.customer.create({
      data: { name, phone, address, ratePerJug: parseFloat(ratePerJug) },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Phone number already exists' });
    next(err);
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, ratePerJug, isActive } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, phone, address, ratePerJug: ratePerJug ? parseFloat(ratePerJug) : undefined, isActive },
    });
    res.json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Customer not found' });
    next(err);
  }
};

// POST /api/customers/:id/payment
const recordPayment = async (req, res, next) => {
  try {
    const { amount, method, note } = req.body;
    const parsedAmount = parseFloat(amount);

    const [customer, payment] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: req.params.id },
        data: { pendingBalance: { decrement: parsedAmount } },
      }),
      prisma.payment.create({
        data: {
          customerId: req.params.id,
          amount: parsedAmount,
          method: method || 'CASH',
          note,
        },
      }),
    ]);

    res.json({ success: true, data: { customer, payment } });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Customer not found' });
    next(err);
  }
};

module.exports = { getAllCustomers, getCustomerById, createCustomer, updateCustomer, recordPayment };
