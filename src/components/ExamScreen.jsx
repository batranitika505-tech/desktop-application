import './ExamScreen.css';

function ExamScreen({ onBackToInstructions }) {
  return (
    <div className="exam-screen">
      <div className="exam-placeholder-card">
        <header className="exam-header">
          <div className="exam-pill">Milestone 5 Development Placeholder</div>
          <h1 className="exam-title">Newton Athena</h1>
          <h2 className="exam-subtitle">Examination</h2>
        </header>

        <main className="exam-body">
          <div className="exam-status-badge">
            <span className="exam-status-dot" />
            <span>Environment Initialized</span>
          </div>

          <p className="exam-lead-text">
            Your examination environment is ready.
          </p>

          <p className="exam-note-text">
            Exam engine will be initialized in the next milestone.
          </p>
        </main>

        {onBackToInstructions && (
          <footer className="exam-footer">
            <button
              type="button"
              id="exam-return-btn"
              className="btn-secondary"
              onClick={onBackToInstructions}
            >
              Return to Instructions
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

export default ExamScreen;
