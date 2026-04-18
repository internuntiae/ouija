'use client'

import styles from './Profile.module.scss'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MOCK_USER = {
  id: 'mock-user-1',
  email: 'jan@gmail.com',
  nickname: 'Jan Kowalski',
  status: 'ONLINE'
}

const MOCK_FRIENDS = [
  {
    userId: 'mock-user-1',
    friendId: 'mock-friend-1',
    status: 'ACCEPTED',
    user: { id: 'mock-user-1', nickname: 'Jan Kowalski', status: 'ONLINE' },
    friend: { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'OFFLINE' }
  },
  {
    userId: 'mock-user-1',
    friendId: 'mock-friend-2',
    status: 'ACCEPTED',
    user: { id: 'mock-user-1', nickname: 'Jan Kowalski', status: 'ONLINE' },
    friend: {
      id: 'mock-friend-2',
      nickname: 'Piotr Wiśniewski',
      status: 'AWAY'
    }
  },
  {
    userId: 'mock-friend-3',
    friendId: 'mock-user-1',
    status: 'ACCEPTED',
    user: { id: 'mock-friend-3', nickname: 'Kasia Kowalczyk', status: 'BUSY' },
    friend: { id: 'mock-user-1', nickname: 'Jan Kowalski', status: 'ONLINE' }
  }
]

const USE_MOCK = true

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

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  useEffect(() => {
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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    if (USE_MOCK) {
      setPasswordMsg('Hasło zmienione pomyślnie! (mock)')
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
        const data = await res.json()
        throw new Error(data?.error ?? 'Błąd zmiany hasła')
      }

      setPasswordMsg('Hasło zmienione pomyślnie!')
      setShowPasswordForm(false)
      setNewPassword('')
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Błąd zmiany hasła')
    }
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
        `http://localhost:3001/api/users/${userId}/friends/${friendId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Nie udało się usunąć znajomego')
      setFriends((prev) =>
        prev.filter((f) => f.friendId !== friendId && f.userId !== friendId)
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd usuwania')
    }
  }

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
      if (!res.ok) throw new Error('Nie udało się otworzyć czatu')
      const chat = await res.json()
      router.push(`/chats?chatId=${chat.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd chatu')
    }
  }

  function getFriendUser(friendship: (typeof MOCK_FRIENDS)[0]) {
    return friendship.userId === userId ? friendship.friend : friendship.user
  }

  if (loading) return <p>Ładowanie...</p>
  if (error) return <p>{error}</p>
  if (!user) return null
  return (
    <>
      <div className={`${styles.Section} ${styles.First}`}>
        <Image
          className={styles.SectionProfilePicture}
          src={'/ouija_white.png'}
          alt={'profile_picture'}
          width={200}
          height={200}
        ></Image>

        <h2 className={styles.SectionHeading}>{user.nickname}</h2>
        <p className={styles.SectionText}>Email: {user.email}</p>
        <p className={styles.SectionText}>
          Hasło:{' '}
          <a
            style={{ cursor: 'pointer' }}
            onClick={() => setShowPasswordForm((v) => !v)}
          >
            Zmień hasło
          </a>
        </p>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword}>
            <input
              type="password"
              placeholder="Nowe hasło"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit">Zapisz</button>
          </form>
        )}
        {passwordMsg && <p>{passwordMsg}</p>}
      </div>

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
              <Image
                className={styles.SectionFriendAvatar}
                src={'/ouija_white.png'}
                alt={'profile_picture'}
                width={100}
                height={100}
              />
              <h3 className={styles.SectionFriendName}>{friend.nickname}</h3>
              <button
                className={styles.SectionFriendMessageButton}
                onClick={() => handleMessageFriend(friend.id)}
              >
                Wyślij wiadomość
              </button>
              <button
                className={styles.SectionFriendDeleteButton}
                onClick={() => handleRemoveFriend(friend.id)}
              >
                Usuń znajomego
              </button>
            </div>
          )
        })}
      </div>
      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>Ustawienia strony</h2>
      </div>
    </>
  )
}
