import { MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import type { ProcessorResult } from './types';
import { mergeSettings } from './settings';
import { ManagedStateStore } from './state/ManagedStateStore';
import { DiffEngine } from './core/DiffEngine';
import { Formatter } from './core/Formatter';
import { RuleEngine } from './core/RuleEngine';
import { createDefaultRegistry } from './resolvers';
import { ObsidianLinkGenerator } from './obsidian/LinkGeneratorImpl';
import { ObsidianVaultAccess } from './obsidian/VaultAccess';
import { FrontmatterWriter } from './obsidian/FrontmatterWriter';
import { MetadataProcessor } from './obsidian/MetadataProcessor';
import {
	EventController,
	type EventControllerHost,
} from './obsidian/EventController';
import { StructuralMetadataSettingsTab } from './ui/SettingsTab';
import { DryRunModal } from './ui/DryRunModal';
import { registerCommands } from './commands';

export default class StructuralMetadataPlugin extends Plugin {
	settings!: ReturnType<typeof mergeSettings>;
	managedState!: ManagedStateStore;
	vaultAccess!: ObsidianVaultAccess;
	linkGenerator!: ObsidianLinkGenerator;
	processor!: MetadataProcessor;
	private eventController!: EventController;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.vaultAccess = new ObsidianVaultAccess(this.app);
		this.linkGenerator = new ObsidianLinkGenerator(this.app);

		const registry = createDefaultRegistry();
		const formatter = new Formatter(this.linkGenerator);
		const diffEngine = new DiffEngine();
		const engine = new RuleEngine(registry, formatter, diffEngine);
		const writer = new FrontmatterWriter(this.app);

		this.processor = new MetadataProcessor(
			this.app,
			engine,
			writer,
			this.vaultAccess,
			this.linkGenerator,
			() => this.settings,
			this.managedState,
		);

		registerCommands(this);
		this.addSettingTab(new StructuralMetadataSettingsTab(this.app, this));

		this.eventController = new EventController(this, this.makeEventHost());
		this.eventController.start();

		// Prune managed state for files that no longer exist once the layout is ready.
		this.app.workspace.onLayoutReady(() => {
			this.pruneManagedState();
		});
	}

	onunload(): void {
		this.eventController?.stop();
	}

	private makeEventHost(): EventControllerHost {
		return {
			app: this.app,
			managedState: this.managedState,
			getDebounceMs: () => this.settings.defaults.debounceMs,
			processPaths: (paths) => this.processPaths(paths),
		};
	}

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as
			| Partial<ReturnType<typeof mergeSettings>>
			| null;
		this.settings = mergeSettings(loaded);
		this.managedState = new ManagedStateStore(this.settings.managedState);
	}

	async saveSettings(): Promise<void> {
		this.settings.managedState = this.managedState.state;
		await this.saveData(this.settings);
	}

	/** Process (plan + apply) a set of file paths, then persist managed state. */
	async processPaths(paths: string[]): Promise<ProcessorResult> {
		const result = await this.processor.processPaths(paths);
		await this.saveSettings();
		return result;
	}

	// -------------------------------------------------------------------------
	// Command implementations
	// -------------------------------------------------------------------------

	private getActiveFile(): TFile | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view?.file) return view.file;
		return this.app.workspace.getActiveFile();
	}

	async refreshCurrentFile(): Promise<void> {
		const file = this.getActiveFile();
		if (!file) {
			new Notice('Structural metadata: no active file');
			return;
		}
		const result = await this.processPaths([file.path]);
		this.reportResult(result, 'current file');
	}

	async refreshCurrentFolder(): Promise<void> {
		const file = this.getActiveFile();
		if (!file || !file.parent) {
			new Notice('Structural metadata: no active file to determine a folder');
			return;
		}
		const paths = this.processor.getProcessableFilePathsInFolder(file.parent.path);
		if (paths.length === 0) {
			new Notice('Structural metadata: no processable files in this folder');
			return;
		}
		new Notice(`Structural metadata: refreshing ${paths.length} file(s)…`);
		const result = await this.processPaths(paths);
		this.reportResult(result, 'folder');
	}

	async refreshEntireVault(): Promise<void> {
		const paths = this.processor.getProcessableFilePaths();
		if (paths.length === 0) {
			new Notice('Structural metadata: no processable files found');
			return;
		}
		new Notice(`Structural metadata: refreshing ${paths.length} file(s)…`);
		const result = await this.processPaths(paths);
		this.reportResult(result, 'vault');
	}

	async dryRunCurrentFolder(): Promise<void> {
		const file = this.getActiveFile();
		if (!file || !file.parent) {
			new Notice('Structural metadata: no active file to determine a folder');
			return;
		}
		const paths = this.processor.getProcessableFilePathsInFolder(file.parent.path);
		await this.runDryRun(paths);
	}

	async dryRunEntireVault(): Promise<void> {
		const paths = this.processor.getProcessableFilePaths();
		await this.runDryRun(paths);
	}

	private async runDryRun(paths: string[]): Promise<void> {
		if (paths.length === 0) {
			new Notice('Structural metadata: no processable files found');
			return;
		}
		new Notice(`Structural metadata: planning for ${paths.length} file(s)…`);
		const changes = await this.processor.planPaths(paths);
		const actionable = changes.filter(
			(c) => c.action === 'set' || c.action === 'clear',
		);
		const apply = async (): Promise<void> => {
			const uniquePaths = Array.from(new Set(actionable.map((c) => c.filePath)));
			const result = await this.processPaths(uniquePaths);
			this.reportResult(result, 'dry run apply');
		};
		new DryRunModal(this.app, changes, apply).open();
	}

	async cleanManagedState(): Promise<void> {
		const removed = this.pruneManagedState();
		await this.saveSettings();
		new Notice(
			`Structural metadata: pruned ${removed} stale managed-state entr${removed === 1 ? 'y' : 'ies'}`,
		);
	}

	private pruneManagedState(): number {
		const existing = new Set(this.vaultAccess.getAllMarkdownFilePaths());
		return this.managedState.prune(existing);
	}

	private reportResult(result: ProcessorResult, scope: string): void {
		if (result.errors > 0) {
			new Notice(
				`Structural metadata (${scope}): ${result.applied} applied, ${result.errors} error(s)`,
				6000,
			);
		} else if (result.applied === 0) {
			new Notice(`Structural metadata (${scope}): nothing to change`);
		} else {
			new Notice(
				`Structural metadata (${scope}): ${result.applied} change(s) applied`,
			);
		}
	}
}
