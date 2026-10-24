import { useState, useCallback } from 'react';
import SystemCheckItem from './SystemCheckItem.jsx';
import './SystemCheckScreen.css';

// ── Error handling helpers ──────────────────────────────────────────────────

function friendlyCameraError(err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return {
      state: 'denied',
      badgeText: 'Action required',
      detail: 'Camera permission was denied. Please allow camera access in macOS System Settings.',
    };
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return {
      state: 'unavailable',
      badgeText: 'Action required',
      detail: 'No camera device was found. Please connect a camera.',
    };
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return {
      state: 'unavailable',
      badgeText: 'Action required',
      detail: 'Camera is currently unavailable.',
    };
  }
  if (err.name === 'SecurityError') {
    return {
      state: 'denied',
      badgeText: 'Action required',
      detail: 'Camera access was blocked by security policy.',
    };
  }
  return {
    state: 'unavailable',
    badgeText: 'Action required',
    detail: 'Camera is currently unavailable. Please check your camera connection and permissions.',
  };
}

function friendlyMicError(err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return {
      state: 'denied',
      badgeText: 'Action required',
      detail: 'Microphone permission was denied. Please allow microphone access in macOS System Settings.',
    };
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return {
      state: 'unavailable',
      badgeText: 'Action required',
      detail: 'No microphone device was found. Please connect a microphone.',
    };
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return {
      state: 'unavailable',
      badgeText: 'Action required',
      detail: 'Microphone is currently unavailable.',
    };
  }
  if (err.name === 'SecurityError') {
    return {
      state: 'denied',
      badgeText: 'Action required',
      detail: 'Microphone access was blocked by security policy.',
    };
  }
  return {
    state: 'unavailable',
    badgeText: 'Action required',
    detail: 'Microphone is currently unavailable. Please check your microphone connection and permissions.',
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
  if (
    camera.state === 'denied' ||
    camera.state === 'unavailable' ||
    camera.state === 'action-required' ||
    mic.state === 'denied' ||
    mic.state === 'unavailable' ||
    mic.state === 'action-required'
  ) {
    return {
      state: 'action-required',
      badgeText: 'Action required',
      detail: 'Camera and microphone access must be granted.',
    };
  }
  return { state: 'pending', badgeText: 'Pending', detail: null };
}

function deriveOverall(camera, mic, examWindow, permissions) {
  if (
    camera.state === 'ready' &&
    mic.state === 'ready' &&
    examWindow.state === 'ready' &&
    permissions.state === 'ready'
  ) {
    return 'ready';
  }
  if (
    camera.state === 'denied' ||
    camera.state === 'unavailable' ||
    camera.state === 'action-required' ||
    mic.state === 'denied' ||
    mic.state === 'unavailable' ||
    mic.state === 'action-required'
  ) {
    return 'failed';
  }
  if (camera.state === 'checking' || mic.state === 'checking') {
    return 'checking';
  }
  return 'idle';
}

function getButtonLabel(state, deviceType) {
  if (state === 'checking') return 'Checking...';
  if (state === 'ready') return `Re-check ${deviceType}`;
  if (state === 'denied' || state === 'unavailable' || state === 'action-required') return 'Try Again';
  return `Check ${deviceType}`;
}

function getButtonClass(state) {
  if (state === 'ready') return 'sci-btn sci-btn--secondary';
  if (state === 'denied' || state === 'unavailable' || state === 'action-required') return 'sci-btn sci-btn--retry';
  if (state === 'checking') return 'sci-btn sci-btn--secondary';
  return 'sci-btn sci-btn--primary';
}

function getCameraDescription(state) {
  if (state === 'ready') return 'Camera access is available.';
  if (state === 'checking') return 'Requesting camera access...';
  if (state === 'denied' || state === 'unavailable' || state === 'action-required') return null;
  return 'Camera access is required for examination monitoring.';
}

