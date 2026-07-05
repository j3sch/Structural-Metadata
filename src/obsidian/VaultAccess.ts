import { App, TFile, TFolder } from 'obsidian';
import type { FileRef, FolderRef, VaultAccess } from '../types';

/**
 * Obsidian-backed implementation of the {@link VaultAccess} abstraction.
 *
 * Frontmatter is read from the metadata cache (no disk I/O) for speed.
 */
export class ObsidianVaultAccess implements VaultAccess {
	constructor(private app: App) {}

	getFileByPath(path: string): FileRef | null {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			return { path: file.path, basename: file.basename, extension: file.extension };
		}
		return null;
	}

	getFolderByPath(path: string): FolderRef | null {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (folder instanceof TFolder) {
			return { path: folder.path, name: folder.name };
		}
		return null;
	}

	fileExists(path: string): boolean {
		return this.app.vault.getAbstractFileByPath(path) != null;
	}

	async readFrontmatter(
		path: string,
	): Promise<Record<string, unknown> | null> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return null;
		const cache = this.app.metadataCache.getFileCache(file);
		return cache?.frontmatter ?? null;
	}

	getAllMarkdownFilePaths(): string[] {
		return this.app.vault.getMarkdownFiles().map((f) => f.path);
	}
}
