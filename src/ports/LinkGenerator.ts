import type { LinkStyle } from '../domain/rules';

export interface LinkGenerator {
	generateLink(
		targetPath: string,
		sourcePath: string,
		style: LinkStyle,
		alias?: string,
	): string;
}
