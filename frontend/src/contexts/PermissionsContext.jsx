import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
import AccessDeniedModal from "../components/AccessDeniedModal/AccessDeniedModal";

export const Permission = Object.freeze({
  CREATE: "create",
  COPY: "copy",
  MOVE: "move",
  READ: "read",
  DELETE: "delete",
  UPLOAD: "upload",
  RENAME: "rename",
});

const readablePermissionNames = {
  [Permission.CREATE]: "Create",
  [Permission.COPY]: "Copy",
  [Permission.MOVE]: "Move",
  [Permission.READ]: "Read",
  [Permission.DELETE]: "Delete",
  [Permission.UPLOAD]: "Upload",
  [Permission.RENAME]: "Rename",
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
        copy: perm.copy !== undefined ? perm.copy && existing.copy : existing.copy,
        read: perm.read !== undefined ? perm.read && existing.read : existing.read,
        write: perm.write !== undefined ? perm.write && existing.write : existing.write,
        delete: perm.delete !== undefined ? perm.delete && existing.delete : existing.delete,
        upload: perm.upload !== undefined ? perm.upload && existing.upload : existing.upload,
      });
    }
  });

  // Convert Map back to an array
  let permissionArray = Array.from(mergedPermissions.values());

  // **Prioritize specific rules over wildcards**
  permissionArray.sort((a, b) => {
    const depthA = a.path.split("/").length;
    const depthB = b.path.split("/").length;

    // More specific rules (deeper paths) come first
    return depthB - depthA;
  });

  return permissionArray;
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
      file = file || { name: "Home", isDirectory: true, path: "/" };
      const filePath = file?.path || "/";
      let permissionFound = false;
      let permissionAllowed = true;
      let highestPriority = -1; // Higher priority = more specific match

      for (const perm of cleanedPermissions) {
        const appliesToFile = perm.applyTo === "file" || !perm.applyTo;
        const appliesToFolder = perm.applyTo === "folder" || !perm.applyTo;

        // Skip if rule applies to files but this is a folder, or vice versa
        if ((file.isDirectory && !appliesToFolder) || (!file.isDirectory && !appliesToFile)) {
          continue;
        }

        // Convert wildcard path to regex
        let permRegex = perm.path
          .replace(/\/\*\*/g, "/.*") // `/**` -> `/.*` (matches everything recursively)
          .replace(/\/\*/g, "/[^/]+"); // `/*` -> `/[^/]+` (matches direct children only)

        const regex = new RegExp(`^${permRegex}$`);
        if (regex.test(filePath)) {
          permissionFound = true;
          const priority = perm.path.split("/").length;

          // Prioritize more specific rules over wildcards
          if (priority > highestPriority) {
            highestPriority = priority;
            permissionAllowed = perm[permissionType] ?? true;
          }

          // If we find a `false`, stop searching (most restrictive takes precedence)
          if (perm[permissionType] === false) {
            permissionAllowed = false;
            break;
          }
        }
      }

      return permissionFound ? permissionAllowed : true;
    });

    if (!allowed && riseError) {
      setDeniedPermission(readablePermissionNames[permissionType]);
      setDeniedFile(files.length === 1 ? (files[0].displayName ?? files[0].name) : "");
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
      create: PropTypes.bool,
      copy: PropTypes.bool,
      move: PropTypes.bool,
      read: PropTypes.bool,
      delete: PropTypes.bool,
      upload: PropTypes.bool,
      rename: PropTypes.bool,
      applyTo: PropTypes.oneOf(["file", "folder"]),
    }),
  ).isRequired,
};

export const usePermissions = () => useContext(PermissionsContext);
