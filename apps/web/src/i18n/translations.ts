// Słownik tłumaczeń dla interfejsu ouija
// Użycie: const { t } = useTranslation()
//
// ── Jak dodać własne tłumaczenie ─────────────────────────────────────────────
//
// 1. Znajdź odpowiednią sekcję (lub dodaj nową komentarzem // ── Moja sekcja ──)
// 2. Dodaj klucz w obu językach: pl i en
//    Przykład:
//      pl: { 'moja.sekcja.klucz': 'Tekst po polsku' }
//      en: { 'moja.sekcja.klucz': 'Text in English' }
// 3. Użyj w komponencie:
//      const { t } = useTranslation()
//      <p>{t('moja.sekcja.klucz')}</p>
//
// ── Klucze ze zmiennymi ───────────────────────────────────────────────────────
// Jeśli potrzebujesz wstawić wartość dynamiczną, użyj funkcji tWith():
//   pl: { 'chat.unread': 'Nieprzeczytane: {count}' }
//   en: { 'chat.unread': 'Unread: {count}' }
//   Użycie: tWith('chat.unread', { count: 5 })  →  "Nieprzeczytane: 5"
// ─────────────────────────────────────────────────────────────────────────────

import { useSettings } from '@/context/SettingsContext'

export const translations = {
  pl: {
    // ── Header ──────────────────────────────────────────────────────────────
    'nav.login': 'login',
    'nav.register': 'register',
    'nav.chats': 'chats',
    'nav.logout': 'wyloguj',

    // ── Home ────────────────────────────────────────────────────────────────
    'home.title': 'witaj w ouija!',
    'home.subtitle':
      'dołącz lub stwórz społeczność, współpracuj w zespołach i ciesz się komfortem ouija!',

    // ── Login ────────────────────────────────────────────────────────────────
    'login.title': 'Zaloguj się',
    'login.username': 'Nazwa użytkownika',
    'login.password': 'Hasło',
    'login.submit': 'Zaloguj',
    'login.submitting': 'Logowanie...',
    'login.noAccount': 'Nie masz konta?',
    'login.register': 'Zarejestruj się',
    'login.forgotPassword': 'Zapomniałeś hasła?',
    'login.errorInvalid': 'Nieprawidłowa nazwa użytkownika lub hasło',
    'login.errorServer': 'Brak połączenia z serwerem',
    'login.errorUsernameRequired': 'Nazwa użytkownika jest wymagana',
    'login.errorUsernameShort':
      'Nazwa użytkownika musi mieć co najmniej 3 znaki',
    'login.errorPasswordRequired': 'Hasło jest wymagane',
    'login.errorPasswordShort': 'Hasło musi mieć co najmniej 8 znaków',

    // ── Register ─────────────────────────────────────────────────────────────
    'register.title': 'Zarejestruj się',
    'register.email': 'E-mail',
    'register.username': 'Nazwa użytkownika',
    'register.password': 'Hasło',
    'register.passwordConfirm': 'Powtórz hasło',
    'register.submit': 'Zarejestruj',
    'register.submitting': 'Tworzenie...',
    'register.hasAccount': 'Masz już konto?',
    'register.login': 'Zaloguj się',
    'register.successTitle': 'witaj!',
    'register.successVerifyTitle': 'sprawdź skrzynkę',
    'register.successReady':
      'Twoje konto jest gotowe. Możesz się teraz zalogować.',
    'register.successVerify':
      'Wysłaliśmy link weryfikacyjny na Twój adres e-mail. Kliknij go, aby aktywować konto.',
    'register.goToLogin': 'przejdź do',
    'register.goToLoginLink': 'logowania',
    'register.errorServer': 'Brak połączenia z serwerem',

    // ── Chaty ────────────────────────────────────────────────────────────────
    'chat.loading': 'Ładowanie...',
    'chat.loadingMessages': 'Ładowanie wiadomości...',
    'chat.loadingOlder': 'Ładowanie starszych...',
    'chat.noChat': 'Wybierz czat',
    'chat.searchPlaceholder': 'szukaj czatu lub osoby...',
    'chat.searchLoading': 'Szukam...',
    'chat.searchNoResults': 'Brak wyników',
    'chat.searchSectionChats': 'Czaty',
    'chat.searchSectionPeople': 'Nowe osoby',
    'chat.messagePlaceholder': 'wpisz wiadomość',
    'chat.sendBtn': 'wyślij',
    'chat.sending': '...',
    'chat.attachTitle': 'Dodaj plik',
    'chat.sentByMe': 'Ty',
    'chat.attachment': '📎 Załącznik',
    'chat.sentInvite': 'Wysłano',
    'chat.addFriend': 'Dodaj znajomego',
    'chat.writeMessage': 'Napisz wiadomość',
    'chat.errorUpload': 'Błąd uploadu pliku',
    'chat.errorSend': 'Błąd wysyłania',
    'chat.errorCreate': 'Błąd tworzenia czatu',
    'chat.errorInvite': 'Błąd wysyłania zaproszenia',

    // ── Status użytkownika ───────────────────────────────────────────────────
    'status.ONLINE': 'Aktywny',
    'status.AWAY': 'Zaraz wracam',
    'status.BUSY': 'Nie przeszkadzać',
    'status.OFFLINE': 'Offline',

    // ── Profil ───────────────────────────────────────────────────────────────
    'profile.settings': 'Ustawienia strony',
    'profile.appearance': 'Wygląd',
    'profile.theme': 'Motyw',
    'profile.themeDark': '🌙 Ciemny',
    'profile.themeLight': '☀️ Jasny',
    'profile.fontSize': 'Rozmiar czcionki',
    'profile.fontSmall': 'Mały',
    'profile.fontMedium': 'Średni',
    'profile.fontLarge': 'Duży',
    'profile.language': 'Język',
    'profile.langLabel': 'Język interfejsu',
    'profile.langPl': '🇵🇱 Polski',
    'profile.langEn': '🇬🇧 English',
    'profile.notifications': 'Powiadomienia',
    'profile.notifSound': 'Dźwięk',
    'profile.notifDesktop': 'Powiadomienia systemowe',
    'profile.account': 'Konto',
    'profile.logout': 'Wyloguj się',
    'profile.saved': 'Zapisano ✓',
    'profile.friends': 'Znajomi',
    'profile.noFriends': 'Brak znajomych',
    'profile.pendingInvites': 'Zaproszenia do znajomych',
    'profile.sentInvites': 'Wysłane zaproszenia',
    'profile.wantsToBeYourFriend': 'chce zostać Twoim znajomym',
    'profile.awaitingResponse': 'oczekuje na odpowiedź',
    'profile.accept': '✓ Akceptuj',
    'profile.reject': '✕ Odrzuć',
    'profile.cancel': '✕ Cofnij',
    'profile.message': 'Wiadomość',
    'profile.remove': 'Usuń',
    'profile.changePassword': 'Zmień hasło',
    'profile.cancelChange': 'Anuluj',
    'profile.savePassword': 'Zapisz',
    'profile.newPasswordPlaceholder': 'Nowe hasło (min. 8 znaków)',
    'profile.passwordChanged': 'Hasło zmienione pomyślnie!',
    'profile.changeAvatar': 'Zmień zdjęcie',

    // ── Wspólne ──────────────────────────────────────────────────────────────
    'common.loading': 'Ładowanie...',
    'common.error': 'Błąd wczytywania'
  },

  en: {
    // ── Header ──────────────────────────────────────────────────────────────
    'nav.login': 'login',
    'nav.register': 'register',
    'nav.chats': 'chats',
    'nav.logout': 'logout',

    // ── Home ────────────────────────────────────────────────────────────────
    'home.title': 'welcome to ouija!',
    'home.subtitle':
      'join or host a community, collaborate in teams and enjoy the comfort of ouija!',

    // ── Login ────────────────────────────────────────────────────────────────
    'login.title': 'Sign in',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in...',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Sign up',
    'login.forgotPassword': 'Forgot your password?',
    'login.errorInvalid': 'Invalid username or password',
    'login.errorServer': 'Cannot connect to server',
    'login.errorUsernameRequired': 'Username is required',
    'login.errorUsernameShort': 'Username must be at least 3 characters',
    'login.errorPasswordRequired': 'Password is required',
    'login.errorPasswordShort': 'Password must be at least 8 characters',

    // ── Register ─────────────────────────────────────────────────────────────
    'register.title': 'Create account',
    'register.email': 'E-mail',
    'register.username': 'Username',
    'register.password': 'Password',
    'register.passwordConfirm': 'Confirm password',
    'register.submit': 'Sign up',
    'register.submitting': 'Creating...',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Sign in',
    'register.successTitle': 'welcome!',
    'register.successVerifyTitle': 'check your inbox',
    'register.successReady': 'Your account is ready. You can now log in.',
    'register.successVerify':
      'We sent a verification link to your email address. Click it to activate your account.',
    'register.goToLogin': 'go to',
    'register.goToLoginLink': 'login',
    'register.errorServer': 'Cannot connect to server',

    // ── Chats ────────────────────────────────────────────────────────────────
    'chat.loading': 'Loading...',
    'chat.loadingMessages': 'Loading messages...',
    'chat.loadingOlder': 'Loading older...',
    'chat.noChat': 'Select a chat',
    'chat.searchPlaceholder': 'search chats or people...',
    'chat.searchLoading': 'Searching...',
    'chat.searchNoResults': 'No results',
    'chat.searchSectionChats': 'Chats',
    'chat.searchSectionPeople': 'New people',
    'chat.messagePlaceholder': 'type a message',
    'chat.sendBtn': 'send',
    'chat.sending': '...',
    'chat.attachTitle': 'Attach file',
    'chat.sentByMe': 'You',
    'chat.attachment': '📎 Attachment',
    'chat.sentInvite': 'Sent',
    'chat.addFriend': 'Add friend',
    'chat.writeMessage': 'Message',
    'chat.errorUpload': 'Upload failed',
    'chat.errorSend': 'Failed to send',
    'chat.errorCreate': 'Failed to create chat',
    'chat.errorInvite': 'Failed to send invite',

    // ── User status ──────────────────────────────────────────────────────────
    'status.ONLINE': 'Online',
    'status.AWAY': 'Away',
    'status.BUSY': 'Do not disturb',
    'status.OFFLINE': 'Offline',

    // ── Profile ──────────────────────────────────────────────────────────────
    'profile.settings': 'App settings',
    'profile.appearance': 'Appearance',
    'profile.theme': 'Theme',
    'profile.themeDark': '🌙 Dark',
    'profile.themeLight': '☀️ Light',
    'profile.fontSize': 'Font size',
    'profile.fontSmall': 'Small',
    'profile.fontMedium': 'Medium',
    'profile.fontLarge': 'Large',
    'profile.language': 'Language',
    'profile.langLabel': 'Interface language',
    'profile.langPl': '🇵🇱 Polish',
    'profile.langEn': '🇬🇧 English',
    'profile.notifications': 'Notifications',
    'profile.notifSound': 'Sound',
    'profile.notifDesktop': 'Desktop notifications',
    'profile.account': 'Account',
    'profile.logout': 'Log out',
    'profile.saved': 'Saved ✓',
    'profile.friends': 'Friends',
    'profile.noFriends': 'No friends yet',
    'profile.pendingInvites': 'Friend requests',
    'profile.sentInvites': 'Sent invites',
    'profile.wantsToBeYourFriend': 'wants to be your friend',
    'profile.awaitingResponse': 'awaiting response',
    'profile.accept': '✓ Accept',
    'profile.reject': '✕ Reject',
    'profile.cancel': '✕ Cancel',
    'profile.message': 'Message',
    'profile.remove': 'Remove',
    'profile.changePassword': 'Change password',
    'profile.cancelChange': 'Cancel',
    'profile.savePassword': 'Save',
    'profile.newPasswordPlaceholder': 'New password (min. 8 chars)',
    'profile.passwordChanged': 'Password changed successfully!',
    'profile.changeAvatar': 'Change photo',

    // ── Common ───────────────────────────────────────────────────────────────
    'common.loading': 'Loading...',
    'common.error': 'Failed to load'
  }
} as const

export type TranslationKey = keyof typeof translations.pl

export function useTranslation() {
  const { settings } = useSettings()
  const lang = settings.language

  function t(key: TranslationKey): string {
    return (
      (translations[lang] as Record<string, string>)[key] ??
      (translations.pl as Record<string, string>)[key] ??
      key
    )
  }

  // Wersja z podstawianiem zmiennych: tWith('chat.unread', { count: 5 })
  function tWith(
    key: TranslationKey,
    vars: Record<string, string | number>
  ): string {
    let text = t(key)
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v))
    }
    return text
  }

  return { t, tWith, lang }
}
