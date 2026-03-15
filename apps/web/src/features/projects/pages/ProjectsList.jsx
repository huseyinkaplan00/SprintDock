import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../../../api/projects.api.js'
import { formatDate } from '../../../lib/format.js'
import { Button } from '../../../components/ui/button.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Modal } from '../../../components/ui/modal.jsx'
import { HoverTooltip } from '../../../components/ui/hover-tooltip.jsx'
import { useToast } from '../../../components/ui/toast.jsx'
import { getErrorMessage } from '../../../lib/api-error.js'
import { useAuth } from '../../../hooks/use-auth.js'
import { Skeleton } from '../../../components/common/skeleton.jsx'

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

function projectStatusMeta(status) {
  const value = (status || '').toLowerCase()
  if (value === 'active' || value === 'in_progress') {
    return {
      label: 'Aktif',
      icon: 'timelapse',
      tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    }
  }
  if (value === 'completed' || value === 'done') {
    return {
      label: 'Tamamlandi',
      icon: 'check_circle',
      tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    }
  }
  if (value === 'blocked') {
    return {
      label: 'Engelli',
      icon: 'block',
      tone: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    }
  }
  if (value === 'archived') {
    return {
      label: 'Arsivlendi',
      icon: 'inventory_2',
      tone: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
    }
  }
  return {
    label: value || 'Aktif',
    icon: 'radio_button_checked',
    tone: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
  }
}

function shortId(value) {
  const text = String(value || '')
  if (!text) return '-'
  return text.length > 8 ? `${text.slice(0, 8)}...` : text
}

function resolveUserLabel(identity, currentUserId, fallbackEmail) {
  if (!identity) return fallbackEmail || 'Kullanici'
  if (typeof identity === 'object') {
    const id = String(identity._id || identity.id || '')
    if (id && id === String(currentUserId)) return fallbackEmail || identity.email || 'Siz'
    return identity.email || identity.name || shortId(id)
  }
  const raw = String(identity)
  if (raw === String(currentUserId)) return fallbackEmail || 'Siz'
  if (raw.includes('@')) return raw
  return shortId(raw)
}

function avatarInitial(label) {
  const value = String(label || '')
    .trim()
    .replace(/^[^a-zA-Z]+/, '')
  return (value[0] || 'K').toUpperCase()
}

