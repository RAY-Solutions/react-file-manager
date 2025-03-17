import PropTypes from "prop-types";
import "./FolderLoadingSkeleton.scss";

const FolderLoadingSkeleton = ({ layout, forNavigation }) => {
  if (forNavigation) {
    return (
      <>
        <div className={`folder-loading-skeleton for-navigation`}>
          <div className="skeleton-icon"></div>
          <div className="skeleton-name"></div>
        </div>
        <div className={`folder-loading-skeleton for-navigation`}>
          <div className="skeleton-icon"></div>
          <div className="skeleton-name"></div>
        </div>
      </>
    );
  }
  if (layout === "grid-layout") {
    return (
      <>
        <div className={`folder-loading-skeleton ${layout}`}>
          <div className="skeleton-icon"></div>
          <div className="skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
        <div className={`folder-loading-skeleton ${layout}`}>
          <div className="skeleton-icon"></div>
          <div className="skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
      </>
    );
  } else if (layout === "list-layout") {
    return (
      <>
        <div className={`folder-loading-skeleton ${layout}`}>
          <div className="skeleton-icon"></div>
          <div className="skeleton-name"></div>
          <div className="skeleton-date"></div>
          <div className="skeleton-size"></div>
        </div>
        <div className={`folder-loading-skeleton ${layout}`}>
          <div className="skeleton-icon"></div>
          <div className="skeleton-name"></div>
          <div className="skeleton-date"></div>
          <div className="skeleton-size"></div>
        </div>
      </>
    );
  }

  return null;
};

FolderLoadingSkeleton.propTypes = {
  layout: PropTypes.string,
  forNavigation: PropTypes.bool,
};

export default FolderLoadingSkeleton;
