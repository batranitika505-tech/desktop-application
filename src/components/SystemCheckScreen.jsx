import { useState, useCallback } from 'react';
import SystemCheckItem from './SystemCheckItem.jsx';
import './SystemCheckScreen.css';

// ── Error handling helpers ──────────────────────────────────────────────────

function friendlyCameraError(err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return {
      state: 'denied',
      badgeText: 'Permission denied',
      detail: 'Camera permission was denied.',
    };
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return {
      state: 'unavailable',
      badgeText: 'Camera unavailable',
      detail: 'No camera device was found.',
    };
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return {
      state: 'unavailable',
      badgeText: 'Camera unavailable',
      detail: 'Camera is currently unavailable.',
    };
  }
  if (err.name === 'SecurityError') {
    return {
      state: 'denied',
      badgeText: 'Permission denied',
      detail: 'Camera access was blocked by security policy.',
    };
  }
  return {
    state: 'unavailable',
    badgeText: 'Camera unavailable',
    detail: 'Camera is currently unavailable.',
  };
}

function friendlyMicError(err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return {
      state: 'denied',
      badgeText: 'Permission denied',
      detail: 'Microphone permission was denied.',
    };
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return {
      state: 'unavailable',
      badgeText: 'Microphone unavailable',
      detail: 'No microphone device was found.',
    };
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return {
      state: 'unavailable',
      badgeText: 'Microphone unavailable',
      detail: 'Microphone is currently unavailable.',
    };
  }
  if (err.name === 'SecurityError') {
    return {
      state: 'denied',
      badgeText: 'Permission denied',
      detail: 'Microphone access was blocked by security policy.',
    };
  }
  return {
    state: 'unavailable',
    badgeText: 'Microphone unavailable',
    detail: 'Microphone is currently unavailable.',
  };
}

// ── Initial states & derivation ─────────────────────────────────────────────

const IDLE = { state: 'idle', badgeText: 'Not checked', detail: null };
const WINDOW_READY = { state: 'ready', badgeText: 'Ready', detail: null };

function derivePermissions(camera, mic) {
  if (camera.state === 'idle' && mic.state === 'idle') {
    return { state: 'idle', badgeText: 'Not checked', detail: null };
  }
  if (camera.state === 'checking' || mic.state === 'checking') {
    return { state: 'checking', badgeText: 'Checking...', detail: null };
  }
  if (camera.state === 'ready' && mic.state === 'ready') {
    return { state: 'ready', badgeText: 'Ready', detail: null };
  }
  return {
    state: 'action-required',
    badgeText: 'Action required',
    detail: 'Camera and microphone access must be granted.',
  };
}

function deriveOverall(camera, mic, examWindow, permissions) {
  if (camera.state === 'idle' && mic.state === 'idle') return 'idle';
  if (camera.state === 'checking' || mic.state === 'checking') return 'checking';
  if (
    camera.state === 'ready' &&
    mic.state === 'ready' &&
    examWindow.state === 'ready' &&
    permissions.state === 'ready'
  ) {
    return 'ready';
  }
  return 'failed';
}

// ── Component ──────────────────────────────────────────────────────────────

function SystemCheckScreen({ onBack, onContinue }) {
  const [camera, setCamera] = useState(IDLE);
  const [mic, setMic] = useState(IDLE);
  const [isRunning, setIsRunning] = useState(false);

  // Derived states
  const permissions = derivePermissions(camera, mic);
  const examWindow = WINDOW_READY;
  const overallStatus = deriveOverall(camera, mic, examWindow, permissions);
  const allReady = overallStatus === 'ready';

  // ── Check execution ───────────────────────────────────────────────────────

  const runChecks = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Transition devices to checking
    setCamera({ state: 'checking', badgeText: 'Checking...', detail: null });
    setMic({ state: 'checking', badgeText: 'Checking...', detail: null });

    // 1. Camera check
    let cameraResult;
    let cameraStream = null;
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevicesUnsupported');
      }
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraResult = { state: 'ready', badgeText: 'Ready', detail: null };
    } catch (err) {
      cameraResult = friendlyCameraError(err);
    } finally {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_) {}
        });
      }
    }
    setCamera(cameraResult);

    // 2. Microphone check
    let micResult;
    let micStream = null;
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevicesUnsupported');
      }
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micResult = { state: 'ready', badgeText: 'Ready', detail: null };
    } catch (err) {
      micResult = friendlyMicError(err);
    } finally {
      if (micStream) {
        micStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_) {}
        });
      }
    }
    setMic(micResult);

    setIsRunning(false);
  }, [isRunning]);

  const handleContinue = () => {
    if (!allReady || isRunning) return;
    if (onContinue) {
      onContinue();
    }
  };

  const overallLabel = {
    idle: 'Not checked',
    checking: 'Checking...',
    ready: '✓ System ready',
    failed: '✕ Action required',
  }[overallStatus];

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

        {/* ── Check list ── */}
        <div className="syscheck-list">
          <SystemCheckItem id="camera" label="Camera" {...camera} />
          <SystemCheckItem id="microphone" label="Microphone" {...mic} />
          <SystemCheckItem id="exam-window" label="Examination Window" {...examWindow} />
          <SystemCheckItem id="permissions" label="Permissions" {...permissions} />
        </div>

        {/* ── Overall status section ── */}
        <div className={`syscheck-overall syscheck-overall--${overallStatus}`}>
          <span className="syscheck-overall-label">System status:</span>
          <span className="syscheck-overall-value">{overallLabel}</span>
        </div>

        {/* ── Actions ── */}
        <div className="syscheck-actions">
          <button
            className="btn-secondary"
            type="button"
            onClick={onBack}
            id="back-btn"
            disabled={isRunning}
          >
            Back
          </button>

          <button
            className="btn-primary"
            type="button"
            id="run-check-btn"
            onClick={runChecks}
            disabled={isRunning}
          >
            {isRunning ? 'Checking...' : 'Run System Check'}
          </button>

          <button
            className="btn-primary"
            type="button"
            id="continue-btn"
            onClick={handleContinue}
            disabled={!allReady || isRunning}
            aria-disabled={!allReady || isRunning}
            title={!allReady ? 'All system checks must pass before continuing.' : undefined}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemCheckScreen;
