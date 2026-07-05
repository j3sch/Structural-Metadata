import type { App } from 'obsidian';
import type {
	FrontmatterSnapshot,
	LinkGenerator,
	PlannedChange,
	ProcessorResult,
	StructuralMetadataSettings,
	VaultAccess,
} from '../types';
import type { RuleEngine } from '../core/RuleEngine';
import type { FrontmatterWriter } from './FrontmatterWriter';
import type { ManagedStateStore } from '../state/ManagedStateStore';
import { matchGlob } from '../utils/glob';

/**
 * Bridge between the pure {@link RuleEngine} and the Obsidian {@link
 * FrontmatterWriter}. Provides both "apply" (writes) and "plan" (dry-run)
 * operations over a set of file paths.
 */
export class MetadataProcessor {
	constructor(
		private app: App,
		private engine: RuleEngine,
		private writer: FrontmatterWriter,
		private vault: VaultAccess,
		private linkGenerator: LinkGenerator,
		private getSettings: () => StructuralMetadataSettings,
		private managedState: ManagedStateStore,
	) {}

	/** Plan + apply changes for the given paths. */
	async processPaths(paths: string[]): Promise<ProcessorResult> {
		const changes = await this.planPaths(paths);
		if (changes.length === 0) {
			return { applied: 0, skipped: 0, errors: 0 };
		}
		return this.writer.applyPlannedChanges(changes, this.managedState);
	}

	/** Plan changes without writing (used for dry runs and the test field). */
	async planPaths(paths: string[]): Promise<PlannedChange[]> {
		const settings = this.getSettings();
		const all: PlannedChange[] = [];
		for (const path of paths) {
			if (!this.isProcessable(path, settings)) continue;
			const fm: FrontmatterSnapshot = await this.writer.readFrontmatter(path);
			const changes = await this.engine.planForFile(
				path,
				fm,
				settings,
				this.managedState,
				this.vault,
				this.linkGenerator,
			);
			all.push(...changes);
		}
		return all;
	}

	/** Quick pre-filter: must be markdown and not match a global exclude. */
	private isProcessable(
		path: string,
		settings: StructuralMetadataSettings,
	): boolean {
		if (!path.toLowerCase().endsWith('.md')) return false;
		for (const pattern of settings.defaults.excludePatterns) {
			if (matchGlob(path, pattern)) return false;
		}
		return true;
	}

	/** All markdown file paths in the vault (excluding globally excluded). */
	getProcessableFilePaths(): string[] {
		const settings = this.getSettings();
		return this.vault
			.getAllMarkdownFilePaths()
			.filter((p) => this.isProcessable(p, settings));
	}

	/** All markdown file paths within a folder (recursively). */
	getProcessableFilePathsInFolder(folderPath: string): string[] {
		const settings = this.getSettings();
		const prefix = folderPath + '/';
		return this.vault
			.getAllMarkdownFilePaths()
			.filter(
				(p) =>
					(p === folderPath || p.startsWith(prefix)) &&
					this.isProcessable(p, settings),
			);
	}
}
