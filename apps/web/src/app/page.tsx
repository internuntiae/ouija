import Image from 'next/image'
import styles from './Home.module.scss'

export default function Home() {
  return (
    <>
      <Image
        src={'/ouija_white_logo.svg'}
        alt={'logo'}
        height={400}
        width={400}
        className={styles.containerLogo}
      ></Image>

      <h1 className={styles.containerTitle}>welcome to ouija!</h1>

      <p className={styles.containerText}>
        join or host a community, collaborate in teams and enjoy the comfort of
        ouija!
      </p>
    </>
  )
}
