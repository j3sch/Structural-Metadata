import type {
	FolderNoteSelfBehavior,
	FormatType,
	LinkStyle,
	OnNoMatch,
	ResolverType,
	StructuralRule,
	TextTransform,
	WritePolicy,
} from '../domain/rules';

export const RESOLVER_TYPES: { value: ResolverType; label: string }[] = [
	{ value: 'parent-folder-note', label: 'Parent folder note' },
	{ value: 'ancestor-folder-note', label: 'Ancestor folder note' },
	{ value: 'nearest-folder-note', label: 'Nearest folder note' },
	{ value: 'path-segment', label: 'Path segment' },
	{ value: 'path-regex', label: 'Path regex' },
	{ value: 'inherit-property', label: 'Inherit property' },
	{ value: 'static', label: 'Static value' },
];

export const FORMAT_TYPES: { value: FormatType; label: string }[] = [
	{ value: 'wikilink', label: 'Wikilink' },
	{ value: 'text', label: 'Text' },
	{ value: 'list', label: 'List' },
	{ value: 'tag', label: 'Tag' },
	{ value: 'boolean', label: 'Boolean' },
	{ value: 'number', label: 'Number' },
];

export const WRITE_POLICIES: { value: WritePolicy; label: string }[] = [
	{ value: 'managed', label: 'Managed (default)' },
	{ value: 'always', label: 'Always' },
	{ value: 'empty-only', label: 'Empty only' },
];

export const ON_NO_MATCH: { value: OnNoMatch; label: string }[] = [
	{ value: 'clear-managed', label: 'Clear managed (default)' },
	{ value: 'ignore', label: 'Ignore' },
];

export const LINK_STYLES: { value: LinkStyle; label: string }[] = [
	{ value: 'full-path', label: 'Full path' },
	{ value: 'obsidian-preference', label: 'Obsidian preference' },
];

export const SELF_BEHAVIORS: { value: FolderNoteSelfBehavior; label: string }[] = [
	{ value: 'parent-folder-note', label: 'Use parent folder note' },
	{ value: 'self', label: 'Link to self' },
	{ value: 'none', label: 'No match' },
];

export const TRANSFORMS: { value: TextTransform; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'lowercase', label: 'lowercase' },
	{ value: 'uppercase', label: 'UPPERCASE' },
];

export const SEARCH_MODES: { value: string; label: string }[] = [
	{ value: 'parent', label: 'Parent folder note' },
	{ value: 'nearest', label: 'Nearest ancestor folder note' },
];

export const SEGMENT_SOURCES: { value: string; label: string }[] = [
	{ value: 'current-folder', label: 'Current folder name' },
	{ value: 'from-root', label: 'Segment index from root' },
];

export function toRecord(options: { value: string; label: string }[]): Record<string, string> {
	const rec: Record<string, string> = {};
	for (const o of options) rec[o.value] = o.label;
	return rec;
}

export function withDefault(options: { value: string; label: string }[]): { value: string; label: string }[] {
	return [{ value: '', label: 'Use default' }, ...options];
}

export function splitLines(value: string): string[] {
	return value
		.split('\n')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

export function cloneRule(rule: StructuralRule): StructuralRule {
	return JSON.parse(JSON.stringify(rule)) as StructuralRule;
}
