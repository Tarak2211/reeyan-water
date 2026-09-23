const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { createEntryWithImage, createManualEntry, getEntries } = require('../controllers/entryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getEntries);
router.post('/upload-image', upload.single('image'), createEntryWithImage);
router.post('/manual', createManualEntry);

module.exports = router;
