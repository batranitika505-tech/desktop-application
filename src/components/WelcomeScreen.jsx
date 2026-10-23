import './WelcomeScreen.css';

function WelcomeScreen({ onBeginSetup }) {
  const checks = [
    'Camera availability',
    'Microphone availability',
    'Examination window readiness',
    'Required permissions',
  ];

  return (
    <div className="welcome">
      <div className="welcome-content">
        <header className="welcome-header">
          <h1 className="welcome-title">Newton Athena</h1>
          <p className="welcome-tagline">AI-Assisted Examination Integrity System</p>
        </header>

        <div className="welcome-body">
          <p className="welcome-intro">
            Welcome to your examination session.
          </p>
          <p className="welcome-description">
            Before the examination begins, Athena will verify your system and
            examination environment.
          </p>

          <div className="welcome-checklist">
            <span className="welcome-checklist-label">
              The setup process will check:
            </span>
            <ul className="welcome-checks">
              {checks.map((item) => (
                <li key={item} className="welcome-check-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={onBeginSetup}
          id="begin-setup-btn"
        >
          Begin Setup
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
