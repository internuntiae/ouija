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
        src={'../../../../public/next.svg'}
        alt={'logo'}
        width={100}
        height={100}
        className={styles.HeaderLogo}
      ></Image>

      {!isAuth && (
        <>
          <Link href={'/login'} className={styles.HeaderLink}>
            Login
          </Link>
          <Link href={'/register'} className={styles.HeaderLink}>
            Register
          </Link>
        </>
      )}
    </header>
  )
}
