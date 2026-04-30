import React from 'react';

function GlobalMonitor({ subjects }) {
  const statData = [
    { label: '本期应核算项目总计', value: 1250, unit: '个', color: 'text-[#003366]' },
    { label: '整装项目', value: 800, percent: '64%', inProgress: 600, finished: 200 },
    { label: '软装项目', value: 350, percent: '28%', inProgress: 300, finished: 50 },
    { label: '设计费项目', value: 100, percent: '8%', inProgress: 80, finished: 20 },
  ];

  const progressData = [
    { label: '整装', done: 400, doing: 300, wait: 100 },
    { label: '软装', done: 150, doing: 150, wait: 50 },
    { label: '设计费', done: 80, doing: 10, wait: 10 }
  ];

  return (
    <div className="bg-white rounded shadow-sm p-6 space-y-6" data-ai-alt="业务全局监控">
      <h2 className="text-[18px] font-bold text-[#003366] border-l-4 border-[#0055ff] pl-3" data-ai-alt="监控标题">业务全局监控</h2>
      
      <div className="grid grid-cols-4 gap-4" style={{ display: 'grid' }} data-ai-alt="统计卡片">
        {statData.map((item, idx) => (
          <div key={idx} className="bg-[#f8faff] rounded p-4 border border-[#e0e8f5]" data-ai-alt="单项统计">
            <div className="text-[#666] text-[14px] mb-2">{item.label}</div>
            <div className="flex items-end space-x-2">
              <span className={`text-[28px] font-bold ${item.color || 'text-[#333]'}`}>{item.value}</span>
              {item.unit && <span className="text-[14px] text-[#666] mb-1">{item.unit}</span>}
              {item.percent && <span className="text-[14px] text-[#0055ff] bg-[#e6f0ff] px-2 py-0.5 rounded mb-1">{item.percent}</span>}
            </div>
            {item.inProgress !== undefined && (
              <div className="text-[12px] text-[#888] mt-2 flex space-x-4">
                <span>在建: {item.inProgress}</span>
                <span>竣工: {item.finished}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#f8faff] p-4 rounded border border-[#e0e8f5]" data-ai-alt="进度监控">
        <h3 className="text-[14px] font-bold text-[#333] mb-4">各类型核算进度</h3>
        <div className="flex flex-col space-y-4" data-ai-list="true">
          {progressData.map((item, idx) => {
            const total = item.done + item.doing + item.wait;
            return (
              <div key={idx} className="flex items-center text-[13px]" data-ai-alt="单条进度">
                <div className="w-[60px] text-[#666]">{item.label}</div>
                <div className="flex-1 h-[12px] bg-[#e8e8e8] rounded-full overflow-hidden flex">
                  <div className="bg-[#00b365] h-full" style={{ width: `${(item.done/total)*100}%` }} title={`已完成 ${item.done}`}></div>
                  <div className="bg-[#1890ff] h-full" style={{ width: `${(item.doing/total)*100}%` }} title={`核算中 ${item.doing}`}></div>
                  <div className="bg-[#f0f2f5] h-full" style={{ width: `${(item.wait/total)*100}%` }} title={`未开始 ${item.wait}`}></div>
                </div>
                <div className="w-[180px] flex justify-between ml-4 text-[#888]">
                  <span className="text-[#00b365]">已完成: {item.done}</span>
                  <span className="text-[#1890ff]">核算中: {item.doing}</span>
                  <span>未开始: {item.wait}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GlobalMonitor;
