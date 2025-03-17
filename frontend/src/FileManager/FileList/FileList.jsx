import { useMemo, useRef } from "react";
import FileItem from "./FileItem";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useLayout } from "../../contexts/LayoutContext";
import ContextMenu from "../../components/ContextMenu/ContextMenu";
import { useDetectOutsideClick } from "../../hooks/useDetectOutsideClick";
import useFileList from "./useFileList";
import FilesHeader from "./FilesHeader";
import "./FileList.scss";
import FolderLoadingSkeleton from "../../components/FolderLoadingSkeleton/FolderLoadingSkeleton";

const FileList = ({
  onCreateFolder,
  onRename,
  onFileOpen,
  onRefresh,
  enableFilePreview,
  triggerAction,
  disableMultipleSelection,
  folderLoaderPaths,
}) => {
  const { currentPath, currentPathFiles } = useFileNavigation();
  const filesViewRef = useRef(null);
  const { activeLayout } = useLayout();

  const {
    emptySelecCtxItems,
    selecCtxItems,
    handleContextMenu,
    unselectFiles,
    visible,
    setVisible,
    setLastSelectedFile,
    selectedFileIndexes,
    clickPosition,
    isSelectionCtx,
  } = useFileList(onRefresh, onFileOpen, enableFilePreview, triggerAction, disableMultipleSelection);

  const contextMenuRef = useDetectOutsideClick(() => setVisible(false));

  const showFolderLoader = useMemo(() => {
    const path = currentPath || "/";
    if (folderLoaderPaths?.length > 0 && folderLoaderPaths.includes(path)) {
      return true;
    }
    return false;
  }, [currentPath, folderLoaderPaths]);

  return (
    <div
      ref={filesViewRef}
      className={`files ${activeLayout}`}
      onContextMenu={handleContextMenu}
      onClick={unselectFiles}
    >
      {activeLayout === "list-layout" && (
        <FilesHeader unselectFiles={unselectFiles} disableMultipleSelection={disableMultipleSelection} />
      )}

      {currentPathFiles?.length > 0 ? (
        <>
          {currentPathFiles.map((file, index) => (
            <FileItem
              key={index}
              index={index}
              file={file}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              onFileOpen={onFileOpen}
              enableFilePreview={enableFilePreview}
              triggerAction={triggerAction}
              filesViewRef={filesViewRef}
              selectedFileIndexes={selectedFileIndexes}
              handleContextMenu={handleContextMenu}
              setVisible={setVisible}
              setLastSelectedFile={setLastSelectedFile}
              disableMultipleSelection={disableMultipleSelection}
            />
          ))}
        </>
      ) : (
        folderLoaderPaths.length === 0 && <div className="empty-folder">This folder is empty.</div>
      )}

      {showFolderLoader && <FolderLoadingSkeleton layout={activeLayout} />}

      <ContextMenu
        filesViewRef={filesViewRef}
        contextMenuRef={contextMenuRef.ref}
        menuItems={isSelectionCtx ? selecCtxItems : emptySelecCtxItems}
        visible={visible}
        setVisible={setVisible}
        clickPosition={clickPosition}
      />
    </div>
  );
};

FileList.displayName = "FileList";

export default FileList;
