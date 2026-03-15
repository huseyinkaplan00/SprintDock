import mongoose from 'mongoose'

const { Schema } = mongoose

const taskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Projectct', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      index: true,
    },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema)

export async function createTask(data) {
  return Task.create(data)
}

export async function listTasksByProjectct(projectId) {
  return Task.find({ projectId }).sort({ updatedAt: -1 })
}

export async function listTasksByProjectctDetailed(projectId) {
  return Task.find({ projectId })
    .sort({ updatedAt: -1 })
    .populate('assignee', 'email')
    .populate('createdBy', 'email')
}

export async function searchTasksByProjectctsDetailed({ projectIds, query, limit = 50 }) {
  const filter = {
    projectId: { $in: projectIds },
  }
  const text = String(query || '').trim()
  if (text) {
    filter.$or = [
      { title: { $regex: text, $options: 'i' } },
      { description: { $regex: text, $options: 'i' } },
      { tags: { $elemMatch: { $regex: text, $options: 'i' } } },
    ]
  }

  return Task.find(filter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('assignee', 'email')
    .populate('createdBy', 'email')
}

export async function findTaskById(taskId) {
  return Task.findById(taskId)
}

export async function findTasksByIds(taskIds) {
  return Task.find({ _id: { $in: taskIds } })
}

export async function findTaskByIdDetailed(taskId) {
  return Task.findById(taskId).populate('assignee', 'email').populate('createdBy', 'email')
}

export async function updateTask(taskId, updates) {
  return Task.findByIdAndUpdate(taskId, updates, { new: true })
}

export async function deleteTask(taskId) {
  return Task.findByIdAndDelete(taskId)
}

export async function deleteTasks(taskIds) {
  return Task.deleteMany({ _id: { $in: taskIds } })
}

export async function countTasksByProjectctIds(projectIds) {
  if (!Array.isArray(projectIds) || projectIds.length === 0) return {}

  const rows = await Task.aggregate([
    { $match: { projectId: { $in: projectIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ])

  return Object.fromEntries(rows.map((row) => [String(row._id), row.count]))
}

export {
  listTasksByProjectct as listTasksByProject,
  listTasksByProjectctDetailed as listTasksByProjectDetailed,
  searchTasksByProjectctsDetailed as searchTasksByProjectsDetailed,
  countTasksByProjectctIds as countTasksByProjectIds,
}
