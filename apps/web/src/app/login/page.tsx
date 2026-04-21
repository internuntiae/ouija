'use client'

import styles from './Login.module.scss'
import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface FormErrors {
  username?: string
  password?: string
  submit?: string
}

function validateUsername(username: string): string | undefined {
  if (!username) return 'Nazwa użytkownika jest wymagana'
  if (username.length < 3)
    return 'Nazwa użytkownika musi mieć co najmniej 3 znaki'
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Hasło jest wymagane'
  if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków'
}

export default function Login() {
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  function handleBlur(field: string, value: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    let error: string | undefined

    if (field === 'username') error = validateUsername(value)
    if (field === 'password') error = validatePassword(value)

    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget

    const username = (
      form.elements.namedItem('username') as HTMLInputElement
    ).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement)
      .value

    const newErrors: FormErrors = {
      username: validateUsername(username),
      password: validatePassword(password)
    }

    setTouched({ username: true, password: true })
    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) return

    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:3001/api/?nickname=${encodeURIComponent(username)}`
      )

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          submit: 'Nieprawidłowa nazwa użytkownika lub hasło'
        }))
        return
      }

      const user = await res.json()

      if (!user) {
        setErrors((prev) => ({
          ...prev,
          submit: 'Nieprawidłowa nazwa użytkownika lub hasło'
        }))
        return
      }

      localStorage.setItem('userId', user.id)
      localStorage.setItem('userNickname', user.nickname)

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

        {errors.submit && <p className={styles.FormError}>{errors.submit}</p>}

        <input
          type="submit"
          value={loading ? 'logowanie...' : 'Login'}
          disabled={loading}
          className={styles.FormSubmit}
        />

        <Link href="/register" className={styles.Link}>
          <p>
            no account? <span className={styles.Underline}>click here</span>
          </p>
        </Link>

        <Link href="/" className={styles.Link}>
          <p>
            forgot password? <span className={styles.Underline}>reset</span>
          </p>
        </Link>
      </form>
    </>
  )
}
