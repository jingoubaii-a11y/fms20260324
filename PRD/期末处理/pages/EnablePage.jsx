import React, { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

function EnablePage({ showToast }) {
  const [data, setData] = useState([
    { id: 1, org: '北京分公司', period: '', isEnabled: false, isActive: false },
    { id: 2, org: '上海分公司', period: '202603', isEnabled: true, isActive: true },
  ]);
  const [modalConfig, setModalConfig] = useState(null);

  const handleEnable = (id, org) => {
    const item = data.find(d => d.id === id);
    if (!item.period) {
      showToast('请先选择启用期间');
      return;
    }
    setModalConfig({
      title: '确认启用',
      content: `确定要启用【${org}】的核算模块吗？启用后启用期间将不可修改。`,
      onConfirm: () => {
        setData(data.map(d => d.id === id ? { ...d, isEnabled: true, isActive: true } : d));
        setModalConfig(null);
        showToast('启用成功', 'success');
      }
    });
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-6 shadow-sm" data-ai-alt="启用管理内容区">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#1677ff] pl-3" data-ai-alt="模块标题">启用管理</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">财务组织</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">启用期间</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">是否生效</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">操作</th>
            </tr>
          </thead>
          <tbody data-ai-list="true">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100 group">
                <td className="p-3 text-sm text-gray-800">{row.org}</td>
                <td className="p-3">
                  <input 
                    type="month" 
                    value={row.period.replace(/(\d{4})(\d{2})/, '$1-$2')} 
                    onChange={(e) => {
                      if(!row.isEnabled) {
                        const val = e.target.value.replace('-', '');
                        setData(data.map(d => d.id === row.id ? { ...d, period: val } : d));
                      }
                    }}
                    disabled={row.isEnabled}
                    className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:border-[#1677ff] focus:outline-none focus:ring-1 focus:ring-[#1677ff] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    data-ai-alt="期间选择"
                  />
                </td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${row.isActive ? 'bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    {row.isActive ? '是' : '否'}
                  </span>
                </td>
                <td className="p-3">
                  {!row.isEnabled && (
                    <button 
                      onClick={() => handleEnable(row.id, row.org)}
                      className="text-[#ff4d4f] hover:text-[#ff7875] text-sm font-medium flex items-center space-x-1 transition-colors"
                      data-ai-alt="启用按钮"
                    >
                      <i className="fas fa-exclamation-triangle text-xs flex items-center justify-center w-3 h-3" data-ai-alt="警告图标"></i>
                      <span>启用</span>
                    </button>
                  )}
                  {row.isEnabled && (
                    <span className="text-gray-400 text-sm">已启用</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalConfig && (
        <ConfirmModal 
          {...modalConfig}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}

export default EnablePage;
