import PropTypes from "prop-types";
import Modal from "../Modal/Modal";
import { BiSolidError } from "react-icons/bi";
import Button from "../Button/Button";
import "./AccessDeniedModal.scss";

const AccessDeniedModal = ({ show, setShow, deniedPermission, deniedFile }) => (
  <Modal
    contentClassName="access-denied-modal"
    heading={
      <div className="access-denied-modal-heading">
        <BiSolidError size={24} className="access-denied-modal-heading-icon" />
        <span>Access Denied</span>
      </div>
    }
    show={show}
    setShow={setShow}
  >
    <div className="access-denied-modal-content">
      <p className="access-denied-modal-text">
        You do not have permission to perform the &quot;{deniedPermission}&quot; action
        {deniedFile ? ` on the file: "${deniedFile}"` : " on the selected files"}.
      </p>
      <div className="access-denied-modal-actions">
        <Button type="danger" onClick={() => setShow(false)}>
          Close
        </Button>
      </div>
    </div>
  </Modal>
);

AccessDeniedModal.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  deniedPermission: PropTypes.string.isRequired,
  deniedFile: PropTypes.string,
};

export default AccessDeniedModal;
