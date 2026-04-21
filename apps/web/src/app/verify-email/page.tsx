'use client'

import { useEffect, useState, Suspense } from 'react' // 1. Import Suspense
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../login/Login.module.scss'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Move your logic into a sub-component
function VerifyEmailContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }

    fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Verification failed.')
        setStatus('done')
        setMessage('Your email has been verified. You can now log in.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage((err as Error).message)
      })
  }, [token])

  return (
    <div className={styles.Form}>
      <label className={styles.FormLabel}>
        {status === 'loading' && 'verifying…'}
        {status === 'done' && 'verified ✓'}
        {status === 'error' && 'oops'}
      </label>

      <p
        style={{
          color: status === 'error' ? '#ff6b6b' : '#f3f3f4',
          fontSize: '1.5rem',
          fontWeight: 200,
          margin: '1rem 0'
        }}
      >
        {message}
      </p>

      {status !== 'loading' && (
        <Link href={'/login'} className={styles.Link}>
          <p>
            go to <span className={styles.Underline}>login</span>
          </p>
        </Link>
      )}
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
