import { App, Plugin, TAbstractFile, TFile, TFolder, Vault } from 'obsidian';
import type { ProcessorResult } from '../types';
import type { ManagedStateStore } from '../state/ManagedStateStore';

/**
 * Interface the EventController needs from its host. The plugin implements it.
 */
export interface EventControllerHost {
	app: App;
	managedState: ManagedStateStore;
	getDebounceMs: () => number;
	processPaths: (paths: string[]) => Promise<ProcessorResult>;
}

/**
 * Registers vault `create` and `rename` events (after the layout is ready) and
 * feeds affected file paths into a debounced processing queue.
 *
 * - `create` fires for every existing file on initial vault load, so events
 *   are only registered inside `workspace.onLayoutReady`.
 * - `rename` covers both file rename and move; folder renames enqueue every
 *   markdown file under the new path and migrate managed-state prefixes.
 * - No global `modify` listener in v1 (avoids write loops).
 *
 * All events are registered via `plugin.registerEvent` so they are removed on
 * unload. The debounce timer is cleared in {@link stop}.
 */
export class EventController {
	private queue = new Set<string>();
	private timer: number | null = null;
	private processing = false;
	private started = false;

	constructor(
		private plugin: Plugin,
		private host: EventControllerHost,
	) {}

	start(): void {
		if (this.started) return;
		this.started = true;
		this.plugin.app.workspace.onLayoutReady(() => this.registerEvents());
	}

	private registerEvents(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on('create', (file: TAbstractFile) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.enqueue(file.path);
				}
			}),
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
				this.handleRename(file, oldPath);
			}),
		);
	}

	private handleRename(file: TAbstractFile, oldPath: string): void {
		if (file instanceof TFile && file.extension === 'md') {
			this.host.managedState.migratePath(oldPath, file.path);
			this.enqueue(file.path);
		} else if (file instanceof TFolder) {
			this.host.managedState.migratePrefix(oldPath, file.path);
			Vault.recurseChildren(file, (child) => {
				if (child instanceof TFile && child.extension === 'md') {
					this.enqueue(child.path);
				}
			});
		}
	}

	enqueue(path: string): void {
		this.queue.add(path);
		this.scheduleFlush();
	}

	private scheduleFlush(): void {
		if (this.timer !== null) return;
		const delay = Math.max(0, this.host.getDebounceMs());
		this.timer = window.setTimeout(() => {
			this.timer = null;
			void this.flush();
		}, delay);
	}

	private async flush(): Promise<void> {
		if (this.processing) return;
		this.processing = true;
		const paths = Array.from(this.queue);
		this.queue.clear();
		try {
			await this.host.processPaths(paths);
		} catch (err) {
			console.error('[Structural Metadata] Processing queue error:', err);
		} finally {
			this.processing = false;
			if (this.queue.size > 0) this.scheduleFlush();
		}
	}

	/** Stop the controller and clear any pending timer. Called on unload. */
	stop(): void {
		if (this.timer !== null) {
			window.clearTimeout(this.timer);
			this.timer = null;
		}
		this.queue.clear();
		this.started = false;
	}
}
