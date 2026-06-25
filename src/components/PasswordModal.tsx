import React, { useState } from "react";

interface PasswordModalProps {
  onClose: () => void;
  onSubmit: (password: string) => void;
  title?: string;
  subtitle?: string;
}

export default function PasswordModal({ onClose, onSubmit, title = "잠긴 항목", subtitle = "내용을 보려면 암호를 입력해주세요." }: PasswordModalProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password.trim());
    setPassword("");
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[65] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          type="button"
        >
          <i className="fas fa-times"></i>
        </button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 text-xl">
            <i className="fas fa-lock"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="암호 입력"
            className="w-full mb-6 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors shadow-sm"
          >
            확인
          </button>
        </form>
      </div>
    </div>
  );
}
