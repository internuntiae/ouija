'use client'

import styles from './Chats.module.scss'
import Image from 'next/image'
import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  Suspense,
  useCallback
} from 'react'
import { useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type ReactionType =
  | 'LIKE'
  | 'LOVE'
  | 'LAUGH'
  | 'SAD'
  | 'ANGRY'
  | 'THUMBS_UP'
  | 'THUMBS_DOWN'
type AttachmentType = 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO'
type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY'

const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  SAD: '😢',
  ANGRY: '😡',
  THUMBS_UP: '👆',
  THUMBS_DOWN: '👇'
}
const STATUS_LABEL: Record<UserStatus, string> = {
  ONLINE: 'Aktywny',
  AWAY: 'Zaraz wracam',
  BUSY: 'Nie przeszkadzać',
  OFFLINE: 'Offline'
}
const STATUS_COLOR: Record<UserStatus, string> = {
  ONLINE: '#2ecc71',
  AWAY: '#f39c12',
  BUSY: '#e74c3c',
  OFFLINE: '#7f8c8d'
}

interface Reaction {
  messageId: string
  userId: string
  type: ReactionType
}
interface Attachment {
  id: string
  url: string
  type: AttachmentType
  name?: string
}
interface Message {
  id: string
  chatId: string
  senderId: string
  content: string | null
  sentAt: string
  editedAt: string | null
  attachments: Attachment[]
  reactions: Reaction[]
}
interface ChatUserEntry {
  userId: string
  chatId: string
  role: string
  joinedAt: string
  user: {
    id: string
    nickname: string
    status: UserStatus
    avatarUrl?: string | null
  }
}
interface Chat {
  id: string
  name: string | null
  type: string
  createdAt: string
  updatedAt: string
  users: ChatUserEntry[]
}
interface UserSearchResult {
  id: string
  nickname: string
  status: UserStatus
  avatarUrl?: string | null
}

const MOCK_USER_ID = 'mock-user-1'
const PAGE_SIZE = 20

const MOCK_CHATS: Chat[] = [
  {
    id: 'mock-chat-1',
    name: null,
    type: 'PRIVATE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    users: [
      {
        userId: 'mock-user-1',
        chatId: 'mock-chat-1',
        role: 'ADMIN',
        joinedAt: '',
        user: { id: 'mock-user-1', nickname: 'Ty', status: 'ONLINE' }
      },
      {
        userId: 'mock-friend-1',
        chatId: 'mock-chat-1',
        role: 'MEMBER',
        joinedAt: '',
        user: { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'AWAY' }
      }
    ]
  },
  {
    id: 'mock-chat-2',
    name: null,
    type: 'PRIVATE',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    users: [
      {
        userId: 'mock-user-1',
        chatId: 'mock-chat-2',
        role: 'MEMBER',
        joinedAt: '',
        user: { id: 'mock-user-1', nickname: 'Ty', status: 'ONLINE' }
      },
      {
        userId: 'mock-friend-2',
        chatId: 'mock-chat-2',
        role: 'ADMIN',
        joinedAt: '',
        user: {
          id: 'mock-friend-2',
          nickname: 'Piotr Wiśniewski',
          status: 'BUSY'
        }
      }
    ]
  },
  {
    id: 'mock-chat-3',
    name: 'Projekt zespołowy',
    type: 'GROUP',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    users: [
      {
        userId: 'mock-user-1',
        chatId: 'mock-chat-3',
        role: 'ADMIN',
        joinedAt: '',
        user: { id: 'mock-user-1', nickname: 'Ty', status: 'ONLINE' }
      },
      {
        userId: 'mock-friend-1',
        chatId: 'mock-chat-3',
        role: 'MEMBER',
        joinedAt: '',
        user: { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'AWAY' }
      },
      {
        userId: 'mock-friend-2',
        chatId: 'mock-chat-3',
        role: 'MEMBER',
        joinedAt: '',
        user: {
          id: 'mock-friend-2',
          nickname: 'Piotr Wiśniewski',
          status: 'BUSY'
        }
      }
    ]
  }
]
const MOCK_SEARCH_USERS: UserSearchResult[] = [
  { id: 'mock-stranger-1', nickname: 'Marek Zielony', status: 'ONLINE' },
  { id: 'mock-stranger-2', nickname: 'Zofia Kamińska', status: 'OFFLINE' },
  { id: 'mock-stranger-3', nickname: 'Tomasz Lewandowski', status: 'AWAY' },
  { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'AWAY' },
  { id: 'mock-friend-2', nickname: 'Piotr Wiśniewski', status: 'BUSY' }
]

