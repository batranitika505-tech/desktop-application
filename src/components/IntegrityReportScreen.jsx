/**
 * Newton Athena — IntegrityReportScreen (Milestone 13)
 *
 * Dedicated post-examination report presenting factual, unvarnished telemetry
 * collected during the examination session:
 * - Examination progress and completion summary
 * - Factual review status (no AI guessing, no cheat probability percentages)
 * - Monitoring environment status (camera, mic, fullscreen, focus)
 * - Breakdown of integrity events by category
 * - Evidence capture telemetry and interactive thumbnail gallery with lightbox
 * - Chronological integrity events timeline
 *
 * Strict Architectural Guarantees:
 * - ZERO calls to navigator.mediaDevices.getUserMedia()
 * - ZERO window / document event listeners (blur, focus, fullscreenchange)
 * - ZERO state mutation or backend network calls
 * - Completely read-only presentational component
 */

import { useState } from 'react';
import {
  getEventCounts,
  getChronologicalEvents,
  EVENT_TYPES,
} from '../integrity/integrityEventEngine.js';
import { getEvidenceCounts } from '../evidence/evidenceCapture.js';
import './IntegrityReportScreen.css';

// ── Human-Readable Dictionaries ─────────────────────────────────────────────

const EVENT_DESCRIPTIONS = {
  FULLSCREEN_EXIT: 'Candidate exited fullscreen mode.',
  FULLSCREEN_RESTORED: 'Fullscreen mode was restored.',
  WINDOW_BLUR: 'Examination window lost focus.',
  WINDOW_FOCUS: 'Examination window regained focus.',
  CAMERA_DISCONNECTED: 'Camera hardware connection was interrupted.',
  MICROPHONE_DISCONNECTED: 'Microphone hardware connection was interrupted.',
  EVIDENCE_CAPTURED: 'Evidence frame snapshot was recorded.',
};

const EVENT_FRIENDLY_NAMES = {
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  FULLSCREEN_RESTORED: 'Fullscreen Restored',
  WINDOW_BLUR: 'Window Focus Lost',
  WINDOW_FOCUS: 'Window Focus Regained',
  CAMERA_DISCONNECTED: 'Camera Disconnected',
  MICROPHONE_DISCONNECTED: 'Microphone Disconnected',
  EVIDENCE_CAPTURED: 'Evidence Captured',
};

