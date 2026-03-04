const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/notesController');

router.get('/',        verifyToken, getNotes);
router.get('/:id',     verifyToken, getNoteById);
router.post('/',       verifyToken, createNote);
router.put('/:id',     verifyToken, updateNote);
router.delete('/:id',  verifyToken, deleteNote);

module.exports = router;