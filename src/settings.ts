import type { StructuralMetadataSettings } from './types';

/**
 * Default settings. Kept as a function so every caller gets a fresh deep copy
 * (settings are mutable and persisted to data.json).
 */
export function defaultSettings(): StructuralMetadataSettings {
	return {
		schemaVersion: 1,
		defaults: {
			debounceMs: 750,
			writePolicy: 'managed',
			onNoMatch: 'clear-managed',
			linkStyle: 'full-path',
			excludePatterns: ['templater/**', 'templates/**', '**/*.excalidraw.md'],
		},
		folderNotePatterns: [
			'{{folderPath}}/{{folderName}}.md',
			'{{folderPath}}/index.md',
			'{{folderPath}}.md',
		],
		rules: [],
		managedState: { entries: {} },
	};
}

/**
 * Merge settings loaded from data.json over the defaults.
 *
 * Arrays (rules, folderNotePatterns) are replaced wholesale because merging
 * them element-wise would be ambiguous. `managedState` is preserved as loaded.
 */
export function mergeSettings(
	loaded: Partial<StructuralMetadataSettings> | null | undefined,
): StructuralMetadataSettings {
	const d = defaultSettings();
	if (!loaded) return d;
	return {
		schemaVersion: 1,
		defaults: { ...d.defaults, ...(loaded.defaults ?? {}) },
		folderNotePatterns: loaded.folderNotePatterns ?? d.folderNotePatterns,
		rules: Array.isArray(loaded.rules) ? loaded.rules : d.rules,
		managedState: loaded.managedState ?? { entries: {} },
	};
}

/** Generate a reasonably unique rule id. */
export function generateRuleId(): string {
	return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

