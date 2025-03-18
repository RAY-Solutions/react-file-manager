import { useState } from "react";
import { BsCopy, BsFolderPlus, BsGridFill, BsScissors } from "react-icons/bs";
import { FiRefreshCw } from "react-icons/fi";
import { MdClear, MdOutlineDelete, MdOutlineFileDownload, MdOutlineFileUpload } from "react-icons/md";
import { BiRename } from "react-icons/bi";
import { FaListUl, FaRegPaste } from "react-icons/fa6";
import LayoutToggler from "./LayoutToggler";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useSelection } from "../../contexts/SelectionContext";
import { useClipBoard } from "../../contexts/ClipboardContext";
import { useLayout } from "../../contexts/LayoutContext";
import { validateApiCallback } from "../../utils/validateApiCallback";
import { useDetectOutsideClick } from "../../hooks/useDetectOutsideClick";
import "./Toolbar.scss";
import { Permission, usePermissions } from "../../contexts/PermissionsContext";
import { useFiles } from "../../contexts/FilesContext";

const Toolbar = ({ allowCreateFolder = true, allowUploadFile = true, onLayoutChange, onRefresh, triggerAction }) => {
  const { files } = useFiles();
  const [showToggleViewMenu, setShowToggleViewMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { currentFolder } = useFileNavigation();
  const { selectedFiles, setSelectedFiles, handleDownload } = useSelection();
  const { clipBoard, setClipBoard, handleCutCopy, handlePasting } = useClipBoard();
  const { activeLayout } = useLayout();
  const dropdownRef = useDetectOutsideClick(() => setShowDropdown(false));
  const [showLeftDropdown, setShowLeftDropdown] = useState(false);
  const leftDropdownRef = useDetectOutsideClick(() => setShowLeftDropdown(false));
  const { isActionAllowed } = usePermissions();

  const toolbarLeftItems = [
    {
      icon: <BsFolderPlus size={17} strokeWidth={0.3} />,
      title: "New Folder",
      text: "New",
      permission: allowCreateFolder && isActionAllowed([currentFolder], Permission.CREATE, false),
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed([currentFolder], Permission.CREATE)) {
          triggerAction.show("createFolder");
        }
      },
    },
    {
      icon: <MdOutlineFileUpload size={18} />,
      text: "Upload",
      permission: allowUploadFile && isActionAllowed([currentFolder], Permission.UPLOAD, false),
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed([currentFolder], Permission.UPLOAD)) {
          triggerAction.show("uploadFile");
        }
      },
    },
    {
      icon: <FaRegPaste size={18} />,
      text: "Paste",
      permission: !!clipBoard && isActionAllowed([currentFolder], Permission.CREATE, false),
      onClick: handleFilePasting,
    },
  ];

  const toolbarRightItems = [
    {
      icon: activeLayout === "grid-layout" ? <BsGridFill size={16} /> : <FaListUl size={16} />,
      title: "Change View",
      onClick: () => setShowToggleViewMenu((prev) => !prev),
    },
    {
      icon: <FiRefreshCw size={16} />,
      title: "Refresh",
      disabled: files.some((file) => file.isPlaceholder),
      onClick: () => {
        validateApiCallback(onRefresh, "onRefresh", currentFolder);
        setClipBoard(null);
      },
    },
  ];

  function handleFilePasting() {
    setShowLeftDropdown(false);
    setShowDropdown(false);
    if (isActionAllowed([currentFolder], Permission.CREATE)) {
      handlePasting(currentFolder);
    }
  }

  const handleDownloadItems = () => {
    setShowDropdown(false);
    if (isActionAllowed(selectedFiles, Permission.READ)) {
      handleDownload();
      setSelectedFiles([]);
    }
  };
  const toolbarLeftOnSelectItems = [
    {
      icon: <BsScissors size={18} />,
      text: "Cut",
      permission: isActionAllowed(selectedFiles, Permission.MOVE, false),
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed(selectedFiles, Permission.MOVE)) {
          handleCutCopy(true);
        }
      },
    },
    {
      icon: <BsCopy strokeWidth={0.1} size={17} />,
      text: "Copy",
      permission: isActionAllowed(selectedFiles, Permission.COPY, false),
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed(selectedFiles, Permission.COPY)) {
          handleCutCopy(false);
        }
      },
    },
    {
      icon: <FaRegPaste size={18} />,
      text: "Paste",
      permission: !!clipBoard && isActionAllowed([currentFolder], Permission.CREATE, false),
      onClick: handleFilePasting,
    },
    {
      icon: <BiRename size={19} />,
      text: "Rename",
      permission: selectedFiles.length === 1 && isActionAllowed(selectedFiles, Permission.RENAME, false),
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed(selectedFiles, Permission.RENAME)) {
          triggerAction.show("rename");
        }
      },
    },
    {
      icon: <MdOutlineFileDownload size={19} />,
      text: "Download",
      permission:
        selectedFiles?.find((file) => !file.isDirectory) && isActionAllowed(selectedFiles, Permission.READ, false),
      onClick: handleDownloadItems,
    },
    {
      icon: <MdOutlineDelete size={19} />,
      text: "Delete",
      permission: isActionAllowed(selectedFiles, Permission.DELETE, false),
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed(selectedFiles, Permission.DELETE)) {
          triggerAction.show("delete");
        }
      },
    },
  ];

  if (selectedFiles.length > 0) {
    return (
      <div className="toolbar file-selected">
        <div className="file-action-container">
          {/*
            Dropdown toggle - visible on mobile, hidden on desktop 
          */}
          {Boolean(toolbarLeftOnSelectItems.filter((item) => item.permission).length > 0) && (
            <button className="dropdown-toggle" onClick={() => setShowDropdown((prev) => !prev)}>
              Actions
            </button>
          )}

          {/*
            Dropdown - visible only if showDropdown === true on mobile
          */}
          {showDropdown && (
            <div className="dropdown-menu" ref={dropdownRef.ref}>
              {toolbarLeftOnSelectItems
                .filter((item) => item.permission)
                .map((item, index) => (
                  <button
                    disabled={item.disabled}
                    className="item-action"
                    key={index}
                    onClick={item.onClick}
                    title={item.title || item.text}
                  >
                    {item.icon}
                    {Boolean(item.text) && <span>{item.text}</span>}
                  </button>
                ))}
            </div>
          )}

          {/*
            File actions - hidden on mobile, shown on desktop
          */}
          <div>
            <div className="file-actions">
              {toolbarLeftOnSelectItems
                .filter((item) => item.permission)
                .map((item, index) => (
                  <button
                    className="item-action file-action"
                    disabled={item.disabled}
                    key={index}
                    onClick={item.onClick}
                    title={item.title || item.text}
                  >
                    {item.icon}
                    {Boolean(item.text) && <span>{item.text}</span>}
                  </button>
                ))}
            </div>
          </div>

          <button
            className="item-action file-action"
            title="Clear selection"
            onClick={() => {
              setSelectedFiles([]);
              setShowDropdown(false);
            }}
          >
            <span>
              {selectedFiles.length} item{selectedFiles.length > 1 && "s"} selected
            </span>
            <MdClear size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="toolbar">
      <div className="fm-toolbar">
        <div className="toolbar-left-container">
          {Boolean(toolbarLeftItems.filter((item) => item.permission).length) && (
            <button className="dropdown-toggle" onClick={() => setShowLeftDropdown((prev) => !prev)}>
              Actions
            </button>
          )}
          {showLeftDropdown && (
            <div className="dropdown-menu" ref={leftDropdownRef.ref}>
              {toolbarLeftItems
                .filter((item) => item.permission)
                .map((item, index) => (
                  <button
                    disabled={item.disabled}
                    className="item-action"
                    key={index}
                    onClick={item.onClick}
                    title={item.title || item.text}
                  >
                    {item.icon}
                    {Boolean(item.text) && <span>{item.text}</span>}
                  </button>
                ))}
            </div>
          )}
          <div className="toolbar-left-items">
            {toolbarLeftItems
              .filter((item) => item.permission)
              .map((item, index) => (
                <button
                  disabled={item.disabled}
                  className="item-action"
                  key={index}
                  onClick={item.onClick}
                  title={item.title || item.text}
                >
                  {item.icon}
                  {Boolean(item.text) && <span>{item.text}</span>}
                </button>
              ))}
          </div>
        </div>
        <div>
          {toolbarRightItems.map((item, index) => (
            <div key={index} className="toolbar-left-items">
              <button
                disabled={item.disabled}
                className="item-action icon-only"
                title={item.title}
                onClick={item.onClick}
              >
                {item.icon}
              </button>
              {index !== toolbarRightItems.length - 1 && <div className="item-separator"></div>}
            </div>
          ))}
          {showToggleViewMenu && (
            <LayoutToggler setShowToggleViewMenu={setShowToggleViewMenu} onLayoutChange={onLayoutChange} />
          )}
        </div>
      </div>
    </div>
  );
};

Toolbar.displayName = "Toolbar";

export default Toolbar;
