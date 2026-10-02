const labels = { public: 'Public', limited: 'Members / signed-in access', private: 'Private / admin only' };
export default function VisibilityBadge({ visibility }) {
  return labels[visibility] ? <span className={`visibility-badge visibility-badge--${visibility}`}>{labels[visibility]}</span> : null;
}
