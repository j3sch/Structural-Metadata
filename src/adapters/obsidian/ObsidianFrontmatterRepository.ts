import { App, Notice, TFile } from 'obsidian';
import type {
	FrontmatterSnapshot,
	PlannedChange,
	ProcessorResult,
} from '../../domain/changes';
import type { FrontmatterRepository } from '../../ports/FrontmatterRepository';
import type { ManagedStateWriter } from '../../domain/managed-state';
import { hashValue } from '../../utils/hash';

export class ObsidianFrontmatterRepository implements FrontmatterRepository {
	constructor(private app: App) {}

	async applyPlannedChanges(
		changes: PlannedChange[],
		managedState: ManagedStateWriter,
	): Promise<ProcessorResult> {
		const byFile = groupByFile(changes);
		let applied = 0;
		let skipped = 0;
		let errors = 0;

		for (const [filePath, fileChanges] of byFile) {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) {
				errors += fileChanges.length;
				continue;
			}
			await this.ensureFrontmatterSkeleton(file);
			try {
				await this.app.fileManager.processFrontMatter(
					file,
					(frontmatter: Record<string, unknown>) => {
					for (const change of fileChanges) {
						if (change.action === 'set') frontmatter[change.property] = change.newValue;
						if (change.action === 'clear') delete frontmatter[change.property];
					}
					},
				);
				for (const change of fileChanges) {
					if (change.action === 'set') {
						managedState.recordWrite(
							filePath,
							change.property,
							change.ruleId,
							hashValue(change.newValue),
						);
						applied++;
					} else if (change.action === 'clear') {
						managedState.recordClear(filePath, change.property);
						applied++;
					} else {
						skipped++;
					}
				}
			} catch (error) {
				errors += fileChanges.length;
				console.error(`[Structural Properties] Failed to update "${filePath}":`, error);
				new Notice(`Structural properties: could not update "${filePath}" (see console)`, 5000);
			}
		}
		return { applied, skipped, errors };
	}

	async readFrontmatter(filePath: string): Promise<FrontmatterSnapshot> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) return {};
		return this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
	}

	private async ensureFrontmatterSkeleton(file: TFile): Promise<void> {
		const content = await this.app.vault.cachedRead(file);
		if (content.trim() === '') await this.app.vault.process(file, () => '---\n---\n');
	}
}

function groupByFile(changes: PlannedChange[]): Map<string, PlannedChange[]> {
	const grouped = new Map<string, PlannedChange[]>();
	for (const change of changes) {
		const current = grouped.get(change.filePath) ?? [];
		current.push(change);
		grouped.set(change.filePath, current);
	}
	return grouped;
}
