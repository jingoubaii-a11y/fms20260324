import React, { useState } from 'react';

function PostponeQueryPage({ showToast }) {
  const [data] = useState([
    { id: 1, batchNo: 'B20260428001', org: '北京分公司', sourcePeriod: '202603', targetPeriod: '202604', docCount: 15, operator: '张明', operateTime: '2026-04-28 10:23:11', reason: '月底发票未到齐，延期核算' },
    { id: 2, batchNo: 'B20260428002', org: '上海分公司', sourcePeriod: '202603', targetPeriod: '202604', docCount: 3, operator: '李华', operateTime: '2026-04-28 11:05:42', reason: '项目工程未确认完工量' },
  ]);

  const [detailModalData, setDetailModalData] = useState(null);
  const [searchDocNo, setSearchDocNo] = useState('');

  // 模拟的明细数据
  const detailRecords = [
    { id: 101, docNo: 'DOC-202603-0001', docType: '库存出库单', originalPeriod: '202603', targetPeriod: '202604', status: '已顺延' },
    { id: 102, docNo: 'DOC-202603-0002', docType: '项目发票核算单', originalPeriod: '202603', targetPeriod: '202604', status: '已顺延' },
    { id: 103, docNo: 'DOC-202603-0005', docType: '暂估入库单', originalPeriod: '202603', targetPeriod: '202604', status: '已顺延' },
    { id: 104, docNo: 'DOC-202603-0008', docType: '库存出库单', originalPeriod: '202603', targetPeriod: '202604', status: '已顺延' },
    { id: 105, docNo: 'DOC-202603-0012', docType: '库存出库单', originalPeriod: '202603', targetPeriod: '202604', status: '已顺延' },
  ];

  const filteredRecords = detailRecords.filter(record => 
    record.docNo.toLowerCase().includes(searchDocNo.toLowerCase())
  );

  return (
    <div className="bg-white rounded border border-gray-200 p-6 shadow-sm" data-ai-alt="顺延查询内容区">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#1677ff] pl-3" data-ai-alt="模块标题">单据顺延记录查询</h2>
        <div className="flex space-x-4">
          <input 
            type="text" 
            placeholder="输入批次号/组织查询"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-[#1677ff] focus:outline-none"
            data-ai-alt="搜索输入框"
          />
          <button className="bg-[#1677ff] text-white px-4 py-1.5 rounded text-sm hover:bg-[#4096ff] transition-colors">
            查询
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-gray-200 rounded-t">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">关账批次号</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">财务组织</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">来源期间</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">目标期间</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">顺延单据数</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">顺延原因</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">操作人</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">操作时间</th>
              <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody data-ai-list="true">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                <td className="p-3 text-sm text-gray-800 font-medium whitespace-nowrap">{row.batchNo}</td>
                <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{row.org}</td>
                <td className="p-3 text-sm text-gray-600 whitespace-nowrap">{row.sourcePeriod}</td>
                <td className="p-3 text-sm text-[#1677ff] whitespace-nowrap">{row.targetPeriod}</td>
                <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{row.docCount}</td>
                <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]" title={row.reason}>{row.reason}</td>
                <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{row.operator}</td>
                <td className="p-3 text-sm text-gray-500 whitespace-nowrap">{row.operateTime}</td>
                <td className="p-3 space-x-3 whitespace-nowrap">
                  <button 
                    onClick={() => {
                      setDetailModalData(row);
                      setSearchDocNo('');
                    }}
                    className="text-[#1677ff] text-sm hover:underline"
                    data-ai-alt="明细操作"
                  >
                    查看明细
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 明细弹窗 */}
      {detailModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-[850px] flex flex-col max-h-[85vh] animate-zoom-in" data-ai-alt="明细弹窗">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-gray-900 font-medium text-lg" data-ai-alt="弹窗标题">顺延单据明细 - {detailModalData.batchNo}</h3>
              <button onClick={() => setDetailModalData(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times" data-ai-alt="关闭按钮"></i>
              </button>
            </div>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-gray-50">
              <span className="text-sm text-gray-600 mr-3">单据查询：</span>
              <input 
                type="text" 
                value={searchDocNo}
                onChange={(e) => setSearchDocNo(e.target.value)}
                placeholder="输入单据编号搜索..."
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:border-[#1677ff] focus:outline-none"
                data-ai-alt="单据搜索输入框"
              />
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">单据编号</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">单据类型</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">原始期间</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">顺延后期间</th>
                    <th className="bg-[#fafafa] p-3 text-sm font-medium text-gray-500 border-b border-gray-200">状态</th>
                  </tr>
                </thead>
                <tbody data-ai-list="true">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                        <td className="p-3 text-sm text-gray-800">{record.docNo}</td>
                        <td className="p-3 text-sm text-gray-600">{record.docType}</td>
                        <td className="p-3 text-sm text-gray-600">{record.originalPeriod}</td>
                        <td className="p-3 text-sm text-[#1677ff]">{record.targetPeriod}</td>
                        <td className="p-3 text-sm text-gray-600">
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 border border-gray-200 text-gray-600">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 text-sm">
                        暂无匹配的单据数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-between items-center border-t border-gray-100">
              <div className="text-sm text-gray-500">
                共 {filteredRecords.length} 条记录
              </div>
              <div className="flex space-x-2">
                 <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-400 cursor-not-allowed" disabled>上一页</button>
                 <button className="px-3 py-1 text-sm bg-white border border-[#1677ff] rounded text-[#1677ff]">1</button>
                 <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-400 cursor-not-allowed" disabled>下一页</button>
              </div>
              <button 
                onClick={() => setDetailModalData(null)} 
                className="px-4 py-2 text-sm bg-[#1677ff] text-white rounded hover:bg-[#4096ff] transition-colors" 
                data-ai-alt="关闭按钮"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostponeQueryPage;
