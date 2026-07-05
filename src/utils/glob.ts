/**
 * Minimal glob-to-regex compiler supporting the subset used by this plugin:
 *   `**`  matches any number of path segments (including zero)
 *   `*`   matches any character except `/`
 *   `?`   matches a single character except `/`
 *
 * No external dependencies. Compiled regexes are cached.
 */

const cache = new Map<string, RegExp>();

/**
 * Private-use placeholder for the `**` segment. Using a character from the
 * Unicode Private Use Area avoids any collision with real glob content and
 * keeps control characters out of regular-expression literals.
 */
const STARSTAR = '\uE000STARSTAR\uE000';

/**
 * Convert a glob pattern into a RegExp anchored to the full path.
 *
 * The path separator is always `/` (vault paths are POSIX style).
 */
export function compileGlob(glob: string): RegExp {
	const cached = cache.get(glob);
	if (cached) return cached;

	const normalized = glob.replace(/^\/+|\/+$/g, '');
	const regex = normalized
		.split('/')
		.map((segment) => {
			if (segment === '**') return STARSTAR;
			return segment
				.replace(/[.+^${}()|[\]\\]/g, '\\$&')
				.replace(/\*/g, '[^/]*')
				.replace(/\?/g, '[^/]');
		})
		.join('/');

	// `**/` -> optional path prefix; `**` -> anything (crosses `/`).
	const starStarSlash = new RegExp(STARSTAR + '/', 'g');
	const starStar = new RegExp(STARSTAR, 'g');
	const final = regex.replace(starStarSlash, '(?:.+/)?').replace(starStar, '.*');

	const re = new RegExp('^' + final + '$');
	cache.set(glob, re);
	return re;
}

/** Return true when `path` matches the glob `pattern`. */
export function matchGlob(path: string, pattern: string): boolean {
	return compileGlob(pattern).test(path);
}
