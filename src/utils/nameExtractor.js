// Extract candidate name from filename
export const extractCandidateFromFilename = (filename) => {
  if (!filename) return null;

  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  /**
   * Pattern:
   * Anything _ Candidate Name _ Grazitti Interactive
   * Supports single or double underscores
   */
  const grazittiPattern =
    /[_]{1,2}\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[_]{1,2}\s*Grazitti\s+Interactive/i;

  const match = nameWithoutExt.match(grazittiPattern);

  if (match) {
    return match[1]
      .trim()
      .split(' ')
      .map(
        word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  }

  return null;
};
