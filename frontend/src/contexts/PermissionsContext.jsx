import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
import AccessDeniedModal from "../components/AccessDeniedModal/AccessDeniedModal";

export const Permission = Object.freeze({
  COPY: "copy",
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  UPLOAD: "upload",
});

const readablePermissionNames = {
  [Permission.COPY]: "Copy",
  [Permission.READ]: "Read",
  [Permission.WRITE]: "Write",
  [Permission.DELETE]: "Delete",
  [Permission.UPLOAD]: "Upload",
};

const PermissionsContext = createContext();

/**
 * Merges duplicate permissions and ensures the most restrictive settings take precedence.
 *
 * @param {Array} permissions - List of permissions from the user.
 * @returns {Array} - Cleaned permissions list with no duplicates.
 */
const mergePermissions = (permissions) => {
  const mergedPermissions = new Map();

  permissions.forEach((perm) => {
    const key = `${perm.path}_${perm.applyTo || "both"}`; // Unique key based on path and applyTo

    if (!mergedPermissions.has(key)) {
      mergedPermissions.set(key, { ...perm });
    } else {
      // Merge existing permissions, prioritizing false (most restrictive)
      const existing = mergedPermissions.get(key);
      mergedPermissions.set(key, {
        path: perm.path,
        applyTo: perm.applyTo || existing.applyTo,
        copy: perm.copy !== undefined ? perm.copy : existing.copy,
        read: perm.read !== undefined ? perm.read : existing.read,
        write: perm.write !== undefined ? perm.write : existing.write,
        delete: perm.delete !== undefined ? perm.delete : existing.delete,
        upload: perm.upload !== undefined ? perm.upload : existing.upload,
      });
    }
  });

  return Array.from(mergedPermissions.values());
};

export const PermissionsProvider = ({ children, permissions }) => {
  const [show, setShow] = useState(false);
  const [deniedPermission, setDeniedPermission] = useState("");
  const [deniedFile, setDeniedFile] = useState("");

  // Preprocess permissions to handle duplicates before use
  const cleanedPermissions = mergePermissions(permissions);

  /**
   * Checks if a specific action is allowed on a set of files based on their permissions.
   *
   * @param {Array} files - The list of files to check permissions for.
   * @param {string} permissionType - The type of permission to check (e.g., 'read', 'write').
   * @returns {boolean} - Returns true if the action is allowed on all files, otherwise false.
   */
  const isActionAllowed = (files, permissionType, riseError = true) => {
    const allowed = files.every((file) => {
      file = file || {
        name: "Home",
        isDirectory: true,
        path: "/",
      };
      const filePath = file?.path || "/";
      let permissionFound = false;
      let permissionAllowed = true;

      for (const perm of cleanedPermissions) {
        const appliesToFile = perm.applyTo === "file" || !perm.applyTo;
        const appliesToFolder = perm.applyTo === "folder" || !perm.applyTo;

        if (perm.path === "/**" && ((file.isDirectory && appliesToFolder) || (!file.isDirectory && appliesToFile))) {
          permissionFound = true;
          permissionAllowed = perm[permissionType] ?? true;
          break;
        }

        if (perm.path === filePath && ((file.isDirectory && appliesToFolder) || (!file.isDirectory && appliesToFile))) {
          permissionFound = true;
          permissionAllowed = perm[permissionType] ?? true;
          break;
        }

        if (perm.path.endsWith("/*")) {
          const parentPath = perm.path.slice(0, -2);
          if (filePath.startsWith(parentPath) && filePath.split("/").length === parentPath.split("/").length + 1) {
            if ((file.isDirectory && appliesToFolder) || (!file.isDirectory && appliesToFile)) {
              permissionFound = true;
              permissionAllowed = perm[permissionType] ?? true;
              break;
            }
          }
        }

        if (perm.path.endsWith("/**")) {
          const parentPath = perm.path.slice(0, -3);
          if (filePath.startsWith(parentPath)) {
            if ((file.isDirectory && appliesToFolder) || (!file.isDirectory && appliesToFile)) {
              permissionFound = true;
              permissionAllowed = perm[permissionType] ?? true;
              break;
            }
          }
        }
      }

      return permissionFound ? permissionAllowed : true;
    });

    if (!allowed && riseError) {
      setDeniedPermission(readablePermissionNames[permissionType]);
      setDeniedFile(files.length === 1 ? files[0].name : "");
      setShow(true);
    }

    return allowed;
  };

  return (
    <PermissionsContext.Provider value={{ isActionAllowed }}>
      <AccessDeniedModal show={show} setShow={setShow} deniedPermission={deniedPermission} deniedFile={deniedFile} />
      {children}
    </PermissionsContext.Provider>
  );
};

PermissionsProvider.propTypes = {
  children: PropTypes.node.isRequired,
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      copy: PropTypes.bool,
      read: PropTypes.bool,
      write: PropTypes.bool,
      delete: PropTypes.bool,
      upload: PropTypes.bool,
      applyTo: PropTypes.oneOf(["file", "folder"]),
    }),
  ).isRequired,
};

export const usePermissions = () => useContext(PermissionsContext);
