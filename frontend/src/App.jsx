import { useEffect, useRef, useState } from "react";
import FileManager from "./File Manager/FileManager";
import { createFolderAPI } from "./Mock APIs/createFolderAPI";
import { renameAPI } from "./Mock APIs/renameAPI";
import { deleteAPI } from "./Mock APIs/deleteAPI";
import { fileTransferAPI } from "./Mock APIs/fileTransferAPI";
import { getAllFilesAPI } from "./Mock APIs/getAllFilesAPI";

function App() {
  const fileUploadConfig = {
    url: import.meta.env.VITE_API_BASE_URL + "/upload",
  };
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const isMountRef = useRef(false);

  // Get Files
  const getFiles = async () => {
    setIsLoading(true);
    const response = await getAllFilesAPI();
    setFiles(response.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isMountRef.current) return;
    isMountRef.current = true;
    getFiles();
  }, []);
  //

  // Create Folder
  const handleCreateFolder = async (name, parentFolder) => {
    setIsLoading(true);
    const response = await createFolderAPI(name, parentFolder?._id);
    if (response.status === 200 || response.status === 201) {
      setFiles((prev) => [...prev, response.data]);
    } else {
      console.error(response);
    }
    setIsLoading(false);
  };
  //

  // Rename File/Folder
  const handleRename = async (files, selectedFile, newName) => {
    setIsLoading(true);
    const response = await renameAPI(files, selectedFile, newName);
    setFiles(response);
    setIsLoading(false);
  };
  //

  // Delete File/Folder
  const handleDelete = async (files, file) => {
    setIsLoading(true);
    const response = await deleteAPI(files, file);
    setFiles(response);
    setIsLoading(false);
  };
  //

  // Paste File/Folder
  const handlePaste = async (files, pastePath, clipBoard, filesCopied) => {
    setIsLoading(true);
    const response = await fileTransferAPI(files, pastePath, clipBoard, filesCopied);
    setFiles(response);
    setIsLoading(false);
  };
  //

  // Refresh Files
  const handleRefresh = () => {
    getFiles();
  };
  //

  return (
    <FileManager
      files={files}
      fileUploadConfig={fileUploadConfig}
      isLoading={isLoading}
      onCreateFolder={handleCreateFolder}
      onRename={handleRename}
      onDelete={handleDelete}
      onPaste={handlePaste}
      onRefresh={handleRefresh}
      allowedFileExtensions=".txt, .png, .jpg, .jpeg, .pdf, .doc, .docx"
    />
  );
}

export default App;
