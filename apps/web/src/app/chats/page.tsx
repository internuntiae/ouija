'use client'

import styles from './Chats.module.scss'
import ProfilePopup from '../components/ProfilePopup/ProfilePopup'
import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  Suspense,
  useCallback
} from 'react'
import { useSearchParams } from 'next/navigation'
import ChatSidebar from './ChatSidebar'
import ChatWindow from './ChatWindow'
import {
  Chat,
  Message,
  UserStatus,
  UserSearchResult,
  ReactionType,
  AttachmentType,
  API_URL,
  PAGE_SIZE
} from './types'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation } from '@/i18n/translations'

// ─── Główny komponent ─────────────────────────────────────────────────────────

function ChatsInner() {
  const userId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('userId') ?? null)
      : null

  if (!userId) return null
  return <ChatsWithUser userId={userId} />
}

function ChatsWithUser({ userId }: { userId: string }) {
  const searchParams = useSearchParams()

  // ── Stan ──
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(
    searchParams.get('chatId')
  )
  const activeChatIdRef = useRef<string | null>(searchParams.get('chatId'))
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
  const [profilePopupUserId, setProfilePopupUserId] = useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([])

  // ── Refs ──
  const bottomRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastIdRef = useRef<string>('')
  const isFirstLoad = useRef(true)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { settings } = useSettings()
  const { t } = useTranslation()

  // ── Status z bazy ──
  useEffect(() => {
    const cached = localStorage.getItem('userStatus') as UserStatus | null
    if (cached) setMyStatus(cached)

    fetch(`${API_URL}/api/?id=${userId}`)
      .then((r) => r.json())
      .then((data: { status?: UserStatus }) => {
        if (data?.status) {
          setMyStatus(data.status)
          localStorage.setItem('userStatus', data.status)
        }
      })
      .catch(console.error)
  }, [userId])

  // ── Pobierz czaty ──
  useEffect(() => {
    fetch(`${API_URL}/api/users/${userId}/chats`)
      .then((r) => r.json())
      .then((data: Chat[]) => {
        // Dla każdego czatu pobierz ostatnią wiadomość
        return Promise.all(
          data.map(async (chat) => {
            try {
              const res = await fetch(
                `${API_URL}/api/chats/${chat.id}/messages?limit=1`
              )
              if (res.ok) {
                const msgs: Message[] = await res.json()
                return { ...chat, lastMessage: msgs[0] ?? null }
              }
            } catch {
              /* ignoruj */
            }
            return chat
          })
        )
      })
      .then((enriched) => {
        // Sortuj malejąco po ostatniej wiadomości
        const sorted = enriched.sort((a, b) => {
          const ta = a.lastMessage?.sentAt ?? a.updatedAt
          const tb = b.lastMessage?.sentAt ?? b.updatedAt
          return new Date(tb).getTime() - new Date(ta).getTime()
        })
        setChats(sorted)
        setActiveChatId(
          (prev) => prev ?? (sorted.length > 0 ? sorted[0].id : null)
        )
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false))
  }, [userId])

  // ── Zamknij dropdown ──
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const t = e.target as Node
      const inSearch =
        document.querySelector('[data-search-dropdown]')?.contains(t) ||
        document.querySelector('[data-search-input]')?.contains(t)
      if (!inSearch) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // ── Wyszukiwanie z debouncingiem ──
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    const q = searchQuery.trim()
    if (!q) {
      setSearchUsers([])
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/?q=${encodeURIComponent(q)}`)
        if (res.ok)
          setSearchUsers(
            (await res.json()).filter((u: UserSearchResult) => u.id !== userId)
          )
      } catch {
        /* ignoruj */
      } finally {
        setSearchLoading(false)
      }
    }, 400)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, userId])

  // ── Pobierz wiadomości ──
  useEffect(() => {
    if (!activeChatId) return
    setMessages([])
    setHasMore(true)
    lastIdRef.current = ''
    isFirstLoad.current = true
    setLoadingMessages(true)

    // Oznacz czat jako przeczytany
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c))
    )

    fetch(`${API_URL}/api/chats/${activeChatId}/messages?limit=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((data: Message[]) => {
        const sorted = [...data].reverse()
        setMessages(sorted)
        setHasMore(data.length === PAGE_SIZE)
        lastIdRef.current = data[data.length - 1]?.id ?? ''
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false))
  }, [activeChatId])

  // ── Sync activeChatIdRef ──
  useEffect(() => {
    activeChatIdRef.current = activeChatId
  }, [activeChatId])

  // ── WebSocket ──
  const wsRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    const WS_URL = API_URL.replace(/^http/, 'ws')
    const ws = new WebSocket(`${WS_URL}/ws?userId=${userId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as {
          type: string
          payload: Record<string, unknown>
        }

        if (msg.type === 'message:created') {
          const newMsg = msg.payload as unknown as Message
          // Only append to the visible message list when the chat is open.
          // The duplicate guard handles the case where the sender already added
          // the message optimistically via the HTTP response.
          if (newMsg.chatId === activeChatIdRef.current) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }

          triggerNotification(
            'ouija',
            (newMsg.content ?? 'No message, ouija error! :)').toString()
          )

          setChats((prev) => {
            const updated = prev.map((c) =>
              c.id === newMsg.chatId
                ? {
                    ...c,
                    lastMessage: newMsg,
                    unreadCount:
                      newMsg.chatId !== activeChatIdRef.current &&
                      newMsg.senderId !== userId
                        ? (c.unreadCount ?? 0) + 1
                        : c.unreadCount
                  }
                : c
            )
            const idx = updated.findIndex((c) => c.id === newMsg.chatId)
            if (idx > 0) {
              const [chat] = updated.splice(idx, 1)
              updated.unshift(chat)
            }
            return updated
          })
          if (newMsg.chatId === activeChatIdRef.current) {
            setTimeout(
              () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
              50
            )
          }
        }

        if (msg.type === 'message:updated') {
          const updated = msg.payload as unknown as Message
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          )
        }

        if (msg.type === 'message:deleted') {
          const { messageId } = msg.payload as { messageId: string }
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
        }

        if (
          msg.type === 'reaction:added' ||
          msg.type === 'reaction:updated' ||
          msg.type === 'reaction:deleted'
        ) {
          const {
            messageId,
            userId: rUserId,
            type: rType
          } = msg.payload as {
            messageId: string
            userId: string
            type: ReactionType
          }
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m
              const withoutUser = m.reactions.filter(
                (r) => r.userId !== rUserId
              )
              if (msg.type === 'reaction:deleted')
                return { ...m, reactions: withoutUser }
              return {
                ...m,
                reactions: [
                  ...withoutUser,
                  { messageId, userId: rUserId, type: rType }
                ]
              }
            })
          )
        }

        if (msg.type === 'chat:created') {
          const newChat = msg.payload as unknown as Chat
          setChats((prev) =>
            prev.some((c) => c.id === newChat.id) ? prev : [newChat, ...prev]
          )
        }
      } catch {
        /* ignoruj */
      }
    }

    ws.onerror = (err) => console.error('[WS] błąd:', err)

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [userId])

  // ── Scroll do dołu przy pierwszym ładowaniu ──
  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isFirstLoad.current = false
    }
  }, [messages])

  // ── Ładuj starsze wiadomości ──
  const loadMoreMessages = useCallback(async () => {
    if (!activeChatId || loadingMore || !hasMore) return
    if (isFirstLoad.current) return
    setLoadingMore(true)
    const container = messageContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    try {
      const res = await fetch(
        `${API_URL}/api/chats/${activeChatId}/messages?limit=${PAGE_SIZE}&lastId=${lastIdRef.current}`
      )
      const older: Message[] = await res.json()
      if (!older.length) {
        setHasMore(false)
        return
      }
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

  // ── Powiadomienia ──
  function triggerNotification(title: string, body: string) {
    if (!settings.notificationsEnabled) return
    if (settings.notificationSound) {
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.value = 0.1
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      } catch {
        /* ignoruj */
      }
    }

    // Powiadomienie systemowe
    if (
      settings.notificationDesktop &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(title, { body, icon: '/ouija_white.png' })
    }
  }

  // ── Wysyłanie wiadomości ──
  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!activeChatId || (!messageText.trim() && pendingFiles.length === 0))
      return
    setSending(true)

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
        if (!uploadRes.ok) {
          alert(t('chat.errorUpload'))
          setSending(false)
          return
        }
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
      if (!res.ok) {
        alert(t('chat.errorSend'))
        setSending(false)
        return
      }
      // Don't append the message here — the WS 'message:created' event
      // will arrive for the sender too and is the single source of truth.
      // Adding it here as well caused a visible duplicate on first send
      // after a page refresh (race between HTTP response and WS delivery).
      await res.json()
      setMessageText('')
      setPendingFiles([])
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        50
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : t('chat.errorSend'))
    } finally {
      setSending(false)
    }
  }

  // ── Reakcje ──
  async function handleReact(messageId: string, type: ReactionType) {
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

  // ── Zmiana statusu ──
  async function handleStatusChange(status: UserStatus) {
    setMyStatus(status)
    setShowStatusMenu(false)
    localStorage.setItem('userStatus', status)
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

  // ── Otwórz lub utwórz czat ──
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
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRIVATE',
          userIds: [userId, targetUserId]
        })
      })
      if (!res.ok) {
        alert(t('chat.errorCreate'))
        return
      }
      const newChat: Chat = await res.json()
      setChats((prev) =>
        prev.some((c) => c.id === newChat.id) ? prev : [newChat, ...prev]
      )
      setTimeout(() => setActiveChatId(newChat.id), 0)
      setSearchQuery('')
      setSearchOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : t('chat.errorCreate'))
    }
  }

  // ── Wyślij zaproszenie ──
  async function handleSendInvite(targetUserId: string) {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: targetUserId })
      })
      if (!res.ok) {
        alert(t('chat.errorInvite'))
        return
      }
      setSentInvites((prev) => new Set(prev).add(targetUserId))
    } catch {
      alert(t('chat.errorInvite'))
    }
  }

  // ── Otwórz czat z ProfilePopup ──
  async function handleMessageFromProfile(targetUserId: string) {
    await handleOpenChatWith(targetUserId)
    setProfilePopupUserId(null)
  }

  // ── Natywny listener dla file input ──
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

  function handleFileChange() {
    /* handled by useEffect */
  }

  // ── Pochodne ──
  function getChatDisplayName(chat: Chat): string {
    if (chat.name) return chat.name
    return chat.users.find((u) => u.userId !== userId)?.user.nickname ?? 'Czat'
  }

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) =>
        getChatDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats

  const existingChatUserIds = new Set(
    chats.flatMap((c) => c.users.map((u) => u.userId))
  )
  const newPeopleResults = searchQuery.trim()
    ? searchUsers.filter((u) => !existingChatUserIds.has(u.id))
    : []

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const otherUser =
    activeChat?.users.find((u) => u.userId !== userId)?.user ?? null

  const lastNotifiedMsgId = useRef<string | null>(null)

  // ── Powiadomienia dla nowych wiadomości od innych ──
  // lastNotifiedMsgId zapobiega powiadomieniu przy pierwszym załadowaniu czatu
  useEffect(() => {
    if (!messages.length) {
      lastNotifiedMsgId.current = null
      return
    }
    const last = messages[messages.length - 1]
    // Ustaw punkt startowy przy pierwszym załadowaniu — nie powiadamiaj
    if (lastNotifiedMsgId.current === null) {
      lastNotifiedMsgId.current = last.id
      return
    }
    // Powiadamiaj tylko o naprawdę nowych wiadomościach (nowe id, nie moje)
    if (
      last.id !== lastNotifiedMsgId.current &&
      last.senderId !== userId &&
      document.hidden
    ) {
      lastNotifiedMsgId.current = last.id
      const senderName =
        activeChat?.users.find((u) => u.userId === last.senderId)?.user
          .nickname ?? 'Ktoś'
      triggerNotification(senderName, last.content ?? '📎 Załącznik')
    }
  }, [messages])

  return (
    <div className={styles.container}>
      {/* Input poza warunkowym renderem */}
      <input
        type="file"
        id="file-upload-input"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/mpeg,audio/ogg,application/pdf"
        style={{ display: 'none' }}
      />

      <ChatSidebar
        userId={userId}
        chats={chats}
        activeChatId={activeChatId}
        myStatus={myStatus}
        showStatusMenu={showStatusMenu}
        setShowStatusMenu={setShowStatusMenu}
        onStatusChange={handleStatusChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchLoading={searchLoading}
        searchUsers={searchUsers}
        filteredChats={filteredChats}
        newPeopleResults={newPeopleResults}
        sentInvites={sentInvites}
        loadingChats={loadingChats}
        onSelectChat={(id) => {
          setActiveChatId(id)
          setChats((prev) =>
            prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
          )
        }}
        onOpenProfile={setProfilePopupUserId}
        onSendInvite={handleSendInvite}
        onOpenChatWith={handleOpenChatWith}
      />

      <ChatWindow
        activeChat={activeChat}
        otherUser={otherUser}
        userId={userId}
        messages={messages}
        loadingMessages={loadingMessages}
        loadingMore={loadingMore}
        messageText={messageText}
        setMessageText={setMessageText}
        pendingFiles={pendingFiles}
        setPendingFiles={setPendingFiles}
        sending={sending}
        bottomRef={bottomRef}
        topSentinelRef={topSentinelRef}
        messageContainerRef={messageContainerRef}
        fileInputRef={fileInputRef}
        onSendMessage={handleSendMessage}
        onReact={handleReact}
        onOpenProfile={setProfilePopupUserId}
        getChatDisplayName={getChatDisplayName}
      />

      {profilePopupUserId && (
        <ProfilePopup
          userId={profilePopupUserId}
          viewerId={userId}
          onClose={() => setProfilePopupUserId(null)}
          onMessageUser={handleMessageFromProfile}
        />
      )}
    </div>
  )
}

export default function Chats() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading...</p>}>
      <ChatsInner />
    </Suspense>
  )
}
