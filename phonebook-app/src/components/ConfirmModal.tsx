import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="confirm-modal-overlay" onClick={onCancel}></div>
      <div className="confirm-modal">
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
