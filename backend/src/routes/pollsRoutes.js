// backend/src/routes/pollsRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPolls, getPollById, createPoll, updatePoll, deletePoll, votePoll, exportPollResults,
} = require('../controllers/pollsController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

router.use(authMiddleware);

router.get('/', getPolls);
router.get('/:id', getPollById);
router.post('/:id/vote', votePoll);
router.get('/:id/export', exportPollResults);

router.post('/', checkRole('admin', 'manager'), createPoll);
router.put('/:id', checkRole('admin', 'manager'), updatePoll);
router.delete('/:id', checkRole('admin', 'manager'), deletePoll);

module.exports = router;