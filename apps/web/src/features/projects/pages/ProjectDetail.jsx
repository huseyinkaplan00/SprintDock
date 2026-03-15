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
  { value: 'all', label: 'Tum durumlar', icon: 'apps' },
  { value: 'todo', label: 'Yapilacak', icon: 'radio_button_unchecked' },
  { value: 'in_progress', label: 'Devam ediyor', icon: 'timelapse' },
  { value: 'done', label: 'Tamamlandi', icon: 'check_circle' },
]

const ASSIGNEE_OPTIONS = [
  { value: 'all', label: 'Tum atananlar' },
  { value: 'me', label: 'Bana atananlar' },
  { value: 'unassigned', label: 'Atanmamis' },
]

const PRIORITY_META = {
  low: { label: 'Dusuk', icon: 'south', tone: 'text-slate-500' },
  medium: { label: 'Orta', icon: 'remove', tone: 'text-amber-500' },
  high: { label: 'Yuksek', icon: 'priority_high', tone: 'text-red-500' },
}

const TASK_STATUS_META = {
  todo: {
    label: 'Yapilacak',
    icon: 'radio_button_unchecked',
    tone: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
  },
  in_progress: {
    label: 'Devam ediyor',
    icon: 'timelapse',
    tone: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/25',
  },
  done: {
    label: 'Tamamlandi',
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
  if (!identity) return 'Atanmamis'

  if (typeof identity === 'object') {
    if (identity.email) return String(identity.email)
    if (identity.name) return String(identity.name)
    const objectId = String(identity._id || identity.id || '')
    if (objectId && objectId === String(currentUserId)) return currentUserEmail || 'Siz'
    if (objectId) return `Kullanici #${objectId.slice(0, 6)}`
  }

  const raw = String(identity)
  if (raw === String(currentUserId)) return currentUserEmail || 'Siz'
  if (raw.includes('@')) return raw
  if (/^[a-f0-9]{24}$/i.test(raw)) return `Kullanici #${raw.slice(0, 6)}`
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
    if (id && id === String(currentUserId)) return currentUserEmail || 'Siz'
    return id ? `${id.slice(0, 8)}...` : '-'
  }
  const raw = String(identity)
  if (raw === String(currentUserId)) return currentUserEmail || 'Siz'
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
  title: { label: 'Baslik', icon: 'title' },
  tags: { label: 'Etiketler', icon: 'sell' },
  status: { label: 'Durum', icon: 'radio_button_checked' },
  assignee: { label: 'Atanan', icon: 'person' },
  priority: { label: 'Oncelik', icon: 'priority_high' },
  dueDate: { label: 'Son Tarih', icon: 'calendar_today' },
  updatedAt: { label: 'Guncellendi', icon: 'update' },
  createdBy: { label: 'Olusturan', icon: 'edit_note' },
  createdAt: { label: 'Olusturulma', icon: 'history' },
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
          title: 'Gorev guncellenemedi',
          description: getErrorMessage(error, 'Gorev guncelleme yetkiniz olmayabilir.'),
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
        title: 'Gorev basligi zorunlu',
        description: 'Lutfen gorev icin en az 1 karakterlik bir baslik girin.',
        variant: 'danger',
      })
      return
    }

    if (cleanTitle.length < 3) {
      push({
        title: 'Baslik cok kisa',
        description: 'Gorev basligi en az 3 karakter olmali.',
        variant: 'danger',
      })
      return
    }

    if (cleanDescription && cleanDescription.length < 3) {
      push({
        title: 'Aciklama cok kisa',
        description: 'Aciklama girmek isterseniz en az 3 karakter olmali.',
        variant: 'danger',
      })
      return
    }

    if (parsedTags.length > 10) {
      push({
        title: 'Etiket sayisi fazla',
        description: 'En fazla 10 etiket ekleyebilirsiniz.',
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
      push({ title: 'Gorev olusturuldu' })
    } catch (error) {
      push({
        title: 'Gorev olusturulamadi',
        description: getErrorMessage(error, 'Bu projede gorev olusturma yetkiniz olmayabilir.'),
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
          successTitle: assignedToMe ? 'Gorev size atandi' : 'Atama kaldirildi',
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
        title: 'Proje silindi',
        description: 'Proje listesine yonlendiriliyorsunuz.',
      })
      navigate('/projects')
    } catch (error) {
      push({
        title: 'Proje silinemedi',
        description: getErrorMessage(error, 'Bu projeyi silme yetkiniz olmayabilir.'),
        variant: 'danger',
      })
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete?._id) return
    try {
      await deleteTask.mutateAsync(taskToDelete._id)
      push({
        title: 'Gorev silindi',
        description: `"${taskToDelete.title || 'Gorev'}" listeden kaldirildi.`,
      })
      setTaskToDelete(null)
    } catch (error) {
      push({
        title: 'Gorev silinemedi',
        description: getErrorMessage(error, 'Bu gorevi silme yetkiniz olmayabilir.'),
        variant: 'danger',
      })
    }
  }

  const handleProjectStatusChange = async (event) => {
    if (!project?._id) return
    const status = event.target.value
    try {
      await updateProject.mutateAsync({ projectId: project._id, payload: { status } })
      push({ title: 'Proje durumu guncellendi' })
    } catch (error) {
      push({
        title: 'Proje durumu guncellenemedi',
        description: getErrorMessage(error, 'Durum guncelleme yetkiniz olmayabilir.'),
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
      push({ title: 'Proje ikonu guncellendi' })
    } catch (error) {
      push({
        title: 'Proje ikonu guncellenemedi',
        description: getErrorMessage(error, 'Ikon guncelleme yetkiniz olmayabilir.'),
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
        title: 'Toplu silme tamamlandi',
        description: `${selectedTaskIds.length} gorev silindi.`,
      })
      setBulkDeleteOpen(false)
    } catch (error) {
      push({
        title: 'Toplu silme basarisiz',
        description: getErrorMessage(error, 'Secilen gorevlerden bazilari silinemedi.'),
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
            aria-label="Tum gorevleri sec"
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
            aria-label="Gorevi sec"
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
        header: 'Gorev Basligi',
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
                      title: 'Baslik bos olamaz',
                      description: 'Gorev basligi en az 1 karakter olmali.',
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
        header: 'Etiketler',
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
        header: 'Durum',
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          const meta = TASK_STATUS_META[row.original.status] || TASK_STATUS_META.todo
          return (
            <Dropdown
              trigger={
                <button
                  className={`inline-flex size-8 items-center justify-center rounded-full border border-border-light ${meta.bg} ${meta.tone} dark:border-border-dark`}
                  data-row-click-stop="true"
                  title={`Durum: ${meta.label}`}
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
        header: 'Atanan',
        accessorFn: (row) => resolveAssigneeId(row.assignee),
        cell: ({ row }) => {
          const assigneeRaw = resolveAssigneeId(row.original.assignee)
          const label = resolveAssigneeLabel(row.original.assignee, myId, user?.email)
          const initial = (label || 'K').slice(0, 1).toUpperCase()
          return (
            <div className="flex items-center gap-2">
              <HoverTooltip content={`Atanan: ${label}`}>
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
                      ? 'Atamayi kaldir'
                      : assigneeRaw
                        ? 'Gorevi uzerine al'
                        : 'Kendine ata'
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
        header: 'Oncelik',
        accessorFn: (row) => row.priority || 'medium',
        cell: ({ row }) => {
          const meta = PRIORITY_META[row.original.priority || 'medium'] || PRIORITY_META.medium
          return (
            <HoverTooltip content={`Oncelik: ${meta.label}`}>
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
        header: 'Son Tarih',
        accessorFn: (row) => formatDate(row.dueDate),
      },
      {
        id: 'updatedAt',
        header: 'Guncellendi',
        accessorFn: (row) => formatDate(row.updatedAt),
      },
      {
        id: 'createdBy',
        header: 'Olusturan',
        accessorFn: (row) => resolveUserDisplay(row.createdBy, myId, user?.email),
      },
      {
        id: 'createdAt',
        header: 'Olusturulma',
        accessorFn: (row) => formatDate(row.createdAt),
      },
      {
        id: 'actions',
        header: 'Aksiyonlar',
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
                Detaya git
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
                Gorevi sil
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
                  Projeler
                </button>
                <span className="text-[#616889] dark:text-gray-500 text-sm font-medium leading-normal">
                  /
                </span>
                <span className="text-[#111218] dark:text-white text-sm font-medium leading-normal">
                  {project?.title || 'Proje'}
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
                        {project?.title || 'Proje'}
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
                            title="Proje ikonunu degistir"
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
                      {project?.description || 'Henuz proje aciklamasi yok.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#616889] dark:text-gray-400">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border-light px-2.5 py-1 dark:border-border-dark">
                        <span
                          className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                          title={ownerLabel}
                        >
                          {avatarInitial(ownerLabel)}
                        </span>
                        <span className="max-w-[160px] truncate">Sahip</span>
                      </span>
                      <span className="inline-flex items-center rounded-full border border-border-light px-2.5 py-1 dark:border-border-dark">
                        <span className="mr-1">Uyeler</span>
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
                      Yeni Gorev
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteModalOpen(true)}
                      disabled={deleteProject.isPending}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      {deleteProject.isPending ? 'Siliniyor...' : 'Projeyi Sil'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#dbdde6] dark:border-gray-700 gap-4">
                  <div className="flex gap-6 overflow-x-auto no-scrollbar">
                    <span className="flex items-center gap-2 border-b-[3px] border-b-primary text-[#111218] dark:text-white pb-3 pt-2 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[20px]">list_alt</span>
                      <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                        Gorevler
                      </p>
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
                    Yapilacak <b>{taskMetrics.todo}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/80 px-2.5 py-1 dark:border-border-dark dark:bg-white/5">
                    <span className="material-symbols-outlined text-[14px] text-blue-500">
                      timelapse
                    </span>
                    Devam ediyor <b>{taskMetrics.in_progress}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/80 px-2.5 py-1 dark:border-border-dark dark:bg-white/5">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">
                      check_circle
                    </span>
                    Tamamlandi <b>{taskMetrics.done}</b>
                  </span>
                  {hasActiveFilters ? (
                    <span className="text-slate-500 dark:text-slate-400">
                      Filtre sonucu: {visibleTasks.length} gorev
                    </span>
                  ) : null}
                </div>
                <DataTable
                  columns={columns}
                  data={visibleTasks}
                  loading={tasksQuery.isLoading}
                  initialPageSize={8}
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
                  emptyText={tasksQuery.isLoading ? 'Gorevler yukleniyor...' : 'Henuz gorev yok.'}
                  renderToolbar={({ table }) => (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px]">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                            search
                          </span>
                          <Input
                            className="h-9 pl-9 max-w-[260px]"
                            placeholder="Gorev ara..."
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
                          placeholder="Etikete gore filtrele..."
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
                            Temizle
                          </Button>
                        ) : null}
                      </div>
                      <Dropdown
                        trigger={
                          <Button size="sm" variant="outline" className="gap-1">
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                            Gorunum
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
                                {column.getIsVisible() ? 'Gizle' : 'Goster'}{' '}
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
                          <span className="flex-1">ID kolonunu goster</span>
                        </DropdownItem>
                      </Dropdown>
                      {selectedTaskIds.length > 0 ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setBulkDeleteOpen(true)}
                          data-row-click-stop="true"
                        >
                          Secilenleri sil ({selectedTaskIds.length})
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
        title="Yeni Gorev Olustur"
        description="Bu proje icin yeni bir gorev ekleyin."
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setCreateTaskModalOpen(false)}>
              Vazgec
            </Button>
            <Button size="sm" type="submit" form="create-task-form" disabled={createTask.isPending}>
              {createTask.isPending ? 'Olusturuluyor...' : 'Gorev Olustur'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" id="create-task-form" onSubmit={submitCreateTask}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Gorev Basligi
            </label>
            <Input
              id="new-task-title"
              placeholder="Gorev basligi (orn: Landing page hero revizyonu)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Aciklama
            </label>
            <textarea
              className="w-full min-h-[110px] rounded-lg border border-border-light bg-transparent p-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-border-dark dark:text-white dark:placeholder:text-slate-500"
              placeholder="Gorev aciklamasi (kapsami aciklayin...)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Etiketler
              </label>
              <Input
                placeholder="Orn: ui, backend, bug"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Oncelik
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border-light bg-white px-3 pr-8 text-sm dark:border-border-dark dark:bg-surface-dark"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="low">Dusuk</option>
                <option value="medium">Orta</option>
                <option value="high">Yuksek</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Son Tarih
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
        title="Projeyi sil"
        description={`"${project?.title || 'Proje'}" kalici olarak silinecek. Bu islem geri alinmaz.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Vazgec
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteProject}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </>
        }
      />

      <Modal
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null)
        }}
        title="Gorevi sil"
        description={`"${taskToDelete?.title || 'Gorev'}" kalici olarak silinecek. Bu islem geri alinmaz.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setTaskToDelete(null)}>
              Vazgec
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteTask}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </>
        }
      />

      <Modal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Secilen gorevleri sil"
        description={`${selectedTaskIds.length} gorev kalici olarak silinecek. Bu islem geri alinmaz.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Vazgec
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleBulkDeleteTasks}
              disabled={bulkDeleteTasks.isPending || selectedTaskIds.length === 0}
            >
              {bulkDeleteTasks.isPending ? 'Siliniyor...' : 'Toplu sil'}
            </Button>
          </>
        }
      />
    </div>
  )
}
