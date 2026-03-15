import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../../api/tasks.api.js'
import { commentsApi } from '../../../api/comments.api.js'
import { projectsApi } from '../../../api/projects.api.js'
import { useAuth } from '../../../hooks/use-auth.js'
import { useProjectRoom } from '../../../hooks/use-project-room.js'
import { formatDate } from '../../../lib/format.js'
import { Button } from '../../../components/ui/button.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Modal } from '../../../components/ui/modal.jsx'
import { useToast } from '../../../components/ui/toast.jsx'
import { getErrorMessage } from '../../../lib/api-error.js'
import { Skeleton } from '../../../components/common/skeleton.jsx'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', tone: 'text-slate-600 dark:text-slate-300' },
  { value: 'in_progress', label: 'In Progress', tone: 'text-blue-600 dark:text-blue-300' },
  { value: 'done', label: 'Completed', tone: 'text-green-600 dark:text-green-300' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', tone: 'text-slate-500 dark:text-slate-400' },
  { value: 'medium', label: 'Medium', tone: 'text-orange-500 dark:text-orange-400' },
  { value: 'high', label: 'High', tone: 'text-red-500 dark:text-red-400' },
]

function normalizeStatus(value) {
  return STATUS_OPTIONS.find((item) => item.value === value) || STATUS_OPTIONS[0]
}

function normalizePriority(value) {
  return PRIORITY_OPTIONS.find((item) => item.value === value) || PRIORITY_OPTIONS[1]
}

function resolveUserLabel(identity, currentUserId, currentUserEmail) {
  if (!identity) return 'User'

  if (typeof identity === 'object') {
    if (identity.email && currentUserEmail && String(identity.email) === String(currentUserEmail)) {
      return 'You'
    }
    if (identity.email) return String(identity.email)
    if (identity.id && String(identity.id) === String(currentUserId))
      return currentUserEmail || 'You'
    if (identity._id && String(identity._id) === String(currentUserId))
      return currentUserEmail || 'You'
    if (identity.name) return String(identity.name)
  }

  const raw = String(identity)
  if (raw === String(currentUserId)) return currentUserEmail || 'You'
  if (currentUserEmail && raw === String(currentUserEmail)) return 'You'
  if (raw.includes('@')) return raw
  if (/^[a-f0-9]{24}$/i.test(raw)) return `User #${raw.slice(0, 6)}`
  if (raw.length <= 40) return raw
  return 'User'
}

function shortUserLabel(label) {
  const raw = String(label || '')
  if (!raw) return 'User'
  if (raw === 'You') return raw
  if (!raw.includes('@')) return raw
  const [name] = raw.split('@')
  return name || raw
}

function shortTitle(value) {
  const text = String(value || '').trim()
  if (!text) return 'Task'
  if (text.length <= 36) return text
  return `${text.slice(0, 33)}...`
}

function avatarInitial(label) {
  const normalized = String(label || '')
    .trim()
    .replace(/^[^a-zA-Z]+/, '')
  return (normalized[0] || 'K').toUpperCase()
}

function toDateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const SHARE_TOKEN_REGEX = /\[\[task:([a-zA-Z0-9_-]+)\|([^\]]+)\]\]/g
const TASK_URL_REGEX = /https?:\/\/[^\s]*\/tasks\/([a-zA-Z0-9_-]+)/g

function parseCommentForCards(content, activeTask) {
  const cards = []
  let plain = String(content || '')

  plain = plain.replace(SHARE_TOKEN_REGEX, (_, taskId, title) => {
    let decodedTitle = ''
    try {
      decodedTitle = decodeURIComponent(title || '')
    } catch (_error) {
      decodedTitle = String(title || '')
    }
    cards.push({
      taskId,
      title: decodedTitle.trim() || `Task #${String(taskId).slice(0, 6)}`,
    })
    return ''
  })

  plain = plain.replace(TASK_URL_REGEX, (match, taskId) => {
    const fallbackTitle = String(taskId) === String(activeTask?._id) ? activeTask?.title : null
    cards.push({
      taskId,
      title: fallbackTitle || `Task #${String(taskId).slice(0, 6)}`,
    })
    return ''
  })

  const normalizedText = plain.replace(/\n{3,}/g, '\n\n').trim()
  return { cards, text: normalizedText }
}

