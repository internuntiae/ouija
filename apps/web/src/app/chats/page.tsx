import styles from './Chats.module.scss'
import Image from 'next/image'

export default function Chats() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.Contacts}>
          <div className={styles.ContactsChatPreview}>
            <Image
              className={styles.ContactsChatPreviewProfilePicture}
              src={'/ouija_white.svg'}
              alt={'profile_picture'}
              height={30}
              width={30}
            ></Image>
            <div className={styles.ContactsChatPreviewMessageContainer}>
              <h4 className={styles.ContactsChatPreviewMessageContainerName}>
                Jan Kowalski
              </h4>
              <p className={styles.ContactsChatPreviewMessageContainerMessage}>
                Ty: Ej stary pomóż w projekcie
              </p>
            </div>
          </div>
          <div className={styles.ContactsChatPreview}>
            <Image
              className={styles.ContactsChatPreviewProfilePicture}
              src={'/ouija_white.svg'}
              alt={'profile_picture'}
              height={30}
              width={30}
            ></Image>
            <div className={styles.ContactsChatPreviewMessageContainer}>
              <h4 className={styles.ContactsChatPreviewMessageContainerName}>
                Jan Kowalski
              </h4>
              <p className={styles.ContactsChatPreviewMessageContainerMessage}>
                Ty: Ej stary pomóż w projekcie
              </p>
            </div>
          </div>
          <div className={styles.ContactsChatPreview}>
            <Image
              className={styles.ContactsChatPreviewProfilePicture}
              src={'/ouija_white.svg'}
              alt={'profile_picture'}
              height={30}
              width={30}
            ></Image>
            <div className={styles.ContactsChatPreviewMessageContainer}>
              <h4 className={styles.ContactsChatPreviewMessageContainerName}>
                Jan Kowalski
              </h4>
              <p className={styles.ContactsChatPreviewMessageContainerMessage}>
                Ty: Ej stary pomóż w projekcie
              </p>
            </div>
          </div>
        </div>

        <div className={styles.Chat}>
          <div className={styles.ChatContactInfo}>
            <h2>Jan Kowalski</h2>
            <h5>Aktywny</h5>
          </div>
          <div className={styles.ChatMessageContainer}>
            <div className={styles.ChatMessageContainerYourMessage}>
              <p>No co tam mordko </p>
            </div>
            <div className={styles.ChatMessageContainerContactMessage}>
              <p>A dobrze </p>
            </div>
            <div className={styles.ChatMessageContainerYourMessage}>
              <p>A to spoko </p>
            </div>
            <div className={styles.ChatMessageContainerYourMessage}>
              <p>Ale możesz pomóc z projektem </p>
            </div>
          </div>
          <div className={styles.ChatMessageToolbar}>
            <form>
              <input
                type={'text'}
                placeholder={'wpisz wiadomość'}
                className={styles.ChatMessageToolbarInput}
              />
              <input
                type={'submit'}
                value={'wyślij'}
                className={styles.ChatMessageToolbarSubmit}
              />
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
