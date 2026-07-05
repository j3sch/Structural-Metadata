import type {
	FolderNoteSelfBehavior,
	ResolverContext,
	ResolverFn,
} from '../types';
import { findFolderNote } from '../core/FolderNoteFinder';
import { getParentFolderPath } from '../utils/path';

/**
 * If the discovered folder note is the current file itself, resolve according
 * to the configured self behavior:
 *  - `self`              -> the file links to itself
 *  - `none`              -> no match
 *  - `parent-folder-note`-> look one level higher (grandparent's folder note)
 */
function handleSelf(
	currentFilePath: string,
	foundNote: string | null,
	behavior: FolderNoteSelfBehavior,
	ctx: ResolverContext,
): string | null {
	if (!foundNote || foundNote !== currentFilePath) return foundNote;
	if (behavior === 'self') return currentFilePath;
	if (behavior === 'none') return null;
	const grandparent = getParentFolderPath(getParentFolderPath(currentFilePath));
	return findFolderNote(grandparent, ctx.folderNotePatterns, ctx.vault);
}

export const resolveParentFolderNote: ResolverFn = async (config, ctx) => {
	const behavior = config.folderNoteSelfBehavior ?? 'parent-folder-note';
	const found = findFolderNote(
		ctx.parentFolderPath,
		ctx.folderNotePatterns,
		ctx.vault,
	);
	const resolved = handleSelf(ctx.filePath, found, behavior, ctx);
	if (resolved) {
		return { matched: true, targetFilePath: resolved, resultType: 'file-ref' };
	}
	return { matched: false, resultType: 'file-ref' };
};

export const resolveAncestorFolderNote: ResolverFn = async (config, ctx) => {
	const root = config.root ?? '';
	const level = Math.max(1, config.levelBelowRoot ?? 1);
	const behavior = config.folderNoteSelfBehavior ?? 'parent-folder-note';
	const rootPrefix = root ? root + '/' : '';

	if (root === '' || !ctx.filePath.startsWith(rootPrefix)) {
		return { matched: false, resultType: 'file-ref' };
	}

	const afterRoot = ctx.filePath.slice(rootPrefix.length);
	const segs = afterRoot.split('/').filter((s) => s.length > 0);
	if (segs.length < level + 1) {
		return { matched: false, resultType: 'file-ref' };
	}

	const ancestorSegs = segs.slice(0, level);
	const ancestorFolder =
		ancestorSegs.length > 0 ? root + '/' + ancestorSegs.join('/') : root;

	const found = findFolderNote(ancestorFolder, ctx.folderNotePatterns, ctx.vault);
	const resolved = handleSelf(ctx.filePath, found, behavior, ctx);
	if (resolved) {
		return { matched: true, targetFilePath: resolved, resultType: 'file-ref' };
	}
	return { matched: false, resultType: 'file-ref' };
};

export const resolveNearestFolderNote: ResolverFn = async (config, ctx) => {
	const behavior = config.folderNoteSelfBehavior ?? 'parent-folder-note';
	let folder = ctx.parentFolderPath;
	let guard = 0;

	while (folder && guard < 100) {
		guard++;
		const found = findFolderNote(folder, ctx.folderNotePatterns, ctx.vault);
		if (found) {
			if (found === ctx.filePath) {
				if (behavior === 'self') {
					return {
						matched: true,
						targetFilePath: ctx.filePath,
						resultType: 'file-ref',
					};
				}
				// skip self, keep walking up
			} else {
				return { matched: true, targetFilePath: found, resultType: 'file-ref' };
			}
		}
		folder = getParentFolderPath(folder);
	}
	return { matched: false, resultType: 'file-ref' };
};

export const resolveInheritProperty: ResolverFn = async (config, ctx) => {
	const behavior = config.folderNoteSelfBehavior ?? 'parent-folder-note';
	const searchMode = config.searchMode ?? 'parent';
	const prop = config.sourceProperty;
	if (!prop) return { matched: false, resultType: 'inherited' };

	let foundNote: string | null = null;

	if (searchMode === 'nearest') {
		// Walk up from the parent folder until a folder note has the property.
		let folder = ctx.parentFolderPath;
		let guard = 0;
		while (folder && guard < 100) {
			guard++;
			const candidate = findFolderNote(
				folder,
				ctx.folderNotePatterns,
				ctx.vault,
			);
			if (candidate) {
				if (candidate === ctx.filePath) {
					if (behavior === 'self') {
						foundNote = candidate;
						break;
					} else if (behavior === 'none') {
						// skip
					} else {
						// parent-folder-note: don't use self, keep walking up
					}
				} else {
					const fm = await ctx.vault.readFrontmatter(candidate);
					if (fm && fm[prop] !== undefined && fm[prop] !== null && fm[prop] !== '') {
						foundNote = candidate;
						break;
					}
				}
			}
			folder = getParentFolderPath(folder);
		}
	} else {
		const parentFolder = ctx.parentFolderPath;
		foundNote = findFolderNote(parentFolder, ctx.folderNotePatterns, ctx.vault);
		if (foundNote && foundNote === ctx.filePath) {
			if (behavior === 'self') {
				foundNote = ctx.filePath;
			} else if (behavior === 'none') {
				foundNote = null;
			} else {
				foundNote = findFolderNote(
					getParentFolderPath(parentFolder),
					ctx.folderNotePatterns,
					ctx.vault,
				);
			}
		}
	}

	if (!foundNote) return { matched: false, resultType: 'inherited' };

	const fm = await ctx.vault.readFrontmatter(foundNote);
	if (!fm) return { matched: false, resultType: 'inherited' };

	const val = fm[prop];
	if (val === undefined || val === null || val === '') {
		return { matched: false, resultType: 'inherited' };
	}
	return { matched: true, inheritedValue: val, resultType: 'inherited' };
};
