'use client'

import Image from 'next/image'
import styles from './Header.module.scss'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation } from '@/i18n/translations'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const { settings } = useSettings()
  const { t } = useTranslation()

  const isAuth =
    pathname.startsWith('/login') || pathname.startsWith('/register')
  const isLogin = pathname.startsWith('/login')
  const isRegister = pathname.startsWith('/register')

  // Wybór logo zależny od motywu:
  // ciemny motyw → biały/jasny obrazek (ouija_white.png)
  // jasny motyw  → ciemny obrazek     (ouija_dark.png)
  const logoSrc =
    settings.theme === 'light' ? '/ouija_dark.png' : '/ouija_white.png'

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userNickname = localStorage.getItem('userNickname')
    setLoggedIn(!!userId)
    setNickname(userNickname)
  }, [pathname])

  async function handleLogout() {
    const userId = localStorage.getItem('userId')
    if (userId) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      // Save the current status so we can restore it on next login
      const currentStatus = localStorage.getItem('userStatus')
      if (
        currentStatus &&
        currentStatus !== 'OFFLINE' &&
        currentStatus !== 'INVISIBLE'
      ) {
        localStorage.setItem('preLogoutStatus', currentStatus)
      }
      // Set status to OFFLINE before disconnecting so friends see the correct state
      try {
        await fetch(`${API_URL}/api/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'OFFLINE' })
        })
      } catch {
        /* best-effort */
      }
    }
    localStorage.removeItem('userId')
    localStorage.removeItem('userNickname')
    localStorage.removeItem('userStatus')
    setLoggedIn(false)
    setNickname(null)
    router.push('/')
  }

  return (
    <header className={styles.Header}>
      <Link href="/">
        <Image
          src={logoSrc}
          alt={'logo'}
          width={1275}
          height={690}
          className={styles.HeaderLogo}
          style={{ width: 'auto', height: '8vh' }}
          priority
        />
      </Link>

      {/* Strony auth — login/register */}
      {isAuth && (
        <div className={styles.HeaderRight}>
          <p
            className={
              isLogin
                ? styles.HeaderText
                : [styles.HeaderText, styles.Invisible].join(' ')
            }
          >
            {t('nav.login')}
          </p>
          <p
            className={
              isRegister
                ? styles.HeaderText
                : [styles.HeaderText, styles.Invisible].join(' ')
            }
          >
            {t('nav.register')}
          </p>
        </div>
      )}

      {/* Niezalogowany, nie na stronie auth */}
      {!isAuth && !loggedIn && (
        <div className={styles.HeaderRight}>
          <Link href="/login" className={styles.HeaderLink}>
            {t('nav.login')}
          </Link>
          <Link href="/register" className={styles.HeaderLink}>
            {t('nav.register')}
          </Link>
        </div>
      )}

      {/* Zalogowany */}
      {!isAuth && loggedIn && (
        <div className={styles.HeaderRight}>
          <Link href="/chats" className={styles.HeaderLink}>
            {t('nav.chats')}
          </Link>
          <Link href="/profile" className={styles.HeaderLink}>
            {nickname ?? 'profile'}
          </Link>
          <button className={styles.HeaderLogout} onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </div>
      )}
    </header>
  )
}
