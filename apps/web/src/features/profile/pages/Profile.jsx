import React, { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../../../api/sessions.api.js'
import { useAuth } from '../../../hooks/use-auth.js'
import { formatDate } from '../../../lib/format.js'
import { Button } from '../../../components/ui/button.jsx'
import { useToast } from '../../../components/ui/toast.jsx'
import { getErrorMessage } from '../../../lib/api-error.js'
import { Skeleton } from '../../../components/common/skeleton.jsx'
import { useI18n } from '../../../lib/i18n.js'

function parseSessionId(token) {
  if (!token || typeof window === 'undefined') return ''

  try {
    const payload = token.split('.')[1]
    if (!payload) return ''
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = window.atob(padded)
    const json = JSON.parse(decoded)
    return json?.sid ? String(json.sid) : ''
  } catch (_err) {
    return ''
  }
}

function normalizeIp(ip) {
  const value = String(ip || '').trim()
  if (!value) return 'Unknown IP'
  return value.replace(/^::ffff:/, '')
}

function parseUserAgent(device) {
  const ua = String(device || '').trim()
  if (!ua) {
    return {
      icon: 'devices',
      title: 'Unknown device',
      detail: 'No browser information',
    }
  }

  const browserRules = [
    { regex: /edg\/([\d.]+)/i, label: 'Edge' },
    { regex: /chrome\/([\d.]+)/i, label: 'Chrome' },
    { regex: /firefox\/([\d.]+)/i, label: 'Firefox' },
    { regex: /safari\/([\d.]+)/i, label: 'Safari' },
  ]

  const osRules = [
    { regex: /mac os x ([\d_]+)/i, label: 'macOS' },
    { regex: /windows nt ([\d.]+)/i, label: 'Windows' },
    { regex: /android ([\d.]+)/i, label: 'Android' },
    { regex: /iphone os ([\d_]+)/i, label: 'iOS' },
    { regex: /ipad.*os ([\d_]+)/i, label: 'iPadOS' },
    { regex: /linux/i, label: 'Linux' },
  ]

  let browser = 'Browser'
  let browserVersion = ''
  for (const rule of browserRules) {
    const match = ua.match(rule.regex)
    if (match) {
      browser = rule.label
      browserVersion = match[1] || ''
      break
    }
  }

  let os = 'Unknown operating system'
  let osVersion = ''
  for (const rule of osRules) {
    const match = ua.match(rule.regex)
    if (match) {
      os = rule.label
      osVersion = (match[1] || '').replace(/_/g, '.')
      break
    }
  }

  const isMobile = /iphone|ipad|android|mobile/i.test(ua)

  return {
    icon: isMobile
      ? 'smartphone'
      : os.toLowerCase().includes('windows')
        ? 'desktop_windows'
        : 'laptop_mac',
    title: `${browser} · ${os}`,
    detail:
      [browserVersion ? `v${browserVersion.split('.')[0]}` : '', osVersion ? `OS ${osVersion}` : '']
        .filter(Boolean)
        .join(' · ') || 'No version information',
  }
}

function locationLabel(ip) {
  return `${normalizeIp(ip)} • Location unavailable`
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { accessToken, user } = useAuth()
  const { push } = useToast()
  const { t } = useI18n()
  const currentSessionId = useMemo(() => parseSessionId(accessToken), [accessToken])

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.list,
  })

  const revokeSession = useMutation({
    mutationFn: sessionsApi.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const revokeOthers = useMutation({
    mutationFn: sessionsApi.revokeOthers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const sessions = useMemo(() => sessionsQuery.data?.sessions || [], [sessionsQuery.data])
  const currentSession = useMemo(
    () => sessions.find((session) => String(session.id) === String(currentSessionId)),
    [sessions, currentSessionId]
  )

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession.mutateAsync(sessionId)
      push({ title: 'Session removed' })
    } catch (error) {
      push({
        title: 'Session could not be removed',
        description: getErrorMessage(error, 'You may not have permission to close this session.'),
        variant: 'danger',
      })
    }
  }

  const handleRevokeOthers = async () => {
    try {
      await revokeOthers.mutateAsync()
      push({ title: 'Other sessions closed' })
    } catch (error) {
      push({
        title: 'Sessions could not be closed',
        description: getErrorMessage(error, 'Active sessions cannot be closed right now.'),
        variant: 'danger',
      })
    }
  }

  return (
    <div className="w-full max-w-[960px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[#111218] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
          Profile
        </p>
        <p className="text-[#616889] dark:text-gray-400 text-base font-normal leading-normal">
          Manage your session and security settings.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-[#dbdde6] bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#15192b]">
        <div className="size-11 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
          {(user?.email || 'M').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#111218] dark:text-white">
            {user?.email || t('User', 'User')}
          </p>
          <p className="text-xs text-[#616889] dark:text-gray-400">
            {(user?.role || 'member').toLowerCase()} - {t('active session', 'active session')}
          </p>
          {currentSession?.device ? (
            <p className="truncate text-xs text-[#616889] dark:text-gray-400">
              {parseUserAgent(currentSession.device).title}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col bg-white dark:bg-[#15192b] rounded-xl border border-[#dbdde6] dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f0f1f4] dark:border-gray-800">
          <h1 className="text-[#111218] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
            Active Sessions
          </h1>
          <p className="text-[#616889] dark:text-gray-400 text-sm font-normal leading-normal mt-2 max-w-2xl">
            {t(
              'This list shows devices signed into your account. Remove any session you do not recognize.',
              'This list shows devices signed into your account. Remove any session you do not recognize.'
            )}
          </p>
        </div>

        <div className="flex flex-col">
          {sessionsQuery.isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}

          {!sessionsQuery.isLoading && sessions.length === 0 ? (
            <div className="p-5 text-sm text-[#616889] dark:text-gray-400">No active sessions.</div>
          ) : null}

          {sessions.map((session) => {
            const isCurrent = currentSessionId && String(session.id) === currentSessionId
            const parsedDevice = parseUserAgent(session.device)
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-5 border-b border-[#f0f1f4] dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1c2136] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                        : 'bg-gray-100 dark:bg-gray-800 text-[#616889] dark:text-gray-400'
                    }`}
                  >
                    <span className="material-symbols-outlined">{parsedDevice.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-[#111218] dark:text-white text-sm font-bold">
                        {parsedDevice.title}
                      </p>
                      {isCurrent ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          This device
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[#616889] dark:text-gray-400 text-xs mt-1">
                      {parsedDevice.detail}
                    </p>
                    <p className="text-[#616889] dark:text-gray-400 text-xs mt-1">
                      {locationLabel(session.ip)}
                    </p>
                    <p className="text-[#616889] dark:text-gray-400 text-xs mt-0.5">
                      Session ID: {String(session.id || '').slice(0, 8)}...
                    </p>
                    <p className="text-[#616889] dark:text-gray-400 text-xs mt-0.5">
                      Created {formatDate(session.createdAt)}
                    </p>
                    <p className="text-[#616889] dark:text-gray-400 text-xs mt-0.5">
                      {isCurrent
                        ? 'Currently active'
                        : `Last active ${formatDate(session.lastUsed)}`}
                    </p>
                  </div>
                </div>
                {!isCurrent ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revokeSession.isPending}
                  >
                    {t('Remove', 'Kaldir')}
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="p-5 bg-gray-50 dark:bg-[#1c2136]/50 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[#111218] dark:text-white text-sm font-semibold">
              {t('Sign out everywhere', 'Her yerden cikis yap')}
            </p>
            <p className="text-[#616889] dark:text-gray-400 text-xs mt-1">
              {t(
                'This ends every session except the current device.',
                'Bu islem bu cihaz disindaki tum oturumlari sonlandirir.'
              )}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            className="h-9 text-xs"
            onClick={handleRevokeOthers}
            disabled={revokeOthers.isPending}
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            {revokeOthers.isPending
              ? t('Processing...', 'Isleniyor...')
              : t('Remove all other sessions', 'Diger tum oturumlari kaldir')}
          </Button>
        </div>
      </div>
    </div>
  )
}