const SEVERITY_BADGE_LABELS = {
  info: 'Informational',
  warning: 'Warning',
  critical: 'Critical',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(isoString) {
  if (!isoString) return 'Not recorded';
  try {
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (_) {
    return isoString;
  }
}

function formatTimeOnly(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (_) {
    return '';
  }
}

function formatDuration(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

// ── Component ───────────────────────────────────────────────────────────────

function IntegrityReportScreen({
  answers = {},
  questions = [],
  integrityEvents = [],
  evidenceList = [],
  sessionStartTime,
  submissionTime,
  submissionReason = 'manual',
  cameraStatus = 'active',
  micStatus = 'active',
  onBackToSummary,
}) {
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // 1. Examination Metrics
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key] !== null && answers[key] !== undefined
  ).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const completionPercent = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  // Duration calculation
  let elapsedSeconds = 0;
  if (sessionStartTime && submissionTime) {
    const startMs = new Date(sessionStartTime).getTime();
    const endMs = new Date(submissionTime).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
      elapsedSeconds = Math.round((endMs - startMs) / 1000);
    }
  }

  // 2. Integrity Telemetry Helpers
  const eventCounts = getEventCounts(integrityEvents);
  const chronologicalEvents = getChronologicalEvents(integrityEvents);

  // Count specific event types from actual data
  const fullscreenExits = integrityEvents.filter(
    (e) => e.type === EVENT_TYPES.FULLSCREEN_EXIT
  ).length;
  const fullscreenRestorations = integrityEvents.filter(
    (e) => e.type === EVENT_TYPES.FULLSCREEN_RESTORED
  ).length;
  const focusLosses = integrityEvents.filter(
    (e) => e.type === EVENT_TYPES.WINDOW_BLUR
  ).length;
  const focusRestorations = integrityEvents.filter(
    (e) => e.type === EVENT_TYPES.WINDOW_FOCUS
  ).length;

  // 3. Evidence Telemetry Helpers
  const evidenceCounts = getEvidenceCounts(evidenceList);
  const latestEvidenceItem = evidenceList.length > 0
    ? evidenceList[evidenceList.length - 1]
    : null;

  // 4. Overall Review Status (Factual derivation, zero AI score)
  let reviewStatusTitle = 'No Integrity Events Recorded';
  let reviewStatusDesc =
    'No fullscreen or focus integrity events were recorded during the examination session.';
  let reviewStatusTheme = 'optimal';

  if (eventCounts.critical > 0) {
    reviewStatusTitle = 'Review Recommended';
    reviewStatusDesc =
      'Critical integrity events were recorded during the examination and should be reviewed.';
    reviewStatusTheme = 'critical';
  } else if (eventCounts.warnings > 0) {
    reviewStatusTitle = 'Integrity Events Recorded';
    reviewStatusDesc =
      'One or more monitoring events were recorded during the examination and may require proctor review.';
    reviewStatusTheme = 'warning';
  }

  // Lookup map for linked events
  const eventMap = new Map();
  integrityEvents.forEach((evt) => {
    if (evt.id) eventMap.set(evt.id, evt);
  });

  return (
    <div className="rep-container" id="integrity-report-screen">
      {/* ── Top Action Bar ── */}
      <nav className="rep-nav" aria-label="Report Navigation">
        <button
          type="button"
          id="btn-report-back-top"
          className="btn-secondary rep-back-btn"
          onClick={onBackToSummary}
        >
          ← Back to Submission Summary
        </button>
        <span className="rep-session-tag">Read-Only Final Record</span>
      </nav>

      {/* ── Main Report Card ── */}
      <main className="rep-card">
        {/* ── 1. Report Header ── */}
        <header className="rep-header">
          <div className="rep-header-top">
            <div className="rep-badge-group">
              <span className="rep-brand-badge">Newton Athena</span>
              <span className="rep-status-badge">
                <span className="rep-status-dot" aria-hidden="true" />
                Exam Completed
              </span>
            </div>
            <time className="rep-timestamp" dateTime={submissionTime}>
              Submitted: {formatDateTime(submissionTime)}
            </time>
          </div>

          <h1 className="rep-title">Examination Integrity Report</h1>
          <p className="rep-subtitle">
            Newton Athena — Examination Monitoring Summary
          </p>

          <div className="rep-meta-strip">
            <span className="rep-meta-pill">
              <strong>{totalQuestions}</strong> Total Questions
            </span>
            <span className="rep-meta-pill rep-meta-pill--success">
              <strong>{answeredCount}</strong> Answered
            </span>
            <span className="rep-meta-pill rep-meta-pill--muted">
              <strong>{unansweredCount}</strong> Unanswered
            </span>
            <span className="rep-meta-pill">
              Reason: <strong>{submissionReason === 'timeout' ? 'Time Limit' : 'Manual'}</strong>
            </span>
          </div>
        </header>

        {/* ── 2. Overall Review Status ── */}
        <section
          className={`rep-review-banner rep-review-banner--${reviewStatusTheme}`}
          aria-labelledby="rep-review-title"
        >
          <div className="rep-review-icon" aria-hidden="true">
            {reviewStatusTheme === 'optimal' ? '✓' : reviewStatusTheme === 'critical' ? '⚠' : 'ℹ'}
          </div>
          <div className="rep-review-content">
            <h2 id="rep-review-title" className="rep-review-title">
              {reviewStatusTitle}
            </h2>
            <p className="rep-review-desc">{reviewStatusDesc}</p>
          </div>
          <span className="rep-review-disclaimer">
            Factual monitoring summary · Human review recommended
          </span>
        </section>

        {/* ── 3. Examination Summary Grid ── */}
        <section className="rep-section" aria-labelledby="sec-exam-summary">
          <h2 id="sec-exam-summary" className="rep-section-title">
            Examination Summary
          </h2>

          <div className="rep-grid-4">
            <div className="rep-metric-card" id="rep-stat-questions">
              <span className="rep-metric-label">Total Questions</span>
              <span className="rep-metric-value">{totalQuestions}</span>
              <span className="rep-metric-sub">Multiple-choice format</span>
            </div>

            <div className="rep-metric-card" id="rep-stat-answered">
              <span className="rep-metric-label">Answered</span>
              <span className="rep-metric-value rep-val--success">{answeredCount}</span>
              <span className="rep-metric-sub">{totalQuestions > 0 ? `${completionPercent}% answered` : ''}</span>
            </div>

            <div className="rep-metric-card" id="rep-stat-unanswered">
              <span className="rep-metric-label">Unanswered</span>
              <span className="rep-metric-value rep-val--muted">{unansweredCount}</span>
              <span className="rep-metric-sub">{unansweredCount === 0 ? 'All attempted' : 'Incomplete items'}</span>
            </div>

            <div className="rep-metric-card" id="rep-stat-duration">
              <span className="rep-metric-label">Elapsed Duration</span>
              <span className="rep-metric-value rep-val--info">
                {elapsedSeconds > 0 ? formatDuration(elapsedSeconds) : 'N/A'}
              </span>
              <span className="rep-metric-sub">30-minute allocation</span>
            </div>
          </div>
        </section>

        {/* ── 4. Monitoring Environment Summary ── */}
        <section className="rep-section" aria-labelledby="sec-monitoring-summary">
          <h2 id="sec-monitoring-summary" className="rep-section-title">
            Environment & Device Monitoring
          </h2>

          <div className="rep-grid-2">
            {/* Device Feeds */}
            <div className="rep-detail-card" id="rep-devices-card">
              <h3 className="rep-card-title">Media Devices</h3>
              <div className="rep-device-rows">
                <div className="rep-device-row">
                  <span className="rep-device-name">Camera Stream</span>
                  <span
                    className={`rep-badge ${
                      cameraStatus === 'active' ? 'rep-badge--success' : 'rep-badge--warn'
                    }`}
                  >
                    {cameraStatus === 'active' ? '● Active At Submission' : '⚠ Interrupted'}
                  </span>
                </div>
                <div className="rep-device-row">
                  <span className="rep-device-name">Microphone Stream</span>
                  <span
                    className={`rep-badge ${
                      micStatus === 'active' ? 'rep-badge--success' : 'rep-badge--warn'
                    }`}
                  >
                    {micStatus === 'active' ? '● Active At Submission' : '⚠ Interrupted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Window & Fullscreen State */}
            <div className="rep-detail-card" id="rep-environment-card">
              <h3 className="rep-card-title">Display & Focus Integrity</h3>
              <div className="rep-env-rows">
                <div className="rep-device-row">
                  <span className="rep-device-name">Fullscreen Exits</span>
                  <span className="rep-device-stat">
                    {fullscreenExits === 0 ? (
                      <span className="rep-badge rep-badge--success">0 — Maintained</span>
                    ) : (
                      <span className="rep-badge rep-badge--warn">{fullscreenExits} detected</span>
                    )}
                  </span>
                </div>
                <div className="rep-device-row">
                  <span className="rep-device-name">Window Focus Losses</span>
                  <span className="rep-device-stat">
                    {focusLosses === 0 ? (
                      <span className="rep-badge rep-badge--success">0 — Focused</span>
                    ) : (
                      <span className="rep-badge rep-badge--warn">{focusLosses} detected</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Integrity Event Breakdown ── */}
        <section className="rep-section" aria-labelledby="sec-event-breakdown">
          <h2 id="sec-event-breakdown" className="rep-section-title">
            Integrity Event Breakdown
          </h2>

          <div className="rep-grid-4">
            <div className="rep-summary-box" id="rep-events-total">
              <span className="rep-summary-box-label">Total Events</span>
              <span className="rep-summary-box-val">{eventCounts.total}</span>
            </div>
            <div className="rep-summary-box rep-summary-box--warn" id="rep-events-warnings">
              <span className="rep-summary-box-label">Warnings</span>
              <span className="rep-summary-box-val">{eventCounts.warnings}</span>
            </div>
            <div className="rep-summary-box rep-summary-box--info" id="rep-events-info">
              <span className="rep-summary-box-label">Informational</span>
              <span className="rep-summary-box-val">{eventCounts.info}</span>
            </div>
            <div className="rep-summary-box rep-summary-box--critical" id="rep-events-critical">
              <span className="rep-summary-box-label">Critical</span>
              <span className="rep-summary-box-val">{eventCounts.critical}</span>
            </div>
          </div>

          <div className="rep-event-tally-table">
            <div className="rep-tally-row">
              <span className="rep-tally-label">Fullscreen Mode Exited</span>
              <span className="rep-tally-count" id="tally-fullscreen-exit">{fullscreenExits}</span>
            </div>
            <div className="rep-tally-row">
              <span className="rep-tally-label">Fullscreen Mode Restored</span>
              <span className="rep-tally-count" id="tally-fullscreen-restored">{fullscreenRestorations}</span>
            </div>
            <div className="rep-tally-row">
              <span className="rep-tally-label">Window Lost Focus (Blur)</span>
              <span className="rep-tally-count" id="tally-focus-loss">{focusLosses}</span>
            </div>
            <div className="rep-tally-row">
              <span className="rep-tally-label">Window Focus Regained</span>
              <span className="rep-tally-count" id="tally-focus-restored">{focusRestorations}</span>
            </div>
          </div>
        </section>

        {/* ── 6. Evidence Summary & Gallery ── */}
        <section className="rep-section" aria-labelledby="sec-evidence">
          <div className="rep-section-header">
            <h2 id="sec-evidence" className="rep-section-title">
              Camera Evidence Gallery
            </h2>
            <span className="rep-section-count">
              {evidenceCounts.total} snapshot{evidenceCounts.total === 1 ? '' : 's'} recorded
            </span>
          </div>

          <div className="rep-grid-3 rep-evidence-summary-strip">
            <div className="rep-evidence-stat-card">
              <span className="rep-evidence-stat-label">Total Snapshots</span>
              <span className="rep-evidence-stat-val" id="rep-evidence-total-count">
                {evidenceCounts.total}
              </span>
            </div>
            <div className="rep-evidence-stat-card">
              <span className="rep-evidence-stat-label">Periodic Monitoring</span>
              <span className="rep-evidence-stat-val" id="rep-evidence-periodic-count">
                {evidenceCounts.periodic}
              </span>
            </div>
            <div className="rep-evidence-stat-card">
              <span className="rep-evidence-stat-label">Integrity Triggered</span>
              <span className="rep-evidence-stat-val" id="rep-evidence-integrity-count">
                {evidenceCounts.integrity}
              </span>
            </div>
          </div>

          {/* Evidence Grid */}
          {evidenceList.length === 0 ? (
            <div className="rep-empty-state" id="rep-no-evidence-box">
              <p>No camera evidence snapshots were recorded during this examination session.</p>
            </div>
          ) : (
            <div className="rep-gallery-grid" id="rep-evidence-gallery" role="region" aria-label="Evidence snapshots gallery">
              {evidenceList.map((item, index) => {
                const linkedEvent = item.eventId ? eventMap.get(item.eventId) : null;
                const isIntegrity = item.trigger === 'INTEGRITY_EVENT';

                return (
                  <article
                    key={item.id || index}
                    className="rep-evidence-card"
                    tabIndex={0}
                    role="button"
                    aria-label={`Evidence snapshot ${index + 1} at ${formatTimeOnly(item.timestamp)}. Click to inspect.`}
                    onClick={() => setSelectedEvidence(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedEvidence(item);
                      }
                    }}
                  >
                    <div className="rep-thumb-container">
                      <img
                        src={item.imageData}
                        alt={`Evidence snapshot ${index + 1} captured at ${formatTimeOnly(item.timestamp)}`}
                        className="rep-thumb-img"
                        loading="lazy"
                      />
                      <span
                        className={`rep-thumb-tag ${
                          isIntegrity ? 'rep-thumb-tag--warn' : 'rep-thumb-tag--periodic'
                        }`}
                      >
                        {isIntegrity ? 'Integrity Trigger' : 'Periodic'}
                      </span>
                    </div>

                    <div className="rep-evidence-meta">
                      <div className="rep-evidence-time">
                        <span className="rep-time-icon" aria-hidden="true">⏱</span>
                        <time dateTime={item.timestamp}>{formatTimeOnly(item.timestamp)}</time>
                      </div>

                      <div className="rep-evidence-trigger">
                        {linkedEvent ? (
                          <span className="rep-linked-event">
                            Triggered by: <strong>{EVENT_FRIENDLY_NAMES[linkedEvent.type] || linkedEvent.type}</strong>
                          </span>
                        ) : (
                          <span className="rep-trigger-label">
                            {isIntegrity ? 'Integrity event snapshot' : 'Periodic interval snapshot'}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 7. Chronological Integrity Timeline ── */}
        <section className="rep-section" aria-labelledby="sec-timeline">
          <div className="rep-section-header">
            <h2 id="sec-timeline" className="rep-section-title">
              Chronological Integrity Timeline
            </h2>
            <span className="rep-section-count">
              {chronologicalEvents.length} event{chronologicalEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          {chronologicalEvents.length === 0 ? (
            <div className="rep-empty-state" id="rep-no-events-box">
              <p>No integrity events recorded during this examination session.</p>
            </div>
          ) : (
            <ol className="rep-timeline-list" id="rep-integrity-timeline" aria-label="Chronological integrity timeline">
              {chronologicalEvents.map((evt, idx) => (
                <li
                  key={evt.id || idx}
                  className={`rep-timeline-item rep-timeline-item--${evt.severity}`}
                  tabIndex={0}
                >
                  <div className="rep-timeline-time-col">
                    <time className="rep-timeline-time" dateTime={evt.timestamp}>
                      {formatTimeOnly(evt.timestamp)}
                    </time>
                    <span className="rep-timeline-subtime">
                      {new Date(evt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="rep-timeline-indicator" aria-hidden="true">
                    <span className={`rep-timeline-node rep-timeline-node--${evt.severity}`} />
                    {idx < chronologicalEvents.length - 1 && <span className="rep-timeline-stem" />}
                  </div>

                  <div className="rep-timeline-body">
                    <div className="rep-timeline-header">
                      <span className="rep-timeline-title">
                        {EVENT_FRIENDLY_NAMES[evt.type] || evt.type}
                      </span>
                      <span
                        className={`rep-severity-pill rep-severity-pill--${evt.severity}`}
                      >
                        {SEVERITY_BADGE_LABELS[evt.severity] || evt.severity}
                      </span>
                    </div>

                    <p className="rep-timeline-desc">
                      {EVENT_DESCRIPTIONS[evt.type] || evt.type}
                    </p>

                    <div className="rep-timeline-id-tag">
                      Event ID: <code>{evt.id}</code>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── Bottom Actions ── */}
        <footer className="rep-footer">
          <button
            type="button"
            id="btn-report-back-bottom"
            className="btn-primary rep-footer-btn"
            onClick={onBackToSummary}
          >
            ← Back to Submission Summary
          </button>
        </footer>
      </main>

      {/* ── Lightbox / Modal for Evidence Inspection ── */}
      {selectedEvidence && (
        <div
          className="rep-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            className="rep-lightbox-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rep-lightbox-header">
              <h3 id="lightbox-title" className="rep-lightbox-title">
                Evidence Frame Inspection
              </h3>
              <button
                type="button"
                id="btn-lightbox-close"
                className="btn-secondary rep-lightbox-close"
                onClick={() => setSelectedEvidence(null)}
                aria-label="Close evidence preview"
              >
                ✕ Close
              </button>
            </div>

            <div className="rep-lightbox-image-wrap">
              <img
                src={selectedEvidence.imageData}
                alt="Selected full-resolution camera snapshot"
                className="rep-lightbox-img"
              />
            </div>

            <div className="rep-lightbox-details">
              <div className="rep-lightbox-field">
                <span className="rep-field-label">Snapshot ID:</span>
                <span className="rep-field-val"><code>{selectedEvidence.id}</code></span>
              </div>
              <div className="rep-lightbox-field">
                <span className="rep-field-label">Timestamp:</span>
                <span className="rep-field-val">{formatDateTime(selectedEvidence.timestamp)}</span>
              </div>
              <div className="rep-lightbox-field">
                <span className="rep-field-label">Trigger:</span>
                <span className="rep-field-val">
                  {selectedEvidence.trigger === 'INTEGRITY_EVENT'
                    ? 'Integrity-Triggered Snapshot'
                    : 'Periodic Snapshot (30s interval)'}
                </span>
              </div>
              {selectedEvidence.eventId && (
                <div className="rep-lightbox-field">
                  <span className="rep-field-label">Linked Event ID:</span>
                  <span className="rep-field-val"><code>{selectedEvidence.eventId}</code></span>
                </div>
              )}
              {selectedEvidence.dimensions && (
                <div className="rep-lightbox-field">
                  <span className="rep-field-label">Frame Dimensions:</span>
                  <span className="rep-field-val">
                    {selectedEvidence.dimensions.width} × {selectedEvidence.dimensions.height} px
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrityReportScreen;
