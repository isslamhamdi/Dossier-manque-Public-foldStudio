'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

// #68: Dark mode — applies data-theme attribute, CSS vars pick it up
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('fold-studio-theme') as Theme | null
    const t = saved ?? 'light'
    setThemeState(t)
    applyTheme(t)
  }, [])

  const applyTheme = (t: Theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = t === 'dark' || (t === 'system' && prefersDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('fold-studio-theme', t)
    applyTheme(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('fold-studio-theme', next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
