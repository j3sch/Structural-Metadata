import type { ResolverFn } from '../types';
import { getBaseName, getPathSegments } from '../utils/path';

export const resolvePathSegment: ResolverFn = async (config, ctx) => {
	const source = config.segmentSource ?? 'current-folder';
	let value: string | undefined;

	if (source === 'current-folder') {
		value = getBaseName(ctx.parentFolderPath);
	} else {
		const segs = getPathSegments(ctx.filePath);
		const folderSegs = segs.slice(0, -1); // drop the filename
		const idx = config.segmentIndex ?? 0;
		value = folderSegs[idx];
	}

	if (value === undefined || value === '') {
		return { matched: false, resultType: 'raw' };
	}
	return { matched: true, rawValue: value, resultType: 'raw' };
};

export const resolvePathRegex: ResolverFn = async (config, ctx) => {
	const pattern = config.pattern;
	if (!pattern) return { matched: false, resultType: 'raw' };

	let re: RegExp;
	try {
		re = new RegExp(pattern);
	} catch {
		return { matched: false, resultType: 'raw' };
	}

	const m = ctx.filePath.match(re);
	if (!m) return { matched: false, resultType: 'raw' };

	const template = config.outputTemplate ?? '$0';
	const value = template.replace(
		/\$(\d+)|\$\{(\w+)\}/g,
		(_full, d1: string | undefined, name: string | undefined) => {
			if (d1 !== undefined) {
				const idx = parseInt(d1, 10);
				return m[idx] ?? '';
			}
			if (name !== undefined) {
				const groups = m.groups ?? {};
				return groups[name] ?? '';
			}
			return '';
		},
	);

	if (value === '') return { matched: false, resultType: 'raw' };
	return { matched: true, rawValue: value, resultType: 'raw' };
};

export const resolveStatic: ResolverFn = async (config) => {
	return { matched: true, rawValue: config.value, resultType: 'raw' };
};
