import { useMemo, useState } from "react";
import Checkbox from "../../components/Checkbox/Checkbox";
import { useSelection } from "../../contexts/SelectionContext";
import { useFileNavigation } from "../../contexts/FileNavigationContext";

const FilesHeader = ({ unselectFiles, disableMultipleSelection }) => {
  const [showSelectAll, setShowSelectAll] = useState(false);

  const { selectedFiles, setSelectedFiles } = useSelection();
  const { currentPathFiles, sortConfig, setSortConfig } = useFileNavigation();

  const allFilesSelected = useMemo(() => {
    return currentPathFiles.length > 0 && selectedFiles.length === currentPathFiles.length;
  }, [selectedFiles, currentPathFiles]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFiles(currentPathFiles);
      setShowSelectAll(true);
    } else {
      unselectFiles();
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div
      className="files-header"
      onMouseOver={() => setShowSelectAll(true)}
      onMouseLeave={() => setShowSelectAll(false)}
    >
      <div className="file-select-all">
        {(showSelectAll || allFilesSelected) && !disableMultipleSelection && (
          <Checkbox
            checked={allFilesSelected}
            onChange={handleSelectAll}
            title="Select all"
            disabled={currentPathFiles.length === 0}
          />
        )}
      </div>
      <div className={`file-name ${sortConfig?.key === "name" ? "active" : ""}`} onClick={() => handleSort("name")}>
        Name
        {sortConfig?.key === "name" && (
          <span className="sort-indicator">{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
        )}
      </div>
      <div
        className={`file-date ${sortConfig?.key === "modified" ? "active" : ""}`}
        onClick={() => handleSort("modified")}
      >
        Modified
        {sortConfig?.key === "modified" && (
          <span className="sort-indicator">{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
        )}
      </div>
      <div className={`file-size ${sortConfig?.key === "size" ? "active" : ""}`} onClick={() => handleSort("size")}>
        Size
        {sortConfig?.key === "size" && (
          <span className="sort-indicator">{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
        )}
      </div>
    </div>
  );
};

export default FilesHeader;