export default function TaskDetail() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { push } = useToast()
  const [comment, setComment] = useState('')
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [onlyMyComments, setOnlyMyComments] = useState(false)

  const taskQuery = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id),
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentsApi.list(id),
  })

  const updateTask = useMutation({
    mutationFn: (payload) => tasksApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createComment = useMutation({
    mutationFn: commentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
    },
  })
  const deleteTask = useMutation({
    mutationFn: () => tasksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const task = taskQuery.data?.task
  const comments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data])
  const projectId = task?.projectId ? String(task.projectId) : ''
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: Boolean(projectId),
  })
  const currentUserId = user?.id ? String(user.id) : ''
  const isAssignedToMe = String(task?.assignee || '') === currentUserId
  const hasAssignee = Boolean(task?.assignee)
  const status = normalizeStatus(task?.status)
  const priority = normalizePriority(task?.priority)
  const creatorLabel = resolveUserLabel(task?.createdBy, currentUserId, user?.email)
  const assigneeLabel = resolveUserLabel(task?.assignee, currentUserId, user?.email)
  const creatorShortLabel = shortUserLabel(creatorLabel)
  const assigneeShortLabel = shortUserLabel(assigneeLabel)
  const projectTitle = projectQuery.data?.project?.title || 'Project'
  const isCompleted = task?.status === 'done'
  const composerPreview = useMemo(() => parseCommentForCards(comment, task), [comment, task])
  const filteredComments = useMemo(() => {
    if (!onlyMyComments) return comments
    return comments.filter((item) => {
      if (typeof item.author === 'object') {
        return String(item.author?._id || item.author?.id || '') === currentUserId
      }
      return String(item.author || '') === currentUserId
    })
  }, [comments, currentUserId, onlyMyComments])

  useProjectRoom({ projectId, taskId: id })

  useEffect(() => {
    if (!task) return
    setTitleDraft(task.title || '')
    setDescriptionDraft(task.description || '')
  }, [task])

  const createdAtLabel = useMemo(() => formatDate(task?.createdAt), [task?.createdAt])
  const updatedAtLabel = useMemo(() => formatDate(task?.updatedAt), [task?.updatedAt])
  const dueAtLabel = useMemo(() => formatDate(task?.dueDate), [task?.dueDate])
  const dueDateInput = useMemo(() => toDateInputValue(task?.dueDate), [task?.dueDate])

  if (taskQuery.isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-[70vh]">
        <section className="flex-1 min-w-0 space-y-5">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </section>
        <aside className="w-full lg:w-[320px] shrink-0 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </aside>
      </div>
    )
  }

  const saveTaskDetails = async () => {
    const nextTitle = titleDraft.trim()
    const nextDescription = descriptionDraft.trim()
    if (!nextTitle) {
      push({
        title: 'Title is required',
        description: 'Task title cannot be empty.',
        variant: 'danger',
      })
      return
    }
    if (nextTitle.length < 3) {
      push({
        title: 'Title is too short',
        description: 'Task title must be at least 3 characters.',
        variant: 'danger',
      })
      return
    }
    if (nextDescription && nextDescription.length < 3) {
      push({
        title: 'Description too short',
        description: 'If you provide a description, it must be at least 3 characters.',
        variant: 'danger',
      })
      return
    }

    try {
      await updateTask.mutateAsync({
        title: nextTitle,
        description: nextDescription,
      })
      setIsEditingTask(false)
      push({ title: 'Task updated', description: 'Title and description saved.' })
    } catch (error) {
      push({
        title: 'Task could not be updated',
        description: getErrorMessage(error, 'You may not have permission to edit this task.'),
        variant: 'danger',
      })
    }
  }

  const submitComment = async () => {
    if (!comment.trim()) {
      push({
        title: 'Comment is required',
        description: 'Please enter a comment with at least 1 character.',
        variant: 'danger',
      })
      return
    }
    if (comment.trim().length > 2000) {
      push({
        title: 'Comment is too long',
        description: 'Comment can be at most 2000 characters.',
        variant: 'danger',
      })
      return
    }
    try {
      await createComment.mutateAsync({ taskId: id, content: comment.trim() })
      setComment('')
      push({ title: 'Comment added' })
    } catch (error) {
      push({
        title: 'Comment could not be added',
        description: getErrorMessage(error, 'You may not have permission to comment on this task.'),
        variant: 'danger',
      })
    }
  }

  const updateStatus = async (event) => {
    try {
      await updateTask.mutateAsync({ status: event.target.value })
      push({ title: 'Status updated' })
    } catch (error) {
      push({
        title: 'Status could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the status.'),
        variant: 'danger',
      })
    }
  }

  const updatePriority = async (event) => {
    try {
      await updateTask.mutateAsync({ priority: event.target.value })
      push({ title: 'Priority updated' })
    } catch (error) {
      push({
        title: 'Priority could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the priority.'),
        variant: 'danger',
      })
    }
  }

  const toggleAssignee = async () => {
    if (!currentUserId) return
    try {
      await updateTask.mutateAsync({ assignee: isAssignedToMe ? null : currentUserId })
      push({ title: isAssignedToMe ? 'Assignment removed' : 'Task assigned to you' })
    } catch (error) {
      push({
        title: 'Assignment could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the assignee.'),
        variant: 'danger',
      })
    }
  }

  const updateDueDate = async (event) => {
    const value = event.target.value
    try {
      await updateTask.mutateAsync({ dueDate: value || null })
      push({ title: value ? 'Due date updated' : 'Due date cleared' })
    } catch (error) {
      push({
        title: 'Due date could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the due date.'),
        variant: 'danger',
      })
    }
  }

  const handleDeleteTask = async () => {
    try {
      await deleteTask.mutateAsync()
      push({ title: 'Task deleted' })
      navigate(projectId ? `/projects/${projectId}` : '/projects')
    } catch (error) {
      push({
        title: 'Task could not be deleted',
        description: getErrorMessage(error, 'You may not have permission to delete this task.'),
        variant: 'danger',
      })
    }
  }

  const copyTaskLink = async () => {
    const link = `${window.location.origin}/tasks/${id}`
    try {
      await navigator.clipboard.writeText(link)
      push({ title: 'Task link copied' })
    } catch (_error) {
      push({
        title: 'Link could not be copied',
        description: 'Your browser denied clipboard access.',
        variant: 'danger',
      })
    }
  }

  const addShareCardToComment = () => {
    if (!task?._id) return
    const token = `[[task:${task._id}|${encodeURIComponent(task.title || 'Task')}]]`
    setComment((prev) => (prev.trim() ? `${prev.trim()}\n${token}` : token))
    push({ title: 'Share card added to comment' })
  }

  const applyDueDatePreset = async (days) => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    base.setDate(base.getDate() + days)
    const value = base.toISOString().slice(0, 10)
    try {
      await updateTask.mutateAsync({ dueDate: value })
      push({ title: 'Due date updated' })
    } catch (error) {
      push({
        title: 'Due date could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the due date.'),
        variant: 'danger',
      })
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[70vh]">
      <section className="flex-1 min-w-0">
        <div className="w-full max-w-4xl">
          <div className="flex flex-wrap gap-2 mb-6 items-center text-sm">
            <Link
              className="text-[#616889] dark:text-gray-400 hover:text-primary transition-colors font-medium"
              to="/projects"
            >
              Projects
            </Link>
            <span className="text-[#616889] dark:text-gray-600">/</span>
            {projectId ? (
              <Link
                className="text-[#616889] dark:text-gray-400 hover:text-primary transition-colors font-medium"
                to={`/projects/${projectId}`}
              >
                {projectTitle}
              </Link>
            ) : (
              <span className="text-[#616889] dark:text-gray-400 font-medium">Project</span>
            )}
            <span className="text-[#616889] dark:text-gray-600">/</span>
            <span className="text-[#111218] dark:text-gray-200 font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
              {shortTitle(task?.title)}
            </span>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-[#111218] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                {task?.title || 'Task'}
              </h1>
              {!isEditingTask ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTitleDraft(task?.title || '')
                      setDescriptionDraft(task?.description || '')
                      setIsEditingTask(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="lg:hidden"
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={deleteTask.isPending}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3 text-sm text-[#616889] dark:text-gray-400 pl-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-border-light px-2.5 py-1 text-xs dark:border-border-dark">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {createdAtLabel}
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border-light px-2.5 py-1 text-xs dark:border-border-dark"
                title={`Created by: ${creatorLabel}`}
              >
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {avatarInitial(creatorShortLabel)}
                </span>
                {creatorShortLabel}
              </span>
            </div>
          </div>

          {isEditingTask ? (
            <div className="mb-10 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark p-4 space-y-3">
              <Input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Task title"
              />
              <textarea
                className="w-full min-h-[120px] rounded-lg border border-border-light dark:border-border-dark bg-transparent p-3 text-sm text-[#111218] dark:text-white placeholder:text-[#616889] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-y"
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                placeholder="Task description"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingTask(false)
                    setTitleDraft(task?.title || '')
                    setDescriptionDraft(task?.description || '')
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={saveTaskDetails} disabled={updateTask.isPending}>
                  {updateTask.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-none text-[#111218] dark:text-gray-300 text-base leading-relaxed mb-12">
              <p className="mb-4">{task?.description || 'Henuz tasks aciklamasi girilmedi.'}</p>
            </div>
          )}

          <div className="border-t border-border-light dark:border-border-dark pt-8">
            <h3 className="text-lg font-bold text-[#111218] dark:text-white mb-6 flex items-center gap-2">
              Opentivity
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                {filteredComments.length}
              </span>
            </h3>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={onlyMyComments ? 'primary' : 'outline'}
                onClick={() => setOnlyMyComments((prev) => !prev)}
              >
                {onlyMyComments ? 'All comments' : 'Only my comments'}
              </Button>
              <Button size="sm" variant="outline" onClick={copyTaskLink}>
                Copy link
              </Button>
              <Button size="sm" variant="outline" onClick={addShareCardToComment}>
                Add share card
              </Button>
            </div>

            {commentsQuery.isLoading ? (
              <div className="space-y-3 mb-5">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : null}

            <div className="flex flex-col gap-6 relative">
              <div className="absolute left-5 top-2 bottom-6 w-px bg-border-light dark:bg-border-dark -z-10" />

              {filteredComments.length === 0 ? (
                <p className="text-sm text-[#616889] dark:text-gray-500 pl-14">No comments yet.</p>
              ) : null}

              {filteredComments.map((item) => {
                const authorLabel = resolveUserLabel(item.author, currentUserId, user?.email)
                const parsedComment = parseCommentForCards(item.content, task)
                return (
                  <div className="flex gap-4" key={item._id}>
                    <div className="size-10 rounded-full flex-none ring-4 ring-background-light dark:ring-background-dark bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                      {avatarInitial(authorLabel)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm text-[#111218] dark:text-white">
                          {authorLabel}
                        </span>
                        <span className="text-xs text-[#616889] dark:text-gray-500">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 text-sm text-[#111218] dark:text-gray-300 shadow-sm">
                        {parsedComment.cards.length ? (
                          <div className="mb-2 space-y-2">
                            {parsedComment.cards.map((card, index) => (
                              <Link
                                key={`${item._id}-card-${card.taskId}-${index}`}
                                className="flex items-center justify-between rounded-lg border border-border-light bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-white/5 dark:text-slate-200"
                                to={`/tasks/${card.taskId}`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px]">
                                    link
                                  </span>
                                  {card.title}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                                  Task
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : null}
                        {parsedComment.text ? parsedComment.text : null}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex gap-4 mt-4">
                <div className="size-10 rounded-full flex-none bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                  {(user?.email || 'M').slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="relative rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary overflow-hidden">
                    <textarea
                      className="w-full border-none bg-transparent p-3 text-sm text-[#111218] dark:text-white placeholder:text-[#616889] focus:ring-0 resize-none"
                      placeholder="Add a comment... (Ctrl+Enter to send)"
                      rows={3}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                          event.preventDefault()
                          submitComment()
                        }
                      }}
                    />
                    {composerPreview.cards.length ? (
                      <div className="mx-3 mb-2 space-y-1 rounded-lg border border-border-light bg-slate-50 p-2 dark:border-border-dark dark:bg-white/5">
                        {composerPreview.cards.map((card, index) => (
                          <Link
                            key={`composer-card-${card.taskId}-${index}`}
                            className="flex items-center justify-between rounded-md border border-border-light bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-surface-dark dark:text-slate-200"
                            to={`/tasks/${card.taskId}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">link</span>
                              {card.title}
                            </span>
                            <span className="text-[10px] text-slate-400">Onizleme</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-end px-2 pb-2">
                      <span className="mr-auto pl-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {comment.length}/2000
                      </span>
                      <Button size="sm" onClick={submitComment} disabled={createComment.isPending}>
                        {createComment.isPending ? 'Sending...' : 'Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="hidden lg:flex w-80 flex-none border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark flex-col overflow-y-auto">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex gap-2">
            {!isCompleted ? (
              <Button
                className="flex-1"
                variant="outline"
                size="sm"
                onClick={() => updateTask.mutate({ status: 'done' })}
                disabled={updateTask.isPending}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Complete
              </Button>
            ) : null}
            <Button className="flex-1" variant="outline" size="sm" onClick={copyTaskLink}>
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleteTask.isPending}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </Button>
          </div>

          <div className="h-px bg-border-light dark:bg-border-dark" />

          <div className="flex flex-col gap-5">
            <div className="group">
              <label className="block text-xs font-medium text-[#616889] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <div className="flex w-full items-center justify-between gap-2 text-sm text-[#111218] dark:text-gray-200 p-1.5 -ml-1.5 rounded-md">
                <span
                  className="material-symbols-outlined text-blue-500 icon-fill text-[18px]"
                  title={`Status: ${status.label}`}
                >
                  radio_button_checked
                </span>
                <select
                  className="bg-transparent border border-border-light dark:border-border-dark rounded-md text-xs px-2 pr-7 py-1 min-w-[118px]"
                  value={task?.status || 'todo'}
                  onChange={updateStatus}
                  disabled={!task}
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-medium text-[#616889] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                Assignee
              </label>
              <button
                className="flex w-full items-center justify-between gap-2 text-sm text-[#111218] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 -ml-1.5 rounded-md transition-colors text-left"
                onClick={toggleAssignee}
                disabled={!currentUserId || updateTask.isPending}
              >
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-semibold">
                    {(user?.email || 'M').slice(0, 1).toUpperCase()}
                  </div>
                  <span>
                    {isAssignedToMe
                      ? 'Assigned to me'
                      : hasAssignee
                        ? `${assigneeShortLabel} assigned`
                        : 'Unassigned'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-[16px]">sync</span>
              </button>
            </div>

            <div className="group">
              <label className="block text-xs font-medium text-[#616889] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <div className="flex w-full items-center justify-between gap-2 text-sm text-[#111218] dark:text-gray-200 p-1.5 -ml-1.5 rounded-md">
                <span
                  className="material-symbols-outlined text-orange-500 icon-fill text-[18px]"
                  title={`Priority: ${priority.label}`}
                >
                  signal_cellular_alt
                </span>
                <select
                  className="bg-transparent border border-border-light dark:border-border-dark rounded-md text-xs px-2 pr-7 py-1 min-w-[108px]"
                  value={task?.priority || 'medium'}
                  onChange={updatePriority}
                  disabled={!task}
                >
                  {PRIORITY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-medium text-[#616889] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <div className="flex w-full items-center justify-between gap-2 text-sm text-[#111218] dark:text-gray-200 p-1.5 -ml-1.5 rounded-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">
                    calendar_today
                  </span>
                  <span>{dueAtLabel}</span>
                </div>
                <Input
                  type="date"
                  className="h-8 text-xs min-w-[136px]"
                  value={dueDateInput}
                  onChange={updateDueDate}
                  disabled={!task}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => applyDueDatePreset(0)}>
                  Today
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyDueDatePreset(1)}>
                  Tomorrow
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyDueDatePreset(7)}>
                  +7 days
                </Button>
              </div>
            </div>
          </div>

          <div className="h-px bg-border-light dark:bg-border-dark mt-2" />
          <div className="flex flex-col gap-2 text-xs text-[#616889] dark:text-gray-500">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{createdAtLabel}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated</span>
              <span>{updatedAtLabel}</span>
            </div>
          </div>
        </div>
      </aside>

      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete task"
        description={`"${task?.title || 'Task'}" will be permanently deleted. This action cannot be undone.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteTask}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      />
    </div>
  )
}
