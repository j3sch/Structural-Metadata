import type { ResolverConfig, ResolverType } from '../rules';
import type { ResolverContext, ResolverFn, ResolverResult } from '../resolvers';

type ErasedResolverFn = (
  config: ResolverConfig,
  ctx: ResolverContext,
) => Promise<ResolverResult>;

/**
 * Registry of resolver implementations keyed by resolver type.
 *
 * Resolvers are pure-ish: they receive a {@link ResolverContext} (which
 * abstracts vault access) and a {@link ResolverConfig}, and return a
 * {@link ResolverResult}. They never write to files.
 */
export class ResolverRegistry {
  private resolvers = new Map<ResolverType, ErasedResolverFn>();

  register<T extends ResolverType>(type: T, fn: ResolverFn<T>): void {
    this.resolvers.set(type, fn as unknown as ErasedResolverFn);
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
        `[Structural Properties] Resolver "${config.type}" threw:`,
        err,
      );
      return { matched: false, resultType: 'raw' };
    }
  }
}
