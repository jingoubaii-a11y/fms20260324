import React, { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

function ProjectPage({ showToast }) {
  const [data, setData] = useState([
    { id: 1, org: '北京分公司', enablePeriod: '202601', currentPeriod: '202604' },
    { id: 2, org: '上海分公司', enablePeriod: '202603', currentPeriod: '202604' },
  ]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [faqVisible, setFaqVisible] = useState(false);
  const [errorDetailModal, setErrorDetailModal] = useState(null);

  // 模拟未完成的项目数据
  const mockUnfinishedDocs = [
    { id: 1, currentPeriod: '202604', contractNo: 'HT-202604-001', projectName: '北京一期工程', status: '待核算', targetPeriod: '202605' },
    { id: 2, currentPeriod: '202604', contractNo: 'HT-202604-002', projectName: '上海二期改造', status: '核算中', targetPeriod: '202605' },
    { id: 3, currentPeriod: '202604', contractNo: 'HT-202604-005', projectName: '广州展厅装修', status: '待确认', targetPeriod: '202605' },
    { id: 4, currentPeriod: '202604', contractNo: 'HT-202604-008', projectName: '深圳南山项目', status: '待核算', targetPeriod: '202605' },
    { id: 5, currentPeriod: '202604', contractNo: 'HT-202604-012', projectName: '成都分部扩建', status: '核算中', targetPeriod: '202605' },
  ];

  const addLogs = (actionType) => {
    const newLogs = selectedIds.map(id => {
      const row = data.find(d => d.id === id);
      const isSuccess = Math.random() > 0.4; // 稍微提高成功率
      const actionName = actionType === 'close' ? '关账' : (actionType === 'check' ? '检查' : '反关账');
      
      let message = '';
      let details = null;
      if (isSuccess) {
        message = `${actionName}操作已完成`;
      } else {
        if (actionType === 'check' || actionType === 'close') {
          // 随机取 2-4 条作为阻断明细
          const detailCount = Math.floor(Math.random() * 3) + 2;
          details = [...mockUnfinishedDocs].sort(() => 0.5 - Math.random()).slice(0, detailCount);
          message = `阻断原因: 当期存在 ${details.length} 个未核算完成或未确认的项目`;
        } else {
          message = `阻断原因: 存在后置关联单据, 不允许${actionName}`;
        }
      }

      return {
        id: Date.now() + id + Math.random(),
        time: new Date().toLocaleTimeString(),
        org: row.org,
        action: actionName,
        status: isSuccess ? '成功' : '失败',
        message: message,
        details: details
      };
    });
    setExecutionLogs(prev => [...newLogs, ...prev]);
  };

  const handleAction = (type) => {
    if (selectedIds.length === 0) return showToast('请至少选择一条记录');

    if (type === 'close') {
      setModalConfig({
        title: '确认关账并顺延单据',
        width: 'w-[720px]',
        content: (
          <div className="space-y-4">
            <p className="text-gray-700">检测到以下项目未完成核算确认，继续关账将自动顺延至下一会计期间，确定要继续吗？</p>
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">当前期间</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">合同号</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">项目名称</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">当前状态</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">顺延至期间</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUnfinishedDocs.slice(0, 3).map(doc => (
                    <tr key={doc.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-800">{doc.currentPeriod}</td>
                      <td className="p-3 text-sm text-gray-600">{doc.contractNo}</td>
                      <td className="p-3 text-sm text-gray-600">{doc.projectName}</td>
                      <td className="p-3 text-sm text-gray-600">{doc.status}</td>
                      <td className="p-3 text-sm text-[#1677ff] font-medium">{doc.targetPeriod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                顺延原因 <span className="text-[#ff4d4f]">*</span>
              </label>
              <textarea 
                id="projectPostponeReason"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#1677ff] focus:outline-none"
                rows="2"
                placeholder="请输入顺延原因..."
                data-ai-alt="顺延原因输入框"
              ></textarea>
            </div>
          </div>
        ),
        onConfirm: () => {
          const reason = document.getElementById('projectPostponeReason')?.value;
          if (!reason?.trim()) {
            showToast('请填写顺延原因');
            return;
          }
          addLogs('close');
          showToast('关账申请已提交，顺延履历已生成', 'success');
          setModalConfig(null);
          setSelectedIds([]);
        }
      });
    }
    if (type === 'check') {
      addLogs('check');
      showToast('关账检查请求已发出');
      setSelectedIds([]);
    }
    if (type === 'reverse') {
      setModalConfig({
        title: '确认反关账',
        content: (
          <div>
            <p className="mb-2">确定要执行项目反关账操作吗？</p>
            <p className="text-[#ff4d4f] font-medium">
              ⚠️ 注意：反关账不会退回已顺延的项目记录。
            </p>
          </div>
        ),
        onConfirm: () => {
          addLogs('reverse');
          showToast('反关账已执行', 'success');
          setModalConfig(null);
          setSelectedIds([]);
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#e6f4ff] border border-[#91caff] px-4 py-3 rounded flex items-start justify-between shadow-sm" data-ai-alt="业务提示">
        <div className="flex items-start text-sm text-[#0050b3]">
          <i className="fas fa-info-circle mt-0.5 mr-2"></i>
          <span>关账用于冻结当期数据（禁止产生已关账期间的新数据），并检查本期应核算单据是否处理完成。所有业务模块完成关账后，方可执行期末结账。</span>
        </div>
        <button 
          onClick={() => setFaqVisible(true)}
          className="text-[#1677ff] hover:text-[#4096ff] text-sm whitespace-nowrap ml-4 underline"
          data-ai-alt="常见问题入口"
        >
          查看常见问题解答
        </button>
      </div>

      <div className="bg-white rounded border border-gray-200 p-6 shadow-sm" data-ai-alt="项目关账内容区">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#1677ff] pl-3" data-ai-alt="模块标题">项目关账</h2>
          <div className="space-x-3">
            <button onClick={() => handleAction('check')} className="bg-white border border-gray-300 text-gray-600 hover:text-[#1677ff] hover:border-[#1677ff] px-4 py-2 rounded text-sm transition-colors">
              关账检查
            </button>
            <button onClick={() => handleAction('close')} className="bg-[#1677ff] hover:bg-[#4096ff] text-white px-4 py-2 rounded text-sm transition-colors">
              批量关账
            </button>
            <button onClick={() => handleAction('reverse')} className="bg-white border border-[#ffccc7] text-[#ff4d4f] hover:bg-[#fff2f0] hover:border-[#ff4d4f] px-4 py-2 rounded text-sm transition-colors">
              批量反关账
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto border border-gray-200 rounded-t">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#fafafa] p-3 w-12 border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedIds(e.target.checked ? data.map(d=>d.id) : [])}
                    checked={selectedIds.length === data.length && data.length > 0}
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
              {data.map((row) => (
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
                  <td className="p-3">
                    <span className="text-sm text-gray-600">{row.enablePeriod || '-'}</span>
                  </td>
                  <td className="p-3 text-sm text-[#1677ff] font-medium">{row.currentPeriod}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <td className="p-3 text-sm text-gray-500 whitespace-nowrap">{log.time}</td>
                    <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{log.org}</td>
                    <td className="p-3 text-sm text-gray-600 whitespace-nowrap">{log.action}</td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${log.status === '成功' ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' : 'bg-[#fff2f0] text-[#ff4d4f] border border-[#ffccc7]'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className={`p-3 text-sm flex items-center space-x-2 ${log.status === '成功' ? 'text-gray-600' : 'text-[#ff4d4f]'}`}>
                      <span>{log.message}</span>
                      {log.details && log.details.length > 0 && (
                        <button 
                          onClick={() => setErrorDetailModal({ org: log.org, details: log.details })}
                          className="text-[#1677ff] hover:underline text-xs whitespace-nowrap"
                        >
                          查看明细
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 阻断明细弹窗 */}
      {errorDetailModal && (
        <ConfirmModal 
          title={`未核算完成项目明细 - ${errorDetailModal.org}`}
          hideCancel={true}
          width="w-[640px]"
          onCancel={() => setErrorDetailModal(null)}
          content={(
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">合同号</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">项目名称</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">当前状态</th>
                  </tr>
                </thead>
                <tbody>
                  {errorDetailModal.details.map((doc, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-800">{doc.contractNo}</td>
                      <td className="p-3 text-sm text-gray-600">{doc.projectName}</td>
                      <td className="p-3 text-sm text-[#ff4d4f]">{doc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        />
      )}

      {modalConfig && <ConfirmModal {...modalConfig} onCancel={() => setModalConfig(null)} />}
      
      {faqVisible && (
        <ConfirmModal 
          title="关账流程常见问题解答"
          hideCancel={true}
          width="w-[560px]"
          onCancel={() => setFaqVisible(false)}
          content={(
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">1. 什么时候可以执行期末结账？</h4>
                <p className="text-gray-600">必须在所有上游业务模块（如库存、项目等）都完成“关账”操作后，才可以执行期末的结账。</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">2. 关账失败提示“存在未核算完成的数据”怎么办？</h4>
                <p className="text-gray-600">系统会拦截存在关键未处理单据的关账请求。您可以执行“关账检查”了解具体是哪些单据，然后视情况选择将这些单据“顺延”到下一会计期间。</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">3. 什么是“顺延”？</h4>
                <p className="text-gray-600">顺延是指将在当前期间无法完成核算处理的单据，推迟记录到下一个会计期间处理的过程。可以在“顺延查询”页面查看详细记录。</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">4. 反关账会影响已经顺延的单据吗？</h4>
                <p className="text-gray-600">不会。反关账仅将当前会计期间回退，对于已经产生跨期顺延的单据记录不可撤回。</p>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

export default ProjectPage;
