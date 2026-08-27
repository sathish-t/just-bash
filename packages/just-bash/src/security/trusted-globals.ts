/**
 * SECURITY: Pre-captured references to dangerous globals.
 *
 * These are captured at module load time (before defense-in-depth patches)
 * so that just-bash infrastructure can use them. They bypass all defense
 * protections.
 *
 * DO NOT import these from command implementations unless absolutely
 * necessary. Any import from this module should be reviewed for security
 * implications.
 */
export const _performanceNow: () => number = performance.now.bind(performance);
/** Internal capability revocation; never expose this constructor to commands. */
export const _Proxy: ProxyConstructor = globalThis.Proxy;
