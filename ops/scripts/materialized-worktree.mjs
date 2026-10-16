/**
 * Allow only generated deployment files in a pinned release checkout.
 * Any tracked edit or unrelated untracked file would make a build differ from
 * the immutable commit named by RELEASE_MANIFEST.json.
 *
 * @param {string} statusOutput
 * @param {readonly string[]} generatedPaths
 * @param {string} component
 */
export function assertMaterializedWorktreeClean(statusOutput, generatedPaths, component) {
  const allowed = new Set(generatedPaths);
  const unexpected = statusOutput
    .split('\n')
    .filter(Boolean)
    .filter((entry) => {
      const status = entry.slice(0, 2);
      const path = entry.slice(3);
      return status !== '??' || !allowed.has(path);
    });

  if (unexpected.length > 0) {
    throw new Error(
      `${component} pinned release checkout is dirty outside generated files: ${unexpected.join(', ')}`,
    );
  }
}
