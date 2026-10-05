import { useSession } from './AuthProvider';

const labels = { public: 'Public', limited: 'Members / signed-in access', private: 'Private / admin only' };
export default function VisibilityBadge({ visibility }) {
  const { isAdmin } = useSession();
  return isAdmin && labels[visibility] ? <span className={`visibility-badge visibility-badge--${visibility}`}>{labels[visibility]}</span> : null;
}
