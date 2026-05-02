import React from 'react';

function ConfirmModal({ title, content, onConfirm, onCancel, width = 'w-[420px]', hideCancel = false }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
      <div className={`bg-white rounded-lg shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[85vh] ${width}`} data-ai-alt="确认弹窗">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-gray-900 font-medium text-lg" data-ai-alt="弹窗标题">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times" data-ai-alt="关闭按钮"></i>
          </button>
        </div>
        <div className="px-6 py-6 text-gray-600 text-sm overflow-y-auto" data-ai-alt="弹窗内容">
          {content}
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100 shrink-0">
          {!hideCancel && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded text-gray-600 hover:border-[#1677ff] hover:text-[#1677ff] transition-colors"
              data-ai-alt="取消按钮"
            >
              取消
            </button>
          )}
          <button 
            onClick={onConfirm || onCancel}
            className="px-4 py-2 text-sm bg-[#1677ff] text-white rounded hover:bg-[#4096ff] transition-colors"
            data-ai-alt="确认按钮"
          >
            {hideCancel ? '知道了' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
