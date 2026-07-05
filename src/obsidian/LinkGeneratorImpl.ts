import { App, TFile } from 'obsidian';
import type { LinkGenerator, LinkStyle } from '../types';

/**
 * Obsidian-backed link generator.
 *
 * - `obsidian-preference` uses `app.fileManager.generateMarkdownLink`, which
 *   respects the user's link format settings (shortest path when unique, etc.).
 * - `full-path` produces a wikilink with the full vault path (no `.md`).
 */
export class ObsidianLinkGenerator implements LinkGenerator {
	constructor(private app: App) {}

	generateLink(
		targetPath: string,
		sourcePath: string,
		style: LinkStyle,
		alias?: string,
	): string {
		if (style === 'obsidian-preference') {
			const file = this.app.vault.getAbstractFileByPath(targetPath);
			if (file instanceof TFile) {
				return this.app.fileManager.generateMarkdownLink(
					file,
					sourcePath,
					undefined,
					alias,
				);
			}
		}

		const linkPath = targetPath.replace(/\.md$/i, '');
		return alias ? `[[${linkPath}|${alias}]]` : `[[${linkPath}]]`;
	}
}
