'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

interface PickerPos {
  top: number
  left: number
}
interface TooltipPos {
  top: number
  left: number
}

export default function MessageBubble({
  msg,
  isOwn,
  userId,
  onReact,
  chatUsers = []
}: Props) {
  const [pickerPos, setPickerPos] = useState<PickerPos | null>(null)
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(
    null
  )
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close picker on outside click
  useEffect(() => {
    if (!pickerPos) return
    function handleClick(e: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      )
        setPickerPos(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerPos])

  // Reposition picker on scroll/resize
  const updatePickerPos = useCallback(() => {
    if (!pickerPos || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPickerPos({ top: r.top - 8, left: isOwn ? r.right : r.left })
  }, [pickerPos, isOwn])

  useEffect(() => {
    if (!pickerPos) return
    window.addEventListener('scroll', updatePickerPos, true)
    window.addEventListener('resize', updatePickerPos)
    return () => {
      window.removeEventListener('scroll', updatePickerPos, true)
      window.removeEventListener('resize', updatePickerPos)
    }
  }, [pickerPos, updatePickerPos])

  function togglePicker() {
    if (pickerPos) {
      setPickerPos(null)
      return
    }
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPickerPos({ top: r.top - 8, left: isOwn ? r.right : r.left })
  }

  function handleChipMouseEnter(
    type: ReactionType,
    e: React.MouseEvent<HTMLSpanElement>
  ) {
    const r = e.currentTarget.getBoundingClientRect()
    setTooltipPos({ top: r.top, left: r.left + r.width / 2 })
    setHoveredReaction(type)
  }

  function handleChipMouseLeave() {
    setHoveredReaction(null)
    setTooltipPos(null)
  }

  const reactions = msg.reactions ?? []

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

  // Picker rendered into a portal so it escapes every scroll/overflow ancestor
  const pickerPortal =
    pickerPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={pickerRef}
            className={styles.ReactionPickerFixed}
            style={{
              top: pickerPos.top,
              left: pickerPos.left,
              transform: isOwn
                ? 'translate(-100%, -100%)'
                : 'translate(0, -100%)'
            }}
          >
            {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => (
              <button
                key={type}
                className={`${styles.ReactionPickerBtn} ${myReaction === type ? styles.ReactionPickerBtnActive : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onReact(msg.id, type)
                  setPickerPos(null)
                }}
                title={type}
              >
                {REACTION_EMOJI[type]}
              </button>
            ))}
          </div>,
          document.body
        )
      : null

  // Tooltip also in a portal
  const tooltipPortal =
    hoveredReaction && tooltipPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={styles.ReactionTooltipFixed}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <span className={styles.ReactionTooltipEmoji}>
              {REACTION_EMOJI[hoveredReaction]}
            </span>
            <span className={styles.ReactionTooltipUsers}>
              {(reactionGroups[hoveredReaction]?.users ?? []).map((name, i) => (
                <span key={i} className={styles.ReactionTooltipUser}>
                  {name}
                </span>
              ))}
            </span>
          </div>,
          document.body
        )
      : null

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
          ref={btnRef}
          className={styles.MessageReactBtn}
          onClick={togglePicker}
          title="Dodaj reakcję"
        >
          {myReaction ? REACTION_EMOJI[myReaction] : '＋'}
        </button>
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
          ).map(([type, { count }]) => {
            const emoji = REACTION_EMOJI[type]
            if (!emoji) return null
            return (
              <span
                key={type}
                className={`${styles.ReactionChip} ${myReaction === type ? styles.ReactionChipActive : ''}`}
                onClick={() => onReact(msg.id, type)}
                onMouseEnter={(e) => handleChipMouseEnter(type, e)}
                onMouseLeave={handleChipMouseLeave}
              >
                {emoji} {count}
              </span>
            )
          })}
        </div>
      )}

      {pickerPortal}
      {tooltipPortal}
    </div>
  )
}
