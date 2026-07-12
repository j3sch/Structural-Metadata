import { Plugin, TAbstractFile, TFile, TFolder, Vault } from 'obsidian';
import type { ProcessorResult } from '../../domain/changes';
import type { ManagedStateStore } from '../../domain/ManagedStateStore';
import { DebouncedPathQueue } from '../../application/DebouncedPathQueue';

export interface EventControllerHost {
	managedState: ManagedStateStore;
	getDebounceMs: () => number;
	processPaths: (paths: string[]) => Promise<ProcessorResult>;
}

export class EventController {
	private started = false;
	private queue: DebouncedPathQueue;

	constructor(
		private plugin: Plugin,
		private host: EventControllerHost,
	) {
		this.queue = new DebouncedPathQueue(
			async (paths) => {
				try {
					await this.host.processPaths(paths);
				} catch (error) {
					console.error('[Structural Properties] Processing queue error:', error);
				}
			},
			this.host.getDebounceMs,
			{
				set: (callback, delayMs) => window.setTimeout(callback, delayMs),
				clear: (id) => window.clearTimeout(id),
			},
		);
	}

	start(): void {
		if (this.started) return;
		this.started = true;
		this.plugin.app.workspace.onLayoutReady(() => this.registerEvents());
	}

	enqueue(path: string): void {
		this.queue.enqueue(path);
	}

	stop(): void {
		this.queue.stop();
		this.started = false;
	}

	private registerEvents(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on('create', (file: TAbstractFile) => {
				if (file instanceof TFile && file.extension === 'md') this.enqueue(file.path);
			}),
		);
		this.plugin.registerEvent(
			this.plugin.app.vault.on('rename', (file, oldPath) => this.handleRename(file, oldPath)),
		);
	}

	private handleRename(file: TAbstractFile, oldPath: string): void {
		if (file instanceof TFile && file.extension === 'md') {
			this.host.managedState.migratePath(oldPath, file.path);
			this.enqueue(file.path);
			return;
		}
		if (file instanceof TFolder) {
			this.host.managedState.migratePrefix(oldPath, file.path);
			Vault.recurseChildren(file, (child) => {
				if (child instanceof TFile && child.extension === 'md') this.enqueue(child.path);
			});
		}
	}

}
