import Loader from "../components/Loader/Loader";
import Toolbar from "./Toolbar/Toolbar";
import NavigationPane from "./NavigationPane/NavigationPane";
import BreadCrumb from "./BreadCrumb/BreadCrumb";
import FileList from "./FileList/FileList";
import Actions from "./Actions/Actions";
import { FilesProvider } from "../contexts/FilesContext";
import { FileNavigationProvider } from "../contexts/FileNavigationContext";
import { SelectionProvider } from "../contexts/SelectionContext";
import { ClipBoardProvider } from "../contexts/ClipboardContext";
import { LayoutProvider } from "../contexts/LayoutContext";
import { PermissionsProvider } from "../contexts/PermissionsContext";
import { useTriggerAction } from "../hooks/useTriggerAction";
import { useColumnResize } from "../hooks/useColumnResize";
import PropTypes from "prop-types";
import { dateStringValidator, urlValidator } from "../validators/propValidators";
import "./FileManager.scss";

const FileManager = ({
  files,
  fileUploadConfig,
  isLoading,
  onCreateFolder,
  onFileUploading = () => {},
  onFileUploaded = () => {},
  onCut,
  onCopy,
  onPaste,
  onRename,
  onDownload,
  onDelete = () => null,
  onLayoutChange = () => {},
  onRefresh,
  onFileOpen = () => {},
  onSelect,
  onError = () => {},
  layout = "grid-layout",
  enableFilePreview = true,
  disableFilePreviewIfExtensions = [],
  maxFileSize,
  filePreviewPath,
  acceptedFileTypes,
  height = "600px",
  width = "100%",
  initialPath = "",
  rootFolder = "Home",
  filePreviewComponent,
  primaryColor = "#6155b4",
  fontFamily = "Nunito Sans, sans-serif",
  disableMultipleSelection = false,
  permissions = [],
}) => {
  const triggerAction = useTriggerAction();
  const { containerRef, colSizes, isDragging, handleMouseMove, handleMouseUp, handleMouseDown } = useColumnResize(
    20,
    80,
  );
  const customStyles = {
    "--file-manager-font-family": fontFamily,
    "--file-manager-primary-color": primaryColor,
    height,
    width,
  };

  return (
    <main className="file-explorer" onContextMenu={(e) => e.preventDefault()} style={customStyles}>
      <Loader loading={isLoading} />
      <FilesProvider filesData={files} onError={onError}>
        <FileNavigationProvider initialPath={initialPath}>
          <SelectionProvider onDownload={onDownload} onSelect={onSelect}>
            <ClipBoardProvider onPaste={onPaste} onCut={onCut} onCopy={onCopy}>
              <LayoutProvider layout={layout}>
                <PermissionsProvider permissions={permissions}>
                  <Toolbar
                    allowCreateFolder
                    allowUploadFile
                    onLayoutChange={onLayoutChange}
                    onRefresh={onRefresh}
                    triggerAction={triggerAction}
                  />
                  <section
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="files-container"
                  >
                    <div className="navigation-pane" style={{ width: colSizes.col1 + "%" }}>
                      <NavigationPane onFileOpen={onFileOpen} />
                      <div
                        className={`sidebar-resize ${isDragging ? "sidebar-dragging" : ""}`}
                        onMouseDown={handleMouseDown}
                      />
                    </div>

                    <div className="folders-preview" style={{ width: colSizes.col2 + "%" }}>
                      <BreadCrumb rootFolder={rootFolder} onFileOpen={onFileOpen} />
                      <FileList
                        onCreateFolder={onCreateFolder}
                        onRename={onRename}
                        onFileOpen={onFileOpen}
                        onRefresh={onRefresh}
                        enableFilePreview={enableFilePreview}
                        disableFilePreviewIfExtensions={disableFilePreviewIfExtensions}
                        triggerAction={triggerAction}
                        disableMultipleSelection={disableMultipleSelection}
                      />
                    </div>
                  </section>

                  <Actions
                    fileUploadConfig={fileUploadConfig}
                    onFileUploading={onFileUploading}
                    onFileUploaded={onFileUploaded}
                    onDelete={onDelete}
                    onRefresh={onRefresh}
                    maxFileSize={maxFileSize}
                    filePreviewPath={filePreviewPath}
                    filePreviewComponent={filePreviewComponent}
                    acceptedFileTypes={acceptedFileTypes}
                    triggerAction={triggerAction}
                    disableMultipleSelection={disableMultipleSelection}
                  />
                </PermissionsProvider>
              </LayoutProvider>
            </ClipBoardProvider>
          </SelectionProvider>
        </FileNavigationProvider>
      </FilesProvider>
    </main>
  );
};

FileManager.displayName = "FileManager";

FileManager.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      isDirectory: PropTypes.bool.isRequired,
      path: PropTypes.string.isRequired,
      isPlaceholder: PropTypes.bool,
      updatedAt: dateStringValidator,
      size: PropTypes.number,
    }),
  ).isRequired,
  fileUploadConfig: PropTypes.shape({
    url: urlValidator,
    generateSignedUrlEndpoint: urlValidator,
    headers: PropTypes.objectOf(PropTypes.string),
    canUpload: PropTypes.func,
  }),
  isLoading: PropTypes.bool,
  onCreateFolder: PropTypes.func,
  onFileUploading: PropTypes.func,
  onFileUploaded: PropTypes.func,
  onRename: PropTypes.func,
  onDelete: PropTypes.func,
  onCut: PropTypes.func,
  onCopy: PropTypes.func,
  onPaste: PropTypes.func,
  onDownload: PropTypes.func,
  onLayoutChange: PropTypes.func,
  onRefresh: PropTypes.func,
  onFileOpen: PropTypes.func,
  onSelect: PropTypes.func,
  onError: PropTypes.func,
  layout: PropTypes.oneOf(["grid-layout", "list-layout"]),
  maxFileSize: PropTypes.number,
  enableFilePreview: PropTypes.bool,
  disableFilePreviewIfExtensions: PropTypes.arrayOf(PropTypes.string),
  filePreviewPath: urlValidator,
  acceptedFileTypes: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialPath: PropTypes.string,
  filePreviewComponent: PropTypes.func,
  primaryColor: PropTypes.string,
  fontFamily: PropTypes.string,
  disableMultipleSelection: PropTypes.bool,
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      create: PropTypes.bool,
      copy: PropTypes.bool,
      move: PropTypes.bool,
      read: PropTypes.bool,
      delete: PropTypes.bool,
      upload: PropTypes.bool,
      rename: PropTypes.bool,
      applyTo: PropTypes.oneOf(["file", "folder"]),
    }),
  ),
  rootFolder: PropTypes.string,
};

export default FileManager;
