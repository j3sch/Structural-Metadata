import type { ResolverFn, ResolverType } from '../types';
import { ResolverRegistry } from '../core/ResolverRegistry';
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

const allResolvers: Record<ResolverType, ResolverFn> = {
	'parent-folder-note': resolveParentFolderNote,
	'ancestor-folder-note': resolveAncestorFolderNote,
	'nearest-folder-note': resolveNearestFolderNote,
	'path-segment': resolvePathSegment,
	'path-regex': resolvePathRegex,
	'inherit-property': resolveInheritProperty,
	static: resolveStatic,
};

/** Register all built-in resolvers onto a registry. */
export function registerResolvers(registry: ResolverRegistry): void {
	for (const [type, fn] of Object.entries(allResolvers)) {
		registry.register(type as ResolverType, fn);
	}
}

/** Build a registry pre-populated with all built-in resolvers. */
export function createDefaultRegistry(): ResolverRegistry {
	const registry = new ResolverRegistry();
	registerResolvers(registry);
	return registry;
}
