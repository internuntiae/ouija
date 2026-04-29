'use client'

import styles from './Profile.module.scss'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useSettings,
  type AppSettings,
  type Theme,
  type Language,
  type FontSize
} from '@/context/SettingsContext'
import { useTranslation } from '@/i18n/translations'
import ProfilePopup from '@/app/components/ProfilePopup/ProfilePopup'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    user: {
      id: 'mock-user-1',
      nickname: 'Jan Kowalski',
      status: 'ONLINE',
      avatarUrl: null as string | null
    },
    friend: {
      id: 'mock-friend-1',
      nickname: 'Anna Nowak',
      status: 'AWAY',
      avatarUrl: null as string | null
    }
  },
  {
    userId: 'mock-user-1',
    friendId: 'mock-friend-2',
    status: 'ACCEPTED',
    user: {
      id: 'mock-user-1',
      nickname: 'Jan Kowalski',
      status: 'ONLINE',
      avatarUrl: null as string | null
    },
    friend: {
      id: 'mock-friend-2',
      nickname: 'Piotr Wiśniewski',
      status: 'BUSY',
      avatarUrl: null as string | null
    }
  },
  {
    userId: 'mock-friend-3',
    friendId: 'mock-user-1',
    status: 'ACCEPTED',
    user: {
      id: 'mock-friend-3',
      nickname: 'Kasia Kowalczyk',
      status: 'OFFLINE',
      avatarUrl: null as string | null
    },
    friend: {
      id: 'mock-user-1',
      nickname: 'Jan Kowalski',
      status: 'ONLINE',
      avatarUrl: null as string | null
    }
  }
]

const MOCK_PENDING = [
  {
    userId: 'mock-stranger-1',
    friendId: 'mock-user-1',
    status: 'PENDING',
    user: {
      id: 'mock-stranger-1',
      nickname: 'Marek Zielony',
      status: 'ONLINE',
      avatarUrl: null as string | null
    },
    friend: {
      id: 'mock-user-1',
      nickname: 'Jan Kowalski',
      status: 'ONLINE',
      avatarUrl: null as string | null
    }
  },
  {
    userId: 'mock-stranger-2',
    friendId: 'mock-user-1',
    status: 'PENDING',
    user: {
      id: 'mock-stranger-2',
      nickname: 'Zofia Kamińska',
      status: 'OFFLINE',
      avatarUrl: null as string | null
    },
    friend: {
      id: 'mock-user-1',
      nickname: 'Jan Kowalski',
      status: 'ONLINE',
      avatarUrl: null as string | null
    }
  }
]

const MOCK_SENT_INVITES = [
  {
    userId: 'mock-user-1',
    friendId: 'mock-stranger-3',
    status: 'PENDING',
    user: {
      id: 'mock-user-1',
      nickname: 'Jan Kowalski',
      status: 'ONLINE',
      avatarUrl: null as string | null
    },
    friend: {
      id: 'mock-stranger-3',
      nickname: 'Tomasz Lewandowski',
      status: 'AWAY',
      avatarUrl: null as string | null
    }
  }
]

const USE_MOCK = false

const STATUS_COLOR: Record<string, string> = {
  ONLINE: '#2ecc71',
  AWAY: '#f39c12',
  BUSY: '#e74c3c',
  OFFLINE: '#7f8c8d'
}

function avatarSrc(url?: string | null) {
  return url ?? '/ouija_white.png'
}

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

interface UserEntry {
  id: string
  nickname: string
  status: string
  avatarUrl?: string | null
}

interface FriendEntry {
  userId: string
  friendId: string
  status: string
  user: UserEntry
  friend: UserEntry
}

type InviteEntry = FriendEntry

