'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../login/Login.module.scss'
import { useTranslation } from '@/i18n/translations'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function VerifyEmailContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('verifyEmail.messageNoToken'))
      return
    }

    fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Verification failed.')
        setStatus('done')
        setMessage(t('verifyEmail.messageDone'))
      })
      .catch((err) => {
        setStatus('error')
        setMessage((err as Error).message)
      })
  }, [token])

  const titleKey =
    status === 'loading'
      ? 'verifyEmail.titleLoading'
      : status === 'done'
        ? 'verifyEmail.titleDone'
        : 'verifyEmail.titleError'

  return (
    <div className={styles.Form}>
      <label className={styles.FormLabel}>{t(titleKey)}</label>

      <p
        style={{
          color: status === 'error' ? '#ff6b6b' : 'var(--text-primary)',
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
            {t('verifyEmail.goTo')}{' '}
            <span className={styles.Underline}>
              {t('verifyEmail.goToLoginLink')}
            </span>
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
