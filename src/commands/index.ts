import type { Plugin } from 'obsidian';

export interface CommandActions {
	refreshCurrentFile(): Promise<void>;
	refreshCurrentFolder(): Promise<void>;
	refreshEntireVault(): Promise<void>;
	dryRunCurrentFolder(): Promise<void>;
	dryRunEntireVault(): Promise<void>;
	cleanManagedState(): Promise<void>;
}

export function registerCommands(plugin: Plugin, actions: CommandActions): void {
	plugin.addCommand({
		id: 'refresh-current-file',
		name: 'Refresh current file',
		editorCallback: () => actions.refreshCurrentFile(),
	});
	plugin.addCommand({
		id: 'refresh-current-folder',
		name: 'Refresh current folder',
		editorCallback: () => actions.refreshCurrentFolder(),
	});
	plugin.addCommand({
		id: 'refresh-entire-vault',
		name: 'Refresh entire vault',
		callback: () => actions.refreshEntireVault(),
	});
	plugin.addCommand({
		id: 'dry-run-current-folder',
		name: 'Dry run current folder',
		editorCallback: () => actions.dryRunCurrentFolder(),
	});
	plugin.addCommand({
		id: 'dry-run-entire-vault',
		name: 'Dry run entire vault',
		callback: () => actions.dryRunEntireVault(),
	});
	plugin.addCommand({
		id: 'clean-managed-state',
		name: 'Clean managed state',
		callback: () => actions.cleanManagedState(),
	});
}
