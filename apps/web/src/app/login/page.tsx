import styles from './Login.module.scss'

export default function Login() {
  return (
    <>
      <form method="POST" action={'/api/healthy'} className={styles.Form}>
        <label htmlFor={'username'} className={styles.FormLabel}>
          <input
            type={'text'}
            placeholder={'Login'}
            name="username"
            className={styles.FormInput}
          />
        </label>
        <label htmlFor={'password'} className={styles.FormLabel}>
          <input
            type={'text'}
            placeholder={'Password'}
            name="password"
            className={styles.FormInput}
          />
        </label>
        <input type={'submit'} value="Login" className={styles.FormSubmit} />
      </form>
    </>
  )
}
