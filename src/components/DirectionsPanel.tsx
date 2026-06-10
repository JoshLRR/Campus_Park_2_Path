/**
 * DirectionsPanel.tsx
 *
 * Active turn-by-turn directions UI shown after a route is calculated —
 * lists each `DirectionStep` with an icon and distance, summarizes the
 * total distance/walking time with a meters/feet toggle, and lets the
 * user pan the map to a step or clear the route.
 */

import {useState} from 'react';
import {DirectionStep} from '../logic/buildDirections';
import {DistanceUnit, formatDistance} from '../logic/formatDistance';
import {formatWalkingTime} from '../logic/estimateWalkingTime';

type DirectionsPanelProps = {
  steps: DirectionStep[];
  totalDistance: number;
  accessibilityWarning?: string | null;
  distanceUnit: DistanceUnit;
  onChangeDistanceUnit: (unit: DistanceUnit) => void;
  onBack: () => void;
  onClear: () => void;
  onFocusStep: (
    position: {x: number; y: number},
    fromNodeId: number,
    toNodeId: number,
  ) => void;
  minimized: boolean;
  onToggleMinimized: () => void;
};

function DistanceUnitToggle({
  unit,
  onChange,
}: {
  unit: DistanceUnit;
  onChange: (unit: DistanceUnit) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-semibold flex-shrink-0">
      {(['m', 'ft'] as const).map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-2 py-0.5 transition-colors ${
            unit === option
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-400 hover:text-gray-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function StepIcon({kind}: {kind: DirectionStep['kind']}) {
  if (kind === 'start') {
    return (
      <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-blue-100 flex-shrink-0" />
    );
  }
  if (kind === 'destination') {
    return (
      <svg
        className="w-4 h-4 text-red-500 flex-shrink-0"
        viewBox="0 0 12 16"
        fill="currentColor"
      >
        <path d="M6 0C2.686 0 0 2.686 0 6c0 3.314 6 10 6 10s6-6.686 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
    );
  }
  if (kind === 'turn-left') {
    return (
      <svg
        className="w-4 h-4 text-orange-500 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
      </svg>
    );
  }
  if (kind === 'turn-right') {
    return (
      <svg
        className="w-4 h-4 text-orange-500 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
      </svg>
    );
  }
  if (kind === 'straight') {
    return (
      <svg
        className="w-4 h-4 text-gray-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5m0 0l-4 4m4-4l4 4" />
      </svg>
    );
  }
  return (
    <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-white flex-shrink-0" />
  );
}

export function DirectionsPanel({
  steps,
  totalDistance,
  accessibilityWarning,
  distanceUnit,
  onChangeDistanceUnit,
  onBack,
  onClear,
  onFocusStep,
  minimized,
  onToggleMinimized,
}: DirectionsPanelProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  if (steps.length === 0) return null;

  const startLabel = steps[0].label;
  const destLabel = steps[steps.length - 1].label;

  return (
    <div
      className="w-80 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      style={{pointerEvents: 'auto', maxHeight: minimized ? undefined : 'calc(100dvh - 2rem)'}}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <button
          onClick={onToggleMinimized}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
          title={minimized ? 'Show steps' : 'Hide steps'}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={minimized ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
            />
          </svg>
          {minimized ? 'Expand' : 'Minimize'}
        </button>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear route
        </button>
      </div>

      {/* From / To summary — always visible */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-800 truncate flex-1 min-w-0">
            {startLabel}
          </span>
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          <span className="font-semibold text-gray-800 truncate flex-1 min-w-0 text-right">
            {destLabel}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-blue-600 font-semibold">
            ~{formatDistance(totalDistance, distanceUnit)} total ·{' '}
            {formatWalkingTime(totalDistance)}
          </p>
          <DistanceUnitToggle
            unit={distanceUnit}
            onChange={onChangeDistanceUnit}
          />
        </div>
      </div>

      {!minimized && (
        <>
          {accessibilityWarning && (
            <p className="px-4 py-2.5 border-b border-gray-100 text-xs text-amber-600 bg-amber-50">
              {accessibilityWarning}
            </p>
          )}

          {/* Steps */}
          <div className="overflow-y-auto flex-1">
            {steps.map((step, i) => (
              <div key={step.nodeId}>
                {/* Step row */}
                <button
                  onClick={() => {
                    setFocusedIndex(i);
                    const isLast = i === steps.length - 1;
                    const fromId = isLast ? steps[i - 1].nodeId : step.nodeId;
                    const toId = isLast ? step.nodeId : steps[i + 1].nodeId;
                    onFocusStep(step.position, fromId, toId);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    focusedIndex === i ? 'bg-amber-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <StepIcon kind={step.kind} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        step.kind === 'start'
                          ? 'text-blue-600'
                          : step.kind === 'destination'
                            ? 'text-red-600'
                            : step.kind === 'turn-left' ||
                                step.kind === 'turn-right'
                              ? 'text-orange-600'
                              : 'text-gray-600'
                      }`}
                    >
                      {step.kind === 'start' || step.kind === 'destination' ? (
                        <>
                          {step.kind === 'start' ? 'Start' : 'Arrive'}
                          <span className="text-gray-800 font-semibold ml-1">
                            {step.label}
                          </span>
                        </>
                      ) : step.kind === 'waypoint' ? (
                        <>
                          Pass
                          <span className="text-gray-800 font-semibold ml-1">
                            {step.label}
                          </span>
                        </>
                      ) : (
                        step.label
                      )}
                    </p>
                  </div>
                  {/* Pan icon */}
                  <svg
                    className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>

                {/* Distance to next step */}
                {i < steps.length - 1 && (
                  <div className="flex items-center gap-3 px-4 py-1">
                    <div className="w-4 flex justify-center flex-shrink-0">
                      <div className="w-px h-6 bg-gray-200" />
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDistance(steps[i + 1].distanceTo, distanceUnit)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
