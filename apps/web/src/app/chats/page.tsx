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

// ─── Typy ────────────────────────────────────────────────────────────────────

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
  messageId: number
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
  id: number
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

// ─── Mock data ────────────────────────────────────────────────────────────────

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

// Generuj 50 mockowych wiadomości żeby było co paginować
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
      id: i,
      chatId,
      senderId: senders[i % senders.length],
      content: contents[i % contents.length],
      sentAt: new Date(Date.now() - (50 - i) * 60000).toISOString(),
      editedAt: null,
      attachments: [],
      reactions:
        i === 3 ? [{ messageId: i, userId: 'mock-friend-1', type: 'LIKE' }] : []
    })
  }
  return msgs
}

const ALL_MOCK_MESSAGES: Record<string, Message[]> = {
  'mock-chat-1': generateMockMessages('mock-chat-1'),
  'mock-chat-2': generateMockMessages('mock-chat-2'),
  'mock-chat-3': generateMockMessages('mock-chat-3')
}

const USE_MOCK = true

// Fallback gdy user nie ma avatara
function avatarSrc(url?: string | null) {
  return url ?? '/ouija_white.svg'
}

// ─── Subkomponent: pojedyncza wiadomość ──────────────────────────────────────

interface MessageBubbleProps {
  msg: Message
  isOwn: boolean
  userId: string
  onReact: (messageId: number, type: ReactionType) => void
}