export default function ProjectsList() {
  const queryClient = useQueryClient()
  const { push } = useToast()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [icon, setIcon] = useState('rocket_launch')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const currentUserId = String(user?.id || '')

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const createProject = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateModalOpen(false)
      setTitle('')
      setDescription('')
      setTagsInput('')
      setIcon('rocket_launch')
    },
  })
  const deleteProject = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const projects = useMemo(() => {
    const list = projectsQuery.data?.projects || []
    if (!search.trim()) return list
    return list.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
  }, [projectsQuery.data, search])

  const submitCreate = async (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const tags = tagsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!cleanTitle) {
      push({
        title: 'Proje basligi zorunlu',
        description: 'Lutfen proje icin bir baslik girin.',
        variant: 'danger',
      })
      return
    }

    if (cleanTitle.length < 3) {
      push({
        title: 'Baslik cok kisa',
        description: 'Proje basligi en az 3 karakter olmali.',
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

    try {
      await createProject.mutateAsync({
        title: cleanTitle,
        description: cleanDescription,
        tags,
        icon,
      })
      push({ title: 'Proje olusturuldu' })
    } catch (error) {
      push({
        title: 'Proje olusturulamadi',
        description: getErrorMessage(error, 'Proje olusturmak icin yetkiniz olmayabilir.'),
        variant: 'danger',
      })
    }
  }

  const handleDeleteProject = async () => {
    if (!deleteTarget?._id) return
    try {
      await deleteProject.mutateAsync(deleteTarget._id)
      setDeleteTarget(null)
      push({ title: 'Proje silindi' })
    } catch (error) {
      push({
        title: 'Proje silinemedi',
        description: getErrorMessage(error, 'Bu projeyi silme yetkiniz olmayabilir.'),
        variant: 'danger',
      })
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projeler
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Ekibinizin devam eden islerini yonetin ve takip edin.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <span className="material-symbols-outlined text-[20px]">add</span>
          Yeni Proje
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-2">
        <div className="relative min-w-[200px] w-full sm:w-[260px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            filter_list
          </span>
          <Input
            className="h-9 pl-9"
            placeholder="Projeleri filtrele..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
          />
        </div>
      </div>

      <div className="border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden shadow-sm">
        <div className="max-h-none md:max-h-[65vh] overflow-x-auto md:overflow-auto">
          <table className="w-full min-w-[900px] text-sm text-left">
            <thead className="sticky top-0 z-10 text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 font-medium min-w-[240px]">Baslik</th>
                <th className="px-6 py-3 font-medium">Durum</th>
                <th className="px-6 py-3 font-medium">Gorevler</th>
                <th className="px-6 py-3 font-medium">Sahip</th>
                <th className="px-6 py-3 font-medium">Ekip</th>
                <th className="px-6 py-3 font-medium">Olusturuldu</th>
                <th className="px-6 py-3 font-medium">Guncellendi</th>
                <th className="px-6 py-3 font-medium text-right">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {projectsQuery.isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`projects-skeleton-${index}`}>
                      <td className="px-6 py-4" colSpan={8}>
                        <div className="grid grid-cols-[2.2fr_1fr_1.2fr_1fr_1fr_1fr_1fr_0.8fr] gap-3">
                          <Skeleton className="h-10" />
                          <Skeleton className="h-6" />
                          <Skeleton className="h-6" />
                          <Skeleton className="h-6" />
                          <Skeleton className="h-6" />
                          <Skeleton className="h-6" />
                          <Skeleton className="h-6" />
                          <Skeleton className="h-6" />
                        </div>
                      </td>
                    </tr>
                  ))
                : null}

              {!projectsQuery.isLoading && projects.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500 text-center" colSpan={8}>
                    Proje bulunamadi.
                  </td>
                </tr>
              ) : null}

              {projects.map((project) => {
                const status = projectStatusMeta(project.status)
                return (
                  <tr
                    key={project._id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all duration-150 hover:-translate-y-[1px]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 dark:bg-orange-500/10 p-1.5 rounded-md text-orange-600 dark:text-orange-400 shrink-0">
                          <span className="material-symbols-outlined text-[18px]">
                            {project.icon || 'rocket_launch'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {project.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {project.description || 'Aciklama yok'}
                          </span>
                          {(project.tags || []).length ? (
                            <span className="mt-1 inline-flex max-w-[240px] flex-wrap gap-1">
                              {(project.tags || []).slice(0, 2).map((tag) => (
                                <span
                                  className="rounded-full border border-border-light px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-border-dark dark:text-slate-400"
                                  key={`${project._id}-${tag}`}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <HoverTooltip content={`Durum: ${status.label}`}>
                        <span
                          className={`inline-flex items-center justify-center size-8 rounded-full text-xs font-medium border ${status.tone}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {status.icon}
                          </span>
                        </span>
                      </HoverTooltip>
                    </td>
                    <td className="px-6 py-4">
                      <HoverTooltip content={`${project.taskCount || 0} gorev`}>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-border-light bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-border-dark dark:bg-white/5 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            task_alt
                          </span>
                          <span className="font-semibold">{project.taskCount || 0}</span>
                          <span className="text-slate-400">gorev</span>
                        </div>
                      </HoverTooltip>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const ownerLabel = resolveUserLabel(
                          project.owner,
                          currentUserId,
                          user?.email
                        )
                        return (
                          <HoverTooltip content={`Sahip: ${ownerLabel}`}>
                            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-2 ring-white dark:ring-surface-dark">
                              {avatarInitial(ownerLabel)}
                            </span>
                          </HoverTooltip>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {(project.members || []).slice(0, 3).map((member, index) => {
                          const memberLabel = resolveUserLabel(member, currentUserId, user?.email)
                          return (
                            <HoverTooltip
                              content={memberLabel}
                              key={`${project._id}-member-${index}`}
                            >
                              <span
                                className={`inline-flex size-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-semibold text-slate-700 dark:border-surface-dark dark:bg-slate-700 dark:text-slate-200 ${
                                  index === 0 ? '' : '-ml-2'
                                }`}
                              >
                                {avatarInitial(memberLabel)}
                              </span>
                            </HoverTooltip>
                          )
                        })}
                        {(project.members?.length || 0) > 3 ? (
                          <HoverTooltip content={`${project.members.length} uye`}>
                            <span className="inline-flex -ml-2 size-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-slate-500 dark:border-surface-dark dark:bg-slate-800 dark:text-slate-300">
                              +{project.members.length - 3}
                            </span>
                          </HoverTooltip>
                        ) : null}
                        {(project.members?.length || 0) === 0 ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(project.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(project.updatedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/projects/${project._id}`}
                          className="inline-flex items-center justify-center h-8 rounded-lg px-3 border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                          Ac
                        </Link>
                        <Button
                          size="sm"
                          variant="danger"
                          className="h-8"
                          onClick={() => setDeleteTarget(project)}
                          disabled={deleteProject.isPending}
                        >
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Yeni Proje Olustur"
        description="Calisma alani icin yeni bir girisim ekleyin."
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Vazgec
            </Button>
            <Button
              size="sm"
              type="submit"
              form="create-project-form"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? 'Olusturuluyor...' : 'Proje Olustur'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" id="create-project-form" onSubmit={submitCreate}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Proje Basligi
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Proje basligi (orn: Q4 Buyume Yol Haritasi)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ikon</label>
            <div className="grid grid-cols-8 gap-2">
              {PROJECT_ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                    icon === iconName
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light bg-slate-50 text-slate-500 hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-white/5 dark:text-slate-300'
                  }`}
                  aria-label={`Ikon sec: ${iconName}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{iconName}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Aciklama
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-border-light bg-transparent p-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-border-dark dark:text-white dark:placeholder:text-slate-500"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Proje aciklamasi (bu projenin amaci nedir?)"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Sahip
              </label>
              <Input readOnly value={user?.email || 'Aktif kullanici'} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Etiketler
              </label>
              <Input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="Orn: marketing, q4"
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Projeyi sil"
        description={`"${deleteTarget?.title || 'Proje'}" kalici olarak silinecek. Bu islem geri alinmaz.`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
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
    </>
  )
}
