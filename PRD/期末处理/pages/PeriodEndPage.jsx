import React, { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

function PeriodEndPage({ showToast }) {
  const [data] = useState([
    { id: 1, org: '北京分公司', enablePeriod: '202601', currentPeriod: '202604' },
    { id: 2, org: '上海分公司', enablePeriod: '202602', currentPeriod: '202604' },
    { id: 3, org: '广州分公司', enablePeriod: '202601', currentPeriod: '202604' },
  ]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  
  // 查询条件
  const [searchOrg, setSearchOrg] = useState('');

  // 过滤数据
  const filteredData = data.filter(row => {
    return row.org.includes(searchOrg);
  });

  const addLogs = (actionType) => {
    const newLogs = selectedIds.map(id => {
      const row = data.find(d => d.id === id);
      const isSuccess = Math.random() > 0.3;
      const actionName = actionType === 'close' ? '结账' : '反结账';
      return {
        id: Date.now() + id,
        time: new Date().toLocaleTimeString(),
        org: row.org,
        action: actionName,
        status: isSuccess ? '成功' : '失败',
        message: isSuccess ? `${actionName}成功` : `存在未核算完成的数据，不允许${actionName}`
      };
    });
    setExecutionLogs(prev => [...newLogs, ...prev]);
  };

  const handleAction = (type) => {
    if (selectedIds.length === 0) return showToast('请至少选择一条记录');
    
    if (type === 'close') {
      addLogs('close');
      showToast('结账处理完成', 'success');
      setSelectedIds([]);
    } else {
      setModalConfig({
        title: '确认反结账',
        content: (
          <div>
            <p className="mb-2">确定要执行反结账操作吗？</p>
            <p className="text-[#ff4d4f] font-medium">
              ⚠️ 注意：反结账不会退回跨期顺延的单据。
            </p>
          </div>
        ),
        onConfirm: () => {
          addLogs('reverse');
          showToast('反结账已触发', 'success');
          setSelectedIds([]);
          setModalConfig(null);
        }
      });
    }
  };

  // 处理全选
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded border border-gray-200 p-6 shadow-sm" data-ai-alt="期末结账内容区">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#1677ff] pl-3" data-ai-alt="模块标题">期末结账</h2>
          <div className="space-x-3">
            <button onClick={() => handleAction('close')} className="bg-[#1677ff] hover:bg-[#4096ff] text-white px-4 py-2 rounded text-sm transition-colors">
              批量结账
            </button>
            <button onClick={() => handleAction('reverse')} className="bg-white border border-[#ffccc7] text-[#ff4d4f] hover:bg-[#fff2f0] hover:border-[#ff4d4f] px-4 py-2 rounded text-sm transition-colors">
              批量反结账
            </button>
          </div>
        </div>

        {/* 查询区域 */}
        <div className="bg-[#fafafa] p-4 rounded border border-gray-100 mb-4 flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">财务组织:</span>
            <input 
              type="text"
              value={searchOrg}
              onChange={(e) => setSearchOrg(e.target.value)}
              placeholder="请输入组织名称"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-[#1677ff] focus:outline-none w-48"
              data-ai-alt="财务组织搜索"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto border border-gray-200 rounded-t">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#fafafa] p-3 w-12 border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                    className="w-4 h-4 accent-[#1677ff] bg-white border-gray-300"
                    data-ai-alt="全选复选框"
                  />
                </th>
                <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">财务组织</th>
                <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">启用期间</th>
                <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">当前期间</th>
              </tr>
            </thead>
            <tbody data-ai-list="true">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className={`transition-colors border-b border-gray-100 ${selectedIds.includes(row.id) ? 'bg-[#e6f4ff]' : 'hover:bg-blue-50'}`}>
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(row.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i=>i!==row.id) : [...prev, row.id])}
                        className="w-4 h-4 accent-[#1677ff] bg-white border-gray-300"
                        data-ai-alt="行选择复选框"
                      />
                    </td>
                    <td className="p-3 text-sm text-gray-800">{row.org}</td>
                    <td className="p-3 text-sm text-gray-600">{row.enablePeriod}</td>
                    <td className="p-3 text-sm text-[#1677ff] font-medium">{row.currentPeriod}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400 text-sm">
                    暂无匹配的记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <span>共查询到 {filteredData.length} 条记录</span>
        </div>
      </div>

      {/* 执行结果区域 */}
      {executionLogs.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-6 shadow-sm" data-ai-alt="执行结果内容区">
          <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">执行结果</h3>
          <div className="overflow-y-auto max-h-60 border border-gray-200 rounded">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#fafafa] z-10">
                <tr>
                  <th className="p-3 text-sm font-medium text-gray-500 border-b border-gray-200">时间</th>
                  <th className="p-3 text-sm font-medium text-gray-500 border-b border-gray-200">财务组织</th>
                  <th className="p-3 text-sm font-medium text-gray-500 border-b border-gray-200">操作类型</th>
                  <th className="p-3 text-sm font-medium text-gray-500 border-b border-gray-200">执行状态</th>
                  <th className="p-3 text-sm font-medium text-gray-500 border-b border-gray-200">结果信息</th>
                </tr>
              </thead>
              <tbody data-ai-list="true">
                {executionLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500">{log.time}</td>
                    <td className="p-3 text-sm text-gray-800">{log.org}</td>
                    <td className="p-3 text-sm text-gray-600">{log.action}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${log.status === '成功' ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' : 'bg-[#fff2f0] text-[#ff4d4f] border border-[#ffccc7]'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className={`p-3 text-sm ${log.status === '成功' ? 'text-gray-600' : 'text-[#ff4d4f]'}`}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalConfig && <ConfirmModal {...modalConfig} onCancel={() => setModalConfig(null)} />}
    </div>
  );
}

export default PeriodEndPage;
