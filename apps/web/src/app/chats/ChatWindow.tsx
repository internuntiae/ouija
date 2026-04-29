'use client'

import { FormEvent, RefObject, useState } from 'react'
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
  onBack?: () => void
  isMobileChatVisible?: boolean
  onRenameGroup: (chatId: string, name: string) => Promise<void>
  onDeleteGroup: (chatId: string) => Promise<void>
  onTransferOwner: (chatId: string, newOwnerId: string) => Promise<void>
  currentUserId?: string
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
  getChatDisplayName,
  onBack,
  isMobileChatVisible,
  onRenameGroup,
  onDeleteGroup,
  onTransferOwner
}: Props) {
  const { t } = useTranslation()
  const [groupPanelOpen, setGroupPanelOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const isGroupAdmin =
    activeChat?.type === 'GROUP' &&
    activeChat.users.find((u) => u.userId === userId)?.role === 'ADMIN'

  if (!activeChat) {
    return (
      <div className={styles.Chat}>
        <p className={styles.NoChatSelected}>{t('chat.noChat')}</p>
      </div>
    )
  }

  return (
    <div
      className={`${styles.Chat}${isMobileChatVisible ? ` ${styles.ChatVisible}` : ''}`}
    >
      {/* ── Nagłówek ── */}
      <div className={styles.ChatContactInfo}>
        {onBack && (
          <button
            className={styles.BackButton}
            onClick={onBack}
            aria-label="Wróć do listy czatów"
          >
            ←
          </button>
        )}
        <div className={styles.ChatContactInfoLeft}>
          {activeChat.type === 'GROUP' ? (
            <>
              <div className={styles.GroupIconWrap}>
                <svg
                  viewBox="0 0 36 36"
                  width="36"
                  height="36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="18" cy="18" r="18" fill="var(--bg-elevated)" />
                  <circle cx="13" cy="14" r="5" fill="var(--text-muted)" />
                  <circle
                    cx="23"
                    cy="14"
                    r="5"
                    fill="var(--text-muted)"
                    opacity="0.7"
                  />
                  <path
                    d="M4 28 Q4 22 13 22 Q18 22 20 24 Q15 24 15 28 Z"
                    fill="var(--text-muted)"
                  />
                  <path
                    d="M16 26 Q17 21 23 21 Q30 21 32 27 L32 28 Q29 24 23 24 Q17 24 16 28 Z"
                    fill="var(--text-muted)"
                    opacity="0.7"
                  />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 className={styles.ChatContactName}>
                  {getChatDisplayName(activeChat)}
                </h2>
                <h5 className={styles.ChatContactStatus}>
                  {activeChat.users.map((u) => u.user.nickname).join(', ')}
                </h5>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
        {activeChat?.type === 'GROUP' && (
          <button
            className={`${styles.GroupSettingsBtn} ${groupPanelOpen ? styles.GroupSettingsBtnActive : ''}`}
            onClick={() => setGroupPanelOpen((v) => !v)}
            title="Ustawienia grupy"
          >
            ⚙️
          </button>
        )}
      </div>

      {/* ── Panel ustawień grupy ── */}
      {groupPanelOpen && activeChat?.type === 'GROUP' && (
        <div className={styles.GroupPanel}>
          {/* Nazwa grupy — każdy może zmienić */}
          <div className={styles.GroupPanelSection}>
            <p className={styles.GroupPanelLabel}>Nazwa grupy</p>
            {editingName ? (
              <div className={styles.GroupPanelNameEdit}>
                <input
                  className={styles.GroupPanelNameInput}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameGroup(activeChat.id, nameInput)
                      setEditingName(false)
                    }
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  autoFocus
                />
                <button
                  className={styles.GroupPanelBtn}
                  onClick={() => {
                    onRenameGroup(activeChat.id, nameInput)
                    setEditingName(false)
                  }}
                >
                  Zapisz
                </button>
                <button
                  className={styles.GroupPanelBtnSecondary}
                  onClick={() => setEditingName(false)}
                >
                  Anuluj
                </button>
              </div>
            ) : (
              <div className={styles.GroupPanelNameRow}>
                <span className={styles.GroupPanelNameText}>
                  {activeChat.name}
                </span>
                <button
                  className={styles.GroupPanelBtn}
                  onClick={() => {
                    setNameInput(activeChat.name ?? '')
                    setEditingName(true)
                  }}
                >
                  ✏️ Edytuj
                </button>
              </div>
            )}
          </div>

          {/* Członkowie */}
          <div className={styles.GroupPanelSection}>
            <p className={styles.GroupPanelLabel}>
              Członkowie ({activeChat.users.length})
            </p>
            {activeChat.users.map((u) => (
              <div key={u.userId} className={styles.GroupPanelMember}>
                <img
                  src={avatarSrc(u.user.avatarUrl)}
                  alt={u.user.nickname}
                  width={28}
                  height={28}
                  className={styles.GroupPanelMemberAvatar}
                  onClick={() => onOpenProfile(u.user.id)}
                />
                <span className={styles.GroupPanelMemberName}>
                  {u.user.nickname}
                </span>
                {u.role === 'ADMIN' && (
                  <span className={styles.GroupPanelAdminBadge}>Admin</span>
                )}
                {isGroupAdmin && u.userId !== userId && (
                  <button
                    className={styles.GroupPanelBtnDanger}
                    title="Przekaż własność"
                    onClick={() => {
                      if (
                        confirm(
                          `Przekazać własność grupy użytkownikowi ${u.user.nickname}?`
                        )
                      )
                        onTransferOwner(activeChat.id, u.userId)
                    }}
                  >
                    👑
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Usuń grupę — tylko admin */}
          {isGroupAdmin && (
            <div className={styles.GroupPanelSection}>
              <button
                className={styles.GroupPanelBtnDangerFull}
                onClick={() => onDeleteGroup(activeChat.id)}
              >
                🗑️ Usuń grupę
              </button>
            </div>
          )}
        </div>
      )}

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
