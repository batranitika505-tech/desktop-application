import './SystemCheckItem.css';

const ICONS = {
  idle: null,
  pending: null,
  checking: null,
  ready: '✓',
  denied: '✕',
  unavailable: '✕',
  'action-required': '✕',
};

const DEFAULT_LABELS = {
  idle: 'Not checked',
  pending: 'Pending',
  checking: 'Checking...',
  ready: 'Ready',
  denied: 'Action required',
  unavailable: 'Action required',
  'action-required': 'Action required',
};

function SystemCheckItem({ id, label, state, badgeText, detail, description, action }) {
  const icon = ICONS[state];
  const text = badgeText ?? DEFAULT_LABELS[state] ?? state;

  return (
    <div className={`sci sci--${state}`} id={`check-${id}`}>
      <div className="sci-main">
        <div className="sci-info">
          <span className="sci-label">{label}</span>
          <span className="sci-sublabel">Status</span>
        </div>
        <span
          className={`sci-badge sci-badge--${state}`}
          id={`check-${id}-badge`}
          aria-label={`${label} status: ${icon ? icon + ' ' : ''}${text}`}
        >
          {icon && <span className="sci-badge-icon" aria-hidden="true">{icon}</span>}
          <span>{text}</span>
        </span>
      </div>
      {description && (
        <p className="sci-description" id={`check-${id}-desc`}>
          {description}
        </p>
      )}
      {detail && (
        <div className="sci-detail" id={`check-${id}-detail`} role="alert">
          {detail}
        </div>
      )}
      {action && (
        <div className="sci-action-row">
          {action}
        </div>
      )}
    </div>
  );
}

export default SystemCheckItem;

