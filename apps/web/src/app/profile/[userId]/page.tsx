'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import styles from './UserProfile.module.scss'
import { useTranslation } from '@/i18n/translations'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const STATUS_COLOR: Record<string, string> = {
  ONLINE: '#2ecc71',
  AWAY: '#f39c12',
  BUSY: '#e74c3c',
  OFFLINE: '#7f8c8d'
}

interface PublicUser {
  id: string
  nickname: string
  status: string
  avatarUrl?: string | null
}

interface FriendUser {
  id: string
  nickname: string
  status: string
  avatarUrl?: string | null
}

export default function UserProfilePage() {
  const { userId: targetId } = useParams<{ userId: string }>()
  const router = useRouter()
  const { t, tWith } = useTranslation()
  const myId =
    typeof window !== 'undefined' ? (localStorage.getItem('userId') ?? '') : ''

  const [user, setUser] = useState<PublicUser | null>(null)
  const [friendStatus, setFriendStatus] = useState<
    'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED'
  >('NONE')
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!targetId) return

    if (myId && myId === targetId) {
      router.replace('/profile')
      return
    }

    async function fetchData() {
      try {
        const [userRes, myFriendsRes, targetFriendsRes] = await Promise.all([
          fetch(`${API_URL}/api/?id=${targetId}`),
          fetch(`${API_URL}/api/users/${myId}/friends`),
          fetch(`${API_URL}/api/users/${targetId}/friends?status=ACCEPTED`)
        ])

        if (!userRes.ok) throw new Error('not found')
        const userData = await userRes.json()
        setUser(userData)

        if (myFriendsRes.ok) {
          const myFriendsData = await myFriendsRes.json()
          const rel = myFriendsData.find(
            (f: { userId: string; friendId: string; status: string }) =>
              f.userId === targetId || f.friendId === targetId
          )
          if (rel) {
            if (rel.status === 'ACCEPTED') setFriendStatus('ACCEPTED')
            else if (rel.status === 'PENDING' && rel.userId === myId)
              setFriendStatus('PENDING_SENT')
            else if (rel.status === 'PENDING' && rel.friendId === myId)
              setFriendStatus('PENDING_RECEIVED')
          }
        }

        if (targetFriendsRes.ok) {
          const targetFriendsData = await targetFriendsRes.json()
          const friendUsers: FriendUser[] = targetFriendsData
            .map(
              (f: {
                userId: string
                friendId: string
                user: FriendUser
                friend: FriendUser
              }) => (f.userId === targetId ? f.friend : f.user)
            )
            .filter((u: FriendUser) => u.id !== myId)
          setFriends(friendUsers)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setLoadingFriends(false)
      }
    }

    fetchData()
  }, [targetId, myId, router])

  async function handleAddFriend() {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/users/${myId}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: targetId })
      })
      if (!res.ok) throw new Error(t('userProfile.errorAdd'))
      setFriendStatus('PENDING_SENT')
    } catch (err) {
      alert(err instanceof Error ? err.message : t('userProfile.errorAdd'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMessage() {
    setActionLoading(true)
    try {
      const chatsRes = await fetch(`${API_URL}/api/users/${myId}/chats`)
      if (chatsRes.ok) {
        const chats = await chatsRes.json()
        const existing = chats.find(
          (c: { type: string; users: { userId: string }[] }) =>
            c.type === 'PRIVATE' && c.users.some((u) => u.userId === targetId)
        )
        if (existing) {
          router.push(`/chats?chatId=${existing.id}`)
          return
        }
      }
      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PRIVATE', userIds: [myId, targetId] })
      })
      if (!res.ok) throw new Error(t('userProfile.errorMessage'))
      const chat = await res.json()
      router.push(`/chats?chatId=${chat.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : t('userProfile.errorMessage'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading)
    return <p className={styles.Loading}>{t('userProfile.loading')}</p>
  if (!user) return <p className={styles.Error}>{t('userProfile.notFound')}</p>

  return (
    <div className={styles.Wrapper}>
      <div className={styles.Card}>
        <div className={styles.AvatarWrap}>
          <img
            className={styles.Avatar}
            src={user.avatarUrl ?? '/ouija_white.png'}
            alt="avatar"
            width={120}
            height={120}
          />
          <span
            className={styles.StatusDot}
            style={{ background: STATUS_COLOR[user.status] ?? '#7f8c8d' }}
          />
        </div>

        <h1 className={styles.Nickname}>{user.nickname}</h1>
        <p
          className={styles.Status}
          style={{ color: STATUS_COLOR[user.status] ?? '#7f8c8d' }}
        >
          {t(
            `status.${user.status}` as `status.${string}` &
              Parameters<typeof t>[0]
          ) ?? user.status}
        </p>

        <div className={styles.Actions}>
          {friendStatus === 'ACCEPTED' && (
            <button
              className={styles.PrimaryBtn}
              onClick={handleMessage}
              disabled={actionLoading}
            >
              {t('userProfile.writeMessage')}
            </button>
          )}
          {friendStatus === 'NONE' && (
            <button
              className={styles.PrimaryBtn}
              onClick={handleAddFriend}
              disabled={actionLoading}
            >
              {t('userProfile.addFriend')}
            </button>
          )}
          {friendStatus === 'PENDING_SENT' && (
            <p className={styles.PendingText}>{t('userProfile.pendingSent')}</p>
          )}
          {friendStatus === 'PENDING_RECEIVED' && (
            <p className={styles.PendingText}>
              {t('userProfile.pendingReceived')}
            </p>
          )}
        </div>

        {!loadingFriends && friends.length > 0 && (
          <div className={styles.FriendsSection}>
            <h3 className={styles.FriendsSectionTitle}>
              {tWith('userProfile.friends', { count: friends.length })}
            </h3>
            <div className={styles.FriendsList}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className={styles.FriendItem}
                  onClick={() => router.push(`/profile/${friend.id}`)}
                  title={friend.nickname}
                >
                  <div className={styles.FriendAvatarWrap}>
                    <img
                      src={friend.avatarUrl ?? '/ouija_white.png'}
                      alt={friend.nickname}
                      className={styles.FriendAvatar}
                    />
                    <span
                      className={styles.FriendStatusDot}
                      style={{
                        background: STATUS_COLOR[friend.status] ?? '#7f8c8d'
                      }}
                    />
                  </div>
                  <span className={styles.FriendNickname}>
                    {friend.nickname}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className={styles.BackBtn} onClick={() => router.back()}>
          {t('userProfile.back')}
        </button>
      </div>
    </div>
  )
}