function generateMockMessages(chatId: string): Message[] {
  const msgs: Message[] = []
  const senders = ['mock-user-1', 'mock-friend-1', 'mock-friend-2']
  const contents = [
    'Hej, co słychać?',
    'Wszystko dobrze!',
    'Kiedy spotkanie?',
    'Jutro o 18',
    'Dobra, będę',
    'Okej 👍',
    'Ej pomożesz z projektem?',
    'Jasne, co trzeba?',
    'Mam tu jakiś plik',
    'Sprawdzam',
    'Super robota!',
    'Dzięki 😊',
    'Masz chwilę?',
    'Teraz nie, za godzinę',
    'Spoko, piszę później',
    'Hej',
    'Co tam?',
    'Normalnie',
    'Okej',
    'Dobra dobra'
  ]
  for (let i = 1; i <= 50; i++) {
    msgs.push({
      id: `mock-msg-${i}`,
      chatId,
      senderId: senders[i % senders.length],
      content: contents[i % contents.length],
      sentAt: new Date(Date.now() - (50 - i) * 60000).toISOString(),
      editedAt: null,
      attachments: [],
      reactions:
        i === 3
          ? [
              {
                messageId: `mock-msg-${i}`,
                userId: 'mock-friend-1',
                type: 'LIKE'
              }
            ]
          : []
    })
  }
  return msgs
}

const ALL_MOCK_MESSAGES: Record<string, Message[]> = {
  'mock-chat-1': generateMockMessages('mock-chat-1'),
  'mock-chat-2': generateMockMessages('mock-chat-2'),
  'mock-chat-3': generateMockMessages('mock-chat-3')
}

const USE_MOCK = false
function avatarSrc(url?: string | null) {
  return url ?? '/ouija_white.svg'
}

interface MessageBubbleProps {
  msg: Message
  isOwn: boolean
  userId: string
  onReact: (messageId: string, type: ReactionType) => void
}

