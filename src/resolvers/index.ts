import { ResolverRegistry } from '../domain/core/ResolverRegistry';
import {
	resolveAncestorFolderNote,
	resolveInheritProperty,
	resolveNearestFolderNote,
	resolveParentFolderNote,
} from './folderNoteResolvers';
import {
	resolvePathRegex,
	resolvePathSegment,
	resolveStatic,
} from './valueResolvers';

/** Register all built-in resolvers onto a registry. */
export function registerResolvers(registry: ResolverRegistry): void {
	registry.register('parent-folder-note', resolveParentFolderNote);
	registry.register('ancestor-folder-note', resolveAncestorFolderNote);
	registry.register('nearest-folder-note', resolveNearestFolderNote);
	registry.register('path-segment', resolvePathSegment);
	registry.register('path-regex', resolvePathRegex);
	registry.register('inherit-property', resolveInheritProperty);
	registry.register('static', resolveStatic);
}

/** Build a registry pre-populated with all built-in resolvers. */
export function createDefaultRegistry(): ResolverRegistry {
	const registry = new ResolverRegistry();
	registerResolvers(registry);
	return registry;
}
