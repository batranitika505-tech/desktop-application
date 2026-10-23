import { useState } from 'react';
import MonitoringSession from './MonitoringSession.jsx';
import './MonitoringTestScreen.css';

function MonitoringTestScreen({ onBack, onContinue }) {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [sessionData, setSessionData] = useState({
    isMonitoring: true,
    cameraStatus: 'initializing',
    micStatus: 'initializing',
    error: null,
  });

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
  };

  // Determine overall status text based on active state and device states
  let overallStatusText = 'Initializing…';
  let overallStatusClass = 'mon-test-status--pending';

  if (!isMonitoring) {
    overallStatusText = 'Monitoring stopped';
    overallStatusClass = 'mon-test-status--stopped';
  } else if (sessionData.cameraStatus === 'active' && sessionData.micStatus === 'active') {
    overallStatusText = 'Monitoring active';
    overallStatusClass = 'mon-test-status--active';
  } else if (
    sessionData.cameraStatus === 'disconnected' ||
    sessionData.micStatus === 'disconnected'
  ) {
    overallStatusText = 'Monitoring interrupted';
    overallStatusClass = 'mon-test-status--warn';
  } else if (sessionData.cameraStatus === 'error' || sessionData.micStatus === 'error') {
    overallStatusText = 'Monitoring error';
    overallStatusClass = 'mon-test-status--error';
  }

  return (
    <div className="mon-test">
      <div className="mon-test-content">
        {/* ── Screen Header ── */}
        <header className="mon-test-header">
          <div className="mon-test-pill">Development Verification Screen</div>
          <h1 className="mon-test-title">Newton Athena</h1>
          <p className="mon-test-subtitle">Monitoring Session</p>
        </header>

        {/* ── Main Monitoring Area ── */}
        <main className="mon-test-main">
          <MonitoringSession
            isActive={isMonitoring}
            onStatusChange={setSessionData}
          />
        </main>

        {/* ── Overall Status Section ── */}
        <div className="mon-test-status-panel">
          <span className="mon-test-status-label">Monitoring session status:</span>
          <span className={`mon-test-status-value ${overallStatusClass}`}>
            {overallStatusText}
          </span>
        </div>

        {/* ── Actions ── */}
        <div className="mon-test-actions">
          {onBack && (
            <button
              className="btn-secondary"
              type="button"
              id="mon-back-btn"
              onClick={onBack}
            >
              Back to System Check
            </button>
          )}

          {isMonitoring ? (
            <button
              className="btn-secondary btn-danger-action"
              type="button"
              id="stop-monitoring-btn"
              onClick={handleStopMonitoring}
            >
              Stop Monitoring
            </button>
          ) : (
            <button
              className="btn-primary"
              type="button"
              id="resume-monitoring-btn"
              onClick={handleStartMonitoring}
            >
              Start Monitoring
            </button>
          )}

          {onContinue && (
            <button
              className="btn-primary"
              type="button"
              id="continue-instructions-btn"
              onClick={onContinue}
            >
              Continue to Instructions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonitoringTestScreen;
