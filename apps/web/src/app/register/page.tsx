'use client'

import styles from './Register.module.scss'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget

    const email = (
      form.elements.namedItem('email') as HTMLInputElement
    ).value.trim()
    const username = (
      form.elements.namedItem('username') as HTMLInputElement
    ).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement)
      .value
    const passwordConfirm = (
      form.elements.namedItem('password-confirm') as HTMLInputElement
    ).value

    // Walidacja wszystkich pól przed submittem
    const newErrors: FormErrors = {
      email: validateEmail(email),
      username: validateUsername(username),
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirm(password, passwordConfirm)
    }

    setTouched({
      email: true,
      username: true,
      password: true,
      passwordConfirm: true
    })
    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) return

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname: username })
      })

      if (!res.ok) {
        const data = await res.json()
        // Obsługa błędów z backendu (np. "user already exists")
        const msg: string = data?.error ?? 'Błąd rejestracji'
        if (msg.includes('already exists') || msg.includes('już istnieje')) {
          setErrors((prev) => ({
            ...prev,
            email: 'Konto z tym e-mailem już istnieje'
          }))
        } else {
          setErrors((prev) => ({ ...prev, submit: msg }))
        }
        return
      }

      router.push('/chats')
    } catch {
      setErrors((prev) => ({ ...prev, submit: 'Brak połączenia z serwerem' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.Form} noValidate>
        <label htmlFor="email" className={styles.FormLabel}>
          e-mail
        </label>
        <input
          type="email"
          placeholder="e-mail"
          name="email"
          id="email"
          className={styles.FormInput}
          onBlur={(e) => handleBlur('email', e.target.value)}
          aria-invalid={touched.email && !!errors.email}
        />
        {touched.email && errors.email && (
          <p className={styles.FormError}>{errors.email}</p>
        )}

        <label htmlFor="username" className={styles.FormLabel}>
          username
        </label>
        <input
          type="text"
          placeholder="username"
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
          password
        </label>
        <input
          type="password"
          placeholder="password"
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
          repeat password
        </label>
        <input
          type="password"
          placeholder="password"
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

        {errors.submit && <p className={styles.FormError}>{errors.submit}</p>}

        <input
          type="submit"
          value={loading ? 'tworzenie...' : 'create'}
          disabled={loading}
          className={styles.FormSubmit}
        />
      </form>
    </>
  )
}
