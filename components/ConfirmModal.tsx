import React from 'react';
import { X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "확인",
  cancelText = "취소"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm relative shadow-2xl animate-fade-in">
        <button 
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 clickable"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold font-pixel mb-4 text-center border-b border-gray-100 pb-2">
          {title}
        </h2>

        <div className="text-center py-4 mb-4 text-gray-700 font-hand">
          {message}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold clickable hover:bg-gray-300 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-cy-dark text-white py-2 rounded font-bold clickable hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-1"
          >
            <Check size={14} /> {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;