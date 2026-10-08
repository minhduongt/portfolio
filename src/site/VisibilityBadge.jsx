import { useLanguage } from '../i18n/LanguageProvider';
import { useSession } from './AuthProvider';

const labels = { public: 'Public', limited: 'Members', private: 'Private' };
export default function VisibilityBadge({ visibility, showMembers = false }) {
  const { t } = useLanguage();
  const { isAdmin } = useSession();
  return (isAdmin || (showMembers && visibility === 'limited')) && labels[visibility] ? <span className={`visibility-badge visibility-badge--${visibility}`}>{t(labels[visibility])}</span> : null;
}
