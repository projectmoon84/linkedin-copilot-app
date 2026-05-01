import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

function getStoredPreference(): ThemePreference {
  return 'light'
}

function applyTheme() {
  document.documentElement.classList.remove('dark')
}

export function initTheme() {
  localStorage.setItem(STORAGE_KEY, 'light')
  applyTheme()
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference)

  const setTheme = useCallback((next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, next)
    setPreference(next)
    applyTheme()
  }, [])

  useEffect(() => {
    if (preference !== 'light') {
      localStorage.setItem(STORAGE_KEY, 'light')
      setPreference('light')
    }
    applyTheme()
    return undefined
  }, [preference])

  return { preference, setTheme } as const
}
