import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [appInfo, setAppInfo] = useState(null);

  useEffect(() => {
    // Fetch app info from Electron via the preload bridge (if available)
    if (window.athena?.getAppInfo) {
      window.athena.getAppInfo().then(setAppInfo).catch(() => {});
    }
  }, []);

  return (
    <div className="landing">
      <div className="landing-content">
        <header className="landing-header">
          <h1 className="landing-title">Newton Athena</h1>
          <p className="landing-tagline">AI-Assisted Examination Integrity System</p>
        </header>

        <div className="landing-status">
          <div className="status-card">
            <span className="status-label">Status</span>
            <div className="status-row">
              <span className="status-dot" />
              <span className="status-message">
                Desktop environment initialized successfully.
              </span>
            </div>
          </div>
        </div>

        {appInfo && (
          <div className="landing-meta">
            <span>v{appInfo.version}</span>
            <span className="meta-sep">·</span>
            <span>Electron {appInfo.electron}</span>
            <span className="meta-sep">·</span>
            <span>{appInfo.platform}</span>
          </div>
        )}

        <button className="landing-continue" type="button">
          Continue
        </button>
      </div>
    </div>
  );
}

export default App;
