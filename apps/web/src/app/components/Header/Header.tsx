'use client'

import Image from 'next/image'
import styles from './Header.module.scss'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)

  const isAuth =
    pathname.startsWith('/login') || pathname.startsWith('/register')
  const isLogin = pathname.startsWith('/login')
  const isRegister = pathname.startsWith('/register')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userNickname = localStorage.getItem('userNickname')
    setLoggedIn(!!userId)
    setNickname(userNickname)
  }, [pathname]) // odświeżaj przy zmianie strony

  function handleLogout() {
    localStorage.removeItem('userId')
    localStorage.removeItem('userNickname')
    setLoggedIn(false)
    setNickname(null)
    router.push('/')
  }

  return (
    <header className={styles.Header}>
      <Link href="/">
        <Image
          src={'/ouija_white.png'}
          alt={'logo'}
          width={1275}
          height={690}
          className={styles.HeaderLogo}
          style={{ width: 'auto', height: '8vh' }}
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
            login
          </p>
          <p
            className={
              isRegister
                ? styles.HeaderText
                : [styles.HeaderText, styles.Invisible].join(' ')
            }
          >
            register
          </p>
        </div>
      )}

      {/* Niezalogowany, nie na stronie auth */}
      {!isAuth && !loggedIn && (
        <div className={styles.HeaderRight}>
          <Link href="/login" className={styles.HeaderLink}>
            login
          </Link>
          <Link href="/register" className={styles.HeaderLink}>
            register
          </Link>
        </div>
      )}

      {/* Zalogowany */}
      {!isAuth && loggedIn && (
        <div className={styles.HeaderRight}>
          <Link href="/chats" className={styles.HeaderLink}>
            chats
          </Link>
          <Link href="/profile" className={styles.HeaderLink}>
            {nickname ?? 'profile'}
          </Link>
          <button className={styles.HeaderLogout} onClick={handleLogout}>
            logout
          </button>
        </div>
      )}
    </header>
  )
}