function MessageBubble({ msg, isOwn, userId, onReact }: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false)
    }
    if (showPicker) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  const reactionCounts = (msg.reactions ?? []).reduce<
    Partial<Record<ReactionType, number>>
  >((acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }), {})
  const myReaction = (msg.reactions ?? []).find(
    (r) => r.userId === userId
  )?.type

  return (
    <div
      className={`${styles.MessageWrapper} ${isOwn ? styles.MessageWrapperOwn : ''}`}
    >
      <div
        className={`${styles.MessageBubble} ${isOwn ? styles.MessageBubbleOwn : styles.MessageBubbleOther}`}
      >
        {msg.content && <p className={styles.MessageText}>{msg.content}</p>}
        {(msg.attachments ?? []).map((att) => (
          <div key={att.id} className={styles.MessageAttachment}>
            {att.type === 'IMAGE' ? (
              <img
                src={att.url}
                alt="załącznik"
                className={styles.MessageAttachmentImage}
              />
            ) : att.type === 'VIDEO' ? (
              <video
                src={att.url}
                controls
                className={styles.MessageAttachmentVideo}
              />
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.MessageAttachmentFile}
              >
                📎 {att.name ?? 'Plik'}
              </a>
            )}
          </div>
        ))}
        <span className={styles.MessageTime}>
          {new Date(msg.sentAt).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {msg.editedAt && ' (edytowano)'}
        </span>
        <button
          className={styles.MessageReactBtn}
          onClick={() => setShowPicker((v) => !v)}
          title="Dodaj reakcję"
        >
          {myReaction ? REACTION_EMOJI[myReaction] : '＋'}
        </button>
        {showPicker && (
          <div
            ref={pickerRef}
            className={`${styles.ReactionPicker} ${isOwn ? styles.ReactionPickerLeft : styles.ReactionPickerRight}`}
          >
            {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => (
              <button
                key={type}
                className={`${styles.ReactionPickerBtn} ${myReaction === type ? styles.ReactionPickerBtnActive : ''}`}
                onClick={() => {
                  onReact(msg.id, type)
                  setShowPicker(false)
                }}
                title={type}
              >
                {REACTION_EMOJI[type]}
              </button>
            ))}
          </div>
        )}
      </div>
      {Object.keys(reactionCounts).length > 0 && (
        <div
          className={`${styles.ReactionBar} ${isOwn ? styles.ReactionBarOwn : ''}`}
        >
          {(Object.entries(reactionCounts) as [ReactionType, number][]).map(
            ([type, count]) => (
              <span
                key={type}
                className={`${styles.ReactionChip} ${myReaction === type ? styles.ReactionChipActive : ''}`}
                onClick={() => onReact(msg.id, type)}
                title={type}
              >
                {REACTION_EMOJI[type]} {count}
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}

function ChatsInner() {
  const searchParams = useSearchParams()
  const initialChatId = searchParams.get('chatId')
  const userId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('userId') ?? MOCK_USER_ID)
      : MOCK_USER_ID

  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)
  const [myStatus, setMyStatus] = useState<UserStatus>('ONLINE')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set())

  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([])
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastIdRef = useRef<string>('')
  const isFirstLoad = useRef(true)

  // Pobierz czaty
  useEffect(() => {
    if (USE_MOCK) {
      setChats(MOCK_CHATS)
      if (!activeChatId) setActiveChatId(MOCK_CHATS[0].id)
      setLoadingChats(false)
      return
    }
    fetch(`${API_URL}/api/users/${userId}/chats`)
      .then((r) => r.json())
      .then((data: Chat[]) => {
        setChats(data)
        if (!activeChatId && data.length > 0) setActiveChatId(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false))
  }, [userId])

  // Zamknij dropdown po kliknięciu poza
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      )
        setSearchOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Wyszukiwanie z debouncingiem — używa GET /api/search?q=...
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    const q = searchQuery.trim()
    if (!q) {
      setSearchUsers([])
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      if (USE_MOCK) {
        setSearchUsers(
          MOCK_SEARCH_USERS.filter((u) =>
            u.nickname.toLowerCase().includes(q.toLowerCase())
          )
        )
        setSearchLoading(false)
        return
      }
      try {
        // GET /api/?q=... — wyszukiwanie przez istniejący endpoint
        const res = await fetch(`${API_URL}/api/?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data: UserSearchResult[] = await res.json()
          // Odfiltruj siebie
          setSearchUsers(data.filter((u) => u.id !== userId))
        }
      } catch (err) {
        console.error('Błąd wyszukiwania:', err)
      } finally {
        setSearchLoading(false)
      }
    }, 400) // 400ms debounce — nie uderza po każdej literze

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, userId])

  function getChatDisplayName(chat: Chat): string {
    if (chat.name) return chat.name
    return chat.users.find((u) => u.userId !== userId)?.user.nickname ?? 'Czat'
  }

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) =>
        getChatDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats

  // Osoby z wyników wyszukiwania które NIE mają jeszcze czatu z nami
  const existingChatUserIds = new Set(
    chats.flatMap((c) => c.users.map((u) => u.userId))
  )
  const newPeopleResults = searchQuery.trim()
    ? searchUsers.filter((u) => !existingChatUserIds.has(u.id))
    : []

  // Wyślij zaproszenie do znajomych
  async function handleSendInvite(targetUserId: string) {
    if (USE_MOCK) {
      setSentInvites((prev) => new Set(prev).add(targetUserId))
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: targetUserId })
      })
      if (!res.ok) throw new Error('Błąd wysyłania zaproszenia')
      setSentInvites((prev) => new Set(prev).add(targetUserId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd wysyłania zaproszenia')
    }
  }

  // Otwórz lub utwórz czat z osobą
  // WAŻNE: najpierw aktualizujemy chats state, POTEM ustawiamy activeChatId
  // żeby useEffect dla wiadomości widział nowy czat na liście
  async function handleOpenChatWith(targetUserId: string) {
    const existing = chats.find(
      (c) =>
        c.type === 'PRIVATE' && c.users.some((u) => u.userId === targetUserId)
    )
    if (existing) {
      setActiveChatId(existing.id)
      setSearchQuery('')
      setSearchOpen(false)
      return
    }
    if (USE_MOCK) {
      setSearchQuery('')
      setSearchOpen(false)
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRIVATE',
          userIds: [userId, targetUserId]
        })
      })
      if (!res.ok) throw new Error('Błąd tworzenia czatu')
      const newChat: Chat = await res.json()

      // Krok 1: dodaj czat do state (synchronicznie w tym samym batchu)
      setChats((prev) => {
        if (prev.some((c) => c.id === newChat.id)) return prev
        return [newChat, ...prev]
      })

      // Krok 2: ustaw activeChatId dopiero w następnym ticku
      // — React musi najpierw przetworzyć setChats zanim useEffect[activeChatId] odczyta chats
      setTimeout(() => setActiveChatId(newChat.id), 0)

      setSearchQuery('')
      setSearchOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd tworzenia czatu')
    }
  }

  // Pobierz wiadomości przy zmianie aktywnego czatu
  useEffect(() => {
    if (!activeChatId) return
    setMessages([])
    setHasMore(true)
    lastIdRef.current = ''
    isFirstLoad.current = true
    setLoadingMessages(true)

    if (USE_MOCK) {
      const all = ALL_MOCK_MESSAGES[activeChatId] ?? []
      const page = all.slice(-PAGE_SIZE)
      lastIdRef.current = page[0]?.id ?? ''
      setMessages(page)
      setHasMore(all.length > PAGE_SIZE)
      setLoadingMessages(false)
      return
    }
    fetch(
      `${API_URL}/api/chats/${activeChatId}/messages?limit=${PAGE_SIZE}&lastId=0`
    )
      .then((r) => r.json())
      .then((data: Message[]) => {
        // Backend zwraca desc (najnowsze pierwsze) — odwracamy żeby wyświetlić chronologicznie
        const sorted = [...data].reverse()
        setMessages(sorted)
        setHasMore(data.length === PAGE_SIZE)
        lastIdRef.current = data[data.length - 1]?.id ?? ''
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false))
  }, [activeChatId])

  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isFirstLoad.current = false
    }
  }, [messages])

  const loadMoreMessages = useCallback(async () => {
    if (!activeChatId || loadingMore || !hasMore) return
    setLoadingMore(true)
    const container = messageContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    if (USE_MOCK) {
      const all = ALL_MOCK_MESSAGES[activeChatId] ?? []
      const currentIndex = all.findIndex((m) => m.id === lastIdRef.current)
      const start = Math.max(0, currentIndex - PAGE_SIZE)
      const older = all.slice(start, currentIndex)
      if (older.length === 0) {
        setHasMore(false)
        setLoadingMore(false)
        return
      }
      lastIdRef.current = older[0].id ?? ''
      setHasMore(start > 0)
      setMessages((prev) => [...older, ...prev])
      requestAnimationFrame(() => {
        if (container)
          container.scrollTop = container.scrollHeight - prevScrollHeight
      })
      setLoadingMore(false)
      return
    }
    try {
      const res = await fetch(
        `${API_URL}/api/chats/${activeChatId}/messages?limit=${PAGE_SIZE}&lastId=${lastIdRef.current}`
      )
      const older: Message[] = await res.json()
      if (older.length === 0) {
        setHasMore(false)
        return
      }
      // Backend zwraca desc — odwracamy przed doklejeniem na górze
      const sorted = [...older].reverse()
      lastIdRef.current = older[older.length - 1]?.id ?? ''
      setHasMore(older.length === PAGE_SIZE)
      setMessages((prev) => [...sorted, ...prev])
      requestAnimationFrame(() => {
        if (container)
          container.scrollTop = container.scrollHeight - prevScrollHeight
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [activeChatId, loadingMore, hasMore])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreMessages()
      },
      { threshold: 1.0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMoreMessages])

  // Wysyłanie wiadomości
  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!activeChatId || (!messageText.trim() && pendingFiles.length === 0))
      return
    setSending(true)

    if (USE_MOCK) {
      const mockAttachments: Attachment[] = pendingFiles.map((f, i) => ({
        id: `att-${Date.now()}-${i}`,
        url: URL.createObjectURL(f),
        type: f.type.startsWith('image/')
          ? 'IMAGE'
          : f.type.startsWith('video/')
            ? 'VIDEO'
            : 'FILE',
        name: f.name
      }))
      setMessages((prev) => [
        ...prev,
        {
          id: `mock-${Date.now()}`,
          chatId: activeChatId,
          senderId: userId,
          content: messageText.trim() || null,
          sentAt: new Date().toISOString(),
          editedAt: null,
          attachments: mockAttachments,
          reactions: []
        }
      ])
      setMessageText('')
      setPendingFiles([])
      setSending(false)
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        50
      )
      return
    }

    try {
      let attachments: { url: string; type: AttachmentType }[] = []
      if (pendingFiles.length > 0) {
        const form = new FormData()
        form.append('ownerId', userId)
        pendingFiles.forEach((f) => form.append('files', f))
        const uploadRes = await fetch(`${API_URL}/api/media/upload`, {
          method: 'POST',
          body: form
        })
        if (!uploadRes.ok) throw new Error('Błąd uploadu pliku')
        const mediaFiles: { url: string; mimeType: string }[] =
          await uploadRes.json()
        attachments = mediaFiles.map((mf) => ({
          url: mf.url,
          type: mf.mimeType.startsWith('image/')
            ? 'IMAGE'
            : mf.mimeType.startsWith('video/')
              ? 'VIDEO'
              : mf.mimeType.startsWith('audio/')
                ? 'AUDIO'
                : 'FILE'
        }))
      }
      const res = await fetch(`${API_URL}/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: messageText.trim() || null,
          attachments
        })
      })
      if (!res.ok) throw new Error('Błąd wysyłania')
      const data: Message = await res.json()
      setMessages((prev) => [...prev, data])
      setMessageText('')
      setPendingFiles([])
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        50
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd wysyłania')
    } finally {
      setSending(false)
    }
  }

  // Reakcje
  async function handleReact(messageId: string, type: ReactionType) {
    if (USE_MOCK) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg
          const existing = msg.reactions.find((r) => r.userId === userId)
          if (existing?.type === type)
            return {
              ...msg,
              reactions: msg.reactions.filter((r) => r.userId !== userId)
            }
          return {
            ...msg,
            reactions: [
              ...msg.reactions.filter((r) => r.userId !== userId),
              { messageId, userId, type }
            ]
          }
        })
      )
      return
    }
    const existing = messages
      .find((m) => m.id === messageId)
      ?.reactions.find((r) => r.userId === userId)
    try {
      if (existing?.type === type) {
        await fetch(
          `${API_URL}/api/messages/${messageId}/reactions/${userId}`,
          { method: 'DELETE' }
        )
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: m.reactions.filter((r) => r.userId !== userId)
                }
              : m
          )
        )
      } else if (existing) {
        await fetch(
          `${API_URL}/api/messages/${messageId}/reactions/${userId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
          }
        )
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: m.reactions.map((r) =>
                    r.userId === userId ? { ...r, type } : r
                  )
                }
              : m
          )
        )
      } else {
        await fetch(`${API_URL}/api/messages/${messageId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, type })
        })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: [...m.reactions, { messageId, userId, type }]
                }
              : m
          )
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleStatusChange(status: UserStatus) {
    setMyStatus(status)
    setShowStatusMenu(false)
    if (USE_MOCK) return
    try {
      await fetch(`${API_URL}/api/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
    } catch (err) {
      console.error(err)
    }
  }

  // Natywny event listener zamiast onChange — pewniejszy dla file inputów
  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return
    function onFileSelect() {
      const files = Array.from(input!.files ?? [])
      if (files.length > 0) {
        setPendingFiles((prev) => [...prev, ...files])
        input!.value = ''
      }
    }
    input.addEventListener('change', onFileSelect)
    return () => input.removeEventListener('change', onFileSelect)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleFileChange(_e: React.ChangeEvent<HTMLInputElement>) {
    // kept for type compatibility, logic handled by useEffect above
  }

  function getOtherUser(chat: Chat) {
    return chat.users.find((u) => u.userId !== userId)?.user ?? null
  }

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const otherUser = activeChat ? getOtherUser(activeChat) : null

  return (
    <div className={styles.container}>
      <div className={styles.Contacts}>
        {/* Status */}
        <div
          className={styles.MyStatus}
          onClick={() => setShowStatusMenu((v) => !v)}
        >
          <span
            className={styles.StatusDot}
            style={{ background: STATUS_COLOR[myStatus] }}
          />
          <span className={styles.StatusLabel}>{STATUS_LABEL[myStatus]}</span>
          <span className={styles.StatusChevron}>▾</span>
        </div>
        {showStatusMenu && (
          <div className={styles.StatusMenu}>
            {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => (
              <button
                key={s}
                className={`${styles.StatusMenuBtn} ${myStatus === s ? styles.StatusMenuBtnActive : ''}`}
                onClick={() => handleStatusChange(s)}
              >
                <span
                  className={styles.StatusDot}
                  style={{ background: STATUS_COLOR[s] }}
                />
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className={styles.SearchSection}>
          <div className={styles.SearchWrap}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.SearchInput}
              placeholder="Szukaj czatów i osób..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
            />
            {searchQuery && (
              <button
                className={styles.SearchClear}
                onClick={() => {
                  setSearchQuery('')
                  setSearchOpen(false)
                }}
              >
                ✕
              </button>
            )}
          </div>

          {searchOpen && searchQuery.trim() && (
            <div ref={searchDropdownRef} className={styles.SearchDropdown}>
              {searchLoading && (
                <p className={styles.SearchDropdownLoading}>Szukam...</p>
              )}

              {filteredChats.length > 0 && (
                <>
                  <p className={styles.SearchDropdownSection}>Czaty</p>
                  {filteredChats.map((chat) => {
                    const other = getOtherUser(chat)
                    return (
                      <div
                        key={chat.id}
                        className={styles.SearchDropdownItem}
                        onClick={() => {
                          setActiveChatId(chat.id)
                          setSearchQuery('')
                          setSearchOpen(false)
                        }}
                      >
                        <div className={styles.AvatarWrap}>
                          <Image
                            src={avatarSrc(other?.avatarUrl)}
                            alt="avatar"
                            height={32}
                            width={32}
                            className={styles.ContactsChatPreviewProfilePicture}
                          />
                          {other && (
                            <span
                              className={styles.StatusDotSmall}
                              style={{ background: STATUS_COLOR[other.status] }}
                            />
                          )}
                        </div>
                        <span className={styles.SearchDropdownItemName}>
                          {getChatDisplayName(chat)}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}

              {newPeopleResults.length > 0 && (
                <>
                  <p className={styles.SearchDropdownSection}>Nowe osoby</p>
                  {newPeopleResults.map((person) => (
                    <div key={person.id} className={styles.SearchDropdownItem}>
                      <div className={styles.AvatarWrap}>
                        <Image
                          src={avatarSrc(person.avatarUrl)}
                          alt="avatar"
                          height={32}
                          width={32}
                          className={styles.ContactsChatPreviewProfilePicture}
                        />
                        <span
                          className={styles.StatusDotSmall}
                          style={{ background: STATUS_COLOR[person.status] }}
                        />
                      </div>
                      <span className={styles.SearchDropdownItemName}>
                        {person.nickname}
                      </span>
                      <div className={styles.SearchDropdownActions}>
                        <button
                          className={styles.SearchActionBtn}
                          onClick={() => handleOpenChatWith(person.id)}
                          title="Napisz wiadomość"
                        >
                          💬
                        </button>
                        <button
                          className={`${styles.SearchActionBtn} ${sentInvites.has(person.id) ? styles.SearchActionBtnSent : ''}`}
                          onClick={() => handleSendInvite(person.id)}
                          disabled={sentInvites.has(person.id)}
                          title={
                            sentInvites.has(person.id)
                              ? 'Wysłano'
                              : 'Dodaj znajomego'
                          }
                        >
                          {sentInvites.has(person.id) ? '✓' : '+'}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!searchLoading &&
                filteredChats.length === 0 &&
                newPeopleResults.length === 0 && (
                  <p className={styles.SearchDropdownEmpty}>Brak wyników</p>
                )}
            </div>
          )}
        </div>

        {/* Lista czatów */}
        {loadingChats && <p className={styles.LoadingText}>Ładowanie...</p>}
        {!searchQuery.trim() &&
          filteredChats.map((chat) => {
            const other = getOtherUser(chat)
            const lastMsg = USE_MOCK
              ? ((ALL_MOCK_MESSAGES[chat.id] ?? []).slice(-1)[0]?.content ?? '')
              : ''
            return (
              <div
                key={chat.id}
                className={`${styles.ContactsChatPreview} ${chat.id === activeChatId ? styles.ContactsChatPreviewActive : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className={styles.AvatarWrap}>
                  <Image
                    src={avatarSrc(other?.avatarUrl)}
                    alt="avatar"
                    height={30}
                    width={30}
                    className={styles.ContactsChatPreviewProfilePicture}
                  />
                  {other && (
                    <span
                      className={styles.StatusDotSmall}
                      style={{ background: STATUS_COLOR[other.status] }}
                    />
                  )}
                </div>
                <div className={styles.ContactsChatPreviewMessageContainer}>
                  <h4
                    className={styles.ContactsChatPreviewMessageContainerName}
                  >
                    {getChatDisplayName(chat)}
                  </h4>
                  <p
                    className={
                      styles.ContactsChatPreviewMessageContainerMessage
                    }
                  >
                    {lastMsg}
                  </p>
                </div>
              </div>
            )
          })}
      </div>

      {/* Input zawsze w DOM niezależnie od activeChat — label htmlFor musi znaleźć input */}
      <input
        type="file"
        id="file-upload-input"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/mpeg,audio/ogg,application/pdf"
        style={{ display: 'none' }}
      />

      {/* Obszar czatu */}
      <div className={styles.Chat}>
        {activeChat ? (
          <>
            <div className={styles.ChatContactInfo}>
              <div className={styles.ChatContactInfoLeft}>
                <div className={styles.AvatarWrap}>
                  <Image
                    src={avatarSrc(otherUser?.avatarUrl)}
                    alt="avatar"
                    height={36}
                    width={36}
                    className={styles.ContactsChatPreviewProfilePicture}
                  />
                  {otherUser && (
                    <span
                      className={styles.StatusDotSmall}
                      style={{ background: STATUS_COLOR[otherUser.status] }}
                    />
                  )}
                </div>
                <div>
                  <h2 className={styles.ChatContactName}>
                    {getChatDisplayName(activeChat)}
                  </h2>
                  {otherUser && (
                    <h5
                      className={styles.ChatContactStatus}
                      style={{ color: STATUS_COLOR[otherUser.status] }}
                    >
                      {STATUS_LABEL[otherUser.status]}
                    </h5>
                  )}
                </div>
              </div>
            </div>

            <div
              className={styles.ChatMessageContainer}
              ref={messageContainerRef}
            >
              <div ref={topSentinelRef} className={styles.TopSentinel} />
              {loadingMore && (
                <p className={styles.LoadingMore}>Ładowanie starszych...</p>
              )}
              {loadingMessages && (
                <p className={styles.LoadingText}>Ładowanie wiadomości...</p>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.senderId === userId}
                  userId={userId}
                  onReact={handleReact}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {pendingFiles.length > 0 && (
              <div className={styles.PendingFiles}>
                {pendingFiles.map((f, i) => (
                  <div key={i} className={styles.PendingFile}>
                    {f.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className={styles.PendingFileThumb}
                      />
                    ) : (
                      <span className={styles.PendingFileIcon}>📎</span>
                    )}
                    <span className={styles.PendingFileName}>{f.name}</span>
                    <button
                      className={styles.PendingFileRemove}
                      onClick={() =>
                        setPendingFiles((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.ChatMessageToolbar}>
              <form onSubmit={handleSendMessage}>
                <label
                  htmlFor="file-upload-input"
                  className={styles.AttachBtn}
                  title="Dodaj plik"
                >
                  📎
                </label>
                <input
                  type="text"
                  placeholder="wpisz wiadomość"
                  className={styles.ChatMessageToolbarInput}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                />
                <input
                  type="submit"
                  value={sending ? '...' : 'wyślij'}
                  className={styles.ChatMessageToolbarSubmit}
                  disabled={sending}
                />
              </form>
            </div>
          </>
        ) : (
          <p className={styles.NoChatSelected}>Wybierz czat</p>
        )}
      </div>
    </div>
  )
}

export default function Chats() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Ładowanie...</p>}>
      <ChatsInner />
    </Suspense>
  )
}
