/**
 * AccessibilityPanel.tsx
 *
 * User-facing overlay (toggled via the "Accessibility" button) for setting
 * route preferences — avoid stairs (ADA-only paths), covered paths only,
 * and paved paths only. These feed into route calculation so the
 * calculated route honors them where possible.
 */

import {RoutePreferences} from './Map/pathfinding';

type AccessibilityPanelProps = {
  onClose: () => void;
  preferences: RoutePreferences;
  setPreferences: (preferences: RoutePreferences) => void;
};

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

function ToggleRow({label, description, checked, onChange}: ToggleRowProps) {
  return (
    <label className="flex items-start justify-between gap-3 py-2 cursor-pointer select-none">
      <span className="flex flex-col">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{description}</span>
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </label>
  );
}

export function AccessibilityPanel({
  onClose,
  preferences,
  setPreferences,
}: AccessibilityPanelProps) {
  const update = (key: keyof RoutePreferences) => (value: boolean) =>
    setPreferences({...preferences, [key]: value});

  return (
    <div className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Routing
          </span>
          <span className="text-sm font-semibold text-gray-800">
            Accessibility
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Route Preferences
        </p>
        <ToggleRow
          label="Avoid stairs"
          description="ADA path only — no steps along the route"
          checked={preferences.avoidStairs ?? false}
          onChange={update('avoidStairs')}
        />
        <ToggleRow
          label="Covered paths only"
          description="Stay under cover (e.g. away from open-air segments)"
          checked={preferences.avoidUncovered ?? false}
          onChange={update('avoidUncovered')}
        />
        <ToggleRow
          label="Paved paths only"
          description="Avoid unpaved or dirt segments"
          checked={preferences.avoidUnpaved ?? false}
          onChange={update('avoidUnpaved')}
        />
        <p className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
          If no route fully matches your preferences, we'll show the closest
          alternative and let you know.
        </p>
      </div>
    </div>
  );
}
