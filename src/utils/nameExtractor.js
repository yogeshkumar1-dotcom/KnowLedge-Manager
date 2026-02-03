// Extract candidate name from filename
export const extractCandidateFromFilename = (filename) => {
  if (!filename) return null;
  
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Pattern for "Communication Round __ Shreyas __ Grazitti Interactive" or "Comm Round __ Vansh Singla __ Grazitti"
  const zoomPattern = /__ ([A-Za-z]+(?:\s+[A-Za-z]+)*) __/;
  const zoomMatch = nameWithoutExt.match(zoomPattern);
  if (zoomMatch) {
    return zoomMatch[1].trim();
  }
  
  // Common patterns for interview filenames
  const patterns = [
    // "John_Doe_Interview.mp4" or "John-Doe-Interview.mp4"
    /^([A-Za-z]+[_-][A-Za-z]+)[_-]?[Ii]nterview/,
    // "Interview_John_Doe.mp4" or "Interview-John-Doe.mp4"  
    /[Ii]nterview[_-]([A-Za-z]+[_-][A-Za-z]+)/,
    // "John Doe Interview.mp4"
    /^([A-Za-z]+ [A-Za-z]+) [Ii]nterview/,
    // "Interview John Doe.mp4"
    /[Ii]nterview ([A-Za-z]+ [A-Za-z]+)/,
    // Just "John_Doe.mp4" or "John-Doe.mp4"
    /^([A-Za-z]+[_-][A-Za-z]+)$/,
    // Just "John Doe.mp4"
    /^([A-Za-z]+ [A-Za-z]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      // Replace underscores/hyphens with spaces and title case
      return match[1]
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }
  
  return null;
};