export function setCookie(name: string, value: string, days: number) {
  let expires;
  if (days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    expires = '; expires=' + date;
  } else {
    expires = '';
  }
  if (typeof document !== 'undefined') {
    document.cookie = name + '=' + value + expires + '; path=/';
  }
}

export function getCookie(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return '';
}

export function getCookieFromString(name: string, cookies: string): string {
  const nameEQ = name + '=';
  const ca = cookies.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return '';
}
