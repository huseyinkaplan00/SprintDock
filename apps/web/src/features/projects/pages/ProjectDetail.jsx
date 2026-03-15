import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../../../api/projects.api.js'
import { tasksApi } from '../../../api/tasks.api.js'
import { useAuth } from '../../../hooks/use-auth.js'
import { useProjectRoom } from '../../../hooks/use-project-room.js'
import { formatDate } from '../../../lib/format.js'
import { DataTable } from '../../../components/ui/table.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Dropdown, DropdownItem } from '../../../components/ui/dropdown.jsx'
import { Modal } from '../../../components/ui/modal.jsx'
import { HoverTooltip } from '../../../components/ui/hover-tooltip.jsx'
import { useToast } from '../../../components/ui/toast.jsx'
import { getErrorMessage } from '../../../lib/api-error.js'
import { Skeleton } from '../../../components/common/skeleton.jsx'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses', icon: 'apps' },
  { value: 'todo', label: 'Todo', icon: 'radio_button_unchecked' },
  { value: 'in_progress', label: 'In progress', icon: 'timelapse' },
  { value: 'done', label: 'Completed', icon: 'check_circle' },
]

const ASSIGNEE_OPTIONS = [
  { value: 'all', label: 'All assignees' },
  { value: 'me', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
]

const PRIORITY_META = {
  low: { label: 'Low', icon: 'south', tone: 'text-slate-500' },
  medium: { label: 'Medium', icon: 'remove', tone: 'text-amber-500' },
  high: { label: 'High', icon: 'priority_high', tone: 'text-red-500' },
}

const TASK_STATUS_META = {
  todo: {
    label: 'Todo',
    icon: 'radio_button_unchecked',
    tone: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
  },
  in_progress: {
    label: 'In progress',
    icon: 'timelapse',
    tone: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/25',
  },
  done: {
    label: 'Completed',
    icon: 'check_circle',
    tone: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/25',
  },
}

const PROJECT_ICON_OPTIONS = [
  'rocket_launch',
  'design_services',
  'code',
  'campaign',
  'monitoring',
  'inventory_2',
  'bolt',
  'analytics',
]

function resolveAssigneeLabel(identity, currentUserId, currentUserEmail) {
  if (!identity) return 'Unassigned'

  if (typeof identity === 'object') {
    if (identity.email) return String(identity.email)
    if (identity.name) return String(identity.name)
    const objectId = String(identity._id || identity.id || '')
    if (objectId && objectId === String(currentUserId)) return currentUserEmail || 'You'
    if (objectId) return `User #${objectId.slice(0, 6)}`
  }

  const raw = String(identity)
  if (raw === String(currentUserId)) return currentUserEmail || 'You'
  if (raw.includes('@')) return raw
  if (/^[a-f0-9]{24}$/i.test(raw)) return `User #${raw.slice(0, 6)}`
  return raw
}

function resolveAssigneeId(identity) {
  if (!identity) return ''
  if (typeof identity === 'object') return String(identity._id || identity.id || '')
  return String(identity)
}

function resolveUserDisplay(identity, currentUserId, currentUserEmail) {
  if (!identity) return '-'
  if (typeof identity === 'object') {
    if (identity.email) return String(identity.email)
    const id = String(identity._id || identity.id || '')
    if (id && id === String(currentUserId)) return currentUserEmail || 'You'
    return id ? `${id.slice(0, 8)}...` : '-'
  }
  const raw = String(identity)
  if (raw === String(currentUserId)) return currentUserEmail || 'You'
  if (raw.includes('@')) return raw
  return raw.length > 8 ? `${raw.slice(0, 8)}...` : raw
}

function parseTagsInput(raw) {
  if (!raw || !raw.trim()) return []
  const parts = raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(parts)]
}

function avatarInitial(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/^[^a-zA-Z]+/, '')
  return (normalized[0] || 'K').toUpperCase()
}

const COLUMN_META = {
  title: { label: 'Title', icon: 'title' },
  tags: { label: 'Tags', icon: 'sell' },
  status: { label: 'Status', icon: 'radio_button_checked' },
  assignee: { label: 'Assignee', icon: 'person' },
  priority: { label: 'Priority', icon: 'priority_high' },
  dueDate: { label: 'Due Date', icon: 'calendar_today' },
  updatedAt: { label: 'Updated', icon: 'update' },
  createdBy: { label: 'Created by', icon: 'edit_note' },
  createdAt: { label: 'Created', icon: 'history' },
}

