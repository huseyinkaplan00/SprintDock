import mongoose from 'mongoose'

const { Schema } = mongoose

export const PROJECT_ICON_VALUES = [
  'rocket_launch',
  'design_services',
  'code',
  'campaign',
  'monitoring',
  'inventory_2',
  'bolt',
  'analytics',
]

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, enum: PROJECT_ICON_VALUES, default: 'rocket_launch' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

const Projectct = mongoose.models.Projectct || mongoose.model('Projectct', projectSchema)

export async function createProjectct({ title, description, icon, ownerId, memberIds, tags }) {
  return Projectct.create({
    title,
    description,
    icon: icon || 'rocket_launch',
    owner: ownerId,
    members: memberIds,
    tags: tags || [],
  })
}

export async function listProjectctsByMember(userId) {
  return Projectct.find({ members: userId })
    .sort({ updatedAt: -1 })
    .populate('owner', 'email')
    .populate('members', 'email')
}

export async function findProjectctById(projectId) {
  return Projectct.findById(projectId)
}

export async function findProjectctByIdDetailed(projectId) {
  return Projectct.findById(projectId).populate('owner', 'email').populate('members', 'email')
}

export async function updateProjectct(projectId, updates) {
  return Projectct.findByIdAndUpdate(projectId, updates, { new: true })
}

export async function deleteProjectct(projectId) {
  return Projectct.findByIdAndDelete(projectId)
}

export {
  createProjectct as createProject,
  listProjectctsByMember as listProjectsByMember,
  findProjectctById as findProjectById,
  findProjectctByIdDetailed as findProjectByIdDetailed,
  updateProjectct as updateProject,
  deleteProjectct as deleteProject,
}
