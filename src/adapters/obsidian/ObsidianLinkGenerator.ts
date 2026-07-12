import { App, TFile } from 'obsidian';
import type { LinkStyle } from '../../domain/rules';
import type { LinkGenerator } from '../../ports/LinkGenerator';

export class ObsidianLinkGenerator implements LinkGenerator {
	constructor(private app: App) {}

	generateLink(
		targetPath: string,
		sourcePath: string,
		style: LinkStyle,
		alias?: string,
	): string {
		const target = this.app.vault.getAbstractFileByPath(targetPath);
		if (style === 'obsidian-preference' && target instanceof TFile) {
			return this.app.fileManager.generateMarkdownLink(target, sourcePath, undefined, alias);
		}
		const path = targetPath.replace(/\.md$/i, '');
		return alias ? `[[${path}|${alias}]]` : `[[${path}]]`;
	}
}
