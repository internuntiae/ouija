'use client'

import { FormEvent, RefObject } from 'react'
import styles from './Chats.module.scss'
import MessageBubble from './MessageBubble'
import { Chat, Message, ReactionType, STATUS_COLOR, avatarSrc } from './types'
import { useTranslation } from '@/i18n/translations'

interface Props {
  activeChat: Chat | null
  otherUser: {
    id: string
    nickname: string
    status: string
    avatarUrl?: string | null
  } | null
  userId: string
  messages: Message[]
  loadingMessages: boolean
  loadingMore: boolean
  messageText: string
  setMessageText: (v: string) => void
  pendingFiles: File[]
  setPendingFiles: (fn: (prev: File[]) => File[]) => void
  sending: boolean
  bottomRef: RefObject<HTMLDivElement | null>
  topSentinelRef: RefObject<HTMLDivElement | null>
  messageContainerRef: RefObject<HTMLDivElement | null>
  fileInputRef: RefObject<HTMLInputElement | null>
  onSendMessage: (e: FormEvent) => void
  onReact: (messageId: string, type: ReactionType) => void
  onOpenProfile: (id: string) => void
  getChatDisplayName: (chat: Chat) => string
}

export default function ChatWindow({
  activeChat,
  otherUser,
  userId,
  messages,
  loadingMessages,
  loadingMore,
  messageText,
  setMessageText,
  pendingFiles,
  setPendingFiles,
  sending,
  bottomRef,
  topSentinelRef,
  messageContainerRef,
  onSendMessage,
  onReact,
  onOpenProfile,
  getChatDisplayName
}: Props) {
  const { t } = useTranslation()

  if (!activeChat) {
    return (
      <div className={styles.Chat}>
        <p className={styles.NoChatSelected}>{t('chat.noChat')}</p>
      </div>
    )
  }

  return (
    <div className={styles.Chat}>
      {/* ── Nagłówek ── */}
      <div className={styles.ChatContactInfo}>
        <div className={styles.ChatContactInfoLeft}>
          <div
            className={styles.AvatarWrap}
            style={{ cursor: 'pointer' }}
            onClick={() => otherUser && onOpenProfile(otherUser.id)}
          >
            <img
              src={avatarSrc(otherUser?.avatarUrl)}
              alt="avatar"
              height={36}
              width={36}
              className={styles.ContactsChatPreviewProfilePicture}
            />
            {otherUser && (
              <span
                className={styles.StatusDotSmall}
                style={{
                  background:
                    STATUS_COLOR[
                      otherUser.status as keyof typeof STATUS_COLOR
                    ] ?? '#7f8c8d'
                }}
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
                style={{
                  color:
                    STATUS_COLOR[
                      otherUser.status as keyof typeof STATUS_COLOR
                    ] ?? '#7f8c8d'
                }}
              >
                {t(`status.${otherUser.status}` as never)}
              </h5>
            )}
          </div>
        </div>
      </div>

      {/* ── Wiadomości ── */}
      <div className={styles.ChatMessageContainer} ref={messageContainerRef}>
        <div ref={topSentinelRef} className={styles.TopSentinel} />
        {loadingMore && (
          <p className={styles.LoadingMore}>{t('chat.loadingOlder')}</p>
        )}
        {loadingMessages && (
          <p className={styles.LoadingText}>{t('chat.loadingMessages')}</p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.senderId === userId}
            userId={userId}
            onReact={onReact}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Podgląd plików ── */}
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
                  setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className={styles.ChatMessageToolbar}>
        <form onSubmit={onSendMessage}>
          <label
            htmlFor="file-upload-input"
            className={styles.AttachBtn}
            title={t('chat.attachTitle')}
          >
            📎
          </label>
          <input
            type="text"
            placeholder={t('chat.messagePlaceholder')}
            className={styles.ChatMessageToolbarInput}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sending}
          />
          <input
            type="submit"
            value={sending ? t('chat.sending') : t('chat.sendBtn')}
            className={styles.ChatMessageToolbarSubmit}
            disabled={sending}
          />
        </form>
      </div>
    </div>
  )
}
