import { useState, useEffect, useRef, useCallback } from 'react';
import { questions } from '../data/questions.js';
import './ExamScreen.css';

const SESSION_STORAGE_KEY = 'newton-athena-exam-session';
const EXAM_DURATION_SECONDS = 30 * 60; // 30 minutes = 1800 seconds

// ── Time & Session Helpers ──────────────────────────────────────────────────

function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

function getInitialExamSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.deadlineAt === 'number') {
        const msLeft = parsed.deadlineAt - Date.now();
        if (msLeft <= 0) {
          return {
            answers: parsed.answers || {},
            currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
            deadlineAt: parsed.deadlineAt,
            isExpired: true,
          };
        }
        return {
          answers: parsed.answers || {},
          currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
          deadlineAt: parsed.deadlineAt,
          isExpired: false,
        };
      }
    }
  } catch (err) {
    console.error('Failed to read session from sessionStorage:', err);
  }

  const newDeadline = Date.now() + EXAM_DURATION_SECONDS * 1000;
  return {
    answers: {},
    currentIndex: 0,
    deadlineAt: newDeadline,
    isExpired: false,
  };
}

// ── Component ──────────────────────────────────────────────────────────────

function ExamScreen({ onBackToSetup, onBackToInstructions }) {
  const devExit = onBackToSetup || onBackToInstructions;

  // Restore or initialize session state once on mount
  const [initialSession] = useState(getInitialExamSession);
  const deadlineAt = initialSession.deadlineAt;

  const [currentIndex, setCurrentIndex] = useState(initialSession.currentIndex);
  const [answers, setAnswers] = useState(initialSession.answers);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(initialSession.isExpired);
  const [submissionReason, setSubmissionReason] = useState(
    initialSession.isExpired ? 'timeout' : 'manual'
  );

  // Remaining time
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (initialSession.isExpired) return 0;
    return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
  });

  // ── Milestone 8: Fullscreen & Window Focus State ──────────────────────────
  const [isFullscreenActive, setIsFullscreenActive] = useState(
    typeof document !== 'undefined' ? !!document.fullscreenElement : false
  );
  const [isWindowFocused, setIsWindowFocused] = useState(
    typeof document !== 'undefined' ? document.hasFocus() : true
  );
  const [integrityEvents, setIntegrityEvents] = useState([]);

  // Refs for stable event listener callbacks without stale closures
  const wasFullscreenActiveRef = useRef(false);
  const isFullscreenActiveRef = useRef(false);
  const isWindowFocusedRef = useRef(true);
  const isSubmittedRef = useRef(isSubmitted);
  isSubmittedRef.current = isSubmitted;

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];
  const currentSelectedOption = answers[currentQuestion.id];

  // Calculated statistics
  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key] !== null && answers[key] !== undefined
  ).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Record an integrity event with real timestamp and unique ID
  const recordIntegrityEvent = useCallback((type, severity = 'warning') => {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      timestamp: new Date().toISOString(),
      severity,
    };
    setIntegrityEvents((prev) => [...prev, event]);
  }, []);

  // Single safe submission handler
  const submitExam = useCallback((reason = 'manual') => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setShowConfirmModal(false);
    setIsSubmitted(true);
    setSubmissionReason(reason);

    // Exit fullscreen cleanly if active
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}

    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (_) {}
  }, []);

  // ── Autosave Effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return;
    try {
      const payload = {
        version: 1,
        answers,
        currentIndex,
        deadlineAt,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to autosave session:', err);
    }
  }, [answers, currentIndex, deadlineAt, isSubmitted]);

  // ── Countdown Timer Effect ────────────────────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return;

    const tick = () => {
      const msLeft = deadlineAt - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setTimeRemaining(secondsLeft);

      if (secondsLeft <= 0) {
        submitExam('timeout');
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [deadlineAt, isSubmitted, submitExam]);

  // ── Fullscreen & Window Focus Listeners ────────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return;

    // Initial fullscreen request when examination starts
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Failure on initial mount (e.g. platform policy) is not counted as cheating
        });
      }
    } catch (_) {}

    const handleFullscreenChange = () => {
      if (isSubmittedRef.current) return;
      const isNowFullscreen = !!document.fullscreenElement;

      if (isNowFullscreen) {
        setIsFullscreenActive(true);
        isFullscreenActiveRef.current = true;

        if (wasFullscreenActiveRef.current) {
          // Restored after previously exiting
          recordIntegrityEvent('FULLSCREEN_RESTORED', 'info');
        } else {
          // Marked active for the first time
          wasFullscreenActiveRef.current = true;
        }
      } else {
        setIsFullscreenActive(false);
        isFullscreenActiveRef.current = false;

        // Only record exit event if fullscreen was previously active
        if (wasFullscreenActiveRef.current) {
          recordIntegrityEvent('FULLSCREEN_EXIT', 'warning');
        }
      }
    };

    const handleBlur = () => {
      if (isSubmittedRef.current) return;
      if (!isWindowFocusedRef.current) return; // Prevent duplicate blurs
      isWindowFocusedRef.current = false;
      setIsWindowFocused(false);
      recordIntegrityEvent('WINDOW_BLUR', 'warning');
    };

    const handleFocus = () => {
      if (isSubmittedRef.current) return;
      if (isWindowFocusedRef.current) return; // Prevent duplicate focuses
      isWindowFocusedRef.current = true;
      setIsWindowFocused(true);
      recordIntegrityEvent('WINDOW_FOCUS', 'info');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isSubmitted, recordIntegrityEvent]);

  // Request fullscreen again (user gesture)
  const handleRequestFullscreen = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (_) {}
  };

  // ── User Navigation & Interaction ─────────────────────────────────────────
  const handleSelectOption = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  const handleDevReset = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (_) {}
    if (devExit) {
      devExit();
    }
  };

  // ── Timer Urgency Styling ─────────────────────────────────────────────────
  let timerUrgencyClass = 'exam-timer--normal';
  let timerAriaUrgency = 'Normal';
  if (timeRemaining <= 60) {
    timerUrgencyClass = 'exam-timer--critical';
    timerAriaUrgency = 'Critical urgency, less than 1 minute remaining';
  } else if (timeRemaining <= 300) {
    timerUrgencyClass = 'exam-timer--warning';
    timerAriaUrgency = 'Warning urgency, less than 5 minutes remaining';
  }

  // Overall monitoring state
  const isEnvironmentOptimal = isFullscreenActive && isWindowFocused;

  // ── Submitted View ────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="exam-submitted-screen">
        <div className="exam-submitted-card">
          <header className="exam-submitted-header">
            <div className="exam-submitted-badge">
              <span className="exam-submitted-dot" />
              <span>Session Concluded</span>
            </div>
            <h1 className="exam-title">Newton Athena</h1>
            <h2 className="exam-submitted-title">Examination Submitted</h2>
            <p className="exam-submitted-lead">
              {submissionReason === 'timeout'
                ? 'Your examination was automatically submitted as the time limit expired.'
                : 'Your examination has been submitted successfully.'}
            </p>
          </header>

          <div className="exam-submitted-stats">
            <div className="exam-stat-box">
              <span className="exam-stat-label">Questions answered</span>
              <span className="exam-stat-value exam-stat-value--success">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            <div className="exam-stat-box">
              <span className="exam-stat-label">Questions unanswered</span>
              <span className="exam-stat-value exam-stat-value--muted">
                {unansweredCount} / {totalQuestions}
              </span>
            </div>
          </div>

          {/* Environment Integrity Summary */}
          <div className="exam-submitted-integrity-summary">
            <span className="exam-integrity-summary-label">
              Environment integrity events recorded:
            </span>
            <span className="exam-integrity-summary-count">
              {integrityEvents.length}
            </span>
          </div>

          <div className="exam-submitted-notice">
            <p>Your examination session has ended.</p>
          </div>

          {devExit && (
            <div className="exam-dev-reset">
              <button
                type="button"
                className="btn-secondary"
                id="exam-dev-reset-btn"
                onClick={handleDevReset}
              >
                Return to Setup (Development Prototype)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active Examination View ───────────────────────────────────────────────
  return (
    <div className="exam-container">
      {/* ── Top Bar ── */}
      <header className="exam-topbar">
        <div className="exam-brand">
          <h1 className="exam-brand-title">Newton Athena</h1>
          <span className="exam-brand-tag">Examination</span>
        </div>

        {/* ── Countdown Timer Display ── */}
        <div
          className={`exam-timer-card ${timerUrgencyClass}`}
          role="timer"
          aria-live="polite"
          aria-label={`Time Remaining: ${formatTime(timeRemaining)}. ${timerAriaUrgency}`}
        >
          <span className="exam-timer-icon" aria-hidden="true">⏱</span>
          <div className="exam-timer-meta">
            <span className="exam-timer-label">Time Remaining</span>
            <span className="exam-timer-digits" id="exam-timer-display">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* ── Monitoring Status Pills ── */}
        <div className="exam-monitoring-pills">
          <span
            className={`exam-pill-badge ${isEnvironmentOptimal ? 'pill--active' : 'pill--warning'}`}
            id="monitoring-status-pill"
          >
            Monitoring: {isEnvironmentOptimal ? 'Active' : 'Warning'}
          </span>
          <span
            className={`exam-pill-badge ${isFullscreenActive ? 'pill--active' : 'pill--warning'}`}
            id="fullscreen-status-pill"
          >
            Fullscreen: {isFullscreenActive ? 'Active' : 'Exited'}
          </span>
        </div>

        <div className="exam-topbar-meta">
          <span className="exam-counter-text" id="question-progress-label">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="exam-answered-badge" id="answered-count-badge">
            Answered: {answeredCount} / {totalQuestions}
          </span>
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div
        className="exam-progress-track"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin="1"
        aria-valuemax={totalQuestions}
        aria-label={`Progress: Question ${currentIndex + 1} of ${totalQuestions}`}
      >
        <div
          className="exam-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Non-intrusive Candidate Environment Warnings ── */}
      {(!isWindowFocused || !isFullscreenActive) && (
        <div className="exam-warning-container" role="alert" aria-live="assertive">
          {!isWindowFocused && (
            <div className="exam-warning-banner exam-warning-banner--blur" id="blur-warning-banner">
              <span className="warning-banner-icon" aria-hidden="true">⚠</span>
              <div className="warning-banner-body">
                <strong>Examination window is not focused</strong>
                <span>Return to the examination window to continue.</span>
              </div>
            </div>
          )}

          {!isFullscreenActive && (
            <div className="exam-warning-banner exam-warning-banner--fullscreen" id="fullscreen-warning-banner">
              <span className="warning-banner-icon" aria-hidden="true">⚠</span>
              <div className="warning-banner-body">
                <strong>Fullscreen mode has been exited</strong>
                <span>Return to fullscreen to maintain examination conditions.</span>
              </div>
              <button
                type="button"
                id="return-fullscreen-btn"
                className="btn-return-fullscreen"
                onClick={handleRequestFullscreen}
              >
                Return to Fullscreen
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Main Layout: Content + Palette ── */}
      <div className="exam-content-layout">
        {/* Left / Center: Question Panel */}
        <main className="exam-question-panel" aria-live="polite">
          <div className="exam-question-header">
            <span className="exam-question-num-tag">
              Question {currentIndex + 1}
            </span>
          </div>

          <h2 className="exam-question-text" id={`question-text-${currentQuestion.id}`}>
            {currentQuestion.question}
          </h2>

          {/* Multiple Choice Options */}
          <div
            className="exam-options-list"
            role="radiogroup"
            aria-labelledby={`question-text-${currentQuestion.id}`}
          >
            {currentQuestion.options.map((option, optIdx) => {
              const isSelected = currentSelectedOption === optIdx;
              const inputId = `q${currentQuestion.id}-opt${optIdx}`;

              return (
                <label
                  key={optIdx}
                  htmlFor={inputId}
                  className={`exam-option-card ${isSelected ? 'exam-option-card--selected' : ''}`}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name={`question-${currentQuestion.id}`}
                    value={optIdx}
                    checked={isSelected}
                    onChange={() => handleSelectOption(optIdx)}
                    className="exam-radio-input"
                  />
                  <span className="exam-option-marker">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="exam-option-text">{option}</span>
                </label>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <footer className="exam-question-actions">
            <button
              type="button"
              id="exam-prev-btn"
              className="btn-secondary"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button
                type="button"
                id="exam-submit-trigger-btn"
                className="btn-primary btn-submit-action"
                onClick={handleNext}
              >
                Submit Examination
              </button>
            ) : (
              <button
                type="button"
                id="exam-next-btn"
                className="btn-primary"
                onClick={handleNext}
              >
                Next
              </button>
            )}
          </footer>
        </main>

        {/* Right / Side: Question Palette */}
        <aside className="exam-palette-panel" aria-label="Question Navigator">
          <div className="exam-palette-header">
            <h3 className="exam-palette-title">Question Navigator</h3>
            <span className="exam-palette-summary">
              {answeredCount} / {totalQuestions} Answered
            </span>
          </div>

          <div className="exam-palette-grid">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered =
                answers[q.id] !== null && answers[q.id] !== undefined;

              let statusClass = 'palette-btn--unanswered';
              if (isAnswered) statusClass = 'palette-btn--answered';
              if (isCurrent) statusClass += ' palette-btn--current';

              const ariaLabel = `Question ${idx + 1}${
                isCurrent ? ', current question' : ''
              }${isAnswered ? ', answered' : ', unanswered'}`;

              return (
                <button
                  key={q.id}
                  type="button"
                  id={`palette-btn-${idx + 1}`}
                  className={`exam-palette-btn ${statusClass}`}
                  onClick={() => handleJumpToQuestion(idx)}
                  aria-label={ariaLabel}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="exam-palette-legend">
            <div className="legend-item">
              <span className="legend-dot legend-dot--current" />
              <span>Current</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot--answered" />
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot--unanswered" />
              <span>Unanswered</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Submission Confirmation Dialog (Manual Submit Only) ── */}
      {showConfirmModal && (
        <div
          className="exam-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-confirm-title"
        >
          <div className="exam-modal-card">
            <h3 id="modal-confirm-title" className="exam-modal-title">
              Submit Examination?
            </h3>
            <p className="exam-modal-lead">
              Are you sure you want to submit your examination?
            </p>

            <div className="exam-modal-stats">
              <div className="modal-stat">
                <span className="modal-stat-label">Answered</span>
                <span className="modal-stat-val modal-stat-val--success">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-label">Unanswered</span>
                <span className="modal-stat-val modal-stat-val--warn">
                  {unansweredCount} / {totalQuestions}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="exam-modal-warn">
                ⚠️ You have {unansweredCount} unanswered{' '}
                {unansweredCount === 1 ? 'question' : 'questions'}. Once
                submitted, your responses cannot be modified.
              </p>
            )}

            <div className="exam-modal-actions">
              <button
                type="button"
                id="modal-cancel-btn"
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-submit-confirm-btn"
                className="btn-primary btn-submit-action"
                onClick={() => submitExam('manual')}
              >
                Submit Examination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamScreen;
