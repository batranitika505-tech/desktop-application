import './SystemCheckItem.css';

const ICONS = {
  idle: null,
  checking: null,
  ready: '✓',
  denied: '✕',
  unavailable: '✕',
  'action-required': '✕',
};

const DEFAULT_LABELS = {
  idle: 'Not checked',
  checking: 'Checking...',
  ready: 'Ready',
  denied: 'Permission denied',
  unavailable: 'Unavailable',
  'action-required': 'Action required',
};

function SystemCheckItem({ id, label, state, badgeText, detail }) {
  const icon = ICONS[state];
  const text = badgeText ?? DEFAULT_LABELS[state] ?? state;

  return (
    <div className="sci" id={`check-${id}`}>
      <div className="sci-main">
        <div className="sci-info">
          <span className="sci-label">{label}</span>
          <span className="sci-sublabel">Status</span>
        </div>
        <span
          className={`sci-badge sci-badge--${state}`}
          aria-label={`${label} status: ${icon ? icon + ' ' : ''}${text}`}
        >
          {icon && <span className="sci-badge-icon" aria-hidden="true">{icon}</span>}
          <span>{text}</span>
        </span>
      </div>
      {detail && (
        <div className="sci-detail" id={`check-${id}-detail`}>
          {detail}
        </div>
      )}
    </div>
  );
}

export default SystemCheckItem;