function MessageBubble({ msg, isOwn, userId, onReact }: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Zamknij picker po kliknięciu poza
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  // Grupuj reakcje: { LIKE: 2, LOVE: 1 }
  const reactionCounts = msg.reactions.reduce<
    Partial<Record<ReactionType, number>>
  >((acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }), {})

  const myReaction = msg.reactions.find((r) => r.userId === userId)?.type

  return (
    <div
      className={`${styles.MessageWrapper} ${isOwn ? styles.MessageWrapperOwn : ''}`}
    >
      <div
        className={`${styles.MessageBubble} ${isOwn ? styles.MessageBubbleOwn : styles.MessageBubbleOther}`}
      >
        {/* Treść */}
        {msg.content && <p className={styles.MessageText}>{msg.content}</p>}

        {/* Załączniki */}
        {msg.attachments.map((att) => (
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

        {/* Czas */}
        <span className={styles.MessageTime}>
          {new Date(msg.sentAt).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {msg.editedAt && ' (edytowano)'}
        </span>

        {/* Przycisk reakcji */}
        <button
          className={styles.MessageReactBtn}
          onClick={() => setShowPicker((v) => !v)}
          title="Dodaj reakcję"
        >
          {myReaction ? REACTION_EMOJI[myReaction] : '＋'}
        </button>

        {/* Picker reakcji */}
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

      {/* Liczniki reakcji pod bańką */}
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

// ─── Główny komponent ─────────────────────────────────────────────────────────

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

  const bottomRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastIdRef = useRef<number>(0)
  const isFirstLoad = useRef(true)

  // ── Pobierz czaty ──
  useEffect(() => {
    if (USE_MOCK) {
      setChats(MOCK_CHATS)
      if (!activeChatId) setActiveChatId(MOCK_CHATS[0].id)
      setLoadingChats(false)
      return
    }
    fetch(`http://localhost:3001/api/users/${userId}/chats`)
      .then((r) => r.json())
      .then((data: Chat[]) => {
        setChats(data)
        if (!activeChatId && data.length > 0) setActiveChatId(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false))
  }, [userId])

  // ── Pobierz pierwsze 20 wiadomości przy zmianie czatu ──
  useEffect(() => {
    if (!activeChatId) return
    setMessages([])
    setHasMore(true)
    lastIdRef.current = 0
    isFirstLoad.current = true
    setLoadingMessages(true)

    if (USE_MOCK) {
      const all = ALL_MOCK_MESSAGES[activeChatId] ?? []
      const page = all.slice(-PAGE_SIZE)
      lastIdRef.current = page[0]?.id ?? 0
      setMessages(page)
      setHasMore(all.length > PAGE_SIZE)
      setLoadingMessages(false)
      return
    }

    fetch(
      `http://localhost:3001/api/chats/${activeChatId}/messages?limit=${PAGE_SIZE}&lastId=0`
    )
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data)
        setHasMore(data.length === PAGE_SIZE)
        lastIdRef.current = data[0]?.id ?? 0
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false))
  }, [activeChatId])

  // ── Scroll do dołu tylko przy pierwszym załadowaniu czatu ──
  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isFirstLoad.current = false
    }
  }, [messages])

  // ── IntersectionObserver — ładuj więcej gdy scroll dotrze do góry ──
  const loadMoreMessages = useCallback(async () => {
    if (!activeChatId || loadingMore || !hasMore) return
    setLoadingMore(true)

    const container = messageContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    if (USE_MOCK) {
      const all = ALL_MOCK_MESSAGES[activeChatId] ?? []
      const currentFirstId = lastIdRef.current
      const currentIndex = all.findIndex((m) => m.id === currentFirstId)
      const start = Math.max(0, currentIndex - PAGE_SIZE)
      const older = all.slice(start, currentIndex)

      if (older.length === 0) {
        setHasMore(false)
        setLoadingMore(false)
        return
      }

      lastIdRef.current = older[0].id
      setHasMore(start > 0)
      setMessages((prev) => [...older, ...prev])

      // Utrzymaj pozycję scrolla po doklejeniu wiadomości na górze
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
      setLoadingMore(false)
      return
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/chats/${activeChatId}/messages?limit=${PAGE_SIZE}&lastId=${lastIdRef.current}`
      )
      const older: Message[] = await res.json()
      if (older.length === 0) {
        setHasMore(false)
        return
      }
      lastIdRef.current = older[0].id
      setHasMore(older.length === PAGE_SIZE)
      setMessages((prev) => [...older, ...prev])
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

  // ── Wysyłanie wiadomości ──
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
      const newMsg: Message = {
        id: Date.now(),
        chatId: activeChatId,
        senderId: userId,
        content: messageText.trim() || null,
        sentAt: new Date().toISOString(),
        editedAt: null,
        attachments: mockAttachments,
        reactions: []
      }
      setMessages((prev) => [...prev, newMsg])
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

      // Krok 1: jeśli są pliki — najpierw upload do /api/media/upload
      // Backend oczekuje: FormData { files[], ownerId }
      // Zwraca: MediaFile[] z polami { url, mimeType, ... }
      if (pendingFiles.length > 0) {
        const form = new FormData()
        form.append('ownerId', userId)
        pendingFiles.forEach((f) => form.append('files', f))

        const uploadRes = await fetch(
          'http://localhost:3001/api/media/upload',
          {
            method: 'POST',
            body: form
          }
        )
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

      // Krok 2: wyślij wiadomość z URL-ami załączników
      // POST /api/chats/:chatId/messages body: { userId, content, attachments? }
      const res = await fetch(
        `http://localhost:3001/api/chats/${activeChatId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            content: messageText.trim() || null,
            attachments
          })
        }
      )
      if (!res.ok) throw new Error('Błąd wysyłania')
      const newMsg: Message = await res.json()
      setMessages((prev) => [...prev, newMsg])
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

  // ── Reakcje ──
  async function handleReact(messageId: number, type: ReactionType) {
    if (USE_MOCK) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg
          const existing = msg.reactions.find((r) => r.userId === userId)
          if (existing?.type === type) {
            // usuń reakcję jeśli kliknięto ponownie ten sam typ
            return {
              ...msg,
              reactions: msg.reactions.filter((r) => r.userId !== userId)
            }
          }
          const filtered = msg.reactions.filter((r) => r.userId !== userId)
          return {
            ...msg,
            reactions: [...filtered, { messageId, userId, type }]
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
          `http://localhost:3001/api/messages/${messageId}/reactions/${userId}`,
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
          `http://localhost:3001/api/messages/${messageId}/reactions/${userId}`,
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
        await fetch(
          `http://localhost:3001/api/messages/${messageId}/reactions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, type })
          }
        )
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

  // ── Zmiana statusu ──
  async function handleStatusChange(status: UserStatus) {
    setMyStatus(status)
    setShowStatusMenu(false)
    if (USE_MOCK) return
    try {
      await fetch(`http://localhost:3001/api/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
    } catch (err) {
      console.error(err)
    }
  }

  // ── Pliki ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPendingFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Helpers ──
  function getChatDisplayName(chat: Chat): string {
    if (chat.name) return chat.name
    const other = chat.users.find((u) => u.userId !== userId)
    return other?.user.nickname ?? 'Czat'
  }

  function getOtherUser(chat: Chat): ChatUserEntry['user'] | null {
    return chat.users.find((u) => u.userId !== userId)?.user ?? null
  }

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const otherUser = activeChat ? getOtherUser(activeChat) : null

  return (
    <div className={styles.container}>
      {/* ── Sidebar ── */}
      <div className={styles.Contacts}>
        {/* Status zalogowanego usera */}
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

        {loadingChats && <p className={styles.LoadingText}>Ładowanie...</p>}
        {chats.map((chat) => {
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
                <h4 className={styles.ContactsChatPreviewMessageContainerName}>
                  {getChatDisplayName(chat)}
                </h4>
                <p
                  className={styles.ContactsChatPreviewMessageContainerMessage}
                >
                  {lastMsg}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Obszar czatu ── */}
      <div className={styles.Chat}>
        {activeChat ? (
          <>
            {/* Nagłówek */}
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

            {/* Wiadomości */}
            <div
              className={styles.ChatMessageContainer}
              ref={messageContainerRef}
            >
              {/* Sentinel na górze — trigger ładowania starszych */}
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

            {/* Podgląd plików do wysłania */}
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
                      onClick={() => removeFile(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className={styles.ChatMessageToolbar}>
              <form onSubmit={handleSendMessage}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className={styles.AttachBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Dodaj plik"
                >
                  📎
                </button>
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
