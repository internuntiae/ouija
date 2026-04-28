'use client'

import { useRef } from 'react'
import styles from './Chats.module.scss'
import {
  Chat,
  UserStatus,
  UserSearchResult,
  STATUS_COLOR,
  STATUS_LABEL,
  avatarSrc
} from './types'

interface Props {
  userId: string
  chats: Chat[]
  activeChatId: string | null
  myStatus: UserStatus
  showStatusMenu: boolean
  setShowStatusMenu: (v: boolean) => void
  onStatusChange: (s: UserStatus) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  searchLoading: boolean
  searchUsers: UserSearchResult[]
  filteredChats: Chat[]
  newPeopleResults: UserSearchResult[]
  sentInvites: Set<string>
  loadingChats: boolean
  onSelectChat: (id: string) => void
  onOpenProfile: (id: string) => void
  onSendInvite: (id: string) => void
  onOpenChatWith: (id: string) => void
}

function getChatDisplayName(chat: Chat, userId: string): string {
  if (chat.name) return chat.name
  return chat.users.find((u) => u.userId !== userId)?.user.nickname ?? 'Czat'
}

function getLastMessagePreview(chat: Chat, userId: string): string {
  const msg = chat.lastMessage
  if (!msg) return ''
  const isOwn = msg.senderId === userId
  if (isOwn) return `Ty: ${msg.content ?? '📎 Załącznik'}`
  const sender =
    chat.users.find((u) => u.userId === msg.senderId)?.user.nickname ?? ''
  return `${sender}: ${msg.content ?? '📎 Załącznik'}`
}

export default function ChatSidebar({
  userId,
  chats,
  activeChatId,
  myStatus,
  showStatusMenu,
  setShowStatusMenu,
  onStatusChange,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  searchLoading,
  filteredChats,
  newPeopleResults,
  sentInvites,
  loadingChats,
  onSelectChat,
  onOpenProfile,
  onSendInvite,
  onOpenChatWith
}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  const STATUS_KEYS = Object.keys(STATUS_LABEL) as UserStatus[]

  return (
    <div className={styles.Contacts}>
      {/* ── Status ── */}
      <div
        className={styles.MyStatus}
        onClick={() => setShowStatusMenu(!showStatusMenu)}
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
          {STATUS_KEYS.map((s) => (
            <button
              key={s}
              className={`${styles.StatusMenuBtn} ${myStatus === s ? styles.StatusMenuBtnActive : ''}`}
              onClick={() => onStatusChange(s)}
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

      {/* ── Wyszukiwarka ── */}
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
                  const other = chat.users.find(
                    (u) => u.userId !== userId
                  )?.user
                  return (
                    <div
                      key={chat.id}
                      className={styles.SearchDropdownItem}
                      onClick={() => {
                        onSelectChat(chat.id)
                        setSearchQuery('')
                        setSearchOpen(false)
                      }}
                    >
                      <div
                        className={styles.AvatarWrap}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (other) onOpenProfile(other.id)
                        }}
                      >
                        <img
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
                        {getChatDisplayName(chat, userId)}
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
                    <div
                      className={styles.AvatarWrap}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onOpenProfile(person.id)
                        setSearchOpen(false)
                      }}
                    >
                      <img
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
                    <span
                      className={styles.SearchDropdownItemName}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onOpenProfile(person.id)
                        setSearchOpen(false)
                      }}
                    >
                      {person.nickname}
                    </span>
                    <div className={styles.SearchDropdownActions}>
                      <button
                        className={styles.SearchActionBtn}
                        onClick={() => onOpenChatWith(person.id)}
                        title="Napisz wiadomość"
                      >
                        💬
                      </button>
                      <button
                        className={`${styles.SearchActionBtn} ${sentInvites.has(person.id) ? styles.SearchActionBtnSent : ''}`}
                        onClick={() => onSendInvite(person.id)}
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

      {/* ── Lista czatów ── */}
      {loadingChats && <p className={styles.LoadingText}>Ładowanie...</p>}

      {!searchQuery.trim() &&
        chats.map((chat) => {
          const other = chat.users.find((u) => u.userId !== userId)?.user
          const lastMsg = getLastMessagePreview(chat, userId)
          const unread = chat.unreadCount ?? 0

          return (
            <div
              key={chat.id}
              className={`${styles.ContactsChatPreview} ${chat.id === activeChatId ? styles.ContactsChatPreviewActive : ''} ${unread > 0 && chat.id !== activeChatId ? styles.ContactsChatPreviewUnread : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div
                className={styles.AvatarWrap}
                onClick={(e) => {
                  e.stopPropagation()
                  if (other) onOpenProfile(other.id)
                }}
                style={{ cursor: 'pointer' }}
              >
                <img
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
                <div className={styles.ContactsChatPreviewTop}>
                  <h4
                    className={`${styles.ContactsChatPreviewMessageContainerName} ${unread > 0 && chat.id !== activeChatId ? styles.ChatNameUnread : ''}`}
                  >
                    {getChatDisplayName(chat, userId)}
                  </h4>
                  {chat.lastMessage && (
                    <span className={styles.ChatPreviewTime}>
                      {new Date(chat.lastMessage.sentAt).toLocaleTimeString(
                        'pl-PL',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </span>
                  )}
                </div>
                <div className={styles.ContactsChatPreviewBottom}>
                  <p
                    className={`${styles.ContactsChatPreviewMessageContainerMessage} ${unread > 0 && chat.id !== activeChatId ? styles.LastMsgUnread : ''}`}
                  >
                    {lastMsg}
                  </p>
                  {unread > 0 && chat.id !== activeChatId && (
                    <span className={styles.UnreadBadge}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
