import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Newton Athena — Evidence Capture Module
 *
 * Responsibilities:
 * 1. Capture real camera frames from the active HTMLVideoElement using HTMLCanvasElement
 * 2. Format normalized evidence objects with unique IDs and ISO timestamps
 * 3. Enforce memory safety with a bounded evidence buffer (MAX_EVIDENCE_ITEMS = 60)
 * 4. Provide controlled periodic evidence capture (30s interval)
 * 5. Provide event-triggered evidence capture with a 5000ms burst cooldown
 * 6. Associate evidence with integrity events via eventId
 * 7. Safely skip capture if the camera stream is unready or unavailable (zero fake frames)
 *
 * Note on Proctoring Ethics:
 * This module records visual telemetry ("what the camera saw at this timestamp").
 * It does NOT make AI claims, judge misconduct, or calculate cheating scores.
 */

// ── Constants & Configuration ───────────────────────────────────────────────

export const EVIDENCE_TYPES = Object.freeze({
  CAMERA_SNAPSHOT: 'CAMERA_SNAPSHOT',
});

export const EVIDENCE_TRIGGERS = Object.freeze({
  PERIODIC: 'PERIODIC',
  INTEGRITY_EVENT: 'INTEGRITY_EVENT',
  MANUAL: 'MANUAL',
});

export const MAX_EVIDENCE_ITEMS = 60;
export const PERIODIC_CAPTURE_INTERVAL_MS = 30000; // 30 seconds
export const EVENT_CAPTURE_COOLDOWN_MS = 5000; // 5 seconds
export const JPEG_QUALITY = 0.7; // Balance between clarity and lightweight payload

// ── ID Generator ────────────────────────────────────────────────────────────

let evidenceSequenceCounter = 0;

export function generateEvidenceId() {
  evidenceSequenceCounter = (evidenceSequenceCounter + 1) % 1000000;
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `evidence-${Date.now()}-${evidenceSequenceCounter}-${randomSuffix}`;
}

// ── Video Readiness Check ───────────────────────────────────────────────────

/**
 * Validates whether the given video element has active, usable camera frames.
 *
 * @param {HTMLVideoElement|null} videoElement
 * @returns {boolean}
 */
export function isCameraFrameReady(videoElement) {
  if (!videoElement) return false;

  // readyState >= HAVE_CURRENT_DATA (2)
  if (typeof videoElement.readyState === 'number' && videoElement.readyState < 2) {
    return false;
  }

  // Ensure video has actual non-zero dimensions
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  if (!width || !height || width <= 0 || height <= 0) {
    return false;
  }

  return true;
}

// ── Frame Capture Mechanism ─────────────────────────────────────────────────

/**
 * Captures a real camera snapshot from an active HTMLVideoElement.
 *
 * @param {HTMLVideoElement} videoElement - The active proctoring video element
 * @param {string} trigger - Source trigger (PERIODIC, INTEGRITY_EVENT, MANUAL)
 * @param {string|null} eventId - Optional integrity event ID to associate with
 * @returns {object|null} Normalized evidence object or null if frame cannot be captured
 */
export function captureEvidenceFrame(
  videoElement,
  trigger = EVIDENCE_TRIGGERS.PERIODIC,
  eventId = null
) {
  if (!isCameraFrameReady(videoElement)) {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    // Draw active video frame onto the canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert to lightweight JPEG data URL
    const imageData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    if (!imageData || imageData === 'data:,' || imageData.length < 50) {
      return null;
    }

    return {
      id: generateEvidenceId(),
      eventId: eventId || null,
      timestamp: new Date().toISOString(),
      type: EVIDENCE_TYPES.CAMERA_SNAPSHOT,
      trigger,
      imageData,
      dimensions: {
        width: canvas.width,
        height: canvas.height,
      },
    };
  } catch (err) {
    console.warn('[EvidenceCapture] Failed to capture camera frame:', err);
    return null;
  }
}

// ── Telemetry & Metrics Helpers ─────────────────────────────────────────────

/**
 * Computes evidence counts categorized by trigger type.
 *
 * @param {Array} evidenceList
 * @returns {object} { total, periodic, integrity, manual }
 */
