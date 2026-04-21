'use client'

import styles from './Profile.module.scss'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Typy ─────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'
type Language = 'pl' | 'en'
type FontSize = 'small' | 'medium' | 'large'

interface AppSettings {
  theme: Theme
  language: Language
  fontSize: FontSize
  notificationsEnabled: boolean
  notificationSound: boolean
  notificationDesktop: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'pl',
  fontSize: 'medium',
  notificationsEnabled: true,
  notificationSound: true,
  notificationDesktop: false
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'mock-user-1',
  email: 'jan@gmail.com',
  nickname: 'Jan Kowalski',
  status: 'ONLINE',
  avatarUrl: null as string | null
}

const MOCK_FRIENDS = [
  {
    userId: 'mock-user-1',
    friendId: 'mock-friend-1',
    status: 'ACCEPTED',
    user: { id: 'mock-user-1', nickname: 'Jan Kowalski', status: 'ONLINE' },
    friend: { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'AWAY' }
  },
  {
    userId: 'mock-user-1',
    friendId: 'mock-friend-2',
    status: 'ACCEPTED',
    user: { id: 'mock-user-1', nickname: 'Jan Kowalski', status: 'ONLINE' },
    friend: {
      id: 'mock-friend-2',
      nickname: 'Piotr Wiśniewski',
      status: 'BUSY'
    }
  },
  {
    userId: 'mock-friend-3',
    friendId: 'mock-user-1',
    status: 'ACCEPTED',
    user: {
      id: 'mock-friend-3',
      nickname: 'Kasia Kowalczyk',
      status: 'OFFLINE'
    },
    friend: { id: 'mock-user-1', nickname: 'Jan Kowalski', status: 'ONLINE' }
  }
]

const USE_MOCK = true

const STATUS_COLOR: Record<string, string> = {
  ONLINE: '#2ecc71',
  AWAY: '#f39c12',
  BUSY: '#e74c3c',
  OFFLINE: '#7f8c8d'
}

// ─── Subkomponent: wiersz ustawień ───────────────────────────────────────────

