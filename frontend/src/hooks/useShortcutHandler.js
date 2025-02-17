import { useKeyPress } from "./useKeyPress";
import { shortcuts } from "../utils/shortcuts";
import { useClipBoard } from "../contexts/ClipboardContext";
import { useFileNavigation } from "../contexts/FileNavigationContext";
import { useSelection } from "../contexts/SelectionContext";
import { useLayout } from "../contexts/LayoutContext";
import { validateApiCallback } from "../utils/validateApiCallback";
import { usePermissions, Permission } from "../contexts/PermissionsContext";

export const useShortcutHandler = (triggerAction, onRefresh, disableMultipleSelection) => {
  const { setClipBoard, handleCutCopy, handlePasting } = useClipBoard();
  const { currentFolder, currentPathFiles } = useFileNavigation();
  const { setSelectedFiles, selectedFiles, handleDownload } = useSelection();
  const { setActiveLayout } = useLayout();
  const { isActionAllowed } = usePermissions();

  const triggerCreateFolder = () => {
    if (isActionAllowed([currentFolder], Permission.WRITE)) {
      triggerAction.show("createFolder");
    }
  };

  const triggerUploadFiles = () => {
    if (isActionAllowed([currentFolder], Permission.UPLOAD)) {
      triggerAction.show("uploadFile");
    }
  };

  const triggerCutItems = () => {
    if (isActionAllowed(selectedFiles, Permission.WRITE)) {
      handleCutCopy(true);
    }
  };

  const triggerCopyItems = () => {
    if (isActionAllowed(selectedFiles, Permission.COPY)) {
      handleCutCopy(false);
    }
  };

  const triggerPasteItems = () => {
    if (isActionAllowed([currentFolder], Permission.WRITE)) {
      handlePasting(currentFolder);
    }
  };

  const triggerRename = () => {
    console.log("currentPathFiles", currentPathFiles);
    if (isActionAllowed(selectedFiles, Permission.WRITE)) {
      triggerAction.show("rename");
    }
  };

  const triggerDownload = () => {
    if (isActionAllowed(selectedFiles, Permission.READ)) {
      handleDownload();
    }
  };

  const triggerDelete = () => {
    if (isActionAllowed(selectedFiles, Permission.DELETE)) {
      triggerAction.show("delete");
    }
  };

  const triggerSelectFirst = () => {
    if (currentPathFiles.length > 0) {
      setSelectedFiles([currentPathFiles[0]]);
    }
  };

  const triggerSelectLast = () => {
    if (currentPathFiles.length > 0) {
      setSelectedFiles([currentPathFiles.at(-1)]);
    }
  };

  const triggerSelectAll = () => {
    if (!disableMultipleSelection) {
      setSelectedFiles(currentPathFiles);
    }
  };

  const triggerClearSelection = () => {
    setSelectedFiles((prev) => (prev.length > 0 ? [] : prev));
  };

  const triggerRefresh = () => {
    validateApiCallback(onRefresh, "onRefresh");
    setClipBoard(null);
  };

  const triggerGridLayout = () => {
    setActiveLayout("grid-layout");
  };
  const triggerListLayout = () => {
    setActiveLayout("list-layout");
  };

  // Keypress detection will be disabled when some Action is in active state.
  useKeyPress(shortcuts.createFolder, triggerCreateFolder, triggerAction.isActive);
  useKeyPress(shortcuts.uploadFiles, triggerUploadFiles, triggerAction.isActive);
  useKeyPress(shortcuts.cut, triggerCutItems, triggerAction.isActive);
  useKeyPress(shortcuts.copy, triggerCopyItems, triggerAction.isActive);
  useKeyPress(shortcuts.paste, triggerPasteItems, triggerAction.isActive);
  useKeyPress(shortcuts.rename, triggerRename, triggerAction.isActive);
  useKeyPress(shortcuts.download, triggerDownload, triggerAction.isActive);
  useKeyPress(shortcuts.delete, triggerDelete, triggerAction.isActive);
  useKeyPress(shortcuts.jumpToFirst, triggerSelectFirst, triggerAction.isActive);
  useKeyPress(shortcuts.jumpToLast, triggerSelectLast, triggerAction.isActive);
  useKeyPress(shortcuts.selectAll, triggerSelectAll, triggerAction.isActive);
  useKeyPress(shortcuts.clearSelection, triggerClearSelection, triggerAction.isActive);
  useKeyPress(shortcuts.refresh, triggerRefresh, triggerAction.isActive);
  useKeyPress(shortcuts.gridLayout, triggerGridLayout, triggerAction.isActive);
  useKeyPress(shortcuts.listLayout, triggerListLayout, triggerAction.isActive);
};
