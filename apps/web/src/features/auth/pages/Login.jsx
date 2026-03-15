import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyOtp } from '../../../api/auth.api.js'
import { Button } from '../../../components/ui/button.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { useToast } from '../../../components/ui/toast.jsx'
import { getErrorMessage } from '../../../lib/api-error.js'
import logo from '../../../assets/logo.svg'

function OtpInputs({ value, onChange, disabled }) {
  const digits = useMemo(() => value.padEnd(6, ' ').slice(0, 6).split(''), [value])

  const setDigit = (index, raw) => {
    const nextDigits = (raw || '').replace(/\D/g, '')
    const current = value.padEnd(6, ' ').split('')

    // Support multi-digit input (paste/auto-fill) into a single box.
    if (nextDigits.length > 1) {
      nextDigits
        .slice(0, 6 - index)
        .split('')
        .forEach((ch, offset) => {
          current[index + offset] = ch
        })
      const merged = current.join('').replace(/\s/g, '')
      onChange(merged)

      const nextIndex = Math.min(5, index + nextDigits.length)
      const next = document.getElementById(`otp-${nextIndex}`) || document.getElementById('otp-5')
      if (next) next.focus()
      return
    }

    const nextChar = nextDigits.slice(-1)
    current[index] = nextChar || ' '
    const merged = current.join('').replace(/\s/g, '')
    onChange(merged)

    if (nextChar) {
      const next = document.getElementById(`otp-${index + 1}`)
      if (next) next.focus()
    }
  }

  const handlePaste = (event) => {
    const text = event.clipboardData?.getData('text') || ''
    const next = text.replace(/\D/g, '').slice(0, 6)
    if (!next) return
    event.preventDefault()
    onChange(next)
    const targetIndex = Math.min(next.length, 6) - 1
    const el = document.getElementById(`otp-${Math.max(0, targetIndex)}`)
    if (el) el.focus()
  }

  const scrollIntoViewIfNeeded = (event) => {
    const el = event.currentTarget
    if (typeof window === 'undefined') return
    if (window.innerWidth >= 768) return
    // When the mobile keyboard opens, keep the focused input visible.
    window.setTimeout(() => {
      try {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      } catch (_err) {
        // no-op
      }
    }, 60)
  }

  return (
    <fieldset className="relative flex gap-2 sm:gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <React.Fragment key={index}>
          {index === 3 ? (
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-600 font-bold">
              -
            </div>
          ) : null}
          <input
            id={`otp-${index}`}
            className="flex h-12 w-10 sm:h-14 sm:w-12 text-center rounded-lg bg-white dark:bg-[#151925] border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-semibold text-[#111218] dark:text-white transition-all shadow-sm"
            maxLength={1}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            value={digits[index] === ' ' ? '' : digits[index]}
            disabled={disabled}
            onChange={(event) => setDigit(index, event.target.value)}
            onFocus={scrollIntoViewIfNeeded}
            onPaste={handlePaste}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digits[index]) {
                const prev = document.getElementById(`otp-${index - 1}`)
                if (prev) prev.focus()
              }
            }}
          />
        </React.Fragment>
      ))}
    </fieldset>
  )
}

