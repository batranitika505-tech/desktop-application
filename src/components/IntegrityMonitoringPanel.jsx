/**
 * Newton Athena — IntegrityMonitoringPanel
 *
 * Pure presentational component that displays a compact, real-time overview
 * of examination integrity state.
 *
 * Strict Architectural Guarantees:
 * - ZERO calls to navigator.mediaDevices.getUserMedia()
 * - ZERO window / document event listeners (blur, focus, fullscreenchange, etc.)
 * - ZERO duplicate state engines or mutated data
 * - ZERO fake AI/cheating scores or accuracy percentages
 *
 * All data is passed down as props from ExamScreen.
 */

import { getChronologicalEvents } from '../integrity/integrityEventEngine.js';
import './IntegrityMonitoringPanel.css';

// ── Human-Readable Event Descriptions ───────────────────────────────────────

const EVENT_DESCRIPTIONS = {
  FULLSCREEN_EXIT: 'Candidate exited fullscreen mode',
  FULLSCREEN_RESTORED: 'Fullscreen mode restored',
  WINDOW_BLUR: 'Examination window lost focus',
  WINDOW_FOCUS: 'Examination window regained focus',
  CAMERA_DISCONNECTED: 'Camera connection was lost',
  MICROPHONE_DISCONNECTED: 'Microphone connection was lost',
  EVIDENCE_CAPTURED: 'Evidence snapshot captured',
};

const SEVERITY_LABELS = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatEventTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (_) {
    return '';
  }
}

// ── Component ───────────────────────────────────────────────────────────────

