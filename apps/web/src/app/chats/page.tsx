'use client'

import styles from './Chats.module.scss'
import Image from 'next/image'
import { useState, useEffect, useRef, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Message {
  id: number
  chatId: string
  senderId: string
  content: string | null
  sentAt: string
  editedAt: string | null
  attachments: unknown[]
  reactions: unknown[]
}

const MOCK_USER_ID = 'mock-user-1'

const MOCK_CHATS = [
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
        user: { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'OFFLINE' }
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
          status: 'AWAY'
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
        user: { id: 'mock-friend-1', nickname: 'Anna Nowak', status: 'OFFLINE' }
      },
      {
        userId: 'mock-friend-2',
        chatId: 'mock-chat-3',
        role: 'MEMBER',
        joinedAt: '',
        user: {
          id: 'mock-friend-2',
          nickname: 'Piotr Wiśniewski',
          status: 'AWAY'
        }
      }
    ]
  }
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  'mock-chat-1': [
    {
      id: 1,
      chatId: 'mock-chat-1',
      senderId: 'mock-user-1',
      content: 'No co tam mordko',
      sentAt: '2024-01-01T10:00:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    },
    {
      id: 2,
      chatId: 'mock-chat-1',
      senderId: 'mock-friend-1',
      content: 'A dobrze',
      sentAt: '2024-01-01T10:01:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    },
    {
      id: 3,
      chatId: 'mock-chat-1',
      senderId: 'mock-user-1',
      content: 'A to spoko',
      sentAt: '2024-01-01T10:02:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    },
    {
      id: 4,
      chatId: 'mock-chat-1',
      senderId: 'mock-user-1',
      content: 'Ale możesz pomóc z projektem?',
      sentAt: '2024-01-01T10:03:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    }
  ],
  'mock-chat-2': [
    {
      id: 5,
      chatId: 'mock-chat-2',
      senderId: 'mock-friend-2',
      content: 'Ej stary pomóż w projekcie',
      sentAt: '2024-01-02T09:00:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    }
  ],
  'mock-chat-3': [
    {
      id: 6,
      chatId: 'mock-chat-3',
      senderId: 'mock-friend-1',
      content: 'Kiedy spotkanie?',
      sentAt: '2024-01-03T12:00:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    },
    {
      id: 7,
      chatId: 'mock-chat-3',
      senderId: 'mock-user-1',
      content: 'W piątek o 18',
      sentAt: '2024-01-03T12:05:00Z',
      editedAt: null,
      attachments: [],
      reactions: []
    }
  ]
}

const USE_MOCK = true

function ChatsInner() {
  const searchParams = useSearchParams()
  const initialChatId = searchParams.get('chatId')

  const userId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('userId') ?? MOCK_USER_ID)
      : MOCK_USER_ID

  const [chats, setChats] = useState<typeof MOCK_CHATS>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pobierz czaty
  useEffect(() => {
    if (USE_MOCK) {
      setChats(MOCK_CHATS)
      if (!activeChatId) setActiveChatId(MOCK_CHATS[0].id)
      setLoadingChats(false)
      return
    }

    // GET http://localhost:3001/api/users/:userId/chats
    fetch(`http://localhost:3001/api/users/${userId}/chats`)
      .then((r) => r.json())
      .then((data) => {
        setChats(data)
        if (!activeChatId && data.length > 0) setActiveChatId(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false))
  }, [userId])

  // Pobierz wiadomości gdy zmienia się aktywny czat
  useEffect(() => {
    if (!activeChatId) return
    setLoadingMessages(true)

    if (USE_MOCK) {
      setMessages(MOCK_MESSAGES[activeChatId] ?? [])
      setLoadingMessages(false)
      return
    }

    // GET http://localhost:3001/api/chats/:chatId/messages?limit=50&lastId=0
    fetch(
      `http://localhost:3001/api/chats/${activeChatId}/messages?limit=50&lastId=0`
    )
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false))
  }, [activeChatId])

  // Scroll do dołu
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!activeChatId || !messageText.trim()) return

    setSending(true)

    if (USE_MOCK) {
      const newMsg = {
        id: Date.now(),
        chatId: activeChatId,
        senderId: userId,
        content: messageText.trim(),
        sentAt: new Date().toISOString(),
        editedAt: null,
        attachments: [],
        reactions: []
      }
      setMessages((prev) => [...prev, newMsg])
      setMessageText('')
      setSending(false)
      return
    }

    try {
      // POST http://localhost:3001/api/chats/:chatId/messages
      // body: { userId, content }
      const res = await fetch(
        `http://localhost:3001/api/chats/${activeChatId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, content: messageText.trim() })
        }
      )

      if (!res.ok) throw new Error('Nie udało się wysłać wiadomości')

      const newMsg = await res.json()
      setMessages((prev) => [...prev, newMsg])
      setMessageText('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd wysyłania')
    } finally {
      setSending(false)
    }
  }

  function getChatDisplayName(chat: (typeof MOCK_CHATS)[0]): string {
    if (chat.name) return chat.name
    const other = chat.users.find((u) => u.userId !== userId)
    return other?.user.nickname ?? 'Czat'
  }

  function getLastMessagePreview(chatId: string): string {
    if (USE_MOCK) {
      const msgs = MOCK_MESSAGES[chatId]
      return msgs?.[msgs.length - 1]?.content ?? ''
    }
    return ''
  }

  const activeChat = chats.find((c) => c.id === activeChatId)

  return (
    <>
      <div className={styles.container}>
        <div className={styles.Contacts}>
          {loadingChats && <p>Ładowanie...</p>}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={styles.ContactsChatPreview}
              onClick={() => setActiveChatId(chat.id)}
              style={{
                cursor: 'pointer',
                opacity: chat.id === activeChatId ? 1 : 0.7
              }}
            >
              <Image
                className={styles.ContactsChatPreviewProfilePicture}
                src={'/ouija_white.svg'}
                alt={'profile_picture'}
                height={30}
                width={30}
              />
              <div className={styles.ContactsChatPreviewMessageContainer}>
                <h4 className={styles.ContactsChatPreviewMessageContainerName}>
                  {getChatDisplayName(chat)}
                </h4>
                <p
                  className={styles.ContactsChatPreviewMessageContainerMessage}
                >
                  {getLastMessagePreview(chat.id)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.Chat}>
          {activeChat ? (
            <>
              <div className={styles.ChatContactInfo}>
                <h2>{getChatDisplayName(activeChat)}</h2>
                <h5>
                  {activeChat.users.find((u) => u.userId !== userId)?.user
                    .status === 'ONLINE'
                    ? 'Aktywny'
                    : 'Nieaktywny'}
                </h5>
              </div>

              <div className={styles.ChatMessageContainer}>
                {loadingMessages && <p>Ładowanie wiadomości...</p>}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.senderId === userId
                        ? styles.ChatMessageContainerYourMessage
                        : styles.ChatMessageContainerContactMessage
                    }
                  >
                    <p>{msg.content}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className={styles.ChatMessageToolbar}>
                <form onSubmit={handleSendMessage}>
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
            <p style={{ padding: '2rem' }}>Wybierz czat</p>
          )}
        </div>
      </div>
    </>
  )
}

export default function Chats() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Ładowanie...</p>}>
      <ChatsInner />
    </Suspense>
  )
}
