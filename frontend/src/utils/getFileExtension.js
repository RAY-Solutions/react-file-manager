export const getFileExtension = (fileName) => {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return ""; // No extension found
  return fileName.slice(lastDotIndex + 1).toLowerCase();
};
