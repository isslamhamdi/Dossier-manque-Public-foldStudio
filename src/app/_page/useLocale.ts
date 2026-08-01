'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Locale, LOCALES, setLocale, getLocale, initLocale } from '@/lib/i18n'

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    initLocale()
    setLocaleState(getLocale())
  }, [])

  const changeLocale = useCallback((l: Locale) => {
    setLocale(l)
    setLocaleState(l)
  }, [])

  const isRTL = LOCALES.find(l => l.code === locale)?.dir === 'rtl'

  return { locale, changeLocale, isRTL, locales: LOCALES }
}
