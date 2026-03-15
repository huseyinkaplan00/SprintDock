import {
  createProjectService,
  listProjectsService,
  getProjectService,
  updateProjectService,
  deleteProjectService,
} from './service.js'

export async function createProjectController(req, res, next) {
  try {
    const project = await createProjectService({
      userId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon,
      tags: req.body.tags,
      members: req.body.members,
    })
    res.json({ project })
  } catch (err) {
    next(err)
  }
}

export async function listProjectsController(req, res, next) {
  try {
    const projects = await listProjectsService({ userId: req.user.id })
    res.json({ projects })
  } catch (err) {
    next(err)
  }
}

export async function getProjectController(req, res, next) {
  try {
    const project = await getProjectService({
      userId: req.user.id,
      projectId: req.params.id,
    })
    res.json({ project })
  } catch (err) {
    next(err)
  }
}

export async function updateProjectController(req, res, next) {
  try {
    const project = await updateProjectService({
      userId: req.user.id,
      role: req.user.role,
      projectId: req.params.id,
      updates: req.body,
    })
    res.json({ project })
  } catch (err) {
    next(err)
  }
}

export async function deleteProjectController(req, res, next) {
  try {
    const result = await deleteProjectService({
      userId: req.user.id,
      role: req.user.role,
      projectId: req.params.id,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}
