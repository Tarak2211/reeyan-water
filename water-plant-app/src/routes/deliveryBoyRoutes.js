const express = require('express');
const router = express.Router();
const { getAllDeliveryBoys, createDeliveryBoy, getDeliveryBoySummary } = require('../controllers/deliveryBoyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getAllDeliveryBoys);
router.post('/', createDeliveryBoy);
router.get('/:id/summary', getDeliveryBoySummary);

module.exports = router;
