const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  shareItem,
  unshareItem,
  getGroupSharedItems,
  getProjectSharedItems,
  checkShared
} = require('../controllers/sharedItemsController');

router.post('/', verifyToken, shareItem);
router.delete('/:id', verifyToken, unshareItem);
router.get('/group/:groupId', verifyToken, getGroupSharedItems);
router.get('/project/:projectId', verifyToken, getProjectSharedItems);
router.get('/check', verifyToken, checkShared);

module.exports = router;