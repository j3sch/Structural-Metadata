/**
 * Shared type definitions for the Structural Metadata plugin.
 *
 * This file is intentionally free of any `obsidian` import so that the core
 * engine and its unit tests can run without the Obsidian runtime.
 */

// ---------------------------------------------------------------------------
// Policy enums
// ---------------------------------------------------------------------------

export type WritePolicy = 'always' | 'empty-only' | 'managed';
export type OnNoMatch = 'ignore' | 'clear-managed';
export type LinkStyle = 'full-path' | 'obsidian-preference';
export type FolderNoteSelfBehavior = 'parent-folder-note' | 'self' | 'none';
export type FormatType = 'wikilink' | 'text' | 'list' | 'tag' | 'boolean' | 'number';
export type TextTransform = 'none' | 'lowercase' | 'uppercase';

export type ResolverType =
	| 'parent-folder-note'
	| 'ancestor-folder-note'
	| 'nearest-folder-note'
	| 'path-segment'
	| 'path-regex'
	| 'inherit-property'
	| 'static';

// ---------------------------------------------------------------------------
// Rule configuration
// ---------------------------------------------------------------------------

export interface ScopeConfig {
	include: string[];
	exclude: string[];
	minDepthBelowRoot?: number;
	markdownOnly: boolean;
}

export interface ResolverConfig {
	type: ResolverType;
	/** parent-folder-note / nearest-folder-note / inherit-property */
	folderNoteSelfBehavior?: FolderNoteSelfBehavior;
	/** ancestor-folder-note */
	root?: string;
	levelBelowRoot?: number;
	/** path-segment */
	segmentSource?: 'from-root' | 'current-folder';
	segmentIndex?: number;
	/** path-regex */
	pattern?: string;
	outputTemplate?: string;
	/** inherit-property */
	sourceProperty?: string;
	searchMode?: 'parent' | 'nearest';
	/** static */
	value?: unknown;
}

export interface FormatConfig {
	type: FormatType;
	/** wikilink only */
	style?: LinkStyle;
	/** wikilink only */
	alias?: string;
	transform?: TextTransform;
	/** list only */
	delimiter?: string;
}

export interface StructuralRule {
	id: string;
	name: string;
	enabled: boolean;
	priority: number;
	property: string;
	scope: ScopeConfig;
	resolver: ResolverConfig;
	format: FormatConfig;
	writePolicy?: WritePolicy;
	onNoMatch?: OnNoMatch;
}

// ---------------------------------------------------------------------------
// Managed state
// ---------------------------------------------------------------------------

export interface ManagedEntry {
	ruleId: string;
	property: string;
	valueHash: string;
}

export interface ManagedFileEntry {
	[property: string]: ManagedEntry;
}

export interface ManagedState {
	entries: Record<string, ManagedFileEntry>;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface StructuralMetadataSettings {
	schemaVersion: 1;
	defaults: {
		debounceMs: number;
		writePolicy: WritePolicy;
		onNoMatch: OnNoMatch;
		linkStyle: LinkStyle;
		excludePatterns: string[];
	};
	folderNotePatterns: string[];
	rules: StructuralRule[];
	managedState: ManagedState;
}

// ---------------------------------------------------------------------------
// Vault abstraction (implemented in the obsidian layer)
// ---------------------------------------------------------------------------

export interface FileRef {
	path: string;
	basename: string;
	extension: string;
}

export interface FolderRef {
	path: string;
	name: string;
}

export interface VaultAccess {
	getFileByPath(path: string): FileRef | null;
	getFolderByPath(path: string): FolderRef | null;
	fileExists(path: string): boolean;
	readFrontmatter(path: string): Promise<Record<string, unknown> | null>;
	getAllMarkdownFilePaths(): string[];
}

export interface LinkGenerator {
	generateLink(
		targetPath: string,
		sourcePath: string,
		style: LinkStyle,
		alias?: string,
	): string;
}

// ---------------------------------------------------------------------------
// Resolver results & context
// ---------------------------------------------------------------------------

export type ResolverResultType = 'file-ref' | 'raw' | 'inherited';

export interface ResolverResult {
	matched: boolean;
	/** path to a target file (folder note) for file-ref results */
	targetFilePath?: string;
	/** raw value produced by segment/regex/static resolvers */
	rawValue?: unknown;
	/** value copied from another note's frontmatter */
	inheritedValue?: unknown;
	resultType: ResolverResultType;
}

export interface ResolverContext {
	filePath: string;
	fileName: string;
	fileBasename: string;
	parentFolderPath: string;
	vault: VaultAccess;
	folderNotePatterns: string[];
	linkGenerator: LinkGenerator;
}

export type ResolverFn = (
	config: ResolverConfig,
	ctx: ResolverContext,
) => Promise<ResolverResult>;

// ---------------------------------------------------------------------------
// Diff / planned changes
// ---------------------------------------------------------------------------

export type PlannedAction = 'set' | 'clear' | 'skip';
export type ConflictStatus = 'none' | 'user-override' | 'no-match';

export interface FrontmatterSnapshot {
	[property: string]: unknown;
}

export interface PlannedChange {
	filePath: string;
	property: string;
	ruleId: string;
	ruleName: string;
	action: PlannedAction;
	oldValue: unknown;
	newValue: unknown;
	writePolicy: WritePolicy;
	onNoMatch: OnNoMatch;
	conflict: ConflictStatus;
	reason: string;
}

export interface DiffInput {
	filePath: string;
	property: string;
	ruleId: string;
	ruleName: string;
	result: ResolverResult;
	formatted: unknown;
	oldValue: unknown;
	writePolicy: WritePolicy;
	onNoMatch: OnNoMatch;
	managed: ManagedEntry | null;
}

export interface ProcessorResult {
	applied: number;
	skipped: number;
	errors: number;
}
