import { useCallback, useEffect, useState } from 'react';

const KEY = 'kleinanzeigen:theme';

/** Dark is the default; the choice is remembered per device. */
export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem(KEY) !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = dark ? '#000' : '#f7f9fb';
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: useCallback(() => setDark((d) => !d), []) };
}
