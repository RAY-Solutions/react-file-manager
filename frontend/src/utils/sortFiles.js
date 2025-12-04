const sortFiles = (items, sortKey = "name", direction = "asc") => {
  const folders = items.filter((file) => file.isDirectory);
  const files = items.filter((file) => !file.isDirectory);

  // Sort function based on key and direction
  const sortFunction = (a, b) => {
    let comparison = 0;
    const aName = a.displayName || a.name;
    const bName = b.displayName || b.name;

    switch (sortKey) {
      case "name":
        comparison = aName.localeCompare(bName);
        break;

      case "size":
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        comparison = sizeA - sizeB;
        break;

      case "modified":
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        comparison = dateA - dateB;
        break;

      default:
        comparison = aName.localeCompare(bName);
    }

    return direction === "asc" ? comparison : -comparison;
  };

  const sortedFolders = [...folders].sort(sortFunction);
  const sortedFiles = [...files].sort(sortFunction);

  return [...sortedFolders, ...sortedFiles];
};

export default sortFiles;
