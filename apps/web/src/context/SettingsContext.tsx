'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
export type Language = 'pl' | 'en'
export type FontSize = 'small' | 'medium' | 'large'

export interface AppSettings {
  theme: Theme
  language: Language
  fontSize: FontSize
  notificationsEnabled: boolean
  notificationSound: boolean
  notificationDesktop: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'pl',
  fontSize: 'medium',
  notificationsEnabled: true,
  notificationSound: true,
  notificationDesktop: false
}

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {}
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  // Wczytaj z localStorage przy montowaniu
  useEffect(() => {
    try {
      const stored = localStorage.getItem('appSettings')
      if (stored) {
        const parsed: AppSettings = JSON.parse(stored)
        setSettings(parsed)
      }
    } catch {
      /* ignoruj błędy parsowania */
    }
    setMounted(true)
  }, [])

  // Aplikuj data-theme, font-size i lang na <html> przy każdej zmianie settings
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('lang', settings.language)
    const sizes: Record<FontSize, string> = {
      small: '8px',
      medium: '10px',
      large: '12px'
    }
    root.style.fontSize = sizes[settings.fontSize]
  }, [settings, mounted])

  function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('appSettings', JSON.stringify(next))
      return next
    })
  }

  // Zapobiegaj flash przed wczytaniem ustawień
  if (!mounted) return null

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
