import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useFiles } from "./FilesContext";
import sortFiles from "../utils/sortFiles";

const FileNavigationContext = createContext();

export const FileNavigationProvider = ({ children, initialPath, onSortChange, onFolderChange }) => {
  const { files } = useFiles();
  const isMountRef = useRef(false);
  const previousPathRef = useRef("");
  const [currentPath, setCurrentPath] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentPathFiles, setCurrentPathFiles] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  useEffect(() => {
    if (!Array.isArray(files)) return;
    if (files.length === 1 && files[0].isPlaceholder) {
      setCurrentPathFiles([]);
      setCurrentFolder(null);
      return;
    }
    if (files.length > 0) {
      setCurrentPathFiles(() => {
        const currPathFiles = files.filter((file) => file.path === `${currentPath}/${file.name}`);
        return sortFiles(currPathFiles, sortConfig.key, sortConfig.direction);
      });

      setCurrentFolder(() => {
        return files.find((file) => file.path === currentPath) ?? null;
      });
    }
  }, [files, currentPath, sortConfig]);

  useEffect(() => {
    if (!Array.isArray(files)) return;
    if (files.length === 1 && files[0].isPlaceholder) {
      setCurrentPath("");
      return;
    }
    if (!isMountRef.current && files.length > 0) {
      setCurrentPath(files.some((file) => file.path === initialPath) ? initialPath : "");
      isMountRef.current = true;
    }
  }, [initialPath, files]);

  useEffect(() => {
    if (onSortChange) {
      onSortChange(sortConfig);
    }
  }, [sortConfig, onSortChange]);

  const handleFolderChange = (folder) => {
    const newPath = folder ? folder.path : "";

    // Only trigger callback if path actually changed and not on mount
    if (isMountRef.current && newPath !== currentPath && onFolderChange) {
      const prevPath = previousPathRef.current;
      onFolderChange(folder, prevPath, newPath);
    }

    previousPathRef.current = newPath;
    setCurrentPath(newPath);
  };

  return (
    <FileNavigationContext.Provider
      value={{
        currentPath,
        setCurrentPath,
        currentFolder,
        setCurrentFolder,
        currentPathFiles,
        setCurrentPathFiles,
        sortConfig,
        setSortConfig,
        handleFolderChange,
      }}
    >
      {children}
    </FileNavigationContext.Provider>
  );
};

export const useFileNavigation = () => useContext(FileNavigationContext);
