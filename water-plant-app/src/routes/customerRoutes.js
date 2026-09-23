const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAllCustomers, getCustomerById, createCustomer, updateCustomer, recordPayment } = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', [
  body('name').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('ratePerJug').isFloat({ min: 0 }),
], createCustomer);
router.put('/:id', updateCustomer);
router.post('/:id/payment', [body('amount').isFloat({ min: 0.01 })], recordPayment);

module.exports = router;
