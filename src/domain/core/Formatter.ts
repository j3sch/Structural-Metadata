import type { FormatConfig, TextTransform } from '../rules';
import type { ResolverContext, ResolverResult } from '../resolvers';
import type { LinkGenerator } from '../../ports/LinkGenerator';
import { getFileName } from '../../utils/path';

function applyTransform(value: string, transform: TextTransform | undefined): string {
	if (transform === 'lowercase') return value.toLowerCase();
	if (transform === 'uppercase') return value.toUpperCase();
	return value;
}

/** Convert any value to a string without relying on Object's toString. */
function safeString(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (typeof value === 'bigint') return value.toString();
	if (value === null || value === undefined) return '';
	if (Array.isArray(value)) return value.map(safeString).join(', ');
	try {
		return JSON.stringify(value) ?? '';
	} catch {
		return '[object]';
	}
}

function toBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const v = value.trim().toLowerCase();
		return v === 'true' || v === 'yes' || v === '1';
	}
	if (typeof value === 'number') return value !== 0;
	return false;
}

function toNumber(value: unknown): number | null {
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const n = Number(value.trim());
		return Number.isNaN(n) ? null : n;
	}
	if (typeof value === 'boolean') return value ? 1 : 0;
	return null;
}

function toList(value: unknown, delimiter: string): string[] {
	if (Array.isArray(value)) {
		return value.map((v) => safeString(v).trim()).filter((s) => s.length > 0);
	}
	if (typeof value === 'string') {
		return value
			.split(delimiter)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}
	if (value === null || value === undefined) return [];
	return [safeString(value)];
}

function toTag(value: unknown, transform: TextTransform | undefined): string {
	const raw =
		typeof value === 'string'
			? value
			: Array.isArray(value)
				? value[0] != null ? safeString(value[0]) : ''
				: value == null
					? ''
					: safeString(value);
	let tag = applyTransform(raw.trim(), transform);
	if (tag.length === 0) return '';
	if (!tag.startsWith('#')) tag = '#' + tag;
	return tag;
}

/**
 * Converts a resolver result into a YAML-compatible value according to the
 * rule's format configuration.
 *
 * - file-ref results are turned into links (wikilink or markdown link)
 * - inherited results are passed through (type preserved)
 * - raw results are coerced to the configured format type
 */
export class Formatter {
	constructor(private linkGenerator: LinkGenerator) {}

	format(
		result: ResolverResult,
		fmt: FormatConfig,
		ctx: ResolverContext,
	): unknown {
		if (!result.matched) return undefined;

		if (result.resultType === 'file-ref' && result.targetFilePath) {
			if (fmt.type === 'wikilink') {
				return this.formatFileLink(result.targetFilePath, ctx, fmt);
			}
			// Non-link format for a file reference: use the note's name.
			return this.coerceRaw(getFileName(result.targetFilePath), fmt);
		}

		if (result.resultType === 'inherited') {
			let val = result.inheritedValue;
			if (
				typeof val === 'string' &&
				'transform' in fmt &&
				fmt.transform &&
				fmt.transform !== 'none'
			) {
				val = applyTransform(val, fmt.transform);
			}
			return val;
		}

		if (result.resultType === 'raw') {
			return this.coerceRaw(result.rawValue, fmt);
		}
		return undefined;
	}

	private formatFileLink(
		targetPath: string,
		ctx: ResolverContext,
		fmt: Extract<FormatConfig, { type: 'wikilink' }>,
	): string {
		const style = fmt.style ?? 'full-path';
		if (style === 'obsidian-preference') {
			return this.linkGenerator.generateLink(
				targetPath,
				ctx.filePath,
				'obsidian-preference',
				fmt.alias,
			);
		}
		// full-path wikilink, without the .md extension
		const linkPath = targetPath.replace(/\.md$/i, '');
		return fmt.alias ? `[[${linkPath}|${fmt.alias}]]` : `[[${linkPath}]]`;
	}

	private coerceRaw(rawValue: unknown, fmt: FormatConfig): unknown {
		switch (fmt.type) {
			case 'boolean':
				return toBoolean(rawValue);
			case 'number':
				return toNumber(rawValue);
			case 'list':
				return toList(rawValue, fmt.delimiter ?? ',');
			case 'tag':
				return toTag(rawValue, fmt.transform);
			case 'wikilink': {
				if (typeof rawValue === 'string') {
					const linkPath = rawValue.replace(/\.md$/i, '');
					return fmt.alias ? `[[${linkPath}|${fmt.alias}]]` : `[[${linkPath}]]`;
				}
				return safeString(rawValue);
			}
			case 'text':
			default: {
				if (typeof rawValue === 'string') {
					return applyTransform(rawValue, fmt.transform);
				}
				if (rawValue === null || rawValue === undefined) return '';
				if (Array.isArray(rawValue)) {
					return rawValue.map((v) => safeString(v)).join(fmt.delimiter ?? ',');
				}
				if (typeof rawValue === 'boolean' || typeof rawValue === 'number') {
					return String(rawValue);
				}
				return safeString(rawValue);
			}
		}
	}
}
