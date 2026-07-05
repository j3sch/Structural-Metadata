import type {
	ResolverConfig,
	ResolverContext,
	ResolverFn,
	ResolverResult,
	ResolverType,
} from '../types';

/**
 * Registry of resolver implementations keyed by resolver type.
 *
 * Resolvers are pure-ish: they receive a {@link ResolverContext} (which
 * abstracts vault access) and a {@link ResolverConfig}, and return a
 * {@link ResolverResult}. They never write to files.
 */
export class ResolverRegistry {
	private resolvers = new Map<ResolverType, ResolverFn>();

	register(type: ResolverType, fn: ResolverFn): void {
		this.resolvers.set(type, fn);
	}

	has(type: ResolverType): boolean {
		return this.resolvers.has(type);
	}

	async resolve(
		config: ResolverConfig,
		ctx: ResolverContext,
	): Promise<ResolverResult> {
		const fn = this.resolvers.get(config.type);
		if (!fn) {
			return { matched: false, resultType: 'raw' };
		}
		try {
			return await fn(config, ctx);
		} catch (err) {
			console.error(
				`[Structural Metadata] Resolver "${config.type}" threw:`,
				err,
			);
			return { matched: false, resultType: 'raw' };
		}
	}
}
