/**
 * List of commands that are not available in browser environments.
 *
 * These commands are excluded from the browser bundle because they:
 * - Use Node.js-specific APIs that don't have browser equivalents
 * - Have dependencies that don't work in browsers
 *
 * When a user tries to use one of these commands in a browser environment,
 * they should get a helpful error message explaining why the command
 * is not available.
 */
export const BROWSER_EXCLUDED_COMMANDS: readonly string[] = [
  "tar", // Uses native compression modules (@mongodb-js/zstd, node-liblzma, seek-bzip)
] as const;

/**
 * Check if a command is browser-excluded
 */
export function isBrowserExcludedCommand(commandName: string): boolean {
  return BROWSER_EXCLUDED_COMMANDS.includes(commandName);
}
