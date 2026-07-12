import type { StructuralMetadataSettings } from '../domain/rules';

export interface PluginDataStore {
	load(): Promise<StructuralMetadataSettings>;
	save(settings: StructuralMetadataSettings): Promise<void>;
}
