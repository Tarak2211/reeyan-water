const express = require('express');
const router = express.Router();
const { getDailySummary, getCustomerLedger } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/daily-summary', getDailySummary);
router.get('/customer-ledger/:customerId', getCustomerLedger);

module.exports = router;
