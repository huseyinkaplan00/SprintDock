import {
  createTaskService,
  listTasksService,
  getTaskService,
  updateTaskService,
  deleteTaskService,
  bulkDeleteTasksService,
} from './service.js'

export async function createTaskController(req, res, next) {
  try {
    const task = await createTaskService({ userId: req.user.id, body: req.body })
    res.json({ task })
  } catch (err) {
    next(err)
  }
}

export async function listTasksController(req, res, next) {
  try {
    const tasks = await listTasksService({
      userId: req.user.id,
      projectId: req.query.projectId,
      query: req.query.q,
    })
    res.json({ tasks })
  } catch (err) {
    next(err)
  }
}

export async function getTaskController(req, res, next) {
  try {
    const task = await getTaskService({ userId: req.user.id, taskId: req.params.id })
    res.json({ task })
  } catch (err) {
    next(err)
  }
}

export async function updateTaskController(req, res, next) {
  try {
    const task = await updateTaskService({
      userId: req.user.id,
      taskId: req.params.id,
      updates: req.body,
    })
    res.json({ task })
  } catch (err) {
    next(err)
  }
}

export async function deleteTaskController(req, res, next) {
  try {
    const result = await deleteTaskService({ userId: req.user.id, taskId: req.params.id })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function bulkDeleteTasksController(req, res, next) {
  try {
    const result = await bulkDeleteTasksService({ userId: req.user.id, taskIds: req.body.taskIds })
    res.json(result)
  } catch (err) {
    next(err)
  }
}