export default function ProjectDetail() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { push } = useToast()
  const { id } = useParams()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [editingTitleId, setEditingTitleId] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  })
  const tasksQuery = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.list(id),
  })

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      setCreateTaskModalOpen(false)
      setTitle('')
      setDescription('')
      setTagsInput('')
      setPriority('medium')
      setDueDate('')
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ taskId, payload }) => tasksApi.update(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
    },
  })
  const deleteTask = useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
    },
  })
  const bulkDeleteTasks = useMutation({
    mutationFn: tasksApi.removeMany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      setRowSelection({})
    },
  })
  const updateProject = useMutation({
    mutationFn: ({ projectId, payload }) => projectsApi.update(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
  const deleteProject = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const project = projectQuery.data?.project
  const projectIcon = project?.icon || 'rocket_launch'
  const tasks = useMemo(() => tasksQuery.data?.tasks ?? [], [tasksQuery.data])
  const myId = user?.id ? String(user.id) : ''
  const ownerLabel = resolveUserDisplay(project?.owner, myId, user?.email)
  const memberLabels = (project?.members || []).map((member) =>
    resolveUserDisplay(member, myId, user?.email)
  )

  useProjectRoom({ projectId: id })

  const applyTaskUpdate = useCallback(
    async (taskId, payload, options = {}) => {
      const { successTitle, successDescription } = options
      try {
        await updateTask.mutateAsync({ taskId, payload })
        if (successTitle) {
          push({ title: successTitle, description: successDescription })
        }
        return true
      } catch (error) {
        push({
          title: 'Task could not be updated',
          description: getErrorMessage(error, 'You may not have permission to update this task.'),
          variant: 'danger',
        })
        return false
      }
    },
    [push, updateTask]
  )

  const submitCreateTask = async (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const parsedTags = parseTagsInput(tagsInput)

    if (!cleanTitle) {
      push({
        title: 'Task title is required',
        description: 'Please enter a title with at least 1 character.',
        variant: 'danger',
      })
      return
    }

    if (cleanTitle.length < 3) {
      push({
        title: 'Title is too short',
        description: 'Task title must be at least 3 characters.',
        variant: 'danger',
      })
      return
    }

    if (cleanDescription && cleanDescription.length < 3) {
      push({
        title: 'Description too short',
        description: 'If you provide a description, it must be at least 3 characters.',
        variant: 'danger',
      })
      return
    }

    if (parsedTags.length > 10) {
      push({
        title: 'Too many tags',
        description: 'You can add at most 10 tags.',
        variant: 'danger',
      })
      return
    }

    try {
      await createTask.mutateAsync({
        projectId: id,
        title: cleanTitle,
        description: cleanDescription,
        tags: parsedTags,
        priority,
        dueDate: dueDate || undefined,
      })
      push({ title: 'Task created' })
    } catch (error) {
      push({
        title: 'Task could not be created',
        description: getErrorMessage(
          error,
          'You may not have permission to create a task in this project.'
        ),
        variant: 'danger',
      })
    }
  }

  const assignToMe = useCallback(
    async (task) => {
      if (!myId) return
      const assignee = resolveAssigneeId(task.assignee)
      const assignedToMe = assignee !== myId
      await applyTaskUpdate(
        task._id,
        { assignee: assignedToMe ? myId : null },
        {
          successTitle: assignedToMe ? 'Task assigned to you' : 'Assignment removed',
        }
      )
    },
    [applyTaskUpdate, myId]
  )

  const handleDeleteProject = async () => {
    if (!project?._id) return

    try {
      await deleteProject.mutateAsync(project._id)
      setDeleteModalOpen(false)
      push({
        title: 'Project deleted',
        description: 'Redirecting you to the projects list.',
      })
      navigate('/projects')
    } catch (error) {
      push({
        title: 'Project could not be deleted',
        description: getErrorMessage(error, 'You may not have permission to delete this project.'),
        variant: 'danger',
      })
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete?._id) return
    try {
      await deleteTask.mutateAsync(taskToDelete._id)
      push({
        title: 'Task deleted',
        description: `"${taskToDelete.title || 'Task'}" removed from the list.`,
      })
      setTaskToDelete(null)
    } catch (error) {
      push({
        title: 'Task could not be deleted',
        description: getErrorMessage(error, 'You may not have permission to delete this task.'),
        variant: 'danger',
      })
    }
  }

  const handleProjectStatusChange = async (event) => {
    if (!project?._id) return
    const status = event.target.value
    try {
      await updateProject.mutateAsync({ projectId: project._id, payload: { status } })
      push({ title: 'Project status updated' })
    } catch (error) {
      push({
        title: 'Project status could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the status.'),
        variant: 'danger',
      })
    }
  }

  const handleProjectIconChange = async (nextIcon) => {
    if (!project?._id) return
    const icon = String(nextIcon || '')
    if (!icon) return
    try {
      await updateProject.mutateAsync({ projectId: project._id, payload: { icon } })
      push({ title: 'Project icon updated' })
    } catch (error) {
      push({
        title: 'Project icon could not be updated',
        description: getErrorMessage(error, 'You may not have permission to update the icon.'),
        variant: 'danger',
      })
    }
  }

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false

      const assignee = resolveAssigneeId(task.assignee)
      if (assigneeFilter === 'me' && assignee !== myId) return false
      if (assigneeFilter === 'unassigned' && assignee) return false

      if (tagFilter.trim()) {
        const tags = Array.isArray(task.tags) ? task.tags : []
        if (!tags.some((tag) => String(tag).toLowerCase().includes(tagFilter.toLowerCase()))) {
          return false
        }
      }

      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase()
        const titleText = String(task.title || '').toLowerCase()
        const descriptionText = String(task.description || '').toLowerCase()
        if (!titleText.includes(query) && !descriptionText.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [tasks, statusFilter, assigneeFilter, tagFilter, myId, searchFilter])

  const taskMetrics = useMemo(() => {
    const summary = { all: tasks.length, todo: 0, in_progress: 0, done: 0 }
    tasks.forEach((task) => {
      if (task?.status === 'done') summary.done += 1
      else if (task?.status === 'in_progress') summary.in_progress += 1
      else summary.todo += 1
    })
    return summary
  }, [tasks])

  const hasActiveFilters = Boolean(
    searchFilter.trim() || tagFilter.trim() || statusFilter !== 'all' || assigneeFilter !== 'all'
  )
  const selectedTaskIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => Boolean(selected))
        .map(([taskId]) => taskId),
    [rowSelection]
  )

  useEffect(() => {
    const visibleIds = new Set(visibleTasks.map((task) => String(task._id)))
    setRowSelection((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([taskId, selected]) => selected && visibleIds.has(taskId))
      )
    )
  }, [visibleTasks])

  const handleBulkDeleteTasks = async () => {
    if (!selectedTaskIds.length) return
    try {
      await bulkDeleteTasks.mutateAsync(selectedTaskIds)
      push({
        title: 'Bulk deleteme tamamlandi',
        description: `${selectedTaskIds.length} tasks deleted.`,
      })
      setBulkDeleteOpen(false)
    } catch (error) {
      push({
        title: 'Bulk deleteme basarisiz',
        description: getErrorMessage(error, 'Some selected tasks could not be deleted.'),
        variant: 'danger',
      })
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all tasks"
            className="h-4 w-4 rounded border-border-light dark:border-border-dark"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            data-row-click-stop="true"
          />
        ),
        accessorFn: (row) => row._id,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label="Select task"
            className="h-4 w-4 rounded border-border-light dark:border-border-dark"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            data-row-click-stop="true"
          />
        ),
      },
      {
        id: 'id',
        header: 'ID',
        accessorFn: (row) => row._id,
        cell: (ctx) => <span className="text-xs text-slate-500">TBS-{ctx.row.index + 101}</span>,
      },
      {
        id: 'title',
        header: 'Task Title',
        accessorFn: (row) => row.title,
        cell: ({ row }) => {
          const task = row.original
          if (editingTitleId === task._id) {
            return (
              <Input
                className="h-8"
                autoFocus
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                onBlur={async () => {
                  const next = editingTitle.trim()
                  if (next && next !== task.title) {
                    await applyTaskUpdate(task._id, { title: next })
                  } else if (!next) {
                    push({
                      title: 'Title cannot be empty',
                      description: 'Task title must be at least 1 character.',
                      variant: 'danger',
                    })
                  }
                  setEditingTitleId('')
                }}
                onKeyDown={async (event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                  if (event.key === 'Escape') {
                    setEditingTitleId('')
                  }
                }}
              />
            )
          }

          return (
            <div className="min-w-[220px]">
              <div className="flex items-center gap-2">
                <Link
                  to={`/tasks/${task._id}`}
                  className="font-medium text-slate-900 transition-colors hover:text-primary dark:text-slate-100"
                >
                  {task.title}
                </Link>
              </div>
              {task.description ? (
                <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500 dark:text-slate-400">
                  {task.description}
                </p>
              ) : null}
            </div>
          )
        },
      },
      {
        id: 'tags',
        header: 'Tags',
        accessorFn: (row) => (Array.isArray(row.tags) ? row.tags.join(', ') : ''),
        cell: ({ row }) => {
          const tags = Array.isArray(row.original.tags) ? row.original.tags : []
          if (!tags.length) return <span className="text-xs text-slate-400">-</span>
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={`${row.original._id}-${tag}`}
                  className="inline-flex items-center rounded-full border border-border-light dark:border-border-dark px-1.5 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          const meta = TASK_STATUS_META[row.original.status] || TASK_STATUS_META.todo
          return (
            <Dropdown
              trigger={
                <button
                  className={`inline-flex size-8 items-center justify-center rounded-full border border-border-light ${meta.bg} ${meta.tone} dark:border-border-dark`}
                  data-row-click-stop="true"
                  title={`Status: ${meta.label}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                </button>
              }
            >
              {Object.entries(TASK_STATUS_META).map(([statusKey, statusMeta]) => (
                <DropdownItem
                  key={statusKey}
                  onSelect={() => applyTaskUpdate(row.original._id, { status: statusKey })}
                >
                  <span className={`material-symbols-outlined mr-2 text-[16px] ${statusMeta.tone}`}>
                    {statusMeta.icon}
                  </span>
                  {statusMeta.label}
                </DropdownItem>
              ))}
            </Dropdown>
          )
        },
      },
      {
        id: 'assignee',
        header: 'Assignee',
        accessorFn: (row) => resolveAssigneeId(row.assignee),
        cell: ({ row }) => {
          const assigneeRaw = resolveAssigneeId(row.original.assignee)
          const label = resolveAssigneeLabel(row.original.assignee, myId, user?.email)
          const initial = (label || 'K').slice(0, 1).toUpperCase()
          return (
            <div className="flex items-center gap-2">
              <HoverTooltip content={`Assignee: ${label}`}>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {initial}
                </span>
              </HoverTooltip>
              <button
                className="inline-flex size-7 items-center justify-center rounded-full border border-border-light bg-white text-slate-500 transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                onClick={() => assignToMe(row.original)}
                data-row-click-stop="true"
              >
                <HoverTooltip
                  content={
                    assigneeRaw === myId
                      ? 'Remove assignment'
                      : assigneeRaw
                        ? 'Assign task to yourself'
                        : 'Assign to yourself'
                  }
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {assigneeRaw === myId ? 'person_remove' : 'person_add'}
                  </span>
                </HoverTooltip>
              </button>
            </div>
          )
        },
      },
      {
        id: 'priority',
        header: 'Priority',
        accessorFn: (row) => row.priority || 'medium',
        cell: ({ row }) => {
          const meta = PRIORITY_META[row.original.priority || 'medium'] || PRIORITY_META.medium
          return (
            <HoverTooltip content={`Priority: ${meta.label}`}>
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-light bg-white dark:border-border-dark dark:bg-surface-dark">
                <span className={`material-symbols-outlined text-[14px] ${meta.tone}`}>
                  {meta.icon}
                </span>
              </span>
            </HoverTooltip>
          )
        },
      },
      {
        id: 'dueDate',
        header: 'Due Date',
        accessorFn: (row) => formatDate(row.dueDate),
      },
      {
        id: 'updatedAt',
        header: 'Updated',
        accessorFn: (row) => formatDate(row.updatedAt),
      },
      {
        id: 'createdBy',
        header: 'Created by',
        accessorFn: (row) => resolveUserDisplay(row.createdBy, myId, user?.email),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorFn: (row) => formatDate(row.createdAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        accessorFn: (row) => row._id,
        enableSorting: false,
        cell: ({ row }) => {
          const task = row.original
          return (
            <Dropdown
              align="end"
              trigger={
                <Button size="icon" variant="ghost" className="h-8 w-8" data-row-click-stop="true">
                  <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                </Button>
              }
            >
              <DropdownItem onSelect={() => navigate(`/tasks/${task._id}`)}>
                Open details
              </DropdownItem>
              <DropdownItem
                onSelect={() => {
                  setEditingTitleId(task._id)
                  setEditingTitle(task.title)
                }}
              >
                Basligi duzenle
              </DropdownItem>
              <DropdownItem
                className="text-red-600 dark:text-red-300"
                onSelect={() => setTaskToDelete(task)}
              >
                Delete task
              </DropdownItem>
            </Dropdown>
          )
        },
      },
    ],
    [applyTaskUpdate, assignToMe, editingTitle, editingTitleId, myId, user?.email, push, navigate]
  )

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="font-display text-[#111218] dark:text-white overflow-x-hidden flex flex-col">
      <div className="relative flex h-full w-full flex-col grow">
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex flex-1 justify-center py-5 px-4 md:px-8 xl:px-40">
            <div className="layout-content-container flex flex-col w-full max-w-[1024px] flex-1 gap-6">
              <div className="flex flex-wrap gap-2 px-4">
                <button
                  className="text-[#616889] dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => navigate('/projects')}
                >
                  <span className="material-symbols-outlined text-lg">{projectIcon}</span>
                  Projects
                </button>
                <span className="text-[#616889] dark:text-gray-500 text-sm font-medium leading-normal">
                  /
                </span>
                <span className="text-[#111218] dark:text-white text-sm font-medium leading-normal">
                  {project?.title || 'Project'}
                </span>
              </div>

              <div className="px-4">
                <div className="flex flex-col gap-4 rounded-xl border border-border-light/70 bg-white/40 p-4 dark:border-border-dark dark:bg-surface-dark/50 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border-light bg-slate-50 text-slate-600 dark:border-border-dark dark:bg-white/5 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[20px]">{projectIcon}</span>
                      </span>
                      <h1 className="text-3xl font-black leading-tight tracking-tight text-[#111218] dark:text-white">
                        {project?.title || 'Project'}
                      </h1>
                      <select
                        className="h-8 rounded-full border border-blue-200 bg-blue-50 px-3 pr-8 text-xs font-bold uppercase tracking-[0.015em] text-primary dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        value={project?.status || 'active'}
                        onChange={handleProjectStatusChange}
                      >
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                      </select>
                      <Dropdown
                        align="start"
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full px-2"
                            title="Change project icon"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {projectIcon}
                            </span>
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              expand_more
                            </span>
                          </Button>
                        }
                      >
                        <div className="grid grid-cols-4 gap-1 p-1">
                          {PROJECT_ICON_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleProjectIconChange(option)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                                projectIcon === option
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border-light text-slate-500 hover:border-primary/40 hover:text-primary dark:border-border-dark dark:text-slate-300'
                              }`}
                              title={option}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {option}
                              </span>
                            </button>
                          ))}
                        </div>
                      </Dropdown>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-[#616889] dark:text-gray-400">
                      {project?.description || 'No project description yet.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#616889] dark:text-gray-400">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border-light px-2.5 py-1 dark:border-border-dark">
                        <span
                          className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                          title={ownerLabel}
                        >
                          {avatarInitial(ownerLabel)}
                        </span>
                        <span className="max-w-[160px] truncate">Owner</span>
                      </span>
                      <span className="inline-flex items-center rounded-full border border-border-light px-2.5 py-1 dark:border-border-dark">
                        <span className="mr-1">Memberler</span>
                        <span className="flex items-center">
                          {memberLabels.slice(0, 3).map((memberLabel, index) => (
                            <span
                              className="-ml-1 inline-flex size-5 items-center justify-center rounded-full border border-white bg-slate-200 text-[9px] font-semibold text-slate-700 first:ml-0 dark:border-surface-dark dark:bg-slate-700 dark:text-slate-200"
                              key={`${memberLabel}-${index}`}
                              title={memberLabel}
                            >
                              {avatarInitial(memberLabel)}
                            </span>
                          ))}
                          {memberLabels.length > 3 ? (
                            <span className="-ml-1 inline-flex size-5 items-center justify-center rounded-full border border-white bg-slate-100 text-[9px] font-semibold text-slate-500 dark:border-surface-dark dark:bg-slate-800 dark:text-slate-300">
                              +{memberLabels.length - 3}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {Array.isArray(project?.tags) && project.tags.length > 0
                        ? project.tags.map((tag) => (
                            <span
                              className="rounded-full border border-border-light px-2.5 py-1 dark:border-border-dark"
                              key={tag}
                            >
                              #{tag}
                            </span>
                          ))
                        : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <Button size="sm" onClick={() => setCreateTaskModalOpen(true)}>
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      New Task
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteModalOpen(true)}
                      disabled={deleteProject.isPending}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      {deleteProject.isPending ? 'Deleting...' : 'Delete project'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#dbdde6] dark:border-gray-700 gap-4">
                  <div className="flex gap-6 overflow-x-auto no-scrollbar">
                    <span className="flex items-center gap-2 border-b-[3px] border-b-primary text-[#111218] dark:text-white pb-3 pt-2 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[20px]">list_alt</span>
                      <p className="text-sm font-bold leading-normal tracking-[0.015em]">Tasks</p>
                      <span className="bg-gray-100 dark:bg-gray-800 text-xs font-medium px-2 py-0.5 rounded-full ml-1">
                        {visibleTasks.length}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/80 px-2.5 py-1 dark:border-border-dark dark:bg-white/5">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      list_alt
                    </span>
                    Toplam <b>{taskMetrics.all}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/80 px-2.5 py-1 dark:border-border-dark dark:bg-white/5">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">
                      radio_button_unchecked
                    </span>
                    To do <b>{taskMetrics.todo}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/80 px-2.5 py-1 dark:border-border-dark dark:bg-white/5">
                    <span className="material-symbols-outlined text-[14px] text-blue-500">
                      timelapse
                    </span>
                    In progress <b>{taskMetrics.in_progress}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/80 px-2.5 py-1 dark:border-border-dark dark:bg-white/5">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">
                      check_circle
                    </span>
                    Completed <b>{taskMetrics.done}</b>
                  </span>
                  {hasActiveFilters ? (
                    <span className="text-slate-500 dark:text-slate-400">
                      Filtered result: {visibleTasks.length} tasks
                    </span>
                  ) : null}
                </div>
                <DataTable
                  columns={columns}
                  data={visibleTasks}
                  loading={tasksQuery.isLoading}
                  initialPageYoue={8}
                  initialColumnVisibility={{
                    id: false,
                    createdBy: false,
                    createdAt: false,
                  }}
                  enableRowSelection
                  getRowId={(row) => String(row._id)}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                  onRowClick={(task) => navigate(`/tasks/${task._id}`)}
                  emptyText={tasksQuery.isLoading ? 'Tasks yukleniyor...' : 'No tasks yet.'}
                  renderToolbar={({ table }) => (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px]">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                            search
                          </span>
                          <Input
                            className="h-9 pl-9 max-w-[260px]"
                            placeholder="Search tasks..."
                            value={searchFilter}
                            onChange={(event) => setSearchFilter(event.target.value)}
                          />
                        </div>

                        <Dropdown
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-w-[132px] justify-between gap-1"
                            >
                              {
                                STATUS_OPTIONS.find((option) => option.value === statusFilter)
                                  ?.label
                              }
                              <span className="material-symbols-outlined text-[16px] text-slate-400">
                                expand_more
                              </span>
                            </Button>
                          }
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <DropdownItem
                              key={option.value}
                              onSelect={() => setStatusFilter(option.value)}
                            >
                              {option.label}
                            </DropdownItem>
                          ))}
                        </Dropdown>

                        <Dropdown
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-w-[148px] justify-between gap-1"
                            >
                              {
                                ASSIGNEE_OPTIONS.find((option) => option.value === assigneeFilter)
                                  ?.label
                              }
                              <span className="material-symbols-outlined text-[16px] text-slate-400">
                                expand_more
                              </span>
                            </Button>
                          }
                        >
                          {ASSIGNEE_OPTIONS.map((option) => (
                            <DropdownItem
                              key={option.value}
                              onSelect={() => setAssigneeFilter(option.value)}
                            >
                              {option.label}
                            </DropdownItem>
                          ))}
                        </Dropdown>

                        <Input
                          className="h-9 w-[200px]"
                          placeholder="Filter by tag..."
                          value={tagFilter}
                          onChange={(event) => setTagFilter(event.target.value)}
                        />
                        {hasActiveFilters ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-500"
                            data-row-click-stop="true"
                            onClick={() => {
                              setSearchFilter('')
                              setStatusFilter('all')
                              setAssigneeFilter('all')
                              setTagFilter('')
                            }}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                      <Dropdown
                        trigger={
                          <Button size="sm" variant="outline" className="gap-1">
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                            View
                          </Button>
                        }
                      >
                        {table
                          .getAllLeafColumns()
                          .filter((column) => !['select', 'id', 'actions'].includes(column.id))
                          .map((column) => (
                            <DropdownItem
                              key={column.id}
                              onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                            >
                              <span className="material-symbols-outlined mr-2 text-[16px] text-slate-400">
                                {COLUMN_META[column.id]?.icon || 'view_column'}
                              </span>
                              <span className="flex-1">
                                {column.getIsVisible() ? 'Hide' : 'Show'}{' '}
                                {COLUMN_META[column.id]?.label || column.id}
                              </span>
                              {column.getIsVisible() ? (
                                <span className="material-symbols-outlined text-[14px] text-primary">
                                  check
                                </span>
                              ) : null}
                            </DropdownItem>
                          ))}
                        <DropdownItem
                          onSelect={() => table.getColumn('id')?.toggleVisibility(true)}
                        >
                          <span className="material-symbols-outlined mr-2 text-[16px] text-slate-400">
                            tag
                          </span>
                          <span className="flex-1">Show ID column</span>
                        </DropdownItem>
                      </Dropdown>
                      {selectedTaskIds.length > 0 ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setBulkDeleteOpen(true)}
                          data-row-click-stop="true"
                        >
                          Delete selected ({selectedTaskIds.length})
                        </Button>
                      ) : null}
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={createTaskModalOpen}
        onOpenChange={setCreateTaskModalOpen}
        title="Create New Task"
        description="Bu proje icin yeni bir tasks ekleyin."
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setCreateTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="create-task-form" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" id="create-task-form" onSubmit={submitCreateTask}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Task Title
            </label>
            <Input
              id="new-task-title"
              placeholder="Task title (orn: Landing page hero revizyonu)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Description
            </label>
            <textarea
              className="w-full min-h-[110px] rounded-lg border border-border-light bg-transparent p-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-border-dark dark:text-white dark:placeholder:text-slate-500"
              placeholder="Task description (describe the scope...)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tags
              </label>
              <Input
                placeholder="For example: ui, backend, bug"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Priority
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border-light bg-white px-3 pr-8 text-sm dark:border-border-dark dark:bg-surface-dark"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete project"
        description={`"${project?.title || 'Project'}" will be permanently deleted. This action cannot be undone.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteProject}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      />

      <Modal
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null)
        }}
        title="Delete task"
        description={`"${taskToDelete?.title || 'Task'}" will be permanently deleted. This action cannot be undone.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setTaskToDelete(null)}>
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

      <Modal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected tasks"
        description={`${selectedTaskIds.length} tasks will be permanently deleted. This action cannot be undone.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleBulkDeleteTasks}
              disabled={bulkDeleteTasks.isPending || selectedTaskIds.length === 0}
            >
              {bulkDeleteTasks.isPending ? 'Deleting...' : 'Bulk delete'}
            </Button>
          </>
        }
      />
    </div>
  )
}
