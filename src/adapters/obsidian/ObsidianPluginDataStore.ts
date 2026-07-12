import type { Plugin } from 'obsidian';
import type { StructuralMetadataSettings } from '../../domain/rules';
import type { PluginDataStore } from '../../ports/PluginDataStore';
import { mergeSettings } from '../../settings';

export class ObsidianPluginDataStore implements PluginDataStore {
	constructor(private plugin: Plugin) {}

	async load(): Promise<StructuralMetadataSettings> {
		return mergeSettings(await this.plugin.loadData());
	}

	async save(settings: StructuralMetadataSettings): Promise<void> {
		await this.plugin.saveData(settings);
	}
}
