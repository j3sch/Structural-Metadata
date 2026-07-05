/**
 * Pure path helpers. Vault paths are POSIX style (forward slashes, no leading
 * slash). These functions never touch the filesystem.
 */

/** Normalize backslashes to forward slashes. */
export function normalizeSlashes(p: string): string {
	return p.replace(/\\/g, '/');
}

/** Parent folder path of a file or folder. Returns '' for a top-level item. */
export function getParentFolderPath(path: string): string {
	const norm = normalizeSlashes(path);
	const idx = norm.lastIndexOf('/');
	return idx === -1 ? '' : norm.slice(0, idx);
}

/** Last segment of a path (file name with extension, or folder name). */
export function getBaseName(path: string): string {
	const norm = normalizeSlashes(path);
	const idx = norm.lastIndexOf('/');
	return idx === -1 ? norm : norm.slice(idx + 1);
}

/** File name without extension. */
export function getFileName(path: string): string {
	const base = getBaseName(path);
	const idx = base.lastIndexOf('.');
	return idx <= 0 ? base : base.slice(0, idx);
}

/** File extension without the dot. */
export function getExtension(path: string): string {
	const base = getBaseName(path);
	const idx = base.lastIndexOf('.');
	return idx <= 0 ? '' : base.slice(idx + 1);
}

/** Name of the folder that contains the given file path. */
export function getFolderName(filePath: string): string {
	return getBaseName(getParentFolderPath(filePath));
}

/** Split a path into non-empty segments. */
export function getPathSegments(path: string): string[] {
	return normalizeSlashes(path)
		.split('/')
		.filter((s) => s.length > 0);
}

/** Join path segments with a single slash. */
export function joinPath(...parts: string[]): string {
	return parts
		.map(normalizeSlashes)
		.join('/')
		.replace(/\/+/g, '/');
}
