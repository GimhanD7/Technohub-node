import { useState, useEffect } from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

export function CustomDialog({ 
  isOpen, 
  type = "info", 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  isAlertOnly = false,
  requirePassword = false,
  passwordPlaceholder = "Enter password to confirm",
  showInput = false,
  inputPlaceholder = "Enter value...",
}) {
  const [password, setPassword] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setInputValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    error: <X className="w-6 h-6 text-red-500" />,
    success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />
  };

  const colors = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  const btnColors = {
    warning: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
    error: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-500 hover:bg-green-600 focus:ring-green-500",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
  };

  const handleConfirm = () => {
    if (onConfirm) {
      if (requirePassword) onConfirm(password);
      else if (showInput) onConfirm(inputValue);
      else onConfirm();
    }
    if (isAlertOnly && onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full shrink-0 border ${colors[type]} bg-opacity-50`}>
              {icons[type]}
            </div>
            <div className="pt-1 flex-1">
              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none mb-2">{title}</h3>
              <div className="text-[13px] text-gray-500 leading-relaxed mb-1">{message}</div>
              
              {requirePassword && (
                <div className="mt-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={passwordPlaceholder}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:outline-none bg-white text-slate-800"
                    autoFocus
                  />
                </div>
              )}

              {showInput && (
                <div className="mt-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={inputPlaceholder || "Enter reason..."}
                    rows={3}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:outline-none bg-white text-slate-800 resize-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2">
          {!isAlertOnly && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-[12px] font-medium text-slate-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            disabled={(requirePassword && !password.trim()) || (showInput && !inputValue.trim())}
            className={`px-4 py-2 text-[12px] font-medium text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${btnColors[type]} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAlertOnly ? "OK" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

