'use client'

import Image from 'next/image'
import styles from './Header.module.scss'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
  const pathname: string = usePathname()
  const isAuth: boolean =
    pathname.startsWith('/login') || pathname.startsWith('/register')
  return (
    <header className={styles.Header}>
      <Image
        src={'/ouija_white.svg'}
        alt={'logo'}
        width={1275}
        height={690}
        className={styles.HeaderLogo}
        style={{
          width: 'auto',
          height: '8vh'
        }}
      ></Image>

      {!isAuth && (
        <div className={styles.HeaderRight}>
          <Link href={'/login'} className={styles.HeaderLink}>
            login
          </Link>
          <Link href={'/register'} className={styles.HeaderLink}>
            register
          </Link>
        </div>
      )}
    </header>
  )
}
