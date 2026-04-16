"use client";

import { useState, useEffect } from "react";

interface ErrorModalProps {
  isOpen: boolean;
  error: string | null;
  onClose: () => void;
}

export function ErrorModal({ isOpen, error, onClose }: ErrorModalProps) {
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Auto-cerrar después de 5 segundos si está abierto
  useEffect(() => {
    if (isOpen && error) {
      setDisplayError(error);
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setDisplayError(null);
    }
  }, [isOpen, error, onClose]);

  if (!isOpen || !displayError) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 animate-pulse">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Error</h2>
        </div>

        <p className="mb-6 text-gray-600">{displayError}</p>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-red-600 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 active:scale-95"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
