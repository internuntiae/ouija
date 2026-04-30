'use client'

import { FormEvent, RefObject, useRef, useState } from 'react'
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
  onAddMember: (chatId: string, userId: string) => Promise<void>
  onUpgradeToGroup: (
    chatId: string,
    name: string,
    memberIds: string[]
  ) => Promise<void>
  friendIds: Set<string>
  allChats: Chat[]
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
  onTransferOwner,
  onAddMember,
  onUpgradeToGroup
}: Props) {
  const { t } = useTranslation()
  const [groupPanelOpen, setGroupPanelOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [addMemberSearch, setAddMemberSearch] = useState('')
  const [addMemberResults, setAddMemberResults] = useState<
    { id: string; nickname: string; avatarUrl?: string | null }[]
  >([])
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeGroupName, setUpgradeGroupName] = useState('')
  const [upgradeExtraMembers, setUpgradeExtraMembers] = useState<
    { id: string; nickname: string; avatarUrl?: string | null }[]
  >([])
  const [upgradeSearch, setUpgradeSearch] = useState('')
  const [upgradeSearchResults, setUpgradeSearchResults] = useState<
    { id: string; nickname: string; avatarUrl?: string | null }[]
  >([])
  const [upgradeSearchLoading, setUpgradeSearchLoading] = useState(false)
  const addMemberTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const upgradeSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const GROUP_MAX_MEMBERS = 10

  const isGroupAdmin =
    activeChat?.type === 'GROUP' &&
    activeChat.users.find((u) => u.userId === userId)?.role === 'ADMIN'

  const atMemberCap =
    activeChat?.type === 'GROUP' &&
    (activeChat.users.length ?? 0) >= GROUP_MAX_MEMBERS

  // Search FRIENDS of current user to add to group
  function handleAddMemberSearch(q: string) {
    setAddMemberSearch(q)
    if (addMemberTimer.current) clearTimeout(addMemberTimer.current)
    if (!q.trim()) {
      setAddMemberResults([])
      return
    }
    addMemberTimer.current = setTimeout(async () => {
      setAddMemberLoading(true)
      try {
        const res = await fetch(
          `${API_URL}/api/users/${userId}/friends?status=ACCEPTED`
        )
        if (res.ok) {
          const data: {
            userId: string
            friendId: string
            user: { id: string; nickname: string; avatarUrl?: string | null }
            friend: { id: string; nickname: string; avatarUrl?: string | null }
          }[] = await res.json()
          const existingIds = new Set(
            activeChat?.users.map((u) => u.userId) ?? []
          )
          const friends = data
            .map((f) => (f.userId === userId ? f.friend : f.user))
            .filter((u) => u.id !== userId && !existingIds.has(u.id))
          const lower = q.toLowerCase()
          setAddMemberResults(
            friends.filter((u) => u.nickname.toLowerCase().includes(lower))
          )
        }
      } catch {
        /* ignore */
      } finally {
        setAddMemberLoading(false)
      }
    }, 200)
  }

  // Search FRIENDS of current user when upgrading private → group
  function handleUpgradeSearch(q: string) {
    setUpgradeSearch(q)
    if (upgradeSearchTimer.current) clearTimeout(upgradeSearchTimer.current)
    if (!q.trim()) {
      setUpgradeSearchResults([])
      return
    }
    upgradeSearchTimer.current = setTimeout(async () => {
      setUpgradeSearchLoading(true)
      try {
        const res = await fetch(
          `${API_URL}/api/users/${userId}/friends?status=ACCEPTED`
        )
        if (res.ok) {
          const data: {
            userId: string
            friendId: string
            user: { id: string; nickname: string; avatarUrl?: string | null }
            friend: { id: string; nickname: string; avatarUrl?: string | null }
          }[] = await res.json()
          const alreadyAdded = new Set([
            userId,
            otherUser?.id ?? '',
            ...upgradeExtraMembers.map((m) => m.id)
          ])
          const friends = data
            .map((f) => (f.userId === userId ? f.friend : f.user))
            .filter((u) => !alreadyAdded.has(u.id))
          const lower = q.toLowerCase()
          setUpgradeSearchResults(
            friends.filter((u) => u.nickname.toLowerCase().includes(lower))
          )
        }
      } catch {
        /* ignore */
      } finally {
        setUpgradeSearchLoading(false)
      }
    }, 200)
  }

  function toggleUpgradeMember(person: {
    id: string
    nickname: string
    avatarUrl?: string | null
  }) {
    setUpgradeExtraMembers((prev) =>
      prev.some((m) => m.id === person.id)
        ? prev.filter((m) => m.id !== person.id)
        : [...prev, person]
    )
  }

  async function handleConfirmUpgrade() {
    if (!activeChat || !upgradeGroupName.trim()) return
    if (upgradeExtraMembers.length === 0) {
      alert(
        'A group chat needs at least 3 members. Please add at least one more person.'
      )
      return
    }
    // current user + other user + extras
    const total = 2 + upgradeExtraMembers.length
    if (total > GROUP_MAX_MEMBERS) {
      alert(`A group can have at most ${GROUP_MAX_MEMBERS} members.`)
      return
    }
    await onUpgradeToGroup(
      activeChat.id,
      upgradeGroupName.trim(),
      upgradeExtraMembers.map((m) => m.id)
    )
    setUpgradeModalOpen(false)
    setUpgradeGroupName('')
    setUpgradeExtraMembers([])
    setUpgradeSearch('')
    setUpgradeSearchResults([])
  }

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
        {activeChat?.type === 'PRIVATE' && (
          <button
            className={styles.GroupSettingsBtn}
            onClick={() => {
              setUpgradeGroupName('')
              setUpgradeExtraMembers([])
              setUpgradeSearch('')
              setUpgradeSearchResults([])
              setUpgradeModalOpen(true)
            }}
            title="Utwórz grupę z tego czatu"
          >
            👥+
          </button>
        )}
      </div>

      {/* ── Modal: upgrade private chat to group ── */}
      {upgradeModalOpen && (
        <div
          className={styles.ModalOverlay}
          onClick={() => setUpgradeModalOpen(false)}
        >
          <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.ModalHeader}>
              <h3 className={styles.ModalTitle}>Utwórz czat grupowy</h3>
              <button
                className={styles.ModalClose}
                onClick={() => setUpgradeModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.ModalBody}>
              <p className={styles.ModalHint}>
                Aktualnie w czacie: ty i {otherUser?.nickname}. Potrzeba min. 3
                osób.
              </p>
              <input
                type="text"
                className={styles.ModalInput}
                placeholder="Nazwa grupy"
                value={upgradeGroupName}
                onChange={(e) => setUpgradeGroupName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className={styles.ModalInput}
                placeholder="Dodaj osoby do grupy..."
                value={upgradeSearch}
                onChange={(e) => handleUpgradeSearch(e.target.value)}
              />
              {upgradeSearchLoading && (
                <p className={styles.ModalHint}>Szukam...</p>
              )}
              {upgradeSearchResults.length > 0 && (
                <div className={styles.ModalSearchResults}>
                  {upgradeSearchResults.map((person) => {
                    const selected = upgradeExtraMembers.some(
                      (m) => m.id === person.id
                    )
                    return (
                      <div
                        key={person.id}
                        className={`${styles.ModalSearchItem} ${selected ? styles.ModalSearchItemSelected : ''}`}
                        onClick={() => toggleUpgradeMember(person)}
                      >
                        <img
                          src={avatarSrc(person.avatarUrl)}
                          alt="avatar"
                          width={28}
                          height={28}
                          className={styles.ContactsChatPreviewProfilePicture}
                        />
                        <span className={styles.ModalSearchItemName}>
                          {person.nickname}
                        </span>
                        {selected && (
                          <span className={styles.ModalCheckmark}>✓</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {upgradeExtraMembers.length > 0 && (
                <div className={styles.ModalMembers}>
                  <p className={styles.ModalHint}>
                    Dodani ({upgradeExtraMembers.length}):
                  </p>
                  <div className={styles.ModalMemberChips}>
                    {upgradeExtraMembers.map((m) => (
                      <span key={m.id} className={styles.ModalChip}>
                        {m.nickname}
                        <button
                          className={styles.ModalChipRemove}
                          onClick={() => toggleUpgradeMember(m)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.ModalFooter}>
              <button
                className={styles.ModalCancelBtn}
                onClick={() => setUpgradeModalOpen(false)}
              >
                Anuluj
              </button>
              <button
                className={styles.ModalConfirmBtn}
                onClick={handleConfirmUpgrade}
                disabled={
                  !upgradeGroupName.trim() || upgradeExtraMembers.length === 0
                }
              >
                Utwórz grupę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel ustawień grupy ── */}
      {groupPanelOpen && activeChat?.type === 'GROUP' && (
        <div className={styles.GroupPanel}>
          {/* Close button */}
          <div className={styles.GroupPanelCloseRow}>
            <span className={styles.GroupPanelTitle}>Ustawienia grupy</span>
            <button
              className={styles.GroupPanelBtnSecondary}
              onClick={() => setGroupPanelOpen(false)}
            >
              ✕
            </button>
          </div>

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

          {/* Dodaj członka */}
          <div className={styles.GroupPanelSection}>
            <p className={styles.GroupPanelLabel}>
              Dodaj osobę{' '}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                ({activeChat.users.length}/{GROUP_MAX_MEMBERS})
              </span>
            </p>
            {atMemberCap ? (
              <p
                style={{
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic'
                }}
              >
                Grupa osiągnęła limit {GROUP_MAX_MEMBERS} członków.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  className={styles.GroupPanelNameInput}
                  placeholder="Szukaj znajomych..."
                  value={addMemberSearch}
                  onChange={(e) => handleAddMemberSearch(e.target.value)}
                />
                {addMemberLoading && (
                  <p
                    style={{
                      fontSize: '1.1rem',
                      color: 'var(--text-muted)',
                      margin: '0.3rem 0'
                    }}
                  >
                    Szukam...
                  </p>
                )}
                {!addMemberLoading &&
                  addMemberSearch.trim() &&
                  addMemberResults.length === 0 && (
                    <p
                      style={{
                        fontSize: '1.1rem',
                        color: 'var(--text-muted)',
                        margin: '0.3rem 0'
                      }}
                    >
                      Brak znajomych poza grupą.
                    </p>
                  )}
                {addMemberResults.length > 0 && (
                  <div className={styles.GroupPanelAddResults}>
                    {addMemberResults.map((person) => (
                      <div
                        key={person.id}
                        className={styles.GroupPanelAddResultItem}
                      >
                        <img
                          src={avatarSrc(person.avatarUrl)}
                          alt="avatar"
                          width={24}
                          height={24}
                          className={styles.GroupPanelMemberAvatar}
                        />
                        <span className={styles.GroupPanelMemberName}>
                          {person.nickname}
                        </span>
                        <button
                          className={styles.GroupPanelBtn}
                          onClick={async () => {
                            await onAddMember(activeChat.id, person.id)
                            setAddMemberSearch('')
                            setAddMemberResults([])
                          }}
                        >
                          + Dodaj
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
