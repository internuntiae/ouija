'use client'

import { useState, Suspense } from 'react' // 1. Added Suspense
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../login/Login.module.scss'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Move your existing logic here
function ResetPasswordContent() {
  const params = useSearchParams()
  const token = params.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle'
  )
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className={styles.Form}>
        <label className={styles.FormLabel}>invalid link</label>
        <p
          style={{
            color: '#ff6b6b',
            fontSize: '1.5rem',
            fontWeight: 200,
            margin: '1rem 0'
          }}
        >
          This reset link is missing a token. Please request a new one.
        </p>
        <Link href={'/forgot-password'} className={styles.Link}>
          <p>
            <span className={styles.Underline}>request new link</span>
          </p>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const form = e.currentTarget
    const newPassword = (
      form.elements.namedItem('password') as HTMLInputElement
    ).value
    const confirm = (
      form.elements.namedItem('password-confirm') as HTMLInputElement
    ).value

    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      setStatus('error')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Reset failed.')
        setStatus('error')
        return
      }

      setStatus('done')
    } catch {
      setError('A network error occurred. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className={styles.Form}>
        <label className={styles.FormLabel}>password updated</label>
        <p
          style={{
            color: '#f3f3f4',
            fontSize: '1.5rem',
            fontWeight: 200,
            margin: '1rem 0'
          }}
        >
          Your password has been changed. You can now log in.
        </p>
        <Link href={'/login'} className={styles.Link}>
          <p>
            go to <span className={styles.Underline}>login</span>
          </p>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <label htmlFor={'password'} className={styles.FormLabel}>
        new password
      </label>
      <input
        type={'password'}
        placeholder={'new password'}
        name="password"
        required
        minLength={6}
        className={styles.FormInput}
      />

      <label htmlFor={'password-confirm'} className={styles.FormLabel}>
        repeat password
      </label>
      <input
        type={'password'}
        placeholder={'repeat password'}
        name="password-confirm"
        required
        className={styles.FormInput}
      />

      {status === 'error' && (
        <p style={{ color: '#ff6b6b', fontSize: '1.4rem', margin: '0.5rem 0' }}>
          {error}
        </p>
      )}

      <input
        type={'submit'}
        value={status === 'loading' ? 'saving…' : 'set new password'}
        disabled={status === 'loading'}
        className={styles.FormSubmit}
      />
    </form>
  )
}

// 2. Wrap the component in Suspense for the actual export
export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
