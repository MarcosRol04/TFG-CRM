const express = require('express');
const router = express.Router();
const {
  getAll, getOne, create, update, remove,
  getLinks, addLink, removeLink, leaveGroup
} = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/',                     getAll);
router.get('/:id',                  getOne);
router.post('/',                    create);
router.put('/:id',                  update);
router.delete('/:id',               remove);

router.get('/:id/links',            getLinks);
router.post('/:id/links',           addLink);
router.delete('/:id/links/:linkId', removeLink);
router.post('/:id/leave',           leaveGroup);

module.exports = router;