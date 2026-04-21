'use client'

import styles from './Login.module.scss'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Login() {
  const [passwordResetEnabled, setPasswordResetEnabled] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/auth/config`)
      .then((r) => r.json())
      .then((cfg) => setPasswordResetEnabled(cfg.enablePasswordReset ?? false))
      .catch(() => {})
  }, [])

  return (
    <form method="POST" action={'/api/health'} className={styles.Form}>
      <label htmlFor={'username'} className={styles.FormLabel}>
        username
      </label>
      <input
        type={'text'}
        placeholder={'username'}
        name="username"
        className={styles.FormInput}
      />

      <label htmlFor={'password'} className={styles.FormLabel}>
        password
      </label>
      <input
        type={'text'}
        placeholder={'password'}
        name="password"
        className={styles.FormInput}
      />

      <input type={'submit'} value="Login" className={styles.FormSubmit} />

      <Link href={'/register'} className={styles.Link}>
        <p>
          no account? <span className={styles.Underline}>click here</span>
        </p>
      </Link>

      {passwordResetEnabled && (
        <Link href={'/forgot-password'} className={styles.Link}>
          <p>
            forgot password? <span className={styles.Underline}>reset</span>
          </p>
        </Link>
      )}
    </form>
  )
}
