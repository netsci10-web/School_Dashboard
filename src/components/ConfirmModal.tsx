import React from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-up">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-xl">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title || "정말 삭제하시겠습니까?"}</h3>
          <p className="text-sm text-gray-500">{message || "이 작업은 되돌릴 수 없습니다."}</p>
        </div>
        <div className="flex border-t border-gray-100 bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 p-4 text-gray-600 hover:bg-gray-100 font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="flex-1 p-4 text-red-500 border-l border-gray-100 hover:bg-red-50 font-bold transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
