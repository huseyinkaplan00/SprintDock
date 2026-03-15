import mongoose from 'mongoose'
import { httpError } from '../../utils/errors.js'
import {
  createProject,
  listProjectsByMember,
  findProjectById,
  findProjectByIdDetailed,
  updateProject,
  deleteProject,
} from './repository.js'
import { countTasksByProjectIds } from '../tasks/repository.js'

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(400, 'Invalid identifier')
  }
}

export async function createProjectService({ userId, title, description, icon, tags, members }) {
  const memberIds = Array.from(new Set([String(userId), ...(members || []).map(String)]))

  return createProject({
    title,
    description,
    icon,
    ownerId: userId,
    memberIds,
    tags,
  })
}

export async function listProjectsService({ userId }) {
  const projects = await listProjectsByMember(userId)
  const projectIds = projects.map((project) => String(project._id))
  const taskCounts = await countTasksByProjectIds(projectIds)

  return projects.map((project) => ({
    ...project.toObject(),
    taskCount: taskCounts[String(project._id)] || 0,
  }))
}

export async function getProjectService({ userId, projectId }) {
  ensureObjectId(projectId)
  const project = await findProjectById(projectId)
  if (!project) throw httpError(404, 'Project not found')

  const isMember = project.members.some((m) => String(m) === String(userId))
  if (!isMember) throw httpError(403, 'Forbidden')

  return findProjectByIdDetailed(projectId)
}

export async function updateProjectService({ userId, role, projectId, updates }) {
  ensureObjectId(projectId)
  const project = await findProjectById(projectId)
  if (!project) throw httpError(404, 'Project not found')

  const isOwner = String(project.owner) === String(userId)
  if (!isOwner && role !== 'admin') throw httpError(403, 'Forbidden')

  const next = {
    title: updates.title ?? project.title,
    description: updates.description ?? project.description,
    icon: updates.icon ?? project.icon,
    status: updates.status ?? project.status,
    tags: updates.tags ?? project.tags,
  }

  if (Array.isArray(updates.members)) {
    const memberIds = Array.from(new Set([String(project.owner), ...updates.members.map(String)]))
    next.members = memberIds
  }

  return updateProject(projectId, next)
}

export async function deleteProjectService({ userId, role, projectId }) {
  ensureObjectId(projectId)
  const project = await findProjectById(projectId)
  if (!project) throw httpError(404, 'Project not found')

  const isOwner = String(project.owner) === String(userId)
  if (!isOwner && role !== 'admin') throw httpError(403, 'Forbidden')

  await deleteProject(projectId)
  return { ok: true }
}

export {
  createProjectService as createProjectctService,
  listProjectsService as listProjectctsService,
  getProjectService as getProjectctService,
  updateProjectService as updateProjectctService,
  deleteProjectService as deleteProjectctService,
}