function getMicDescription(state) {
  if (state === 'ready') return 'Microphone access is available.';
  if (state === 'checking') return 'Requesting microphone access...';
  if (state === 'denied' || state === 'unavailable' || state === 'action-required') return null;
  return 'Microphone access is required for examination monitoring.';
}

// ── Component ──────────────────────────────────────────────────────────────

function SystemCheckScreen({ onBack, onContinue }) {
  const [camera, setCamera] = useState(IDLE);
  const [mic, setMic] = useState(IDLE);
  const [isCheckingCamera, setIsCheckingCamera] = useState(false);
  const [isCheckingMic, setIsCheckingMic] = useState(false);

  // Derived states
  const permissions = derivePermissions(camera, mic);
  const examWindow = WINDOW_READY;
  const overallStatus = deriveOverall(camera, mic, examWindow, permissions);
  const allReady = camera.state === 'ready' && mic.state === 'ready';
  const anyChecking = isCheckingCamera || isCheckingMic;

  // ── Dedicated Camera Check ────────────────────────────────────────────────

  const checkCamera = useCallback(async () => {
    if (isCheckingCamera || isCheckingMic) return;
    setIsCheckingCamera(true);
    setCamera({ state: 'checking', badgeText: 'Checking...', detail: null });

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
      setIsCheckingCamera(false);
    }
    setCamera(cameraResult);
  }, [isCheckingCamera, isCheckingMic]);

  // ── Dedicated Microphone Check ────────────────────────────────────────────

  const checkMicrophone = useCallback(async () => {
    if (isCheckingMic || isCheckingCamera) return;
    setIsCheckingMic(true);
    setMic({ state: 'checking', badgeText: 'Checking...', detail: null });

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
      setIsCheckingMic(false);
    }
    setMic(micResult);
  }, [isCheckingMic, isCheckingCamera]);

  const handleContinue = () => {
    if (!allReady || anyChecking) return;
    if (onContinue) {
      onContinue();
    }
  };

  const overallLabel = {
    idle: 'Waiting for checks',
    checking: 'Checking...',
    ready: 'Ready',
    failed: 'Action required',
  }[overallStatus];

  // Camera action button
  const cameraAction = (
    <button
      type="button"
      id="check-camera-btn"
      className={getButtonClass(camera.state)}
      onClick={checkCamera}
      disabled={anyChecking}
      aria-label={
        camera.state === 'ready'
          ? 'Re-check camera permission'
          : camera.state === 'checking'
          ? 'Checking camera permission'
          : 'Check camera permission'
      }
    >
      {getButtonLabel(camera.state, 'Camera')}
    </button>
  );

  // Microphone action button
  const micAction = (
    <button
      type="button"
      id="check-mic-btn"
      className={getButtonClass(mic.state)}
      onClick={checkMicrophone}
      disabled={anyChecking}
      aria-label={
        mic.state === 'ready'
          ? 'Re-check microphone permission'
          : mic.state === 'checking'
          ? 'Checking microphone permission'
          : 'Check microphone permission'
      }
    >
      {getButtonLabel(mic.state, 'Microphone')}
    </button>
  );

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
          <SystemCheckItem
            id="camera"
            label="Camera"
            description={getCameraDescription(camera.state)}
            action={cameraAction}
            {...camera}
          />
          <SystemCheckItem
            id="microphone"
            label="Microphone"
            description={getMicDescription(mic.state)}
            action={micAction}
            {...mic}
          />
          <SystemCheckItem
            id="exam-window"
            label="Examination Window"
            {...examWindow}
          />
          <SystemCheckItem
            id="permissions"
            label="Permissions"
            {...permissions}
          />
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
            disabled={anyChecking}
          >
            Back
          </button>

          <button
            className="btn-primary"
            type="button"
            id="continue-btn"
            onClick={handleContinue}
            disabled={!allReady || anyChecking}
            aria-disabled={!allReady || anyChecking}
            title={!allReady ? 'Both camera and microphone checks must pass before continuing.' : undefined}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemCheckScreen;