function IntegrityMonitoringPanel({
  cameraStatus = 'initializing',
  micStatus = 'initializing',
  isFullscreenActive = false,
  isWindowFocused = true,
  integrityCounts = { total: 0, warnings: 0, info: 0, critical: 0 },
  integrityEvents = [],
  evidenceCounts = { total: 0 },
  latestEvidence = null,
}) {
  // Use existing chronological helper from the integrity event engine,
  // then take the latest 5 events in reverse chronological order (newest first).
  // Non-mutating slice + reverse.
  const chronological = getChronologicalEvents(integrityEvents);
  const recentEvents = chronological.slice(-5).reverse();

  const isCameraActive = cameraStatus === 'active';
  const isMicActive = micStatus === 'active';

  return (
    <section
      className="imp"
      id="integrity-monitoring-panel"
      aria-label="Live Integrity Monitoring Panel"
    >
      <div className="imp-header">
        <h3 className="imp-title">Live Integrity Monitor</h3>
        <span className="imp-badge-live" aria-label="System status: live">
          <span className="imp-live-dot" aria-hidden="true" /> Live
        </span>
      </div>

      {/* ── Section 1: Device & Environment Status ── */}
      <div className="imp-section" aria-labelledby="imp-sec-env">
        <h4 className="imp-section-title" id="imp-sec-env">Environment Status</h4>

        <div className="imp-status-grid">
          {/* 1. Camera Status */}
          <div
            className="imp-status-row"
            id="imp-camera-status"
            aria-label={`Camera: ${isCameraActive ? 'Active' : 'Disconnected'}`}
          >
            <span className="imp-status-label">Camera</span>
            <span
              className={`imp-status-badge ${
                isCameraActive ? 'imp-badge--active' : 'imp-badge--warn'
              }`}
            >
              {isCameraActive ? '● Active' : '⚠ Disconnected'}
            </span>
          </div>

          {/* 2. Microphone Status */}
          <div
            className="imp-status-row"
            id="imp-mic-status"
            aria-label={`Microphone: ${isMicActive ? 'Active' : 'Disconnected'}`}
          >
            <span className="imp-status-label">Microphone</span>
            <span
              className={`imp-status-badge ${
                isMicActive ? 'imp-badge--active' : 'imp-badge--warn'
              }`}
            >
              {isMicActive ? '● Active' : '⚠ Disconnected'}
            </span>
          </div>

          {/* 3. Fullscreen Status */}
          <div
            className="imp-status-row"
            id="imp-fullscreen-status"
            aria-label={`Fullscreen: ${isFullscreenActive ? 'Active' : 'Exited'}`}
          >
            <span className="imp-status-label">Fullscreen</span>
            <span
              className={`imp-status-badge ${
                isFullscreenActive ? 'imp-badge--active' : 'imp-badge--warn'
              }`}
            >
              {isFullscreenActive ? '● Active' : '⚠ Exited'}
            </span>
          </div>

          {/* 4. Window Focus Status */}
          <div
            className="imp-status-row"
            id="imp-focus-status"
            aria-label={`Window Focus: ${isWindowFocused ? 'Focused' : 'Unfocused'}`}
          >
            <span className="imp-status-label">Window Focus</span>
            <span
              className={`imp-status-badge ${
                isWindowFocused ? 'imp-badge--active' : 'imp-badge--warn'
              }`}
            >
              {isWindowFocused ? '● Focused' : '⚠ Unfocused'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Integrity Summary ── */}
      <div className="imp-section" aria-labelledby="imp-sec-summary">
        <h4 className="imp-section-title" id="imp-sec-summary">Integrity Summary</h4>

        <div className="imp-summary-grid">
          <div className="imp-summary-item" id="imp-total-events">
            <span className="imp-summary-value">{integrityCounts.total ?? 0}</span>
            <span className="imp-summary-label">Total Events</span>
          </div>
          <div className="imp-summary-item imp-summary-item--warning" id="imp-warning-events">
            <span className="imp-summary-value">{integrityCounts.warnings ?? 0}</span>
            <span className="imp-summary-label">Warnings</span>
          </div>
          <div className="imp-summary-item imp-summary-item--info" id="imp-info-events">
            <span className="imp-summary-value">{integrityCounts.info ?? 0}</span>
            <span className="imp-summary-label">Info</span>
          </div>
          <div className="imp-summary-item imp-summary-item--critical" id="imp-critical-events">
            <span className="imp-summary-value">{integrityCounts.critical ?? 0}</span>
            <span className="imp-summary-label">Critical</span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Evidence Summary ── */}
      <div className="imp-section" aria-labelledby="imp-sec-evidence">
        <h4 className="imp-section-title" id="imp-sec-evidence">Evidence Summary</h4>

        <div className="imp-evidence-stats">
          <div className="imp-evidence-row">
            <span className="imp-evidence-label">Evidence Captured</span>
            <span className="imp-evidence-value" id="imp-evidence-total">
              {evidenceCounts.total ?? 0}
            </span>
          </div>
          <div className="imp-evidence-row">
            <span className="imp-evidence-label">Latest Evidence</span>
            <span className="imp-evidence-value imp-evidence-value--time" id="imp-evidence-latest">
              {latestEvidence
                ? formatEventTime(latestEvidence.timestamp)
                : 'No evidence captured yet'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 4: Recent Integrity Events Timeline ── */}
      <div className="imp-section" aria-labelledby="imp-sec-recent">
        <h4 className="imp-section-title" id="imp-sec-recent">Recent Integrity Events</h4>

        {recentEvents.length === 0 ? (
          <p className="imp-no-events" id="imp-no-events-text">
            No integrity events recorded yet.
          </p>
        ) : (
          <ul className="imp-event-list" id="imp-event-list" aria-label="Recent integrity events">
            {recentEvents.map((event) => (
              <li
                key={event.id}
                className={`imp-event-item imp-event-item--${event.severity}`}
                tabIndex={0}
                aria-label={`${event.type.replace(/_/g, ' ')}, ${SEVERITY_LABELS[event.severity] || event.severity}, at ${formatEventTime(event.timestamp)}`}
              >
                <div className="imp-event-top">
                  <span className={`imp-event-type-tag imp-event-type--${event.severity}`}>
                    {event.type}
                  </span>
                  <time className="imp-event-time" dateTime={event.timestamp}>
                    {formatEventTime(event.timestamp)}
                  </time>
                </div>
                <div className="imp-event-bottom">
                  <span className={`imp-severity-dot imp-severity-dot--${event.severity}`} aria-hidden="true" />
                  <span className="imp-event-desc">
                    {EVENT_DESCRIPTIONS[event.type] || event.type}
                  </span>
                  <span className={`imp-severity-label imp-severity-label--${event.severity}`}>
                    {SEVERITY_LABELS[event.severity] || event.severity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default IntegrityMonitoringPanel;
