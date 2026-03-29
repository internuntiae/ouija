import styles from './Profile.module.scss'
import Image from 'next/image'

export default function Profile() {
  return (
    <>
      <div className={`${styles.Section} ${styles.First}`}>
        <Image
          className={styles.SectionProfilePicture}
          src={'/ouija_white.png'}
          alt={'profile_picture'}
          width={200}
          height={200}
        ></Image>

        <h2 className={styles.SectionHeading}>Jan Kowalski</h2>
        <p className={styles.SectionText}>Email: jan@gmail.com</p>
        <p className={styles.SectionText}>
          Hasło: <a>Zmień hasło</a>
        </p>
      </div>

      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>Znajomi</h2>
        <div className={styles.SectionFriend}>
          <Image
            className={styles.SectionFriendAvatar}
            src={'/ouija_white.png'}
            alt={'profile_picture'}
            width={100}
            height={100}
          ></Image>
          <h3 className={styles.SectionFriendName}>Jan Kowalski</h3>
          <button className={styles.SectionFriendMessageButton}>
            Wyślij wiadomość
          </button>
          <button className={styles.SectionFriendDeleteButton}>
            Usuń znajomego
          </button>
        </div>

        <div className={styles.SectionFriend}>
          <Image
            className={styles.SectionFriendAvatar}
            src={'/ouija_white.png'}
            alt={'profile_picture'}
            width={100}
            height={100}
          ></Image>
          <h3 className={styles.SectionFriendName}>Jan Kowalski</h3>
          <button className={styles.SectionFriendMessageButton}>
            Wyślij wiadomość
          </button>
          <button className={styles.SectionFriendDeleteButton}>
            Usuń znajomego
          </button>
        </div>

        <div className={styles.SectionFriend}>
          <Image
            className={styles.SectionFriendAvatar}
            src={'/ouija_white.png'}
            alt={'profile_picture'}
            width={100}
            height={100}
          ></Image>
          <h3 className={styles.SectionFriendName}>Jan Kowalski</h3>
          <button className={styles.SectionFriendMessageButton}>
            Wyślij wiadomość
          </button>
          <button className={styles.SectionFriendDeleteButton}>
            Usuń znajomego
          </button>
        </div>
      </div>

      <div className={styles.Section}>
        <h2 className={styles.SectionHeading}>Ustawienia strony</h2>
      </div>
    </>
  )
}
