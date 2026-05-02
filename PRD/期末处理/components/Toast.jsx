import React from 'react';

function Toast({ message, type = 'error' }) {
  return (
    <div 
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center bg-white text-gray-800 px-6 py-3 rounded shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-100 animate-fade-in-down"
      data-ai-alt="全局提示"
    >
      {type === 'error' && (
        <i className="fas fa-exclamation-circle text-[#ff4d4f] mr-2" data-ai-alt="错误图标"></i>
      )}
      {type === 'success' && (
        <i className="fas fa-check-circle text-[#52c41a] mr-2" data-ai-alt="成功图标"></i>
      )}
      <span className="text-sm">{message}</span>
    </div>
  );
}

export default Toast;
