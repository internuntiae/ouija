'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './Chats.module.scss'
import { Message, ReactionType, REACTION_EMOJI } from './types'

interface Props {
  msg: Message
  isOwn: boolean
  userId: string
  onReact: (messageId: string, type: ReactionType) => void
}

export default function MessageBubble({ msg, isOwn, userId, onReact }: Props) {
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

  const reactions = msg.reactions ?? []
  const reactionCounts = reactions.reduce<
    Partial<Record<ReactionType, number>>
  >((acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }), {})
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

      {Object.keys(reactionCounts).length > 0 && (
        <div
          className={`${styles.ReactionBar} ${isOwn ? styles.ReactionBarOwn : ''}`}
        >
          {(Object.entries(reactionCounts) as [ReactionType, number][]).map(
            ([type, count]) => {
              const emoji = REACTION_EMOJI[type]
              if (!emoji) return null
              return (
                <span
                  key={type}
                  className={`${styles.ReactionChip} ${myReaction === type ? styles.ReactionChipActive : ''}`}
                  onClick={() => onReact(msg.id, type)}
                  title={type}
                >
                  {emoji} {count}
                </span>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}
