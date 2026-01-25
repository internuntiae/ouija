import styles from './Register.module.scss'

export default function Register() {
  return (
    <>
      <form method="POST" action={'/api/healthy'} className={styles.Form}>
        <label htmlFor={'email'} className={styles.FormLabel}>
          e-mail
        </label>

        <input
          type={'text'}
          placeholder={'e-mail'}
          name="email"
          className={styles.FormInput}
        />

        <label htmlFor={'username'} className={styles.FormLabel}>
          username
        </label>

        <input
          type={'text'}
          placeholder={'username'}
          name="username"
          className={styles.FormInput}
        />

        <label htmlFor={'password'} className={styles.FormLabel}>
          password
        </label>

        <input
          type={'text'}
          placeholder={'password'}
          name="password"
          className={styles.FormInput}
        />

        <label htmlFor={'password-confirm'} className={styles.FormLabel}>
          repeat password
        </label>

        <input
          type={'text'}
          placeholder={'password'}
          name="password-confirm"
          className={styles.FormInput}
        />

        <input type={'submit'} value="create" className={styles.FormSubmit} />
      </form>
    </>
  )
}
