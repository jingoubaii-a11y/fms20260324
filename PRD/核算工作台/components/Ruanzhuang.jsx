import React, { useState } from 'react';

function Ruanzhuang({ subjects }) {
  const [activeDetailTab, setActiveDetailTab] = useState('progress');
  const [doneStatus, setDoneStatus] = useState('');
  const [contractNo, setContractNo] = useState('');

  const metrics = [
    { label: '本期应核算项目', value: 350, suffix: '个' },
    { label: '对账成功', value: 300, rate: '85.7%' },
    { label: '竣工出库', value: 280, rate: '80.0%' },
    { label: '出库成本获取', value: 280, rate: '80.0%' },
    { label: '工费成本获取', value: 250, rate: '71.4%' },
    { label: '收入分摊计算', value: 200, rate: '57.1%' },
    { label: '软装项目确认', value: 150, rate: '42.8%' }
  ];

  const progressTableData = [
    { id: 'RZ901000001', org: '成都分公司', dz: '对账成功', dzTime: '2026-03-01 09:00:00', ck: '已出库', ckTime: '2026-03-01 11:00:00', ckcb: '已获取', ckcbTime: '2026-03-01 11:00:00', gfcb: '已获取', gfcbTime: '2026-03-01 11:00:00', srft: '已计算', srftTime: '2026-03-01 18:00:00', qr: '已确认', qrTime: '2026-03-01 20:00:00', done: true },
    { id: 'RZ901000002', org: '成都分公司', dz: '对账成功', dzTime: '2026-03-01 09:00:00', ck: '已出库', ckTime: '2026-03-01 11:00:00', ckcb: '已获取', ckcbTime: '2026-03-01 11:00:00', gfcb: '已获取', gfcbTime: '2026-03-01 11:00:00', srft: '已计算', srftTime: '2026-03-01 18:00:00', qr: '未确认', qrTime: '-', done: false }
  ];

  const documentTableData = [
    { org: '成都分公司', id: 'RZ901000001', srcDoc: '三方对账单', srcDocNo: 'RZ901000001-20260301', targetNode: '对账成功', targetDoc: '销售出库单', targetDocNo: 'XSCKD000001', targetDocTime: '2026-03-01 11:00:00', ebsStatus: '未同步', ebsTime: '2026-03-01 11:00:00', kdStatus: '已同步', kdTime: '2026-03-01 18:00:00' }
  ];

  const filteredProgressData = progressTableData.filter(row => {
    const matchCompleted = doneStatus ? (doneStatus === '1' ? row.done : !row.done) : true;
    const matchContract = contractNo ? row.id.includes(contractNo) : true;
    return matchCompleted && matchContract;
  });

  return (
    <div className="space-y-6" data-ai-alt="软装核算区域">
      <div className="bg-[#f8faff] p-4 rounded border border-[#e0e8f5]" data-ai-alt="软装指标概览">
        <h3 className="text-[14px] font-bold text-[#003366] mb-4">软装核算进度概览</h3>
        <div className="flex space-x-2 mb-4" data-ai-list="true">
          {metrics.map((m, i) => (
            <div key={i} className="flex-1 bg-white p-3 rounded shadow-sm border border-[#eee] text-center">
              <div className="text-[#666] text-[12px] mb-1">{m.label}</div>
              <div className="text-[#333] text-[20px] font-bold">{m.value}<span className="text-[12px] font-normal">{m.suffix||''}</span></div>
              {m.rate && <div className="text-[#0055ff] text-[12px] mt-1">进度 {m.rate}</div>}
            </div>
          ))}
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-[13px] text-[#666]">整体核算进度</div>
          <div className="h-[8px] bg-[#e8e8e8] rounded-full overflow-hidden w-full">
            <div className="bg-[#0055ff] h-full" style={{ width: '42.8%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8faff] p-4 rounded border border-[#e0e8f5]" data-ai-alt="快捷核算步骤">
        <h3 className="text-[14px] font-bold text-[#003366] mb-4">核算步骤与快捷入口</h3>
        <div className="flex space-x-4 items-center" data-ai-list="true">
          <button className="bg-[#1890ff] text-white px-4 py-2 rounded text-[14px] hover:bg-[#0055ff] transition-colors">三方对账与出库</button>
          <span className="text-[#ccc]">→</span>
          <button className="bg-[#1890ff] text-white px-4 py-2 rounded text-[14px] hover:bg-[#0055ff] transition-colors">软装收入分摊</button>
          <span className="text-[#ccc]">→</span>
          <button className="bg-[#1890ff] text-white px-4 py-2 rounded text-[14px] hover:bg-[#0055ff] transition-colors">软装项目收入核算</button>
        </div>
      </div>

      <div className="bg-white border border-[#e8e8e8] rounded" data-ai-alt="明细页签区">
        <div className="flex border-b border-[#e8e8e8] bg-[#fafafa]" data-ai-list="true">
          <div 
            className={`px-4 py-3 cursor-pointer text-[14px] font-medium ${activeDetailTab === 'progress' ? 'text-[#0055ff] bg-white border-t-2 border-t-[#0055ff] border-x border-x-[#e8e8e8] -mb-[1px]' : 'text-[#666] hover:text-[#0055ff]'}`}
            onClick={() => setActiveDetailTab('progress')}
          >
            本期核算进度详情
          </div>
          <div 
            className={`px-4 py-3 cursor-pointer text-[14px] font-medium ${activeDetailTab === 'documents' ? 'text-[#0055ff] bg-white border-t-2 border-t-[#0055ff] border-x border-x-[#e8e8e8] -mb-[1px]' : 'text-[#666] hover:text-[#0055ff]'}`}
            onClick={() => setActiveDetailTab('documents')}
          >
            本期单据生成详情
          </div>
        </div>

        <div className="p-4">
          {activeDetailTab === 'progress' && (
            <div className="space-y-4" data-ai-alt="核算进度详情">
              <div className="flex items-center space-x-4 mb-4" data-ai-alt="筛选区">
                <div className="flex items-center space-x-2">
                  <span className="text-[13px] text-[#333]">完成状态:</span>
                  <select className="border border-[#d9d9d9] rounded px-2 py-1 text-[13px] outline-none" value={doneStatus} onChange={(e) => setDoneStatus(e.target.value)}>
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
              <div className="overflow-x-auto">
                <table className="w-[1600px] text-left border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f2f5] text-[#333]">
                      <th className="p-2 border border-[#e8e8e8]">财务主体</th>
                      <th className="p-2 border border-[#e8e8e8]">合同号</th>
                      <th className="p-2 border border-[#e8e8e8]">对账状态</th>
                      <th className="p-2 border border-[#e8e8e8]">对账时间</th>
                      <th className="p-2 border border-[#e8e8e8]">出库状态</th>
                      <th className="p-2 border border-[#e8e8e8]">出库时间</th>
                      <th className="p-2 border border-[#e8e8e8]">出库成本获取状态</th>
                      <th className="p-2 border border-[#e8e8e8]">出库成本获取时间</th>
                      <th className="p-2 border border-[#e8e8e8]">工费成本获取状态</th>
                      <th className="p-2 border border-[#e8e8e8]">工费成本获取时间</th>
                      <th className="p-2 border border-[#e8e8e8]">软装项目计算状态</th>
                      <th className="p-2 border border-[#e8e8e8]">软装项目计算时间</th>
                      <th className="p-2 border border-[#e8e8e8]">软装项目确认状态</th>
                      <th className="p-2 border border-[#e8e8e8]">软装项目确认时间</th>
                      <th className="p-2 border border-[#e8e8e8] text-center w-[80px]">完成状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgressData.map((row, i) => (
                      <tr key={i} className="hover:bg-[#f9fafc]">
                        <td className="p-2 border border-[#e8e8e8]">{row.org}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#1890ff] cursor-pointer">{row.id}</td>
                        <td className="p-2 border border-[#e8e8e8]">{row.dz}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.dzTime}</td>
                        <td className="p-2 border border-[#e8e8e8]">{row.ck}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.ckTime}</td>
                        <td className="p-2 border border-[#e8e8e8]">{row.ckcb}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.ckcbTime}</td>
                        <td className="p-2 border border-[#e8e8e8]">{row.gfcb}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.gfcbTime}</td>
                        <td className="p-2 border border-[#e8e8e8]">{row.srft}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.srftTime}</td>
                        <td className="p-2 border border-[#e8e8e8]">{row.qr}</td>
                        <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.qrTime}</td>
                        <td className="p-2 border border-[#e8e8e8] text-center">{row.done ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeDetailTab === 'documents' && (
            <div className="space-y-4 overflow-x-auto" data-ai-alt="单据生成详情">
              <table className="w-[1400px] text-left border-collapse text-[12px]">
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
                  {documentTableData.map((row, i) => (
                    <tr key={i} className="hover:bg-[#f9fafc]">
                      <td className="p-2 border border-[#e8e8e8]">{row.org}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#1890ff] cursor-pointer">{row.id}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.srcDoc}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.srcDocNo}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.targetNode}</td>
                      <td className="p-2 border border-[#e8e8e8]">{row.targetDoc}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#1890ff] cursor-pointer">{row.targetDocNo}</td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.targetDocTime}</td>
                      <td className="p-2 border border-[#e8e8e8]">
                        <span className={row.ebsStatus === '已同步' ? 'text-[#00b365]' : row.ebsStatus === '同步失败' ? 'text-[#ff4d4f]' : 'text-[#faad14]'}>
                          {row.ebsStatus}
                        </span>
                      </td>
                      <td className="p-2 border border-[#e8e8e8] text-[#888]">{row.ebsTime}</td>
                      <td className="p-2 border border-[#e8e8e8]">
                        <span className={row.kdStatus === '已同步' ? 'text-[#00b365]' : row.kdStatus === '同步失败' ? 'text-[#ff4d4f]' : 'text-[#faad14]'}>
                          {row.kdStatus}
                        </span>
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

export default Ruanzhuang;