export default function Profile() {
  const router = useRouter()
  const { settings, updateSetting } = useSettings()
  const { t } = useTranslation()

  const userId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('userId') ?? MOCK_USER.id)
      : MOCK_USER.id

  const [user, setUser] = useState<typeof MOCK_USER | null>(null)
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [pendingInvites, setPendingInvites] = useState<InviteEntry[]>([])
  const [sentInvites, setSentInvites] = useState<InviteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── NEW: controls which user's ProfilePopup is open ──
  const [profilePopupUserId, setProfilePopupUserId] = useState<string | null>(
    null
  )

  const [settingsSaved, setSettingsSaved] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    try {
      if (USE_MOCK) {
        const url = URL.createObjectURL(file)
        setUser((prev) => (prev ? { ...prev, avatarUrl: url } : prev))
        return
      }
      const form = new FormData()
      form.append('ownerId', userId)
      form.append('files', file)
      const uploadRes = await fetch(`${API_URL}/api/media/upload`, {
        method: 'POST',
        body: form
      })
      if (!uploadRes.ok) throw new Error('Błąd uploadu')
      const [media] = await uploadRes.json()
      const updateRes = await fetch(`${API_URL}/api/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: media.url })
      })
      if (!updateRes.ok) throw new Error('Błąd zapisu avatara')
      setUser((prev) => (prev ? { ...prev, avatarUrl: media.url } : prev))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd zmiany avatara')
    } finally {
      setAvatarUploading(false)
    }
  }

  useEffect(() => {
    if (USE_MOCK) {
      setUser(MOCK_USER)
      setFriends(MOCK_FRIENDS)
      setPendingInvites(MOCK_PENDING)
      setSentInvites(MOCK_SENT_INVITES)
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const [userRes, friendsRes, pendingRes] = await Promise.all([
          fetch(`${API_URL}/api/?id=${userId}`),
          fetch(`${API_URL}/api/users/${userId}/friends?status=ACCEPTED`),
          fetch(`${API_URL}/api/users/${userId}/friends?status=PENDING`)
        ])
        if (!userRes.ok) throw new Error('Błąd pobierania profilu')
        const [userData, friendsData, pendingData] = await Promise.all([
          userRes.json(),
          friendsRes.json(),
          pendingRes.json()
        ])
        setUser(userData)
        setFriends(friendsData)
        setPendingInvites(
          pendingData.filter((f: InviteEntry) => f.friendId === userId)
        )
        setSentInvites(
          pendingData.filter((f: InviteEntry) => f.userId === userId)
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  function handleSaveSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    updateSetting(key, value)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  async function handleRemoveFriend(friendId: string) {
    if (USE_MOCK) {
      setFriends((prev) =>
        prev.filter((f) => f.friendId !== friendId && f.userId !== friendId)
      )
      return
    }
    try {
      const res = await fetch(
        `${API_URL}/api/users/${userId}/friends/${friendId}`,
        { method: 'DELETE' }
      )
      const res2 = await fetch(
        `${API_URL}/api/users/${friendId}/friends/${userId}`,
        { method: 'DELETE' }
      )
      if (!res.ok && !res2.ok) throw new Error('Błąd usuwania')
      setFriends((prev) =>
        prev.filter((f) => f.friendId !== friendId && f.userId !== friendId)
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
    }
  }

  async function handleMessageFriend(friendId: string) {
    if (USE_MOCK) {
      router.push('/chats')
      return
    }
    try {
      const chatsRes = await fetch(`${API_URL}/api/users/${userId}/chats`)
      if (chatsRes.ok) {
        const chats = await chatsRes.json()
        const existing = chats.find(
          (c: { type: string; users: { userId: string }[] }) =>
            c.type === 'PRIVATE' && c.users.some((u) => u.userId === friendId)
        )
        if (existing) {
          router.push(`/chats?chatId=${existing.id}`)
          return
        }
      }
      const res = await fetch(`${API_URL}/api/chats`, {
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

  // ── NEW: called from ProfilePopup's onMessageUser prop ──
  async function handleMessageFromProfile(friendId: string) {
    await handleMessageFriend(friendId)
  }

  async function handleAcceptInvite(inviterId: string) {
    if (USE_MOCK) {
      const invite = pendingInvites.find((i) => i.userId === inviterId)
      if (invite)
        setFriends((prev) => [...prev, { ...invite, status: 'ACCEPTED' }])
      setPendingInvites((prev) => prev.filter((i) => i.userId !== inviterId))
      return
    }
    try {
      const res = await fetch(
        `${API_URL}/api/users/${inviterId}/friends/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACCEPTED' })
        }
      )
      if (!res.ok) throw new Error('Błąd akceptacji')
      const inviterRes = await fetch(`${API_URL}/api/?id=${inviterId}`)
      if (!inviterRes.ok) throw new Error('Błąd pobierania danych użytkownika')
      const inviterData = await inviterRes.json()
      const newFriend: FriendEntry = {
        userId: inviterId,
        friendId: userId,
        status: 'ACCEPTED',
        user: {
          id: inviterData.id,
          nickname: inviterData.nickname,
          status: inviterData.status,
          avatarUrl: inviterData.avatarUrl ?? null
        },
        friend: {
          id: user!.id,
          nickname: user!.nickname,
          status: user!.status,
          avatarUrl: user!.avatarUrl ?? null
        }
      }
      setFriends((prev) => [...prev, newFriend])
      setPendingInvites((prev) => prev.filter((i) => i.userId !== inviterId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
    }
  }

  async function handleRejectInvite(inviterId: string) {
    if (USE_MOCK) {
      setPendingInvites((prev) => prev.filter((i) => i.userId !== inviterId))
      return
    }
    try {
      const res = await fetch(
        `${API_URL}/api/users/${inviterId}/friends/${userId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Błąd odrzucenia')
      setPendingInvites((prev) => prev.filter((i) => i.userId !== inviterId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
    }
  }

  async function handleCancelInvite(friendId: string) {
    if (USE_MOCK) {
      setSentInvites((prev) => prev.filter((i) => i.friendId !== friendId))
      return
    }
    try {
      const res = await fetch(
        `${API_URL}/api/users/${userId}/friends/${friendId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Błąd cofania zaproszenia')
      setSentInvites((prev) => prev.filter((i) => i.friendId !== friendId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
    }
  }

  function getFriendUser(f: FriendEntry): UserEntry {
    return f.userId === userId ? f.friend : f.user
  }

  if (loading)
    return <p className={styles.LoadingText}>{t('common.loading')}</p>
  if (error) return <p className={styles.ErrorText}>{error}</p>
  if (!user) return null

  return (
    <div className={styles.PageWrapper}>
      {/* ── Profil ── */}
      <div className={`${styles.Section} ${styles.First}`}>
        <div className={styles.AvatarEditWrap}>
          <img
            className={styles.SectionProfilePicture}
            src={avatarSrc(user.avatarUrl)}
            alt="avatar"
            width={120}
            height={120}
          />
          <label
            className={styles.AvatarEditBtn}
            title={t('profile.changeAvatar')}
          >
            {avatarUploading ? '...' : '📷'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>
        </div>
        <h2 className={styles.SectionHeading}>{user.nickname}</h2>
        <p className={styles.SectionText}>Email: {user.email}</p>
        <p className={styles.SectionText}>
          {t('profile.passwordLabel')}{' '}
          <a
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/forgot-password')}
          >
            {t('profile.changePasswordRedirect')}
          </a>
        </p>
      </div>

      {/* ── Zaproszenia przychodzące ── */}
      {pendingInvites.length > 0 && (
        <div className={styles.Section}>
          <h2 className={styles.SectionHeading}>
            {t('profile.pendingInvites')}
            <span className={styles.Badge}>{pendingInvites.length}</span>
          </h2>
          {pendingInvites.map((invite) => (
            <div
              key={`${invite.userId}-${invite.friendId}`}
              className={styles.SectionFriend}
            >
              <div
                className={styles.AvatarWrap}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/profile/${invite.user.id}`)}
              >
                <img
                  className={styles.SectionFriendAvatar}
                  src={avatarSrc(invite.user.avatarUrl)}
                  alt="avatar"
                  width={48}
                  height={48}
                />
                <span
                  className={styles.StatusDot}
                  style={{ background: STATUS_COLOR[invite.user.status] }}
                />
              </div>
              <div className={styles.FriendInfo}>
                <h3 className={styles.SectionFriendName}>
                  {invite.user.nickname}
                </h3>
                <span className={styles.FriendStatusText}>
                  {t('profile.wantsToBeYourFriend')}
                </span>
              </div>
              <button
                className={styles.AcceptBtn}
                onClick={() => handleAcceptInvite(invite.userId)}
              >
                {t('profile.accept')}
              </button>
              <button
                className={styles.RejectBtn}
                onClick={() => handleRejectInvite(invite.userId)}
              >
                {t('profile.reject')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Wysłane zaproszenia ── */}
      {sentInvites.length > 0 && (
        <div className={styles.Section}>
          <h2 className={styles.SectionHeading}>
            {t('profile.sentInvites')}
            <span className={styles.Badge}>{sentInvites.length}</span>
          </h2>
          {sentInvites.map((invite) => (
            <div
              key={`${invite.userId}-${invite.friendId}`}
              className={styles.SectionFriend}
            >
              <div
                className={styles.AvatarWrap}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/profile/${invite.friend.id}`)}
              >
                <img
                  className={styles.SectionFriendAvatar}
                  src={avatarSrc(invite.friend.avatarUrl)}
                  alt="avatar"
                  width={48}
                  height={48}
                />
                <span
                  className={styles.StatusDot}
                  style={{ background: STATUS_COLOR[invite.friend.status] }}
                />
              </div>
              <div className={styles.FriendInfo}>
                <h3 className={styles.SectionFriendName}>
                  {invite.friend.nickname}
                </h3>
                <span className={styles.FriendStatusText}>
                  {t(
                    `status.${invite.friend.status}` as `status.${string}` &
                      Parameters<typeof t>[0]
                  ) ?? invite.friend.status}{' '}
                  · {t('profile.awaitingResponse')}
                </span>
              </div>
              <button
                className={styles.RejectBtn}
                onClick={() => handleCancelInvite(invite.friendId)}
              >
                {t('profile.cancel')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── ProfilePopup ── */}
      {profilePopupUserId && (
        <ProfilePopup
          userId={profilePopupUserId}
          viewerId={userId}
          onClose={() => setProfilePopupUserId(null)}
          onMessageUser={handleMessageFromProfile}
        />
      )}

      {/* ── Znajomi ── */}
      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>{t('profile.friends')}</h2>
        {friends.length === 0 && (
          <p className={styles.SectionText}>{t('profile.noFriends')}</p>
        )}
        {friends.map((friendship) => {
          const friend = getFriendUser(friendship)
          return (
            <div
              key={`${friendship.userId}-${friendship.friendId}`}
              className={styles.SectionFriend}
            >
              {/* ── CHANGED: onClick now opens ProfilePopup instead of navigating ── */}
              <div
                className={styles.AvatarWrap}
                style={{ cursor: 'pointer' }}
                onClick={() => setProfilePopupUserId(friend.id)}
              >
                <img
                  className={styles.SectionFriendAvatar}
                  src={avatarSrc(friend.avatarUrl)}
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
                  className={styles.FriendStatusText}
                  style={{ color: STATUS_COLOR[friend.status] }}
                >
                  {t(
                    `status.${friend.status}` as `status.${string}` &
                      Parameters<typeof t>[0]
                  ) ?? friend.status}
                </span>
              </div>
              <button
                className={styles.SectionFriendMessageButton}
                onClick={() => handleMessageFriend(friend.id)}
              >
                {t('profile.message')}
              </button>
              <button
                className={styles.SectionFriendDeleteButton}
                onClick={() => handleRemoveFriend(friend.id)}
              >
                {t('profile.remove')}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Ustawienia ── */}
      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>{t('profile.settings')}</h2>
        {settingsSaved && (
          <p className={styles.SuccessMsg}>{t('profile.saved')}</p>
        )}

        <div className={styles.SettingsGroup}>
          <h3 className={styles.SettingsGroupTitle}>
            {t('profile.appearance')}
          </h3>
          <SettingRow label={t('profile.theme')}>
            <div className={styles.SegmentedControl}>
              {(['dark', 'light'] as Theme[]).map((th) => (
                <button
                  key={th}
                  className={`${styles.SegmentBtn} ${settings.theme === th ? styles.SegmentBtnActive : ''}`}
                  onClick={() => handleSaveSetting('theme', th)}
                >
                  {th === 'dark'
                    ? t('profile.themeDark')
                    : t('profile.themeLight')}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label={t('profile.fontSize')}>
            <div className={styles.SegmentedControl}>
              {(
                [
                  ['small', t('profile.fontSmall')],
                  ['medium', t('profile.fontMedium')],
                  ['large', t('profile.fontLarge')]
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
          <h3 className={styles.SettingsGroupTitle}>{t('profile.language')}</h3>
          <SettingRow label={t('profile.language')}>
            <div className={styles.SegmentedControl}>
              {(
                [
                  ['pl', t('profile.langPl')],
                  ['en', t('profile.langEn')]
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
          <h3 className={styles.SettingsGroupTitle}>
            {t('profile.notifications')}
          </h3>
          <SettingRow label={t('profile.notifications')}>
            <Toggle
              checked={settings.notificationsEnabled}
              onChange={(v) => handleSaveSetting('notificationsEnabled', v)}
            />
          </SettingRow>
          <SettingRow label={t('profile.notifSound')}>
            <Toggle
              checked={settings.notificationSound}
              onChange={(v) => handleSaveSetting('notificationSound', v)}
            />
          </SettingRow>
          <SettingRow label={t('profile.notifDesktop')}>
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
          <h3 className={styles.SettingsGroupTitle}>{t('profile.account')}</h3>
          <button
            className={styles.DangerBtn}
            onClick={() => {
              if (confirm(t('profile.logoutConfirm'))) {
                localStorage.removeItem('userId')
                localStorage.removeItem('userNickname')
                router.push('/login')
              }
            }}
          >
            {t('profile.logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