export function getEvidenceCounts(evidenceList = []) {
  if (!Array.isArray(evidenceList)) {
    return { total: 0, periodic: 0, integrity: 0, manual: 0 };
  }

  return evidenceList.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.trigger === EVIDENCE_TRIGGERS.PERIODIC) acc.periodic += 1;
      else if (item.trigger === EVIDENCE_TRIGGERS.INTEGRITY_EVENT) acc.integrity += 1;
      else if (item.trigger === EVIDENCE_TRIGGERS.MANUAL) acc.manual += 1;
      return acc;
    },
    { total: 0, periodic: 0, integrity: 0, manual: 0 }
  );
}

// ── React Integration Hook ──────────────────────────────────────────────────

/**
 * Custom hook to manage examination evidence capture.
 *
 * @param {object} options
 * @param {React.MutableRefObject} options.videoRef - Ref to the proctoring HTMLVideoElement
 * @param {boolean} options.isActive - Whether evidence capture should be running
 * @returns {object} { evidenceList, counts, latestEvidence, captureOnIntegrityEvent }
 */
export function useEvidenceCapture({ videoRef, isActive = true }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const lastEventCaptureTimeRef = useRef(0);
  const initialPeriodicCapturedRef = useRef(false);

  // Safe bounded addition to memory buffer
  const addEvidence = useCallback((newEvidence) => {
    if (!newEvidence) return;
    setEvidenceList((prev) => {
      const next = [...prev, newEvidence];
      if (next.length > MAX_EVIDENCE_ITEMS) {
        return next.slice(next.length - MAX_EVIDENCE_ITEMS);
      }
      return next;
    });
  }, []);

  // Capture triggered by an integrity event with cooldown throttling
  const captureOnIntegrityEvent = useCallback(
    (eventId) => {
      if (!isActive) return null;

      const now = Date.now();
      if (now - lastEventCaptureTimeRef.current < EVENT_CAPTURE_COOLDOWN_MS) {
        // Cooldown active: skip evidence capture to prevent burst duplication
        return null;
      }

      const video = videoRef?.current;
      if (!isCameraFrameReady(video)) {
        return null;
      }

      const evidence = captureEvidenceFrame(
        video,
        EVIDENCE_TRIGGERS.INTEGRITY_EVENT,
        eventId
      );

      if (evidence) {
        lastEventCaptureTimeRef.current = now;
        addEvidence(evidence);
      }
      return evidence;
    },
    [isActive, videoRef, addEvidence]
  );

  // Periodic capture lifecycle
  useEffect(() => {
    if (!isActive) return;

    // Capture initial baseline frame once stream is ready (1.5s delay allows camera video warmup)
    const initialCheckTimer = setTimeout(() => {
      if (!initialPeriodicCapturedRef.current && isCameraFrameReady(videoRef?.current)) {
        const initialEvidence = captureEvidenceFrame(
          videoRef.current,
          EVIDENCE_TRIGGERS.PERIODIC,
          null
        );
        if (initialEvidence) {
          initialPeriodicCapturedRef.current = true;
          addEvidence(initialEvidence);
        }
      }
    }, 1500);

    // Periodic 30-second capture interval
    const intervalId = setInterval(() => {
      const video = videoRef?.current;
      if (isCameraFrameReady(video)) {
        const evidence = captureEvidenceFrame(
          video,
          EVIDENCE_TRIGGERS.PERIODIC,
          null
        );
        if (evidence) {
          addEvidence(evidence);
        }
      }
    }, PERIODIC_CAPTURE_INTERVAL_MS);

    return () => {
      clearTimeout(initialCheckTimer);
      clearInterval(intervalId);
    };
  }, [isActive, videoRef, addEvidence]);

  const counts = useMemo(() => getEvidenceCounts(evidenceList), [evidenceList]);
  const latestEvidence =
    evidenceList.length > 0 ? evidenceList[evidenceList.length - 1] : null;

  return {
    evidenceList,
    counts,
    latestEvidence,
    captureOnIntegrityEvent,
  };
}
