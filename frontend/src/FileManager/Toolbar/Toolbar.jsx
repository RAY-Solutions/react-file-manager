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

const Toolbar = ({ allowCreateFolder = true, allowUploadFile = true, onLayoutChange, onRefresh, triggerAction }) => {
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
      permission: allowCreateFolder,
      onClick: () => {
        setShowLeftDropdown(false);
        if (isActionAllowed([currentFolder], Permission.WRITE)) {
          triggerAction.show("createFolder");
        }
      },
    },
    {
      icon: <MdOutlineFileUpload size={18} />,
      text: "Upload",
      permission: allowUploadFile,
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
      permission: !!clipBoard,
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
      onClick: () => {
        validateApiCallback(onRefresh, "onRefresh", currentFolder);
        setClipBoard(null);
      },
    },
  ];

  function handleFilePasting() {
    setShowLeftDropdown(false);
    setShowDropdown(false);
    if (isActionAllowed([currentFolder], Permission.WRITE)) {
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

  if (selectedFiles.length > 0) {
    return (
      <div className="toolbar file-selected">
        <div className="file-action-container">
          {/*
            Dropdown toggle - visible on mobile, hidden on desktop 
          */}
          <button className="dropdown-toggle" onClick={() => setShowDropdown((prev) => !prev)}>
            Actions
          </button>

          {/*
            Dropdown - visible only if showDropdown === true on mobile
          */}
          {showDropdown && (
            <div className="dropdown-menu" ref={dropdownRef.ref}>
              <button
                className="item-action"
                onClick={() => {
                  setShowDropdown(false);
                  if (isActionAllowed(selectedFiles, Permission.WRITE)) {
                    handleCutCopy(true);
                  }
                }}
              >
                <BsScissors size={18} />
                <span>Cut</span>
              </button>
              <button
                className="item-action"
                onClick={() => {
                  setShowDropdown(false);
                  if (isActionAllowed(selectedFiles, Permission.COPY)) {
                    handleCutCopy(false);
                  }
                }}
              >
                <BsCopy strokeWidth={0.1} size={17} />
                <span>Copy</span>
              </button>
              {clipBoard?.files?.length > 0 && (
                <button className="item-action" onClick={handleFilePasting}>
                  <FaRegPaste size={18} />
                  <span>Paste</span>
                </button>
              )}
              {selectedFiles.length === 1 && (
                <button
                  className="item-action"
                  onClick={() => {
                    setShowDropdown(false);
                    if (isActionAllowed(selectedFiles, Permission.WRITE)) {
                      triggerAction.show("rename");
                    }
                  }}
                >
                  <BiRename size={19} />
                  <span>Rename</span>
                </button>
              )}
              {selectedFiles?.find((file) => !file.isDirectory) && (
                <button className="item-action" onClick={handleDownloadItems}>
                  <MdOutlineFileDownload size={19} />
                  <span>Download</span>
                </button>
              )}
              <button
                className="item-action"
                onClick={() => {
                  setShowDropdown(false);
                  if (isActionAllowed(selectedFiles, Permission.DELETE)) {
                    triggerAction.show("delete");
                  }
                }}
              >
                <MdOutlineDelete size={19} />
                <span>Delete</span>
              </button>
            </div>
          )}

          {/*
            File actions - hidden on mobile, shown on desktop
          */}
          <div className="file-actions">
            <button
              className="item-action file-action"
              onClick={() => {
                if (isActionAllowed(selectedFiles, Permission.WRITE)) {
                  handleCutCopy(true);
                }
              }}
            >
              <BsScissors size={18} />
              <span>Cut</span>
            </button>
            <button
              className="item-action file-action"
              onClick={() => {
                if (isActionAllowed(selectedFiles, Permission.COPY)) {
                  handleCutCopy(false);
                }
              }}
            >
              <BsCopy strokeWidth={0.1} size={17} />
              <span>Copy</span>
            </button>
            {clipBoard?.files?.length > 0 && (
              <button className="item-action file-action" onClick={handleFilePasting}>
                <FaRegPaste size={18} />
                <span>Paste</span>
              </button>
            )}
            {selectedFiles.length === 1 && (
              <button
                className="item-action file-action"
                onClick={() => {
                  if (isActionAllowed(selectedFiles, Permission.WRITE)) {
                    triggerAction.show("rename");
                  }
                }}
              >
                <BiRename size={19} />
                <span>Rename</span>
              </button>
            )}
            {selectedFiles?.find((file) => !file.isDirectory) && (
              <button className="item-action file-action" onClick={handleDownloadItems}>
                <MdOutlineFileDownload size={19} />
                <span>Download</span>
              </button>
            )}
            <button
              className="item-action file-action"
              onClick={() => {
                if (isActionAllowed(selectedFiles, Permission.DELETE)) {
                  triggerAction.show("delete");
                }
              }}
            >
              <MdOutlineDelete size={19} />
              <span>Delete</span>
            </button>
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
          <button className="dropdown-toggle" onClick={() => setShowLeftDropdown((prev) => !prev)}>
            Actions
          </button>
          {showLeftDropdown && (
            <div className="dropdown-menu" ref={leftDropdownRef.ref}>
              {toolbarLeftItems
                .filter((item) => item.permission)
                .map((item, index) => (
                  <button className="item-action" key={index} onClick={item.onClick} title={item.title || item.text}>
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
                <button className="item-action" key={index} onClick={item.onClick} title={item.title || item.text}>
                  {item.icon}
                  {Boolean(item.text) && <span>{item.text}</span>}
                </button>
              ))}
          </div>
        </div>
        <div>
          {toolbarRightItems.map((item, index) => (
            <div key={index} className="toolbar-left-items">
              <button className="item-action icon-only" title={item.title} onClick={item.onClick}>
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
