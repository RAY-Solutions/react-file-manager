import { useEffect, useRef, useState, useCallback, useRef as UseRef } from "react";
import { useGesture } from "@use-gesture/react";
import { FaRegFile, FaRegFolderOpen } from "react-icons/fa6";
import { useFileIcons } from "../../hooks/useFileIcons";
import CreateFolderAction from "../Actions/CreateFolder/CreateFolder.action";
import RenameAction from "../Actions/Rename/Rename.action";
import { getDataSize } from "../../utils/getDataSize";
import { formatDate } from "../../utils/formatDate";
import { ellipsisInMiddle } from "../../utils/ellipsisInMiddle";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useSelection } from "../../contexts/SelectionContext";
import { useClipBoard } from "../../contexts/ClipboardContext";
import { useLayout } from "../../contexts/LayoutContext";
import Checkbox from "../../components/Checkbox/Checkbox";
import { usePermissions, Permission } from "../../contexts/PermissionsContext";

const dragIconSize = 50;

const FileItem = ({
  index,
  file,
  onCreateFolder,
  onRename,
  enableFilePreview,
  onFileOpen,
  filesViewRef,
  selectedFileIndexes,
  triggerAction,
  handleContextMenu,
  setLastSelectedFile,
  disableMultipleSelection,
}) => {
  const [fileSelected, setFileSelected] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [checkboxClassName, setCheckboxClassName] = useState("hidden");
  const [dropZoneClass, setDropZoneClass] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState(null);
  // For manual long-press logic if desired
  const LONG_PRESS_THRESHOLD = 500;
  const longPressTimer = useRef(null);

  const { activeLayout } = useLayout();
  const iconSize = activeLayout === "grid-layout" ? 48 : 20;
  const fileIcons = useFileIcons(iconSize);
  const { setCurrentPath, currentPathFiles } = useFileNavigation();
  const { setSelectedFiles, selectedFiles } = useSelection();
  const { clipBoard, handleCutCopy, setClipBoard, handlePasting } = useClipBoard();
  const dragIconRef = useRef(null);
  const dragIcons = useFileIcons(dragIconSize);
  const { isActionAllowed } = usePermissions();

  const isFileMoving = clipBoard?.isMoving && clipBoard.files.find((f) => f.name === file.name && f.path === file.path);

  /**
   * Opens file or navigates into a folder.
   */
  const handleFileAccess = useCallback(() => {
    if (!isActionAllowed(selectedFiles, Permission.READ)) return;
    onFileOpen(file);
    if (file.isDirectory) {
      setCurrentPath(file.path);
      setSelectedFiles([]);
    } else {
      enableFilePreview && triggerAction.show("previewFile");
    }
  }, [
    file,
    isActionAllowed,
    selectedFiles,
    onFileOpen,
    enableFilePreview,
    triggerAction,
    setCurrentPath,
    setSelectedFiles,
  ]);

  const handleFileRangeSelection = useCallback(
    (shiftKey, ctrlKey, metaKey) => {
      const isCtrlOrCmdPressed = ctrlKey || metaKey;

      if (disableMultipleSelection) {
        setSelectedFiles([file]);
        return;
      }

      if (selectedFileIndexes.length > 0 && shiftKey) {
        let reverseSelection = false;
        let startRange = selectedFileIndexes[0];
        let endRange = index;
        if (startRange >= endRange) {
          const temp = startRange;
          startRange = endRange;
          endRange = temp;
          reverseSelection = true;
        }
        const filesRange = currentPathFiles.slice(startRange, endRange + 1);
        setSelectedFiles(reverseSelection ? filesRange.reverse() : filesRange);
      } else if (selectedFileIndexes.length > 0 && isCtrlOrCmdPressed) {
        setSelectedFiles((prev) => {
          const filteredFiles = prev.filter((f) => f.path !== file.path);
          if (prev.length === filteredFiles.length) {
            return [...prev, file];
          }
          return filteredFiles;
        });
      } else {
        setSelectedFiles([file]);
      }
    },
    [disableMultipleSelection, file, selectedFileIndexes, index, currentPathFiles, setSelectedFiles],
  );

  const bind = useGesture(
    {
      onPointerDown: ({ event, down }) => {
        longPressTimer.current = setTimeout(() => {
          if (!file.isEditing) {
            setSelectedFiles((prev) => {
              if (!prev.includes(file)) {
                return [...prev, file];
              }
              return prev;
            });
          }
        }, LONG_PRESS_THRESHOLD);
      },
      onPointerMove: ({ event, offset, first, dragging, tap }) => {
        // If user moves the pointer, we cancel the long-press.
        if (longPressTimer.current && dragging) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      onPointerUp: ({ event, tap }) => {
        // Clear the long press timer.
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      onClick: ({ event }) => {
        event.stopPropagation();
        if (file.isEditing) return;
        handleFileRangeSelection(event.shiftKey, event.ctrlKey, event.metaKey);
        // Double-click logic
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 300) {
          handleFileAccess();
        } else {
          setLastClickTime(currentTime);
        }
      },
      onContextMenu: ({ event }) => {
        event.preventDefault();
        event.stopPropagation();
        if (file.isEditing) return;
        if (!fileSelected) {
          setSelectedFiles([file]);
        }
        setLastSelectedFile(file);
        handleContextMenu(event, true);
      },
    },
    {
      drag: {
        threshold: 5,
      },
      eventOptions: { passive: false },
    },
  );

  const handleOnKeyDown = (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      setSelectedFiles([file]);
      handleFileAccess();
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setDragImage(dragIconRef.current, 30, 50);
    e.dataTransfer.effectAllowed = "copy";
    if (isActionAllowed(selectedFiles, Permission.WRITE)) {
      handleCutCopy(true);
    }
  };

  const handleDragEnd = () => setClipBoard(null);
  const handleDragEnterOver = (e) => {
    e.preventDefault();
    if (fileSelected || !file.isDirectory) {
      e.dataTransfer.dropEffect = "none";
    } else {
      setTooltipPosition({ x: e.clientX, y: e.clientY + 12 });
      e.dataTransfer.dropEffect = "copy";
      setDropZoneClass("file-drop-zone");
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropZoneClass((prev) => (prev ? "" : prev));
      setTooltipPosition(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (fileSelected || !file.isDirectory) return;
    if (isActionAllowed(selectedFiles, Permission.WRITE)) {
      handlePasting(file);
    }
    setDropZoneClass((prev) => (prev ? "" : prev));
    setTooltipPosition(null);
  };

  // Show/hide checkbox on hover.
  const handleMouseOver = () => {
    setCheckboxClassName("visible");
  };
  const handleMouseLeave = () => {
    if (!fileSelected) setCheckboxClassName("hidden");
  };

  const handleCheckboxChange = (e) => {
    if (disableMultipleSelection) {
      setSelectedFiles((prev) => (prev.includes(file) ? [] : [file]));
      setFileSelected(e.target.checked);
      return;
    }
    if (e.target.checked) {
      setSelectedFiles((prev) => [...prev, file]);
    } else {
      setSelectedFiles((prev) => prev.filter((f) => f.path !== file.path));
    }
    setFileSelected(e.target.checked);
  };

  useEffect(() => {
    setFileSelected(selectedFileIndexes.includes(index));
    setCheckboxClassName(selectedFileIndexes.includes(index) ? "visible" : "hidden");
  }, [selectedFileIndexes, index]);

  return (
    <div
      {...bind()}
      className={`file-item-container ${dropZoneClass} ${isFileMoving ? "file-moving" : ""}`}
      style={{ touchAction: "none" }}
      tabIndex={0}
      title={file.name}
      onKeyDown={handleOnKeyDown}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      draggable={fileSelected}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragEnter={handleDragEnterOver}
      onDragOver={handleDragEnterOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`file-item ${fileSelected || !!file.isEditing ? "file-selected" : ""}`}>
        {!file.isEditing && (
          <Checkbox
            name={file.name}
            id={file.name}
            checked={fileSelected}
            className={`selection-checkbox ${checkboxClassName}`}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {file.isDirectory ? (
          <FaRegFolderOpen style={{ minWidth: iconSize, minHeight: iconSize, width: iconSize, height: iconSize }} />
        ) : (
          (fileIcons[file.name?.split(".").pop()?.toLowerCase()] ?? (
            <FaRegFile style={{ minWidth: iconSize, minHeight: iconSize, width: iconSize, height: iconSize }} />
          ))
        )}

        {file.isEditing ? (
          <div className={`rename-file-container ${activeLayout}`}>
            {triggerAction.actionType === "createFolder" ? (
              <CreateFolderAction
                filesViewRef={filesViewRef}
                file={file}
                onCreateFolder={onCreateFolder}
                triggerAction={triggerAction}
              />
            ) : (
              <RenameAction filesViewRef={filesViewRef} file={file} onRename={onRename} triggerAction={triggerAction} />
            )}
          </div>
        ) : (
          <div className={activeLayout === "list-layout" ? "text-truncate" : "file-name"}>
            <span title={file.name} className="file-name">
              {ellipsisInMiddle(file.name)}
            </span>
          </div>
        )}
      </div>

      {activeLayout === "list-layout" && (
        <>
          <div className="modified-date">{formatDate(file.updatedAt)}</div>
          <div className="size">{file?.size > 0 ? getDataSize(file?.size) : ""}</div>
        </>
      )}

      {/* Drag Icon & Tooltip Setup */}
      {tooltipPosition && (
        <div style={{ top: `${tooltipPosition.y}px`, left: `${tooltipPosition.x}px` }} className="drag-move-tooltip">
          Move to <span className="drop-zone-file-name">{file.name}</span>
        </div>
      )}

      <div ref={dragIconRef} className="drag-icon">
        {file.isDirectory ? (
          <FaRegFolderOpen size={dragIconSize} />
        ) : (
          <>{dragIcons[file.name?.split(".").pop()?.toLowerCase()] ?? <FaRegFile size={dragIconSize} />}</>
        )}
      </div>
    </div>
  );
};

export default FileItem;
