import type { LinkGenerator } from '../ports/LinkGenerator';
import type { VaultAccess } from '../ports/VaultAccess';
import type { ResolverConfig, ResolverType } from './rules';

export type ResolverResult =
	| {
			matched: false;
			resultType: 'file-ref' | 'raw' | 'inherited';
			targetFilePath?: never;
			rawValue?: never;
			inheritedValue?: never;
		}
	| {
			matched: true;
			resultType: 'file-ref';
			targetFilePath: string;
			rawValue?: never;
			inheritedValue?: never;
		}
	| {
			matched: true;
			resultType: 'raw';
			rawValue: unknown;
			targetFilePath?: never;
			inheritedValue?: never;
		}
	| {
			matched: true;
			resultType: 'inherited';
			inheritedValue: unknown;
			targetFilePath?: never;
			rawValue?: never;
		};

export interface ResolverContext {
	filePath: string;
	fileName: string;
	fileBasename: string;
	parentFolderPath: string;
	vault: VaultAccess;
	folderNotePatterns: string[];
	linkGenerator: LinkGenerator;
}

export type ResolverConfigFor<T extends ResolverType> = Extract<
	ResolverConfig,
	{ type: T }
>;

export type ResolverFn<T extends ResolverType = ResolverType> = (
	config: ResolverConfigFor<T>,
	ctx: ResolverContext,
) => Promise<ResolverResult>;
