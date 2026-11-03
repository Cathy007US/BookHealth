import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Lang = 'zh' | 'en';

// Translation dictionary type
type Dict = Record<string, string>;

// Import translation files
import { zh } from './zh';
import { en } from './en';
import { dataZh } from './dataZh';

const DICTS: Record<Lang, Dict> = { zh, en };

interface I18nContextValue {
  lang: Lang;
  t: (key: string, fallback?: string) => string;
  td: (value: string | undefined | null) => string;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'zh' ? 'en' : 'zh'));
  }, []);

  const t = useCallback((key: string, fallback?: string) => {
    const dict = DICTS[lang];
    return dict[key] ?? fallback ?? key;
  }, [lang]);

  // Translate database values: when zh, map known English values to Chinese;
  // when en, return as-is
  const td = useCallback((value: string | undefined | null) => {
    if (!value) return '';
    if (lang === 'zh') {
      return dataZh[value] ?? value;
    }
    return value;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, t, td, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
