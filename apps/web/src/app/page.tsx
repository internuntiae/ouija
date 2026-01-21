import Image from 'next/image'
import styles from './Home.module.scss'

export default function Home() {
  return (
    <>
      <h1 className={styles.containerTitle}>Welcome to Ouija</h1>
      <Image
        src={'/zdjenciem'}
        alt={'logo'}
        height={400}
        width={400}
        className={styles.containerLogo}
      ></Image>
      <p>
        Dołącz już dziś do najlepszej społeczności chatowej, współpracuj w
        zespołach i ciesz się wygodą w pracy grupowej.
      </p>
    </>
  )
}