export default function LoginPage() {
  // API bazen retryAfter donmezse backend default penceresine gore korumali bekleme uygula.
  const RESEND_FALLBACK_WAIT_SEC = 60
  const navigate = useNavigate()
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [resendBlockedUntil, setResendBlockedUntil] = useState(0)
  const [resendCountdown, setResendCountdown] = useState(0)
  const lastAutoSubmitRef = React.useRef('')

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value)

  useEffect(() => {
    if (!otpExpiresAt) {
      setCountdown(0)
      return undefined
    }

    const tick = () => {
      const next = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000))
      setCountdown(next)
      if (next === 0) {
        setOtpRequested(false)
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [otpExpiresAt])

  useEffect(() => {
    if (!resendBlockedUntil) {
      setResendCountdown(0)
      return undefined
    }

    const tick = () => {
      const next = Math.max(0, Math.ceil((resendBlockedUntil - Date.now()) / 1000))
      setResendCountdown(next)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [resendBlockedUntil])

  const countdownLabel = useMemo(() => {
    const minutes = String(Math.floor(countdown / 60)).padStart(2, '0')
    const seconds = String(countdown % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [countdown])

  const resendCountdownLabel = useMemo(() => {
    const minutes = String(Math.floor(resendCountdown / 60)).padStart(2, '0')
    const seconds = String(resendCountdown % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [resendCountdown])

  useEffect(() => {
    if (!otpRequested) return
    if (loading) return
    if (otp.length !== 6) return
    if (lastAutoSubmitRef.current === otp) return
    lastAutoSubmitRef.current = otp
    // Full paste / auto-fill: attempt verify immediately for a smoother UX.
    submitOtp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpRequested, loading])

  const submitEmail = async () => {
    const cleanEmail = email.trim()
    if (resendCountdown > 0) {
      const reason = `Cok fazla istek algilandi. Yeni OTP kodu icin ${resendCountdownLabel} bekleyin.`
      setMessage(reason)
      push({ title: 'Bekleme suresi var', description: reason, variant: 'danger' })
      return
    }

    if (!cleanEmail) {
      const reason = 'E-posta zorunlu. Lutfen e-posta adresinizi girin.'
      setMessage(reason)
      push({ title: 'E-posta gerekli', description: reason, variant: 'danger' })
      return
    }
    if (!validateEmail(cleanEmail)) {
      const reason = 'Gecersiz e-posta formati. Ornek: ad@domain.com'
      setMessage(reason)
      push({ title: 'E-posta gecersiz', description: reason, variant: 'danger' })
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const data = await requestOtp(cleanEmail)
      const expiresInSec = Number(data?.expiresInSec || 300)
      setOtpRequested(true)
      setOtp('')
      lastAutoSubmitRef.current = ''
      setOtpExpiresAt(Date.now() + expiresInSec * 1000)
      setResendBlockedUntil(0)
      if (data?.otp) setMessage(`OTP (gelistirme): ${data.otp}`)
      push({
        title: 'OTP kodu gonderildi',
        description: `Kod ${Math.ceil(expiresInSec / 60)} dakika icinde sona erecek.`,
      })
    } catch (error) {
      const retryAfterSec = Number(error?.retryAfterSec || 0)
      const waitSec =
        retryAfterSec > 0
          ? retryAfterSec
          : Number(error?.status) === 429
            ? RESEND_FALLBACK_WAIT_SEC
            : 0
      if (waitSec > 0) {
        setResendBlockedUntil(Date.now() + waitSec * 1000)
      }
      const baseReason = getErrorMessage(error, 'OTP kodu su anda gonderilemiyor.')
      const reason =
        waitSec > 0 && !baseReason.includes('sn sonra')
          ? `${baseReason}. ${waitSec} sn sonra tekrar deneyin.`
          : baseReason
      setMessage(reason)
      push({ title: 'OTP gonderilemedi', description: reason, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const submitOtp = async () => {
    if (otp.length !== 6) {
      const reason = 'OTP kodu 6 haneli olmali.'
      setMessage(reason)
      push({ title: 'OTP eksik', description: reason, variant: 'danger' })
      return
    }

    setLoading(true)
    setMessage('')
    try {
      await verifyOtp(email.trim(), otp)
      push({ title: 'Giris basarili' })
      navigate('/projects')
    } catch (error) {
      const reason = getErrorMessage(error, 'Kod dogrulanamadi.')
      setMessage(reason)
      push({ title: 'Giris basarisiz', description: reason, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-grid-pattern pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="absolute top-[-20%] left-[20%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen dark:bg-primary/20" />
      <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen dark:bg-purple-500/10" />

      <div className="layout-container flex h-full grow flex-col items-center justify-center p-4 sm:p-6">
        <div className="glass-card shadow-glass dark:shadow-glass-dark relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-white/20 dark:border-white/10">
          <div className="flex flex-col items-center pt-10 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 mb-6">
              <img alt="SprintDock" className="logo-float h-8 w-8" src={logo} />
            </div>
            <h2 className="text-[#111218] dark:text-white tracking-tight text-2xl font-bold leading-tight px-4 text-center">
              SprintDock'a Giris Yap
            </h2>
          </div>

          <div className="px-8 pb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-normal text-center">
              E-posta adresinize 6 haneli bir kod gonderecegiz ve erisiminizi dogrulayacagiz.
            </p>
          </div>

          <div className="px-8 pt-2 pb-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">
                E-posta adresi
              </label>
              <div className="relative flex items-center">
                <Input
                  className="h-10 bg-gray-50 dark:bg-white/5"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@sprintdock.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  disabled={loading}
                  onFocus={(event) => {
                    if (window.innerWidth < 768) {
                      window.setTimeout(() => {
                        try {
                          event.currentTarget.scrollIntoView({
                            block: 'center',
                            behavior: 'smooth',
                          })
                        } catch (_err) {
                          // no-op
                        }
                      }, 60)
                    }
                  }}
                />
                <Button
                  variant="default"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 rounded-md px-3 text-xs disabled:opacity-100 disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-white/10 dark:disabled:text-slate-300"
                  onClick={submitEmail}
                  disabled={loading || resendCountdown > 0}
                >
                  {resendCountdown > 0
                    ? `${resendCountdownLabel}`
                    : otpRequested
                      ? 'Tekrar Gonder'
                      : 'OTP Gonder'}
                </Button>
              </div>
            </div>
          </div>

          <div className="px-8 pb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-3 text-center">
              Dogrulama kodunu girin
            </label>
            <div className="flex justify-center">
              <OtpInputs value={otp} onChange={setOtp} disabled={!otpRequested || loading} />
            </div>
          </div>

          <div className="px-8 py-4 flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {otpRequested ? `Sona ermesine ${countdownLabel}` : 'OTP istemek icin e-posta girin'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 p-0"
              onClick={submitEmail}
              disabled={loading || !email.trim() || resendCountdown > 0}
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              {resendCountdown > 0
                ? `Tekrar gonder (${resendCountdownLabel})`
                : 'Kodu tekrar gonder'}
            </Button>
          </div>
          {resendCountdown > 0 ? (
            <div className="px-8 pb-1">
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Cok fazla istek nedeniyle yeni kodu {resendCountdownLabel} sonra isteyebilirsiniz.
              </p>
            </div>
          ) : null}

          <div className="px-8 pb-10 pt-2">
            <Button
              className="relative flex w-full h-12 rounded-xl"
              onClick={submitOtp}
              disabled={!otpRequested || loading}
            >
              {loading ? 'Dogrulaniyor...' : 'Dogrula ve Giris Yap'}
            </Button>
            {message ? (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">{message}</p>
            ) : null}
          </div>

          <div className="bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 px-8 py-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SprintDock guvenligi ile korunur. Gizlilik politikasi yakinda yayinda.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
