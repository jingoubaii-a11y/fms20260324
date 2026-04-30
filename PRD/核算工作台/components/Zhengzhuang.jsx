import React, { useState } from 'react';

function Zhengzhuang({ subjects }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [contractNo, setContractNo] = useState('');
  const [status, setStatus] = useState('');

  const metrics = [
    { label: '本期应核算项目', value: 800, suffix: '个' },
    { label: '整装项目确认', value: 400, rate: '50.0%' }
  ];

  const generateData = [
    { org: '成都分公司', id: 'ZZ901000001', calcStatus: '已计算', calcTime: '2026-03-01 18:00:00', confirmStatus: '已确认', confirmTime: '2026-03-01 20:00:00', done: true },
    { org: '成都分公司', id: 'ZZ901000002', calcStatus: '已计算', calcTime: '2026-03-01 18:00:00', confirmStatus: '未确认', confirmTime: '-', done: false }
  ];

  const syncData = [
    { org: '成都分公司', id: 'ZZ901000001', srcDoc: '整装项目核算单', srcDocNo: 'ZZ901000001-20260301', targetNode: '项目核算收入确认', targetDoc: '应收单', targetDocNo: 'AR20260199', targetTime: '2026-03-01 11:00:00', ebsStatus: '已同步', ebsTime: '2026-03-01 11:00:00', kdStatus: '未同步', kdTime: '2026-03-01 18:00:00' }
  ];

  const filteredGenerateData = generateData.filter(row => {
    const matchContract = contractNo ? row.id.includes(contractNo) : true;
    const matchStatus = status ? (status === '1' ? row.done : !row.done) : true;
    return matchContract && matchStatus;
  });

  return (
    <div className="space-y-6" data-ai-alt="整装核算区域">
      <div className="bg-[#f8faff] p-4 rounded border border-[#e0e8f5]" data-ai-alt="整装指标概览">
        <h3 className="text-[14px] font-bold text-[#003366] mb-4">整装核算进度概览</h3>
        <div className="flex space-x-4 mb-4" data-ai-list="true">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white p-4 rounded shadow-sm border border-[#eee] w-[200px] text-center">
              <div className="text-[#666] text-[13px] mb-2">{m.label}</div>
              <div className="text-[#333] text-[24px] font-bold">{m.value}<span className="text-[12px] font-normal"> {m.suffix||''}</span></div>
              {m.rate && <div className="text-[#0055ff] text-[12px] mt-1">进度 {m.rate}</div>}
            </div>
          ))}
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-[13px] text-[#666]">整体核算进度</div>
          <div className="h-[8px] bg-[#e8e8e8] rounded-full overflow-hidden w-[416px]">
            <div className="bg-[#0055ff] h-full" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8faff] p-4 rounded border border-[#e0e8f5]" data-ai-alt="快捷核算步骤">
        <h3 className="text-[14px] font-bold text-[#003366] mb-4">整装核算步骤与快捷入口</h3>
        <button className="bg-[#1890ff] text-white px-4 py-2 rounded text-[14px] hover:bg-[#0055ff] transition-colors">
          整装项目收入核算
        </button>
      </div>

      <div className="bg-white border border-[#e8e8e8] rounded" data-ai-alt="明细页签区">
        <div className="flex border-b border-[#e8e8e8] bg-[#fafafa]" data-ai-list="true">
          <div 
            className={`px-4 py-3 cursor-pointer text-[14px] font-medium ${activeTab === 'generate' ? 'text-[#0055ff] bg-white border-t-2 border-t-[#0055ff] border-x border-x-[#e8e8e8] -mb-[1px]' : 'text-[#666] hover:text-[#0055ff]'}`}
            onClick={() => setActiveTab('generate')}
          >
            本期单据生成详情
          </div>
          <div 
            className={`px-4 py-3 cursor-pointer text-[14px] font-medium ${activeTab === 'sync' ? 'text-[#0055ff] bg-white border-t-2 border-t-[#0055ff] border-x border-x-[#e8e8e8] -mb-[1px]' : 'text-[#666] hover:text-[#0055ff]'}`}
            onClick={() => setActiveTab('sync')}
          >
            本期单据同步详情
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'generate' && (
            <div className="space-y-4" data-ai-alt="生成详情内容">
              <div className="flex items-center space-x-4 mb-4" data-ai-alt="筛选区">
                <div className="flex items-center space-x-2">
                  <span className="text-[13px] text-[#333]">完成状态:</span>
                  <select className="border border-[#d9d9d9] rounded px-2 py-1 text-[13px] outline-none" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">全部</option>
                    <option value="1">已完成</option>
                    <option value="0">未完成</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[13px] text-[#333]">合同号:</span>
                  <input 
                    type="text" 
                    placeholder="请输入合同号"
                    className="border border-[#d9d9d9] rounded px-2 py-1 text-[13px] outline-none w-[200px]"
                    value={contractNo}
                    onChange={(e) => setContractNo(e.target.value)}
                  />
                </div>
              </div>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f0f2f5] text-[#333]">
                    <th className="p-2 border border-[#e8e8e8]">财务主体</th>
                    <th className="p-2 border border-[#e8e8e8]">合同号</th>
                    <th className="p-2 border border-[#e8e8e8]">整装项目计算状态</th>
                    <th className="p-2 border border-[#e8e8e8]">整装项目计算时间</th>
                    <th className="p-2 border border-[#e8e8e8]">整装项目确认状态</th>
                    <th className="p-2 border border-[#e8e8e8]">整装项目确认时间</th>
                    <th className="p-2 border border-[#e8e8e8] text-center w-[80px]">完成状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGenerateData.map((row, i) => (
                    <tr key={i} className="hover:bg-[#f9fafc]">
                      <td className="p-2 border border-[#e8e8e8]">{row.org}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#1890ff] cursor-pointer">{row.id}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.calcStatus}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.calcTime}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.confirmStatus}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.confirmTime}</td>
                      <td className="p-2 border border-[#e8e8e8] text-center">{row.done ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'sync' && (
             <div className="space-y-4 overflow-x-auto" data-ai-alt="同步详情内容">
              <table className="w-full text-left border-collapse text-[12px] min-w-[1200px]">
                <thead>
                  <tr className="bg-[#f0f2f5] text-[#333]">
                    <th className="p-2 border border-[#e8e8e8]">财务主体</th>
                    <th className="p-2 border border-[#e8e8e8]">合同号</th>
                    <th className="p-2 border border-[#e8e8e8]">来源单据</th>
                    <th className="p-2 border border-[#e8e8e8]">来源单据编号</th>
                    <th className="p-2 border border-[#e8e8e8]">目标单据生成节点</th>
                    <th className="p-2 border border-[#e8e8e8]">目标单据</th>
                    <th className="p-2 border border-[#e8e8e8]">目标单据编号</th>
                    <th className="p-2 border border-[#e8e8e8]">目标单据生成时间</th>
                    <th className="p-2 border border-[#e8e8e8]">同步EBS状态</th>
                    <th className="p-2 border border-[#e8e8e8]">同步EBS时间</th>
                    <th className="p-2 border border-[#e8e8e8]">同步KD状态</th>
                    <th className="p-2 border border-[#e8e8e8]">同步KD时间</th>
                  </tr>
                </thead>
                <tbody>
                  {syncData.map((row, i) => (
                    <tr key={i} className="hover:bg-[#f9fafc]">
                      <td className="p-2 border border-[#e8e8e8]">{row.org}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#1890ff] cursor-pointer">{row.id}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.srcDoc}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.srcDocNo}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.targetNode}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.targetDoc}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#1890ff] cursor-pointer">{row.targetDocNo}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.targetTime}</td>
                      <td className="p-2 border border-[#e8e8e8]">
                        <span className={row.ebsStatus === '已同步' ? 'text-[#00b365]' : 'text-[#faad14]'}>{row.ebsStatus}</span>
                      </td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.ebsTime}</td>
                      <td className="p-2 border border-[#e8e8e8]">
                        <span className={row.kdStatus === '已同步' ? 'text-[#00b365]' : 'text-[#faad14]'}>{row.kdStatus}</span>
                      </td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.kdTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Zhengzhuang;
