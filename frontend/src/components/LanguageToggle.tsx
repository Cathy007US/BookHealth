import { useI18n } from '../i18n';

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, toggleLang } = useI18n();
  return (
    <button
      onClick={toggleLang}
      className={`px-2 py-1 text-xs rounded-md border border-white/30 ${className}`}
      style={{ minWidth: '28px' }}
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  );
}
