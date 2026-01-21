// import Image from 'next/image'
import styles from './Home.module.scss'

/*
<Image
  src={'/zdjenciem'}
  alt={'logo'}
  height={400}
  width={400}
  className={styles.containerLogo}
></Image>
 */

export default function Home() {
  return (
    <>
      <h1 className={styles.containerTitle}>Welcome to Ouija!</h1>

      <p className={styles.containerText}>
        Join the best community, collaborate in teams and enjoy the comfort of
        this app.
      </p>
    </>
  )
}
