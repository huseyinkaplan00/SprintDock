import mongoose from 'mongoose'
import { httpError } from '../../utils/errors.js'
import { publishEvent } from '../../events/publisher.js'
import { findTaskById } from '../tasks/repository.js'
import { findProjectById } from '../projects/repository.js'
import { createComment, listCommentsByTask, findCommentById, deleteComment } from './repository.js'

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(400, 'Gecersiz kimlik')
  }
}

async function ensureTaskMember(taskId, userId) {
  const task = await findTaskById(taskId)
  if (!task) throw httpError(404, 'Gorev bulunamadi')
  const project = await findProjectById(task.projectId)
  if (!project) throw httpError(404, 'Proje bulunamadi')
  const isMember = project.members.some((m) => String(m) === String(userId))
  if (!isMember) throw httpError(403, 'Yasak')
  return { task, project }
}

export async function createCommentService({ userId, body }) {
  ensureObjectId(body.taskId)
  const { task } = await ensureTaskMember(body.taskId, userId)

  const comment = await createComment({
    taskId: task._id,
    author: userId,
    content: body.content,
  })

  publishEvent('comment_added', {
    id: comment._id,
    taskId: comment.taskId,
    projectId: task.projectId,
    author: comment.author,
  })

  return comment
}

export async function listCommentsService({ userId, taskId }) {
  ensureObjectId(taskId)
  await ensureTaskMember(taskId, userId)
  return listCommentsByTask(taskId)
}

export async function deleteCommentService({ userId, commentId }) {
  ensureObjectId(commentId)
  const comment = await findCommentById(commentId)
  if (!comment) throw httpError(404, 'Yorum bulunamadi')

  const { project } = await ensureTaskMember(comment.taskId, userId)
  const isOwner = String(comment.author) === String(userId)
  if (!isOwner && String(project.owner) !== String(userId)) {
    throw httpError(403, 'Yasak')
  }

  await deleteComment(commentId)
  return { ok: true }
}
