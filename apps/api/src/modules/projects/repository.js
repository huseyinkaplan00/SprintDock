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

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)

export async function createProject({ title, description, icon, ownerId, memberIds, tags }) {
  return Project.create({
    title,
    description,
    icon: icon || 'rocket_launch',
    owner: ownerId,
    members: memberIds,
    tags: tags || [],
  })
}

export async function listProjectsByMember(userId) {
  return Project.find({ members: userId })
    .sort({ updatedAt: -1 })
    .populate('owner', 'email')
    .populate('members', 'email')
}

export async function findProjectById(projectId) {
  return Project.findById(projectId)
}

export async function findProjectByIdDetailed(projectId) {
  return Project.findById(projectId).populate('owner', 'email').populate('members', 'email')
}

export async function updateProject(projectId, updates) {
  return Project.findByIdAndUpdate(projectId, updates, { new: true })
}

export async function deleteProject(projectId) {
  return Project.findByIdAndDelete(projectId)
}
