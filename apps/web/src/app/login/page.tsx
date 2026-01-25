import styles from './Login.module.scss'
import Link from 'next/link'

export default function Login() {
  return (
    <>
      <form method="POST" action={'/api/healthy'} className={styles.Form}>
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
        <input type={'submit'} value="Login" className={styles.FormSubmit} />

        <Link href={'/register'} className={styles.Link}>
          <p>
            no account? <span className={styles.Underline}>click here</span>
          </p>
        </Link>

        <Link href={'/'} className={styles.Link}>
          <p>
            forgot password? <span className={styles.Underline}>reset</span>
          </p>
        </Link>
      </form>
    </>
  )
}
