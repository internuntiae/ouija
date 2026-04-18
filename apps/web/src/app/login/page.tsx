'use client'

import styles from './Login.module.scss'
import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const username = (
      form.elements.namedItem('username') as HTMLInputElement
    ).value.trim()

    try {
      // GET /api/?nickname=username
      const res = await fetch(
        `http://localhost:3001/api/?nickname=${encodeURIComponent(username)}`
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error ?? 'Nie znaleziono użytkownika')
      }

      const user = await res.json()

      // Tymczasowe przechowywanie sesji — zastąp JWT gdy będzie gotowe
      localStorage.setItem('userId', user.id)
      localStorage.setItem('userNickname', user.nickname)

      router.push('/chats')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.Form}>
        <label htmlFor={'username'} className={styles.FormLabel}>
          username
        </label>
        <input
          type={'text'}
          placeholder={'username'}
          name="username"
          id="username"
          required
          className={styles.FormInput}
        />
        <label htmlFor={'password'} className={styles.FormLabel}>
          password
        </label>
        <input
          type={'password'}
          placeholder={'password'}
          name="password"
          id="password"
          required
          className={styles.FormInput}
        />

        {error && <p className={styles.FormError}>{error}</p>}

        <input
          type="submit"
          value={loading ? 'logowanie...' : 'Login'}
          disabled={loading}
          className={styles.FormSubmit}
        />

        <Link href={'/register'} className={styles.Link}>
          <p>
            no account? <span className={styles.Underline}>click here</span>
          </p>
        </Link>

        <Link href={'/'} className={styles.Link}>
          <p>
            forgot password? <span className={styles.Underline}>reset</span>
          </p>
        </Link>
      </form>
    </>
  )
}
