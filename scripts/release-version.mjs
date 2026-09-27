const stableSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function releaseArtifactPaths(version) {
  const match = String(version ?? '').match(stableSemver);
  if (!match) throw new Error(`Release version must be stable major.minor.patch SemVer: ${version}`);
  const [, major, minor] = match;
  return {
    governance: `docs/RELEASE_CANDIDATE_${major}_${minor}.md`,
    notes: `docs/RELEASE_NOTES_${version}.md`,
  };
}
