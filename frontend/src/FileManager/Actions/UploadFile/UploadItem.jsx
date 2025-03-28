import { AiOutlineClose } from "react-icons/ai";
import Progress from "../../../components/Progress/Progress";
import { getFileExtension } from "../../../utils/getFileExtension";
import { useFileIcons } from "../../../hooks/useFileIcons";
import { FaRegFile } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";
import { getDataSize } from "../../../utils/getDataSize";
import { FaRegCheckCircle } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import { useFiles } from "../../../contexts/FilesContext";

const UploadItem = ({
  index,
  fileData,
  setFiles,
  setIsUploading,
  fileUploadConfig,
  onFileUploaded,
  handleFileRemove,
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const fileIcons = useFileIcons(33);
  const xhrRef = useRef();
  const { onError } = useFiles();

  const handleUploadError = (xhr) => {
    setUploadProgress(0);
    setIsUploading((prev) => ({
      ...prev,
      [index]: false,
    }));
    const error = {
      type: "upload",
      message: "Upload failed.",
      response: {
        status: xhr?.status,
        statusText: xhr?.statusText,
        data: xhr?.response,
      },
    };

    setFiles((prev) =>
      prev.map((file, i) => {
        if (index === i) {
          return {
            ...file,
            error: error.message,
          };
        }
        return file;
      }),
    );

    setUploadFailed(true);
    onError(error, fileData.file);
  };

  const fileUpload = async (fileData) => {
    if (fileData.error) return;

    const metadata = fileData?.appendData ?? {};
    setIsUploading((prev) => ({ ...prev, [index]: true }));

    // ✅ Pre-upload check
    if (fileUploadConfig?.canUpload) {
      const result = await fileUploadConfig.canUpload(fileData.file, metadata);
      if (!result.success) {
        setIsUploading((prev) => ({ ...prev, [index]: false }));
        setFiles((prev) =>
          prev.map((file, i) => {
            if (index === i) {
              return {
                ...file,
                error: result.message || "Upload failed.",
              };
            }
            return file;
          }),
        );
        return;
      }
    }

    try {
      let uploadUrl = fileUploadConfig.url;
      const isSignedUpload = !!fileUploadConfig.generateSignedUrlEndpoint;

      if (isSignedUpload) {
        const res = await fetch(fileUploadConfig.generateSignedUrlEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: fileData.file.name,
            contentType: fileData.file.type,
            ...metadata,
          }),
        });

        if (!res.ok) throw new Error("Failed to get signed upload URL");
        const { signedUrl } = await res.json();
        uploadUrl = signedUrl;
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        setIsUploading((prev) => ({ ...prev, [index]: false }));

        if (xhr.status >= 200 && xhr.status < 300) {
          setIsUploaded(true);

          const response = isSignedUpload
            ? JSON.stringify({
                file: {
                  name: fileData.file.name,
                  size: fileData.file.size,
                  mimeType: fileData.file.type,
                  metadata,
                  updatedAt: new Date().toISOString(),
                },
              })
            : xhr.response;

          onFileUploaded(response, fileData.file);
        } else {
          handleUploadError(xhr);
        }
      };

      xhr.onerror = () => {
        handleUploadError(xhr);
      };

      if (isSignedUpload) {
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", fileData.file.type || "application/octet-stream");
        const headers = fileUploadConfig?.headers || {};
        for (let key in headers) {
          xhr.setRequestHeader(key, headers[key]);
        }
        xhr.send(fileData.file);
      } else {
        xhr.open("POST", uploadUrl, true);
        const headers = fileUploadConfig?.headers || {};
        for (let key in headers) {
          xhr.setRequestHeader(key, headers[key]);
        }

        const formData = new FormData();
        for (let key in metadata) {
          formData.append(key, metadata[key]);
        }
        formData.append("file", fileData.file);
        xhr.send(formData);
      }
    } catch (err) {
      console.error("Upload failed", err);
      handleUploadError({ status: 500, response: err.message });
    }
  };

  useEffect(() => {
    if (!xhrRef.current) {
      fileUpload(fileData);
    }
  }, []);

  const handleAbortUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setIsUploading((prev) => ({
        ...prev,
        [index]: false,
      }));
      setIsCanceled(true);
      setUploadProgress(0);
    }
  };

  const handleRetry = () => {
    if (fileData?.file) {
      setFiles((prev) =>
        prev.map((file, i) => {
          if (index === i) {
            return {
              ...file,
              error: false,
            };
          }
          return file;
        }),
      );
      fileUpload({ ...fileData, error: false });
      setIsCanceled(false);
      setUploadFailed(false);
    }
  };

  if (fileData.removed) return null;

  return (
    <li>
      <div className="file-icon">{fileIcons[getFileExtension(fileData.file?.name)] ?? <FaRegFile size={33} />}</div>
      <div className="file">
        <div className="file-details">
          <div className="file-info">
            <span className="file-name text-truncate" title={fileData.file?.name}>
              {fileData.file?.name}
            </span>
            <span className="file-size">{getDataSize(fileData.file?.size)}</span>
          </div>
          {isUploaded ? (
            <FaRegCheckCircle title="Uploaded" className="upload-success" />
          ) : isCanceled || uploadFailed ? (
            <IoMdRefresh className="retry-upload" size={20} title="Retry" onClick={handleRetry} />
          ) : (
            <div
              className="rm-file"
              title={fileData.error ? "Remove" : "Abort Upload"}
              onClick={fileData.error ? () => handleFileRemove(index) : handleAbortUpload}
            >
              <AiOutlineClose />
            </div>
          )}
        </div>
        <Progress percent={uploadProgress} isCanceled={isCanceled} isCompleted={isUploaded} error={fileData.error} />
      </div>
    </li>
  );
};

export default UploadItem;
