import React, { useEffect, useState } from "react";
import FolderTree from "./FolderTree";
import { getParentPath } from "../../utils/getParentPath";
import { useFiles } from "../../contexts/FilesContext";
import "./NavigationPane.scss";
import FolderLoadingSkeleton from "../../components/FolderLoadingSkeleton/FolderLoadingSkeleton";

const NavigationPane = ({ folderLoaderPaths, onFileOpen }) => {
  const [foldersTree, setFoldersTree] = useState([]);
  const { files } = useFiles();

  const createChildRecursive = (path, foldersStruct) => {
    if (!foldersStruct[path]) return []; // No children for this path (folder)

    return foldersStruct[path]?.map((folder) => {
      return {
        ...folder,
        subDirectories: createChildRecursive(folder.path, foldersStruct),
      };
    });
  };

  useEffect(() => {
    if (Array.isArray(files)) {
      const folders = files.filter((file) => file.isDirectory);
      // Grouping folders by parent path
      const foldersStruct = Object.groupBy(folders, ({ path }) => getParentPath(path));
      setFoldersTree(() => {
        const rootPath = "";
        return createChildRecursive(rootPath, foldersStruct);
      });
    }
  }, [files]);

  return (
    <div className="sb-folders-list">
      {foldersTree?.length > 0 ? (
        <>
          {foldersTree?.map((folder, index) => {
            return <FolderTree key={index} folder={folder} onFileOpen={onFileOpen} />;
          })}
        </>
      ) : (
        folderLoaderPaths.length === 0 && <div className="empty-nav-pane">Nothing here yet</div>
      )}
      {folderLoaderPaths.length > 0 && <FolderLoadingSkeleton forNavigation={true} />}
    </div>
  );
};

NavigationPane.displayName = "NavigationPane";

export default NavigationPane;