function SettingRow({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.SettingRow}>
      <span className={styles.SettingLabel}>{label}</span>
      <div className={styles.SettingControl}>{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`${styles.Toggle} ${checked ? styles.ToggleOn : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className={styles.ToggleThumb} />
    </button>
  )
}

// ─── Główny komponent ─────────────────────────────────────────────────────────

export default function Profile() {
  const router = useRouter()
  const userId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('userId') ?? MOCK_USER.id)
      : MOCK_USER.id

  const [user, setUser] = useState<typeof MOCK_USER | null>(null)
  const [friends, setFriends] = useState<typeof MOCK_FRIENDS>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Zmiana hasła
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  // Ustawienia strony — trzymane w localStorage
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // ── Wczytaj dane ──
  useEffect(() => {
    // Wczytaj ustawienia z localStorage
    try {
      const stored = localStorage.getItem('appSettings')
      if (stored) setSettings(JSON.parse(stored))
    } catch {
      /* ignoruj */
    }

    if (USE_MOCK) {
      setUser(MOCK_USER)
      setFriends(MOCK_FRIENDS)
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const [userRes, friendsRes] = await Promise.all([
          fetch(`http://localhost:3001/api/?id=${userId}`),
          fetch(
            `http://localhost:3001/api/users/${userId}/friends?status=ACCEPTED`
          )
        ])
        if (!userRes.ok) throw new Error('Błąd pobierania profilu')
        if (!friendsRes.ok) throw new Error('Błąd pobierania znajomych')
        const [userData, friendsData] = await Promise.all([
          userRes.json(),
          friendsRes.json()
        ])
        setUser(userData)
        setFriends(friendsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd wczytywania')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  // ── Aplikuj ustawienia do DOM ──
  useEffect(() => {
    const root = document.documentElement
    // Motyw
    root.setAttribute('data-theme', settings.theme)
    // Rozmiar czcionki
    const sizes: Record<FontSize, string> = {
      small: '8px',
      medium: '10px',
      large: '12px'
    }
    root.style.fontSize = sizes[settings.fontSize]
    // Język (tylko zapis — zmiana UI wymagałaby i18n)
    root.setAttribute('lang', settings.language)
  }, [settings])

  // ── Zapis ustawień ──
  function handleSaveSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('appSettings', JSON.stringify(next))
      return next
    })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  // ── Zmiana hasła ──
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)
    if (USE_MOCK) {
      setPasswordMsg('Hasło zmienione! (mock)')
      setShowPasswordForm(false)
      setNewPassword('')
      return
    }
    try {
      const res = await fetch(`http://localhost:3001/api/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d?.error ?? 'Błąd')
      }
      setPasswordMsg('Hasło zmienione pomyślnie!')
      setShowPasswordForm(false)
      setNewPassword('')
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Błąd zmiany hasła')
    }
  }

  // ── Usuń znajomego ──
  async function handleRemoveFriend(friendId: string) {
    if (USE_MOCK) {
      setFriends((prev) =>
        prev.filter((f) => f.friendId !== friendId && f.userId !== friendId)
      )
      return
    }
    try {
      const res = await fetch(
        `http://localhost:3001/api/users/${userId}/friends/${friendId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Błąd usuwania')
      setFriends((prev) =>
        prev.filter((f) => f.friendId !== friendId && f.userId !== friendId)
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
    }
  }

  // ── Wiadomość do znajomego ──
  async function handleMessageFriend(friendId: string) {
    if (USE_MOCK) {
      router.push('/chats')
      return
    }
    try {
      const res = await fetch('http://localhost:3001/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PRIVATE', userIds: [userId, friendId] })
      })
      if (!res.ok) throw new Error('Błąd')
      const chat = await res.json()
      router.push(`/chats?chatId=${chat.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
    }
  }

  function getFriendUser(f: (typeof MOCK_FRIENDS)[0]) {
    return f.userId === userId ? f.friend : f.user
  }

  if (loading) return <p className={styles.LoadingText}>Ładowanie...</p>
  if (error) return <p className={styles.ErrorText}>{error}</p>
  if (!user) return null

  return (
    <div className={styles.PageWrapper}>
      {/* ── Profil ── */}
      <div className={`${styles.Section} ${styles.First}`}>
        <Image
          className={styles.SectionProfilePicture}
          src="/ouija_white.png"
          alt="avatar"
          width={200}
          height={200}
        />
        <h2 className={styles.SectionHeading}>{user.nickname}</h2>
        <p className={styles.SectionText}>Email: {user.email}</p>
        <p className={styles.SectionText}>
          Hasło:{' '}
          <a onClick={() => setShowPasswordForm((v) => !v)}>
            {showPasswordForm ? 'Anuluj' : 'Zmień hasło'}
          </a>
        </p>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className={styles.PasswordForm}>
            <input
              type="password"
              placeholder="Nowe hasło (min. 8 znaków)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              className={styles.PasswordInput}
            />
            <button type="submit" className={styles.SaveBtn}>
              Zapisz
            </button>
          </form>
        )}
        {passwordMsg && (
          <p
            className={
              passwordMsg.includes('!') ? styles.SuccessMsg : styles.ErrorMsg
            }
          >
            {passwordMsg}
          </p>
        )}
      </div>

      {/* ── Znajomi ── */}
      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>Znajomi</h2>
        {friends.length === 0 && (
          <p className={styles.SectionText}>Brak znajomych</p>
        )}
        {friends.map((friendship) => {
          const friend = getFriendUser(friendship)
          return (
            <div
              key={`${friendship.userId}-${friendship.friendId}`}
              className={styles.SectionFriend}
            >
              <div className={styles.AvatarWrap}>
                <Image
                  className={styles.SectionFriendAvatar}
                  src="/ouija_white.png"
                  alt="avatar"
                  width={48}
                  height={48}
                />
                <span
                  className={styles.StatusDot}
                  style={{ background: STATUS_COLOR[friend.status] }}
                />
              </div>
              <div className={styles.FriendInfo}>
                <h3 className={styles.SectionFriendName}>{friend.nickname}</h3>
                <span
                  className={styles.FriendStatus}
                  style={{ color: STATUS_COLOR[friend.status] }}
                >
                  {friend.status}
                </span>
              </div>
              <button
                className={styles.SectionFriendMessageButton}
                onClick={() => handleMessageFriend(friend.id)}
              >
                Wiadomość
              </button>
              <button
                className={styles.SectionFriendDeleteButton}
                onClick={() => handleRemoveFriend(friend.id)}
              >
                Usuń
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Ustawienia strony ── */}
      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>Ustawienia strony</h2>
        {settingsSaved && <p className={styles.SuccessMsg}>Zapisano ✓</p>}

        <div className={styles.SettingsGroup}>
          <h3 className={styles.SettingsGroupTitle}>Wygląd</h3>

          <SettingRow label="Motyw">
            <div className={styles.SegmentedControl}>
              {(['dark', 'light'] as Theme[]).map((t) => (
                <button
                  key={t}
                  className={`${styles.SegmentBtn} ${settings.theme === t ? styles.SegmentBtnActive : ''}`}
                  onClick={() => handleSaveSetting('theme', t)}
                >
                  {t === 'dark' ? '🌙 Ciemny' : '☀️ Jasny'}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Rozmiar czcionki">
            <div className={styles.SegmentedControl}>
              {(
                [
                  ['small', 'Mały'],
                  ['medium', 'Średni'],
                  ['large', 'Duży']
                ] as [FontSize, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  className={`${styles.SegmentBtn} ${settings.fontSize === val ? styles.SegmentBtnActive : ''}`}
                  onClick={() => handleSaveSetting('fontSize', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        <div className={styles.SettingsGroup}>
          <h3 className={styles.SettingsGroupTitle}>Język</h3>
          <SettingRow label="Język interfejsu">
            <div className={styles.SegmentedControl}>
              {(
                [
                  ['pl', '🇵🇱 Polski'],
                  ['en', '🇬🇧 English']
                ] as [Language, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  className={`${styles.SegmentBtn} ${settings.language === val ? styles.SegmentBtnActive : ''}`}
                  onClick={() => handleSaveSetting('language', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        <div className={styles.SettingsGroup}>
          <h3 className={styles.SettingsGroupTitle}>Powiadomienia</h3>

          <SettingRow label="Powiadomienia">
            <Toggle
              checked={settings.notificationsEnabled}
              onChange={(v) => handleSaveSetting('notificationsEnabled', v)}
            />
          </SettingRow>

          <SettingRow label="Dźwięk">
            <Toggle
              checked={settings.notificationSound}
              onChange={(v) => handleSaveSetting('notificationSound', v)}
            />
          </SettingRow>

          <SettingRow label="Powiadomienia systemowe">
            <Toggle
              checked={settings.notificationDesktop}
              onChange={(v) => {
                if (
                  v &&
                  typeof window !== 'undefined' &&
                  'Notification' in window
                ) {
                  Notification.requestPermission().then((perm) => {
                    handleSaveSetting('notificationDesktop', perm === 'granted')
                  })
                } else {
                  handleSaveSetting('notificationDesktop', v)
                }
              }}
            />
          </SettingRow>
        </div>

        <div className={styles.SettingsGroup}>
          <h3 className={styles.SettingsGroupTitle}>Konto</h3>
          <button
            className={styles.DangerBtn}
            onClick={() => {
              if (confirm('Na pewno chcesz się wylogować?')) {
                localStorage.removeItem('userId')
                localStorage.removeItem('userNickname')
                router.push('/login')
              }
            }}
          >
            Wyloguj się
          </button>
        </div>
      </div>
    </div>
  )
}
