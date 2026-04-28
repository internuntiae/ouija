'use client'

import styles from './Register.module.scss'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/translations'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface FormErrors {
  email?: string
  username?: string
  password?: string
  passwordConfirm?: string
  submit?: string
}

function validateEmail(email: string): string | undefined {
  if (!email) return 'E-mail jest wymagany'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Nieprawidłowy format e-mail'
}

function validateUsername(username: string): string | undefined {
  if (!username) return 'Nazwa użytkownika jest wymagana'
  if (username.length < 3)
    return 'Nazwa użytkownika musi mieć co najmniej 3 znaki'
  if (username.length > 32)
    return 'Nazwa użytkownika może mieć maksymalnie 32 znaki'
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Dozwolone znaki: litery, cyfry, podkreślnik'
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Hasło jest wymagane'
  if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków'
  if (!/[A-Z]/.test(password))
    return 'Hasło musi zawierać co najmniej jedną wielką literę'
  if (!/[0-9]/.test(password))
    return 'Hasło musi zawierać co najmniej jedną cyfrę'
}

function validatePasswordConfirm(
  password: string,
  confirm: string
): string | undefined {
  if (!confirm) return 'Powtórzenie hasła jest wymagane'
  if (password !== confirm) return 'Hasła nie są identyczne'
}

export default function Register() {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle'
  )
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/auth/config`)
      .then((r) => r.json())
      .then((cfg) =>
        setRequiresVerification(cfg.requireEmailVerification ?? false)
      )
      .catch(() => {})
  }, [])

  function handleBlur(field: string, value: string, extraValue?: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    let error: string | undefined

    if (field === 'email') error = validateEmail(value)
    if (field === 'username') error = validateUsername(value)
    if (field === 'password') error = validatePassword(value)
    if (field === 'passwordConfirm')
      error = validatePasswordConfirm(extraValue ?? '', value)

    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const form = e.currentTarget
    const email = (
      form.elements.namedItem('email') as HTMLInputElement
    ).value.trim()
    const nickname = (
      form.elements.namedItem('username') as HTMLInputElement
    ).value.trim()
    const password = (
      form.elements.namedItem('password') as HTMLInputElement
    ).value.trim()
    const confirm = (
      form.elements.namedItem('password-confirm') as HTMLInputElement
    ).value.trim()

    const newErrors: FormErrors = {
      email: validateEmail(email),
      username: validateUsername(nickname),
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirm(password, confirm)
    }

    setTouched({
      email: true,
      username: true,
      password: true,
      passwordConfirm: true
    })
    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) {
      setStatus('idle')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname })
      })

      const data = await res.json()

      if (!res.ok) {
        const msg: string = data?.error ?? 'Błąd rejestracji'
        if (
          msg.includes('email already exists') ||
          msg.includes('email już istnieje')
        ) {
          setErrors((prev) => ({
            ...prev,
            email: 'Konto z tym e-mailem już istnieje'
          }))
        } else if (
          msg.includes('already exists') ||
          msg.includes('już istnieje')
        ) {
          setErrors((prev) => ({
            ...prev,
            username: "Konto z tym username'm już istnieje"
          }))
        } else {
          setError(msg)
        }
        setStatus('error')
        return
      }

      setRequiresVerification(data.requiresVerification ?? false)
      setStatus('done')
    } catch {
      setErrors((prev) => ({ ...prev, submit: 'Brak połączenia z serwerem' }))
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className={styles.Form}>
        <label className={styles.FormLabel}>
          {requiresVerification ? 'check your inbox' : 'welcome!'}
        </label>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            fontWeight: 200,
            margin: '1rem 0'
          }}
        >
          {requiresVerification
            ? 'We sent a verification link to your email address. Click it to activate your account.'
            : 'Your account is ready. You can now log in.'}
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
    <>
      <form onSubmit={handleSubmit} className={styles.Form} noValidate>
        <label htmlFor="email" className={styles.FormLabel}>
          {t('register.email')}
        </label>
        <input
          type="email"
          placeholder={t('register.email')}
          name="email"
          id="email"
          className={styles.FormInput}
          onBlur={(e) => handleBlur('email', e.target.value)}
          aria-invalid={touched.email && !!errors.email}
        />
        {touched.email && errors.email && (
          <p className={styles.FormError}>{errors.email}</p>
        )}

        <label htmlFor={'username'} className={styles.FormLabel}>
          {t('register.username')}
        </label>
        <input
          type="text"
          placeholder={t('register.username')}
          name="username"
          id="username"
          className={styles.FormInput}
          onBlur={(e) => handleBlur('username', e.target.value)}
          aria-invalid={touched.username && !!errors.username}
        />
        {touched.username && errors.username && (
          <p className={styles.FormError}>{errors.username}</p>
        )}

        <label htmlFor="password" className={styles.FormLabel}>
          {t('register.password')}
        </label>
        <input
          type="password"
          placeholder={t('register.password')}
          name="password"
          id="password"
          className={styles.FormInput}
          onBlur={(e) => handleBlur('password', e.target.value)}
          aria-invalid={touched.password && !!errors.password}
        />
        {touched.password && errors.password && (
          <p className={styles.FormError}>{errors.password}</p>
        )}

        <label htmlFor="password-confirm" className={styles.FormLabel}>
          {t('register.passwordConfirm')}
        </label>
        <input
          type="password"
          placeholder={t('register.password')}
          name="password-confirm"
          id="password-confirm"
          className={styles.FormInput}
          onBlur={(e) => {
            const password = (
              e.target.form?.elements.namedItem('password') as HTMLInputElement
            )?.value
            handleBlur('passwordConfirm', e.target.value, password)
          }}
          aria-invalid={touched.passwordConfirm && !!errors.passwordConfirm}
        />
        {touched.passwordConfirm && errors.passwordConfirm && (
          <p className={styles.FormError}>{errors.passwordConfirm}</p>
        )}

        {status === 'error' && (
          <p
            style={{ color: '#ff6b6b', fontSize: '1.4rem', margin: '0.5rem 0' }}
          >
            {error}
          </p>
        )}
        {errors.submit && <p className={styles.FormError}>{errors.submit}</p>}

        <input
          type={'submit'}
          value={status === 'loading' ? '...' : t('register.submit')}
          disabled={status === 'loading'}
          className={styles.FormSubmit}
        />

        <Link href={'/login'} className={styles.Link}>
          <p>
            {t('register.hasAccount')}{' '}
            <span className={styles.Underline}>{t('register.login')}</span>
          </p>
        </Link>
      </form>
    </>
  )
}
