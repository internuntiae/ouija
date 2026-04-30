'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './Chats.module.scss'
import { Message, ReactionType, REACTION_EMOJI } from './types'

interface Props {
  msg: Message
  isOwn: boolean
  userId: string
  onReact: (messageId: string, type: ReactionType) => void
  chatUsers?: {
    userId: string
    user: { nickname: string; avatarUrl?: string | null }
  }[]
}

export default function MessageBubble({
  msg,
  isOwn,
  userId,
  onReact,
  chatUsers = []
}: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(
    null
  )
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false)
    }
    if (showPicker) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  const reactions = msg.reactions ?? []

  // Group reactions by type, collecting reactors
  const reactionGroups = reactions.reduce<
    Partial<Record<ReactionType, { count: number; users: string[] }>>
  >((acc, r) => {
    const nickname =
      r.user?.nickname ??
      chatUsers.find((cu) => cu.userId === r.userId)?.user.nickname ??
      r.userId
    if (!acc[r.type]) acc[r.type] = { count: 0, users: [] }
    acc[r.type]!.count++
    acc[r.type]!.users.push(nickname)
    return acc
  }, {})

  const myReaction = reactions.find((r) => r.userId === userId)?.type

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

      {Object.keys(reactionGroups).length > 0 && (
        <div
          className={`${styles.ReactionBar} ${isOwn ? styles.ReactionBarOwn : ''}`}
        >
          {(
            Object.entries(reactionGroups) as [
              ReactionType,
              { count: number; users: string[] }
            ][]
          ).map(([type, { count, users }]) => {
            const emoji = REACTION_EMOJI[type]
            if (!emoji) return null
            return (
              <span
                key={type}
                className={`${styles.ReactionChip} ${myReaction === type ? styles.ReactionChipActive : ''}`}
                onClick={() => onReact(msg.id, type)}
                onMouseEnter={() => setHoveredReaction(type)}
                onMouseLeave={() => setHoveredReaction(null)}
                style={{ position: 'relative' }}
              >
                {emoji} {count}
                {hoveredReaction === type && users.length > 0 && (
                  <span className={styles.ReactionTooltip}>
                    <span className={styles.ReactionTooltipEmoji}>{emoji}</span>
                    <span className={styles.ReactionTooltipUsers}>
                      {users.map((name, i) => (
                        <span key={i} className={styles.ReactionTooltipUser}>
                          {name}
                        </span>
                      ))}
                    </span>
                  </span>
                )}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
