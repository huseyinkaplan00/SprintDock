import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUiStore } from '../store/ui.store.js'
import { useAuth } from '../hooks/use-auth.js'
import { projectsApi } from '../api/projects.api.js'
import { tasksApi } from '../api/tasks.api.js'
import logo from '../assets/logo.svg'

function navClass(active) {
  if (active) {
    return 'flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary dark:text-blue-400'
  }

  return 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group'
}

function statusDotClass(status) {
  if (status === 'done') return 'bg-green-500'
  if (status === 'in_progress') return 'bg-blue-500'
  return 'bg-slate-400'
}

function statusLabel(status) {
  if (status === 'done') return 'Tamamlandi'
  if (status === 'in_progress') return 'Devam ediyor'
  return 'Yapilacak'
}

function SidebarProjectTasks({ projectId, activeTaskId }) {
  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.list(projectId),
    enabled: Boolean(projectId),
  })

  const tasks = useMemo(() => tasksQuery.data?.tasks ?? [], [tasksQuery.data])

  if (tasksQuery.isLoading) {
    return (
      <div className="space-y-1 py-1">
        <div className="skeleton h-7 w-full rounded-md" />
        <div className="skeleton h-7 w-full rounded-md" />
      </div>
    )
  }

  if (!tasks.length) {
    return <p className="px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">Gorev yok</p>
  }

  return (
    <div className="space-y-1 py-1">
      {tasks.slice(0, 8).map((task) => {
        const isActive = String(task._id) === String(activeTaskId)
        return (
          <NavLink
            key={task._id}
            to={`/tasks/${task._id}`}
            className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass(task.status)}`}
            />
            <span className="truncate">{task.title}</span>
          </NavLink>
        )
      })}
      {tasks.length > 8 ? (
        <p className="px-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
          +{tasks.length - 8} gorev daha
        </p>
      ) : null}
    </div>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const location = useLocation()
  const [expandedProjectId, setExpandedProjectId] = useState('')
  const [taskSearchInput, setTaskSearchInput] = useState('')
  const [taskSearchOpen, setTaskSearchOpen] = useState(false)
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })
  const projects = useMemo(() => projectsQuery.data?.projects ?? [], [projectsQuery.data])

  useEffect(() => {
    const text = taskSearchInput.trim()
    const timer = setTimeout(() => {
      setTaskSearchQuery(text)
    }, 180)
    return () => clearTimeout(timer)
  }, [taskSearchInput])

  const taskSearchQueryResult = useQuery({
    queryKey: ['tasks-search', taskSearchQuery],
    queryFn: () => tasksApi.search(taskSearchQuery),
    enabled: taskSearchQuery.length >= 1,
  })
  const searchedTasks = useMemo(
    () => taskSearchQueryResult.data?.tasks?.slice(0, 8) ?? [],
    [taskSearchQueryResult.data]
  )
  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((project) => [String(project._id), project])),
    [projects]
  )

  const activeProjectId = useMemo(() => {
    const matched = location.pathname.match(/^\/projects\/([^/]+)/)
    return matched ? matched[1] : ''
  }, [location.pathname])

  const activeTaskId = useMemo(() => {
    const matched = location.pathname.match(/^\/tasks\/([^/]+)/)
    return matched ? matched[1] : ''
  }, [location.pathname])

  useEffect(() => {
    if (activeProjectId) setExpandedProjectId(activeProjectId)
  }, [activeProjectId])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isShortcut) return
      event.preventDefault()
      searchInputRef.current?.focus()
      setTaskSearchOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setTaskSearchOpen(false)
  }, [location.pathname])

  const pageTitle = (() => {
    const path = location.pathname
    if (path.startsWith('/projects/')) return 'Proje Detayi'
    if (path.startsWith('/tasks/')) return 'Gorev Detayi'
    if (path.startsWith('/profile')) return 'Profil'
    return 'Projeler'
  })()

  return (
    <div className="flex h-[100dvh] w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark h-full shrink-0 transition-colors duration-200">
        <div className="flex flex-col h-full p-4">
          <div className="flex gap-3 mb-8 px-2 mt-2">
            <div className="bg-primary/10 flex items-center justify-center rounded-lg size-10 shrink-0">
              <img alt="SprintDock" className="logo-float h-6 w-6" src={logo} />
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <h1 className="text-sm font-semibold truncate">SprintDock</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">Calisma Alani</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            <NavLink to="/projects" className={({ isActive }) => navClass(isActive)}>
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="text-sm font-medium">Projeler</span>
            </NavLink>

            <div className="mt-2 rounded-lg border border-border-light/80 bg-slate-50/60 p-2 dark:border-border-dark dark:bg-white/[0.02]">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Proje Agaci
              </p>
              {projectsQuery.isLoading ? (
                <div className="space-y-2 p-1">
                  <div className="skeleton h-8 w-full rounded-md" />
                  <div className="skeleton h-8 w-full rounded-md" />
                  <div className="skeleton h-8 w-5/6 rounded-md" />
                </div>
              ) : projects.length ? (
                <div className="space-y-1">
                  {projects.map((project) => {
                    const isExpanded = expandedProjectId === String(project._id)
                    const isActive = activeProjectId === String(project._id)
                    return (
                      <div key={project._id} className="rounded-md">
                        <button
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                          }`}
                          onClick={() =>
                            setExpandedProjectId((prev) =>
                              prev === String(project._id) ? '' : String(project._id)
                            )
                          }
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">
                              {project.icon || 'folder'}
                            </span>
                            <span className="truncate">{project.title}</span>
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-slate-400">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                        {isExpanded ? (
                          <div className="mt-1 pl-2">
                            <SidebarProjectTasks
                              activeTaskId={activeTaskId}
                              projectId={String(project._id)}
                            />
                            <NavLink
                              to={`/projects/${project._id}`}
                              className="mt-1 block rounded-md px-2 py-1.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                            >
                              Proje detayina git
                            </NavLink>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                  Proje bulunamadi.
                </p>
              )}
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark flex flex-col gap-1">
            <NavLink to="/profile" className={({ isActive }) => navClass(isActive)}>
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
              <span className="text-sm font-medium">Profil</span>
            </NavLink>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-grid-pattern">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-cyan-400/[0.04] dark:from-primary/[0.14] dark:via-transparent dark:to-cyan-400/[0.08]" />
        <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-primary/15 blur-[90px] dark:bg-primary/20" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-300/20 blur-[90px] dark:bg-indigo-700/20" />
        <header className="flex items-center justify-between gap-3 px-6 py-3 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark shrink-0 z-10">
          <NavLink
            to="/projects"
            className="flex items-center gap-2 text-slate-900 dark:text-white lg:hidden"
          >
            <img alt="SprintDock" className="logo-float h-5 w-5" src={logo} />
            <span className="text-sm font-semibold">SprintDock</span>
          </NavLink>

          <div className="hidden lg:block min-w-[140px] text-sm font-semibold text-slate-900 dark:text-white">
            {pageTitle}
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <div className="relative w-[360px]">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                ref={searchInputRef}
                className="h-10 w-full rounded-xl border border-border-light bg-white/80 pl-10 pr-16 text-[16px] text-slate-900 outline-none transition-shadow focus:border-primary/50 focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-surface-dark dark:text-white"
                placeholder="Tum projelerde task ara..."
                value={taskSearchInput}
                onChange={(event) => setTaskSearchInput(event.target.value)}
                onFocus={() => setTaskSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchedTasks.length > 0) {
                    event.preventDefault()
                    navigate(`/tasks/${searchedTasks[0]._id}`)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setTaskSearchOpen(false), 120)
                }}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border-light px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-border-dark dark:text-slate-400">
                Ctrl K
              </span>
              {taskSearchOpen && taskSearchInput.trim().length >= 1 ? (
                <div className="absolute inset-x-0 top-12 z-30 rounded-xl border border-border-light bg-white p-2 shadow-xl dark:border-border-dark dark:bg-surface-dark">
                  {taskSearchQueryResult.isLoading ? (
                    <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                      Gorevler araniyor...
                    </p>
                  ) : searchedTasks.length ? (
                    <div className="space-y-1">
                      {searchedTasks.map((task) => {
                        const project = projectsById[String(task.projectId)]
                        return (
                          <button
                            key={task._id}
                            className="flex w-full items-start justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              navigate(`/tasks/${task._id}`)
                            }}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                                {task.title}
                              </span>
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                {project?.title || 'Proje'} - {statusLabel(task.status)}
                              </span>
                            </span>
                            <span
                              className={`mt-1 h-2 w-2 rounded-full ${statusDotClass(task.status)}`}
                            />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                      Eslesen gorev bulunamadi.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border-light bg-white/80 text-slate-500 transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
              onClick={toggleTheme}
              title="Tema degistir"
              aria-label="Tema degistir"
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border-light bg-white/80 text-slate-500 transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
              onClick={logout}
              title="Cikis"
              aria-label="Cikis yap"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>

          <div className="lg:hidden" />
          <div className="flex items-center gap-2 lg:hidden">
            <button
              className="inline-flex items-center justify-center size-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={toggleTheme}
              aria-label="Temayi degistir"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              className="inline-flex items-center justify-center size-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={logout}
              aria-label="Cikis yap"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>
        <nav className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              isActive
                ? 'px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium'
                : 'px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5'
            }
          >
            Projeler
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? 'px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium'
                : 'px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5'
            }
          >
            Profil
          </NavLink>
        </nav>

        <div className="flex-1 overflow-auto overscroll-contain p-6 md:p-8 relative z-[1] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto flex flex-col gap-6 min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
