'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../login/Login.module.scss'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ForgotPassword() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')

    const email = (
      e.currentTarget.elements.namedItem('email') as HTMLInputElement
    ).value

    // Always show "done" regardless of whether the email exists (prevents enumeration)
    await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).catch(() => {
      /* ignore network errors too */
    })

    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className={styles.Form}>
        <label className={styles.FormLabel}>check your inbox</label>
        <p
          style={{
            color: '#f3f3f4',
            fontSize: '1.5rem',
            fontWeight: 200,
            margin: '1rem 0'
          }}
        >
          If that address is registered, we sent a reset link.
          <br />
          The link expires in 1 hour.
        </p>
        <Link href={'/login'} className={styles.Link}>
          <p>
            back to <span className={styles.Underline}>login</span>
          </p>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <label htmlFor={'email'} className={styles.FormLabel}>
        forgot password
      </label>

      <input
        type={'email'}
        placeholder={'e-mail'}
        name="email"
        required
        className={styles.FormInput}
      />

      <input
        type={'submit'}
        value={status === 'loading' ? 'sending…' : 'send reset link'}
        disabled={status === 'loading'}
        className={styles.FormSubmit}
      />

      <Link href={'/login'} className={styles.Link}>
        <p>
          remembered it? <span className={styles.Underline}>login</span>
        </p>
      </Link>
    </form>
  )
}
