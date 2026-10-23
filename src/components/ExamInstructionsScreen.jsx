import { useState } from 'react';
import './ExamInstructionsScreen.css';

// ── Exam Configuration Constants ───────────────────────────────────────────

const EXAM_OVERVIEW = [
  { label: 'Exam Duration', value: '30 minutes' },
  { label: 'Questions', value: '10 questions' },
  { label: 'Question Type', value: 'Multiple Choice' },
  { label: 'Monitoring', value: 'Camera + Microphone' },
  { label: 'Examination Mode', value: 'Desktop Application' },
];

const EXAM_RULES = [
  'Remain inside the Newton Athena examination application during the examination.',
  'Keep your camera enabled throughout the examination.',
  'Keep your microphone enabled throughout the examination.',
  'Do not intentionally disconnect or disable the camera or microphone.',
  'Do not use external assistance during the examination.',
  'Do not intentionally interfere with the examination environment.',
  'Complete and submit the examination before leaving the application.',
];

function ExamInstructionsScreen({ onBack, onStartExam }) {
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasAgreed && onStartExam) {
      onStartExam();
    }
  };

  return (
    <div className="instr">
      <div className="instr-container">
        {/* ── Screen Header ── */}
        <header className="instr-header">
          <div className="instr-pill">Pre-Examination Step</div>
          <h1 className="instr-title">Newton Athena</h1>
          <h2 className="instr-subtitle">Pre-Examination Instructions</h2>
          <p className="instr-description">
            Please review the examination rules before continuing.
          </p>
        </header>

        {/* ── Scrollable Content Area ── */}
        <div className="instr-scrollable">
          {/* 1. Examination Overview */}
          <section className="instr-section" aria-labelledby="overview-heading">
            <h3 id="overview-heading" className="instr-section-title">
              Examination Overview
            </h3>
            <div className="instr-overview-grid">
              {EXAM_OVERVIEW.map((item) => (
                <div key={item.label} className="instr-overview-card">
                  <span className="instr-overview-label">{item.label}</span>
                  <span className="instr-overview-val">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Monitoring Notice */}
          <section className="instr-section" aria-labelledby="monitoring-heading">
            <h3 id="monitoring-heading" className="instr-section-title">
              Examination Monitoring
            </h3>
            <p className="instr-text">
              During the examination, Newton Athena may monitor the examination environment using:
            </p>

            <div className="instr-mon-blocks">
              <div className="instr-mon-block">
                <h4 className="instr-mon-subtitle">Active Monitoring</h4>
                <ul className="instr-list instr-list--active">
                  <li>
                    <span className="instr-check-icon" aria-hidden="true">✓</span>
                    Camera connection
                  </li>
                  <li>
                    <span className="instr-check-icon" aria-hidden="true">✓</span>
                    Microphone connection
                  </li>
                </ul>
              </div>

              <div className="instr-mon-block">
                <h4 className="instr-mon-subtitle">Examination Controls</h4>
                <ul className="instr-list instr-list--controls">
                  <li>The examination will run inside the Athena desktop application.</li>
                  <li>Additional examination controls may be enforced during the session.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Examination Rules */}
          <section className="instr-section" aria-labelledby="rules-heading">
            <h3 id="rules-heading" className="instr-section-title">
              Examination Rules
            </h3>
            <ol className="instr-rules-list">
              {EXAM_RULES.map((rule, idx) => (
                <li key={idx} className="instr-rule-item">
                  <span className="instr-rule-num">{idx + 1}</span>
                  <span className="instr-rule-text">{rule}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 4. Integrity Notice */}
          <section className="instr-integrity-panel" role="note" aria-label="Integrity Notice">
            <div className="instr-integrity-header">
              <span className="instr-integrity-icon" aria-hidden="true">ℹ</span>
              <h4 className="instr-integrity-title">Examination Integrity Notice</h4>
            </div>
            <p className="instr-integrity-text">
              Newton Athena records examination integrity events during the examination.
              Events such as monitoring interruptions may be included in the final
              examination integrity report.
            </p>
          </section>
        </div>

        {/* ── Agreement & Action Footer ── */}
        <footer className="instr-footer">
          <div className="instr-agreement">
            <input
              type="checkbox"
              id="rules-agreement-checkbox"
              className="instr-checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
            />
            <label htmlFor="rules-agreement-checkbox" className="instr-checkbox-label">
              I have read and understood the examination instructions and agree to follow the examination rules.
            </label>
          </div>

          <div className="instr-actions">
            {onBack && (
              <button
                type="button"
                id="instr-back-btn"
                className="btn-secondary"
                onClick={onBack}
              >
                Back
              </button>
            )}

            <button
              type="button"
              id="start-exam-btn"
              className="btn-primary"
              disabled={!hasAgreed}
              aria-disabled={!hasAgreed}
              onClick={handleSubmit}
            >
              Start Examination
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ExamInstructionsScreen;
