const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  getSpreadsheets,
  getSpreadsheet,
  createSpreadsheet,
  updateSpreadsheet,
  deleteSpreadsheet
} = require('../controllers/spreadsheetController');

router.get('/', verifyToken, getSpreadsheets);
router.get('/:id', verifyToken, getSpreadsheet);
router.post('/', verifyToken, createSpreadsheet);
router.put('/:id', verifyToken, updateSpreadsheet);
router.delete('/:id', verifyToken, deleteSpreadsheet);

module.exports = router;