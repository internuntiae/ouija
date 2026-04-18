'use client'

import styles from './Register.module.scss'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Register() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

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

    if (password !== passwordConfirm) {
      setError('Hasła nie są identyczne')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname: username })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error ?? 'Błąd rejestracji')
      }

      router.push('/chats')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd rejestracji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.Form}>
        <label htmlFor={'email'} className={styles.FormLabel}>
          e-mail
        </label>

        <input
          type={'text'}
          placeholder={'e-mail'}
          name="email"
          id="email"
          required
          className={styles.FormInput}
        />

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
          type={'text'}
          placeholder={'password'}
          name="password"
          id="password"
          required
          className={styles.FormInput}
        />

        <label htmlFor={'password-confirm'} className={styles.FormLabel}>
          repeat password
        </label>

        <input
          type={'text'}
          placeholder={'password'}
          name="password-confirm"
          id="password-confirm"
          required
          className={styles.FormInput}
        />

        {error && <p className={styles.FormError}>{error}</p>}

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
