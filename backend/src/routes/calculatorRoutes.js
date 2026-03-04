const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { saveOperation, getHistory, clearHistory } = require('../controllers/calculatorController');

router.post('/history',   verifyToken, saveOperation);
router.get('/history',    verifyToken, getHistory);
router.delete('/history', verifyToken, clearHistory);

module.exports = router;