import { createContext, useContext, useEffect, useState } from "react";

const FilesContext = createContext();

export const FilesProvider = ({ children, filesData, onError }) => {
  const [files, setFiles] = useState(filesData);
  const [filesDisplayNames, setFilesDisplayNames] = useState(new Map());

  useEffect(() => {
    setFiles(filesData);
  }, [filesData]);

  useEffect(() => {
    const displayNameMap = new Map();
    filesData
      .filter((file) => file.displayName)
      .forEach((file) => {
        displayNameMap.set(file.path, file.displayName);
      });
    setFilesDisplayNames(displayNameMap);
  }, [filesData]);

  const getChildren = (file) => {
    if (!file.isDirectory) return [];

    return files.filter((child) => child.path === `${file.path}/${child.name}`);
  };

  return (
    <FilesContext.Provider value={{ files, filesDisplayNames, setFiles, getChildren, onError }}>
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => useContext(FilesContext);
