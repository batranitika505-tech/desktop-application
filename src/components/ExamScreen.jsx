import { useState } from 'react';
import { questions } from '../data/questions.js';
import './ExamScreen.css';

function ExamScreen({ onBackToSetup, onBackToInstructions }) {
  const devExit = onBackToSetup || onBackToInstructions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const currentSelectedOption = answers[currentQuestion.id];

  // Calculated statistics
  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key] !== null && answers[key] !== undefined
  ).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Handlers
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

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setIsSubmitted(true);
  };

  // ── Submitted Confirmation Screen ─────────────────────────────────────────
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
              Your examination has been submitted successfully.
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

          <div className="exam-submitted-notice">
            <p>Your examination session has ended.</p>
          </div>

          {devExit && (
            <div className="exam-dev-reset">
              <button
                type="button"
                className="btn-secondary"
                id="exam-dev-reset-btn"
                onClick={devExit}
              >
                Return to Setup (Development Prototype)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active Examination Screen ─────────────────────────────────────────────
  return (
    <div className="exam-container">
      {/* ── Top Bar ── */}
      <header className="exam-topbar">
        <div className="exam-brand">
          <h1 className="exam-brand-title">Newton Athena</h1>
          <span className="exam-brand-tag">Examination</span>
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

      {/* ── Submission Confirmation Dialog ── */}
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
                onClick={handleConfirmSubmit}
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
