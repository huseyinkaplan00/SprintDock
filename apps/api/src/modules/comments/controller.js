import {
  createCommentService,
  listCommentsService,
  deleteCommentService,
} from './service.js'

export async function createCommentController(req, res, next) {
  try {
    const comment = await createCommentService({ userId: req.user.id, body: req.body })
    res.json({ comment })
  } catch (err) {
    next(err)
  }
}

export async function listCommentsController(req, res, next) {
  try {
    const comments = await listCommentsService({
      userId: req.user.id,
      taskId: req.query.taskId,
    })
    res.json({ comments })
  } catch (err) {
    next(err)
  }
}

export async function deleteCommentController(req, res, next) {
  try {
    const result = await deleteCommentService({
      userId: req.user.id,
      commentId: req.params.id,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}
