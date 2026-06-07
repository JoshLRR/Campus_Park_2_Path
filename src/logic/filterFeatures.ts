/**
 * filterFeatures.ts
 *
 * Filters the known room features by display label using a search term.
 */

import {FEATURE_LABELS} from './featureLabels';

export type FeatureOption = {
  id: number;
  label: string;
};

export function filterFeatures(searchTerm: string): FeatureOption[] {
  const term = searchTerm.toLowerCase().trim();
  const options = Object.entries(FEATURE_LABELS).map(([id, label]) => ({
    id: Number(id),
    label,
  }));

  if (!term) return options;
  return options.filter(option => option.label.toLowerCase().includes(term));
}
