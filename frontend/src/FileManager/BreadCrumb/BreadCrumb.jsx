import { useEffect, useRef, useState } from "react";
import { MdHome, MdMoreHoriz, MdOutlineNavigateNext } from "react-icons/md";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useFiles } from "../../contexts/FilesContext";
import { useDetectOutsideClick } from "../../hooks/useDetectOutsideClick";
import "./BreadCrumb.scss";

const BreadCrumb = ({ rootFolder, onFileOpen }) => {
  const [folders, setFolders] = useState([]);
  const [hiddenFolders, setHiddenFolders] = useState([]);
  const [hiddenFoldersWidth, setHiddenFoldersWidth] = useState([]);
  const [showHiddenFolders, setShowHiddenFolders] = useState(false);

  const { filesDisplayNames } = useFiles();
  const { currentPath, setCurrentPath } = useFileNavigation();
  const breadCrumbRef = useRef(null);
  const foldersRef = useRef([]);
  const moreBtnRef = useRef(null);
  const popoverRef = useDetectOutsideClick(() => {
    setShowHiddenFolders(false);
  });

  useEffect(() => {
    setFolders(() => {
      let path = "";
      return currentPath?.split("/").map((item) => {
        const displayName = filesDisplayNames.get(`${path}/${item}`);
        return {
          name: displayName || item || rootFolder,
          path: item === "" ? item : (path += `/${item}`),
        };
      });
    });
    setHiddenFolders([]);
    setHiddenFoldersWidth([]);
  }, [currentPath, filesDisplayNames, rootFolder]);

  const switchFolder = (folder) => {
    if (folder.path === currentPath) return;
    onFileOpen(folder);
    setCurrentPath(folder.path);
  };

  const getBreadCrumbWidth = () => {
    const containerWidth = breadCrumbRef.current.clientWidth;
    const containerStyles = getComputedStyle(breadCrumbRef.current);
    const paddingLeft = parseFloat(containerStyles.paddingLeft);
    const moreBtnGap = hiddenFolders.length > 0 ? 1 : 0;
    const flexGap = parseFloat(containerStyles.gap) * (folders.length + moreBtnGap);
    return containerWidth - (paddingLeft + flexGap);
  };

  const checkAvailableSpace = () => {
    const availableSpace = getBreadCrumbWidth();
    const remainingFoldersWidth = foldersRef.current.reduce((prev, curr) => {
      if (!curr) return prev;
      return prev + curr.clientWidth;
    }, 0);
    const moreBtnWidth = moreBtnRef.current?.clientWidth || 0;
    return availableSpace - (remainingFoldersWidth + moreBtnWidth);
  };

  const handleResize = () => {
    if (breadCrumbRef?.current && breadCrumbRef.current.scrollWidth > breadCrumbRef.current.clientWidth) {
      const hiddenFolder = folders[1];
      const hiddenFolderWidth = foldersRef.current[1]?.clientWidth;
      setHiddenFoldersWidth((prev) => [...prev, hiddenFolderWidth]);
      setHiddenFolders((prev) => [...prev, hiddenFolder]);
      setFolders((prev) => prev.filter((_, index) => index !== 1));
    } else if (
      breadCrumbRef?.current &&
      hiddenFolders.length > 0 &&
      checkAvailableSpace() > hiddenFoldersWidth.at(-1)
    ) {
      const newFolders = [folders[0], hiddenFolders.at(-1), ...folders.slice(1)];
      setFolders(newFolders);
      setHiddenFolders((prev) => prev.slice(0, -1));
      setHiddenFoldersWidth((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(breadCrumbRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [folders, hiddenFolders, hiddenFoldersWidth]);

  return (
    <div className="bread-crumb-container">
      <div className="breadcrumb" ref={breadCrumbRef}>
        {folders.map((folder, index) => (
          <div key={index} style={{ display: "contents" }}>
            <span
              className="folder-name"
              onClick={() => switchFolder(folder)}
              ref={(el) => (foldersRef.current[index] = el)}
            >
              {index === 0 ? <MdHome /> : <MdOutlineNavigateNext />}
              <span className="text-truncate">{folder.name}</span>
            </span>
            {hiddenFolders?.length > 0 && index === 0 && (
              <button
                className="folder-name folder-name-btn"
                onClick={() => setShowHiddenFolders(true)}
                ref={moreBtnRef}
                title="Show more folders"
              >
                <MdMoreHoriz size={22} className="hidden-folders" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showHiddenFolders && (
        <ul ref={popoverRef.ref} className="hidden-folders-container">
          {hiddenFolders.map((folder, index) => (
            <li
              key={index}
              onClick={() => {
                switchFolder(folder);
                setShowHiddenFolders(false);
              }}
            >
              {folder.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

BreadCrumb.displayName = "BreadCrumb";

export default BreadCrumb;
