import { useUiStore } from '../store/ui.store.js'

export function useI18n() {
  const locale = useUiStore((state) => state.locale)
  const setLocale = useUiStore((state) => state.setLocale)

  const t = (en, tr = en) => (locale === 'tr' ? tr : en)

  return {
    locale,
    setLocale,
    t,
    isTurkish: locale === 'tr',
    isEnglish: locale === 'en',
  }
}
