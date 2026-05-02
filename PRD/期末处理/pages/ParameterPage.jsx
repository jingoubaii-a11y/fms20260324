import React, { useState } from 'react';

function ParameterPage({ showToast }) {
  const [params, setParams] = useState({
    checkReceipt: true,
    forceCheckComplete: true,
    startTime: '01:00',
    startDay: '2'
  });

  const handleSave = () => {
    showToast('参数保存成功', 'success');
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-6 max-w-4xl shadow-sm" data-ai-alt="参数管理内容区">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#1677ff] pl-3" data-ai-alt="模块标题">业务参数配置</h2>
        <button 
          onClick={handleSave}
          className="bg-[#1677ff] hover:bg-[#4096ff] text-white px-5 py-2 rounded text-sm transition-colors shadow-sm"
          data-ai-alt="保存按钮"
        >
          保存设置
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Group 1 */}
        <div className="bg-[#fafafa] rounded border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">出库与核算控制</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={params.checkReceipt}
                onChange={e => setParams({...params, checkReceipt: e.target.checked})}
                className="w-4 h-4 accent-[#1677ff] bg-white border-gray-300 rounded"
                data-ai-alt="校验对账状态复选框"
              />
              <span className="text-sm text-gray-700">软装出库是否校验对账状态</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={params.forceCheckComplete}
                onChange={e => setParams({...params, forceCheckComplete: e.target.checked})}
                className="w-4 h-4 accent-[#1677ff] bg-white border-gray-300 rounded"
                data-ai-alt="强制校验复选框"
              />
              <span className="text-sm text-gray-700">强制校验当期应核算项目是否全部核算完成</span>
            </label>
          </div>
        </div>

        {/* Group 2 */}
        <div className="bg-[#fafafa] rounded border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">定时任务设定</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-700">每期整装核算开始时间为次月</span>
            <select 
              value={params.startDay}
              onChange={e => setParams({...params, startDay: e.target.value})}
              className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:border-[#1677ff] focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
              data-ai-alt="日期选择"
            >
              {[...Array(28)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}日</option>
              ))}
            </select>
            <input 
              type="time" 
              value={params.startTime}
              onChange={e => setParams({...params, startTime: e.target.value})}
              className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:border-[#1677ff] focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
              data-ai-alt="时间选择"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParameterPage;
