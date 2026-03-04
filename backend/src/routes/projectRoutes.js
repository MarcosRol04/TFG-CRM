const express = require('express');
const router = express.Router();
const {
  getAll, getOne, create, update, remove,
  getMembers, syncMembers,
  getTasks, createTask, updateTask, deleteTask,
  getComments, createComment, deleteComment
} = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/',                          getAll);
router.get('/:id',                       getOne);
router.post('/',                         create);
router.put('/:id',                       update);
router.delete('/:id',                    remove);

router.get('/:id/members',               getMembers);
router.post('/:id/members',              syncMembers);

router.get('/:id/tasks',                 getTasks);
router.post('/:id/tasks',                createTask);
router.put('/:id/tasks/:taskId',         updateTask);
router.delete('/:id/tasks/:taskId',      deleteTask);

router.get('/:id/comments',              getComments);
router.post('/:id/comments',             createComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;