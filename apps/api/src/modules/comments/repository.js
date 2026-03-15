import mongoose from 'mongoose'

const { Schema } = mongoose

const commentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema)

export async function createComment(data) {
  return Comment.create(data)
}

export async function listCommentsByTask(taskId) {
  return Comment.find({ taskId }).sort({ createdAt: 1 }).populate('author', 'email')
}

export async function findCommentById(commentId) {
  return Comment.findById(commentId)
}

export async function deleteComment(commentId) {
  return Comment.findByIdAndDelete(commentId)
}
