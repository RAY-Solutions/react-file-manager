import { BiRename, BiSelectMultiple } from "react-icons/bi";
import { BsCopy, BsFolderPlus, BsGrid, BsScissors } from "react-icons/bs";
import { FaListUl, FaRegFile, FaRegPaste } from "react-icons/fa6";
import { FiRefreshCw } from "react-icons/fi";
import { MdOutlineDelete, MdOutlineFileDownload, MdOutlineFileUpload } from "react-icons/md";
import { PiFolderOpen } from "react-icons/pi";
import { useClipBoard } from "../../contexts/ClipboardContext";
import { useEffect, useState } from "react";
import { useSelection } from "../../contexts/SelectionContext";
import { useLayout } from "../../contexts/LayoutContext";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { duplicateNameHandler } from "../../utils/duplicateNameHandler";
import { validateApiCallback } from "../../utils/validateApiCallback";
import { Permission, usePermissions } from "../../contexts/PermissionsContext";

const useFileList = (
  onRefresh,
  onFileOpen,
  enableFilePreview,
  triggerAction,
  disableMultipleSelection,
  folderLoaderPaths,
) => {
  const [selectedFileIndexes, setSelectedFileIndexes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [isSelectionCtx, setIsSelectionCtx] = useState(false);
  const [clickPosition, setClickPosition] = useState({ clickX: 0, clickY: 0 });
  const [lastSelectedFile, setLastSelectedFile] = useState(null);

  const { clipBoard, setClipBoard, handleCutCopy, handlePasting } = useClipBoard();
  const { selectedFiles, setSelectedFiles, handleDownload } = useSelection();
  const { isActionAllowed } = usePermissions();
  const { currentPath, currentFolder, setCurrentPath, currentPathFiles, setCurrentPathFiles } = useFileNavigation();
  const { activeLayout, setActiveLayout } = useLayout();

  // Context Menu
  const handleFileOpen = () => {
    if (lastSelectedFile.isDirectory) {
      if (isActionAllowed([lastSelectedFile], Permission.READ)) {
        setCurrentPath(lastSelectedFile.path);
        setSelectedFileIndexes([]);
        setSelectedFiles([]);
        onFileOpen(lastSelectedFile);
      }
    } else {
      enableFilePreview && triggerAction.show("previewFile");
    }
    setVisible(false);
  };

  const handleMoveOrCopyItems = (isMoving) => {
    if (isActionAllowed(selectedFiles, isMoving ? Permission.MOVE : Permission.COPY)) {
      handleCutCopy(isMoving);
    }
    setVisible(false);
  };

  const handleFilePasting = () => {
    if (isActionAllowed([lastSelectedFile], Permission.CREATE)) {
      handlePasting(lastSelectedFile);
    }
    setVisible(false);
  };

  const handleRenaming = () => {
    if (isActionAllowed(selectedFiles, Permission.RENAME)) {
      triggerAction.show("rename");
    }
    setVisible(false);
  };

  const handleDownloadItems = () => {
    if (isActionAllowed(selectedFiles, Permission.READ)) {
      handleDownload();
    }
    setVisible(false);
  };

  const handleDelete = () => {
    if (isActionAllowed(selectedFiles, Permission.DELETE)) {
      triggerAction.show("delete");
    }
    setVisible(false);
  };

  const handleRefresh = () => {
    setVisible(false);
    validateApiCallback(onRefresh, "onRefresh", currentFolder);
    setClipBoard(null);
  };

  const handleCreateNewFolder = () => {
    if (isActionAllowed([currentFolder], Permission.CREATE)) {
      triggerAction.show("createFolder");
    }
    setVisible(false);
  };

  const handleUpload = () => {
    if (isActionAllowed([currentFolder], Permission.UPLOAD)) {
      triggerAction.show("uploadFile");
    }
    setVisible(false);
  };

  const handleselectAllFiles = () => {
    if (!disableMultipleSelection) {
      setSelectedFiles(currentPathFiles);
    }
    setVisible(false);
  };

  const emptySelecCtxItems = [
    {
      title: "View",
      icon: activeLayout === "grid-layout" ? <BsGrid size={18} /> : <FaListUl size={18} />,
      onClick: () => {},
      children: [
        {
          title: "Grid",
          icon: <BsGrid size={18} />,
          selected: activeLayout === "grid-layout",
          onClick: () => {
            setActiveLayout("grid-layout");
            setVisible(false);
          },
        },
        {
          title: "List",
          icon: <FaListUl size={18} />,
          selected: activeLayout === "list-layout",
          onClick: () => {
            setActiveLayout("list-layout");
            setVisible(false);
          },
        },
      ],
    },
    {
      title: "Refresh",
      icon: <FiRefreshCw size={18} />,
      onClick: handleRefresh,
      className: `${folderLoaderPaths && folderLoaderPaths.length > 0 ? "disable" : ""}`,
      divider: true,
    },
    {
      title: "New folder",
      icon: <BsFolderPlus size={18} />,
      onClick: handleCreateNewFolder,
      className: `${isActionAllowed([currentFolder], Permission.CREATE, false) ? "" : "disable"}`,
    },
    {
      title: "Upload",
      icon: <MdOutlineFileUpload size={18} />,
      onClick: handleUpload,
      divider: !disableMultipleSelection,
      className: `${isActionAllowed([currentFolder], Permission.UPLOAD, false) ? "" : "disable"}`,
    },
    {
      title: "Select all",
      icon: <BiSelectMultiple size={18} />,
      onClick: handleselectAllFiles,
      hidden: disableMultipleSelection,
    },
  ];

  const selecCtxItems = [
    {
      title: "Open",
      icon: lastSelectedFile?.isDirectory ? <PiFolderOpen size={20} /> : <FaRegFile size={16} />,
      onClick: handleFileOpen,
      className: `${isActionAllowed([lastSelectedFile], Permission.READ, false) ? "" : "disable"}`,
      divider: true,
    },
    {
      title: "Cut",
      icon: <BsScissors size={19} />,
      onClick: () => handleMoveOrCopyItems(true),
      className: `${isActionAllowed(selectedFiles, Permission.MOVE, false) ? "" : "disable"}`,
    },
    {
      title: "Copy",
      icon: <BsCopy strokeWidth={0.1} size={17} />,
      onClick: () => handleMoveOrCopyItems(false),
      className: `${isActionAllowed(selectedFiles, Permission.COPY, false) ? "" : "disable"}`,
      divider: !lastSelectedFile?.isDirectory,
    },
    {
      title: "Paste",
      icon: <FaRegPaste size={18} />,
      onClick: handleFilePasting,
      className: `${clipBoard ? "" : "disable-paste"}`,
      hidden: !lastSelectedFile?.isDirectory,
      divider: true,
    },
    {
      title: "Rename",
      icon: <BiRename size={19} />,
      onClick: handleRenaming,
      hidden: selectedFiles.length > 1,
      className: `${isActionAllowed(selectedFiles, Permission.RENAME, false) ? "" : "disable"}`,
    },
    {
      title: "Download",
      icon: <MdOutlineFileDownload size={18} />,
      onClick: handleDownloadItems,
      hidden: lastSelectedFile?.isDirectory,
      className: `${isActionAllowed(selectedFiles, Permission.READ, false) ? "" : "disable"}`,
    },
    {
      title: "Delete",
      icon: <MdOutlineDelete size={19} />,
      onClick: handleDelete,
      className: `${isActionAllowed(selectedFiles, Permission.DELETE, false) ? "" : "disable"}`,
    },
  ];
  //

  const handleFolderCreating = () => {
    setCurrentPathFiles((prev) => {
      return [
        ...prev,
        {
          name: duplicateNameHandler("New Folder", true, prev),
          isDirectory: true,
          path: currentPath,
          isEditing: true,
          key: new Date().valueOf(),
        },
      ];
    });
  };

  const handleItemRenaming = () => {
    setCurrentPathFiles((prev) => {
      if (prev[selectedFileIndexes.at(-1)]) {
        prev[selectedFileIndexes.at(-1)].isEditing = true;
      }
      return prev;
    });

    setSelectedFileIndexes([]);
    setSelectedFiles([]);
  };

  const unselectFiles = () => {
    setSelectedFileIndexes([]);
    setSelectedFiles((prev) => (prev.length > 0 ? [] : prev));
  };

  const handleContextMenu = (e, isSelection = false) => {
    e.preventDefault();
    setClickPosition({ clickX: e.clientX, clickY: e.clientY });
    setIsSelectionCtx(isSelection);
    !isSelection && unselectFiles();
    setVisible(true);
  };

  useEffect(() => {
    if (triggerAction.isActive) {
      switch (triggerAction.actionType) {
        case "createFolder":
          handleFolderCreating();
          break;
        case "rename":
          handleItemRenaming();
          break;
      }
    }
  }, [triggerAction.isActive]);

  useEffect(() => {
    setSelectedFileIndexes([]);
    setSelectedFiles([]);
  }, [currentPath]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      setSelectedFileIndexes(() => {
        return selectedFiles.map((selectedFile) => {
          return currentPathFiles.findIndex((f) => f.path === selectedFile.path);
        });
      });
    } else {
      setSelectedFileIndexes([]);
    }
  }, [selectedFiles, currentPathFiles]);

  return {
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
  };
};

export default useFileList;
