import mongoose from 'mongoose'
import { httpError } from '../../utils/errors.js'
import { findProjectById } from '../projects/repository.js'
import { listProjectsByMember } from '../projects/repository.js'
import {
  createTask,
  findTasksByIds,
  findTaskById,
  listTasksByProjectDetailed,
  searchTasksByProjectsDetailed,
  findTaskByIdDetailed,
  updateTask,
  deleteTask,
  deleteTasks,
} from './repository.js'
import { publishTaskCreated, publishTaskAssigned } from './events.js'

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(400, 'Gecersiz kimlik')
  }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  const seen = new Set()
  const normalized = []
  for (const raw of tags) {
    const tag = String(raw || '')
      .trim()
      .toLowerCase()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    normalized.push(tag)
  }
  return normalized
}

async function ensureProjectMember(projectId, userId) {
  const project = await findProjectById(projectId)
  if (!project) throw httpError(404, 'Proje bulunamadi')
  const isMember = project.members.some((m) => String(m) === String(userId))
  if (!isMember) throw httpError(403, 'Yasak')
  return project
}

export async function createTaskService({ userId, body }) {
  ensureObjectId(body.projectId)
  await ensureProjectMember(body.projectId, userId)

  const task = await createTask({
    projectId: body.projectId,
    title: body.title,
    description: body.description,
    tags: normalizeTags(body.tags),
    status: body.status,
    assignee: body.assignee || null,
    priority: body.priority,
    dueDate: body.dueDate || null,
    createdBy: userId,
  })

  publishTaskCreated({
    id: task._id,
    projectId: task.projectId,
    title: task.title,
    status: task.status,
    assignee: task.assignee,
  })

  if (task.assignee) {
    publishTaskAssigned({
      id: task._id,
      projectId: task.projectId,
      assignee: task.assignee,
    })
  }

  return task
}

export async function listTasksService({ userId, projectId, query }) {
  const text = String(query || '').trim()
  if (projectId) {
    ensureObjectId(projectId)
    await ensureProjectMember(projectId, userId)
    if (!text) return listTasksByProjectDetailed(projectId)
    return searchTasksByProjectsDetailed({ projectIds: [projectId], query: text, limit: 50 })
  }

  const projects = await listProjectsByMember(userId)
  const projectIds = projects.map((project) => String(project._id))
  if (!projectIds.length) return []
  return searchTasksByProjectsDetailed({ projectIds, query: text, limit: 50 })
}

export async function getTaskService({ userId, taskId }) {
  ensureObjectId(taskId)
  const task = await findTaskById(taskId)
  if (!task) throw httpError(404, 'Gorev bulunamadi')
  await ensureProjectMember(task.projectId, userId)
  return findTaskByIdDetailed(taskId)
}

export async function updateTaskService({ userId, taskId, updates }) {
  ensureObjectId(taskId)
  const task = await findTaskById(taskId)
  if (!task) throw httpError(404, 'Gorev bulunamadi')
  await ensureProjectMember(task.projectId, userId)

  const wasAssignee = task.assignee ? String(task.assignee) : null
  const hasAssigneeUpdate = Object.prototype.hasOwnProperty.call(updates, 'assignee')
  const next = {
    title: updates.title ?? task.title,
    description: updates.description ?? task.description,
    tags: Object.prototype.hasOwnProperty.call(updates, 'tags')
      ? normalizeTags(updates.tags)
      : task.tags,
    status: updates.status ?? task.status,
    assignee: hasAssigneeUpdate ? updates.assignee : task.assignee,
    priority: updates.priority ?? task.priority,
    dueDate: updates.dueDate ?? task.dueDate,
  }

  const updated = await updateTask(taskId, next)

  const isAssignedNow = updated.assignee ? String(updated.assignee) : null
  if (wasAssignee !== isAssignedNow && isAssignedNow) {
    publishTaskAssigned({
      id: updated._id,
      projectId: updated.projectId,
      assignee: updated.assignee,
    })
  }

  publishTaskCreated({
    id: updated._id,
    projectId: updated.projectId,
    title: updated.title,
    status: updated.status,
    assignee: updated.assignee,
  })

  return updated
}

export async function deleteTaskService({ userId, taskId }) {
  ensureObjectId(taskId)
  const task = await findTaskById(taskId)
  if (!task) throw httpError(404, 'Gorev bulunamadi')
  await ensureProjectMember(task.projectId, userId)

  await deleteTask(taskId)
  return { ok: true }
}

export async function bulkDeleteTasksService({ userId, taskIds }) {
  const normalizedIds = [...new Set((taskIds || []).map((id) => String(id)))]
  normalizedIds.forEach(ensureObjectId)

  const tasks = await findTasksByIds(normalizedIds)
  if (tasks.length !== normalizedIds.length) throw httpError(404, 'Bazi gorevler bulunamadi')

  const projectIds = [...new Set(tasks.map((task) => String(task.projectId)))]
  for (const projectId of projectIds) {
    await ensureProjectMember(projectId, userId)
  }

  const result = await deleteTasks(normalizedIds)
  return { ok: true, deletedCount: result.deletedCount || 0 }
}
