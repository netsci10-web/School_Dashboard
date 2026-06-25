import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-xl z-[80] flex items-center gap-3 animate-bounce">
      {type === "success" ? (
        <span className="text-emerald-400"><i className="fas fa-check-circle text-lg"></i></span>
      ) : (
        <span className="text-rose-400"><i className="fas fa-exclamation-circle text-lg"></i></span>
      )}
      <span className="text-sm font-medium truncate max-w-xs">{message}</span>
    </div>
  );
}
