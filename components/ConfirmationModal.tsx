import React from 'react';
import { AlertTriangle, X, Calendar, Zap } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isScheduled?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  isScheduled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className={`h-2 w-full ${isScheduled ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              {isScheduled ? (
                <Calendar className="w-6 h-6 mr-2 text-indigo-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
              )}
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            {message}
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                // Modal closing is handled by the parent or side effect, but ensuring UI feedback is instant
              }}
              className={`px-4 py-2 text-sm font-bold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md transition-colors flex items-center ${
                isScheduled 
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                  : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
              }`}
            >
              {!isScheduled && <Zap className="w-4 h-4 mr-1.5" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
