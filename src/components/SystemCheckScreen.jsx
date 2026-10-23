import './SystemCheckScreen.css';

const checks = [
  {
    id: 'camera',
    label: 'Camera',
    status: 'Not checked',
    state: 'pending',
  },
  {
    id: 'microphone',
    label: 'Microphone',
    status: 'Not checked',
    state: 'pending',
  },
  {
    id: 'exam-window',
    label: 'Examination Window',
    status: 'Ready',
    state: 'ready',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    status: 'Not checked',
    state: 'pending',
  },
];

function SystemCheckScreen({ onBack }) {
  return (
    <div className="syscheck">
      <div className="syscheck-content">
        <header className="syscheck-header">
          <h1 className="syscheck-title">System Readiness Check</h1>
          <p className="syscheck-description">
            Before starting your examination, Athena needs to verify that your
            examination environment is ready.
          </p>
        </header>

        <div className="syscheck-list">
          {checks.map((check) => (
            <div key={check.id} className="syscheck-item" id={`check-${check.id}`}>
              <div className="syscheck-item-info">
                <span className="syscheck-item-label">{check.label}</span>
                <span className="syscheck-item-sublabel">Status</span>
              </div>
              <span className={`syscheck-item-status syscheck-item-status--${check.state}`}>
                {check.status}
              </span>
            </div>
          ))}
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={onBack}
          id="back-btn"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default SystemCheckScreen;
