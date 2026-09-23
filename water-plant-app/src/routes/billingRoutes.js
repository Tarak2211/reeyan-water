const express = require('express');
const router = express.Router();
const { getBills, getBillById } = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getBills);
router.get('/:id', getBillById);

module.exports = router;
