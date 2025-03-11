const sortAscending = (files) =>
  files.sort((a, b) => {
    const aName = a.displayName || a.name;
    const bName = b.displayName || b.name;
    return aName.localeCompare(bName);
  });

const sortFiles = (items) => {
  const folders = items.filter((file) => file.isDirectory);
  const files = items.filter((file) => !file.isDirectory);
  const sortedFolders = sortAscending(folders);
  const sortedFiles = sortAscending(files);

  return [...sortedFolders, ...sortedFiles];
};

export default sortFiles;
