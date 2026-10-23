import { useState, useEffect, useRef } from 'react';
import './MonitoringSession.css';

// ── Error Helper ────────────────────────────────────────────────────────────

function getFriendlyMediaError(err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return 'Camera or microphone permission was denied.';
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return 'No camera or microphone device was found.';
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return 'Camera or microphone is currently unavailable or already in use.';
  }
  if (err.name === 'SecurityError') {
    return 'Camera/microphone access was blocked by the operating system or security policy.';
  }
  return 'Camera or microphone is currently unavailable.';
}

/**
 * Reusable MonitoringSession component.
 *
 * Props:
 * - isActive (boolean): Whether monitoring stream should be active.
 * - onStatusChange (function): Callback notifying parent of session changes.
 */
function MonitoringSession({ isActive = true, onStatusChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Statuses: 'initializing' | 'active' | 'disconnected' | 'error' | 'stopped'
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [micStatus, setMicStatus] = useState('initializing');
  const [errorMessage, setErrorMessage] = useState(null);
  const [interruptionNotice, setInterruptionNotice] = useState(null);

  // Clean up all tracks safely
  const stopAllTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.onended = null;
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (!isActive) {
      stopAllTracks();
      setCameraStatus('stopped');
      setMicStatus('stopped');
      setInterruptionNotice(null);
      if (onStatusChange) {
        onStatusChange({
          isMonitoring: false,
          cameraStatus: 'stopped',
          micStatus: 'stopped',
          error: null,
        });
      }
      return;
    }

    // Starting or resuming monitoring session
    setCameraStatus('initializing');
    setMicStatus('initializing');
    setErrorMessage(null);
    setInterruptionNotice(null);

    async function initializeStream() {
      // Clean any existing stream first
      stopAllTracks();

      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('MediaDevicesUnsupported');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (isCancelled) {
          // If cancelled before completion, stop acquired tracks immediately
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        // Attach video track to preview element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup track listeners for unexpected disconnections
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          videoTrack.onended = () => {
            setCameraStatus('disconnected');
            setInterruptionNotice(
              'Examination environment interrupted: Camera connection was lost.'
            );
            if (onStatusChange) {
              onStatusChange({
                isMonitoring: true,
                cameraStatus: 'disconnected',
                micStatus: audioTrack?.readyState === 'live' ? 'active' : 'disconnected',
                error: 'Camera disconnected',
              });
            }
          };
          setCameraStatus('active');
        } else {
          setCameraStatus('error');
        }

        if (audioTrack) {
          audioTrack.onended = () => {
            setMicStatus('disconnected');
            setInterruptionNotice(
              'Examination environment interrupted: Microphone connection was lost.'
            );
            if (onStatusChange) {
              onStatusChange({
                isMonitoring: true,
                cameraStatus: videoTrack?.readyState === 'live' ? 'active' : 'disconnected',
                micStatus: 'disconnected',
                error: 'Microphone disconnected',
              });
            }
          };
          setMicStatus('active');
        } else {
          setMicStatus('error');
        }

        if (onStatusChange) {
          onStatusChange({
            isMonitoring: true,
            cameraStatus: 'active',
            micStatus: 'active',
            error: null,
          });
        }
      } catch (err) {
        if (isCancelled) return;
        const msg = getFriendlyMediaError(err);
        setErrorMessage(msg);
        setCameraStatus('error');
        setMicStatus('error');
        if (onStatusChange) {
          onStatusChange({
            isMonitoring: false,
            cameraStatus: 'error',
            micStatus: 'error',
            error: msg,
          });
        }
      }
    }

    initializeStream();

    // Cleanup on unmount or when isActive changes
    return () => {
      isCancelled = true;
      stopAllTracks();
    };
  }, [isActive]);

  const renderBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="mon-badge mon-badge--active">● Active</span>;
      case 'disconnected':
        return <span className="mon-badge mon-badge--disconnected">⚠ Disconnected</span>;
      case 'error':
        return <span className="mon-badge mon-badge--error">✕ Error</span>;
      case 'stopped':
        return <span className="mon-badge mon-badge--stopped">○ Stopped</span>;
      default:
        return <span className="mon-badge mon-badge--pending">Checking…</span>;
    }
  };

  return (
    <div className="mon-session">
      {/* ── Live Camera Preview ── */}
      <div className="mon-video-wrapper">
        <video
          ref={videoRef}
          className={`mon-video ${cameraStatus === 'active' ? 'mon-video--visible' : ''}`}
          autoPlay
          playsInline
          muted
          aria-label="Proctoring Live Camera Feed"
        />

        {/* Overlay when not active */}
        {cameraStatus !== 'active' && (
          <div className="mon-video-placeholder">
            {cameraStatus === 'initializing' && (
              <div className="mon-placeholder-state">
                <span className="mon-spinner" aria-hidden="true" />
                <p>Initializing camera & microphone…</p>
              </div>
            )}
            {cameraStatus === 'stopped' && (
              <div className="mon-placeholder-state">
                <span className="mon-placeholder-icon">○</span>
                <p>Monitoring session is currently stopped</p>
              </div>
            )}
            {cameraStatus === 'disconnected' && (
              <div className="mon-placeholder-state mon-placeholder-state--warn">
                <span className="mon-placeholder-icon">⚠</span>
                <p>Camera feed disconnected</p>
              </div>
            )}
            {cameraStatus === 'error' && (
              <div className="mon-placeholder-state mon-placeholder-state--error">
                <span className="mon-placeholder-icon">✕</span>
                <p>{errorMessage || 'Camera unavailable'}</p>
              </div>
            )}
          </div>
        )}

        {/* Live Feed Header Overlay */}
        {cameraStatus === 'active' && (
          <div className="mon-video-live-tag">
            <span className="mon-live-dot" /> LIVE
          </div>
        )}
      </div>

      {/* ── Interruption / Warning Alert ── */}
      {interruptionNotice && (
        <div className="mon-alert mon-alert--interruption" role="alert">
          {interruptionNotice}
        </div>
      )}

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="mon-alert mon-alert--error" role="alert">
          ✕ {errorMessage}
        </div>
      )}

      {/* ── Device Status Cards ── */}
      <div className="mon-devices">
        <div className="mon-device-card" id="mon-camera-status">
          <div className="mon-device-info">
            <span className="mon-device-label">Camera</span>
            <span className="mon-device-sublabel">Video Feed</span>
          </div>
          {renderBadge(cameraStatus)}
        </div>

        <div className="mon-device-card" id="mon-mic-status">
          <div className="mon-device-info">
            <span className="mon-device-label">Microphone</span>
            <span className="mon-device-sublabel">Audio Stream</span>
          </div>
          {renderBadge(micStatus)}
        </div>
      </div>
    </div>
  );
}

export default MonitoringSession;
