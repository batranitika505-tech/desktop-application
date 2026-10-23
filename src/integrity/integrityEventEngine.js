import { useState, useCallback, useMemo } from 'react';

/**
 * Newton Athena — Centralized Integrity Event Engine
 *
 * Responsibilities:
 * 1. Defining standardized event types & operational severity levels
 * 2. Validating event types and severity levels
 * 3. Assigning unique collision-safe IDs and real ISO timestamps
 * 4. Normalizing event payload structures
 * 5. Providing timeline aggregation and telemetry event counts
 * 6. Keeping ExamScreen focused purely on UI and user interaction
 */

// ── Constants & Dictionary ──────────────────────────────────────────────────

export const SEVERITY_LEVELS = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

export const EVENT_TYPES = Object.freeze({
  // Active examination events currently implemented
  FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
  FULLSCREEN_RESTORED: 'FULLSCREEN_RESTORED',
  WINDOW_BLUR: 'WINDOW_BLUR',
  WINDOW_FOCUS: 'WINDOW_FOCUS',

  // Prepared for subsequent monitoring / evidence milestones
  CAMERA_DISCONNECTED: 'CAMERA_DISCONNECTED',
  MICROPHONE_DISCONNECTED: 'MICROPHONE_DISCONNECTED',
  EVIDENCE_CAPTURED: 'EVIDENCE_CAPTURED',
});

// Default operational severity mapping
export const DEFAULT_EVENT_SEVERITY = Object.freeze({
  [EVENT_TYPES.FULLSCREEN_EXIT]: SEVERITY_LEVELS.WARNING,
  [EVENT_TYPES.FULLSCREEN_RESTORED]: SEVERITY_LEVELS.INFO,
  [EVENT_TYPES.WINDOW_BLUR]: SEVERITY_LEVELS.WARNING,
  [EVENT_TYPES.WINDOW_FOCUS]: SEVERITY_LEVELS.INFO,
  [EVENT_TYPES.CAMERA_DISCONNECTED]: SEVERITY_LEVELS.WARNING,
  [EVENT_TYPES.MICROPHONE_DISCONNECTED]: SEVERITY_LEVELS.WARNING,
  [EVENT_TYPES.EVIDENCE_CAPTURED]: SEVERITY_LEVELS.INFO,
});

// ── Validation Helpers ──────────────────────────────────────────────────────

export function isValidEventType(type) {
  return typeof type === 'string' && Object.values(EVENT_TYPES).includes(type);
}

export function isValidSeverity(severity) {
  return typeof severity === 'string' && Object.values(SEVERITY_LEVELS).includes(severity);
}

// ── ID Generator ────────────────────────────────────────────────────────────

let eventSequenceCounter = 0;

export function generateEventId() {
  eventSequenceCounter = (eventSequenceCounter + 1) % 1000000;
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `evt-${Date.now()}-${eventSequenceCounter}-${randomSuffix}`;
}

// ── Core Event Factory ──────────────────────────────────────────────────────

/**
 * Creates and normalizes an integrity event.
 *
 * @param {string} type - Event type from EVENT_TYPES
 * @param {object} [metadata={}] - Optional event context
 * @param {string} [customSeverity=null] - Optional severity override
 * @returns {object|null} Normalized event object or null if rejected
 */
export function createIntegrityEvent(type, metadata = {}, customSeverity = null) {
  if (!isValidEventType(type)) {
    console.warn(`[IntegrityEngine] Rejected invalid or unsupported event type: "${type}"`);
    return null;
  }

  const severity = customSeverity || DEFAULT_EVENT_SEVERITY[type] || SEVERITY_LEVELS.INFO;
  if (!isValidSeverity(severity)) {
    console.warn(`[IntegrityEngine] Rejected invalid severity level: "${severity}"`);
    return null;
  }

  return {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    severity,
    metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
  };
}

// ── Telemetry & Metrics Helpers ─────────────────────────────────────────────

/**
 * Calculates event counts by severity category.
 *
 * @param {Array} events - List of integrity events
 * @returns {object} { total, warnings, info, critical }
 */
export function getEventCounts(events = []) {
  if (!Array.isArray(events)) {
    return { total: 0, warnings: 0, info: 0, critical: 0 };
  }

  return events.reduce(
    (acc, event) => {
      acc.total += 1;
      if (event.severity === SEVERITY_LEVELS.WARNING) acc.warnings += 1;
      else if (event.severity === SEVERITY_LEVELS.INFO) acc.info += 1;
      else if (event.severity === SEVERITY_LEVELS.CRITICAL) acc.critical += 1;
      return acc;
    },
    { total: 0, warnings: 0, info: 0, critical: 0 }
  );
}

/**
 * Returns events sorted chronologically (oldest to newest).
 *
 * @param {Array} events
 * @returns {Array} Sorted shallow copy of events
 */
export function getChronologicalEvents(events = []) {
  if (!Array.isArray(events)) return [];
  return [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// ── React Integration Hook ──────────────────────────────────────────────────

/**
 * React hook to manage examination integrity events within component state.
 */
export function useIntegrityEvents() {
  const [events, setEvents] = useState([]);

  const recordEvent = useCallback((type, metadata = {}, customSeverity = null) => {
    const newEvent = createIntegrityEvent(type, metadata, customSeverity);
    if (newEvent) {
      setEvents((prev) => [...prev, newEvent]);
    }
    return newEvent;
  }, []);

  const counts = useMemo(() => getEventCounts(events), [events]);

  return {
    events,
    recordEvent,
    counts,
  };
}
