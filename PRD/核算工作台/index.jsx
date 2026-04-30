import React, { useState, useEffect, useRef } from 'react';
import GlobalMonitor from './components/GlobalMonitor';
import Ruanzhuang from './components/Ruanzhuang';
import Zhengzhuang from './components/Zhengzhuang';
import Shejifei from './components/Shejifei';

function App() {
  const [currentPage, setCurrentPage] = useState('workbench');
  const [period] = useState('2026-03');
  const [subjects, setSubjects] = useState(['全部']);
  const [activeTab, setActiveTab] = useState('ruanzhuang');
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const dropdownRef = useRef(null);

  const subjectOptions = ['成都分公司', '北京分公司', '上海分公司', '广州分公司'];

  useEffect(() => {
    const handlePageChange = () => {
      const pageKey = document.querySelector('[data-page-key]')?.getAttribute('data-page-key');
      if (pageKey && pageKey !== currentPage) {
        setCurrentPage(pageKey);
      }
    };
    handlePageChange();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSubjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubjectToggle = (option) => {
    if (option === '全部') {
      setSubjects(['全部']);
    } else {
      let newSubjects = subjects.filter(item => item !== '全部');
      if (newSubjects.includes(option)) {
        newSubjects = newSubjects.filter(item => item !== option);
      } else {
        newSubjects.push(option);
      }
      if (newSubjects.length === 0) {
        setSubjects(['全部']);
      } else {
        setSubjects(newSubjects);
      }
    }
  };

  return (
    <div className="w-full min-h-[1024px] bg-[#f0f2f5] font-sans" data-page-key={currentPage} data-ai-alt="工作台容器">
      <div className="w-[1440px] mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between" data-ai-alt="顶部标题栏">
          <h1 className="text-[24px] font-bold text-[#003366] mt-1">核算工作台</h1>
          <div className="flex space-x-6 items-start">
            <div className="flex items-center space-x-2 mt-1" data-ai-alt="期间选择">
              <span className="text-[#666] text-[14px]">会计期间：</span>
              <div className="bg-white border border-[#d9d9d9] rounded px-3 py-1.5 text-[14px] text-[#333] font-medium">
                {period}
              </div>
            </div>
            <div className="relative flex items-start space-x-2 mt-1" ref={dropdownRef} data-ai-alt="主体多选">
              <span className="text-[#666] text-[14px] mt-1.5">财务主体：</span>
              <div 
                className="border border-[#d9d9d9] rounded p-1 text-[13px] min-w-[240px] max-w-[400px] cursor-pointer flex justify-between items-start bg-white"
                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
              >
                <div className="flex-1 flex flex-wrap gap-1 max-h-[70px] overflow-y-auto pr-2">
                  {subjects.includes('全部') ? (
                    <span className="px-2 py-1 bg-[#f5f5f5] text-[#333] rounded">全部主体</span>
                  ) : (
                    subjects.map(sub => (
                      <span key={sub} className="px-2 py-0.5 bg-[#e6f0ff] text-[#0055ff] border border-[#b3d4ff] rounded flex items-center">
                        {sub}
                        <span 
                          className="ml-1.5 cursor-pointer text-[#999] hover:text-[#ff4d4f] text-[14px] leading-none"
                          onClick={(e) => { e.stopPropagation(); handleSubjectToggle(sub); }}
                        >
                          ×
                        </span>
                      </span>
                    ))
                  )}
                </div>
                <span className="text-[#999] text-[12px] ml-2 px-1 mt-1.5">▼</span>
              </div>
              
              {isSubjectOpen && (
                <div className="absolute top-full right-0 mt-1 w-[280px] bg-white border border-[#e8e8e8] shadow-lg rounded z-10 py-1 max-h-[250px] overflow-y-auto">
                  <div 
                    className="px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer flex items-center space-x-2"
                    onClick={() => handleSubjectToggle('全部')}
                  >
                    <input type="checkbox" className="cursor-pointer text-[#0055ff]" checked={subjects.includes('全部')} readOnly />
                    <span className="text-[14px] text-[#333]">全部主体</span>
                  </div>
                  <div className="border-t border-[#f0f0f0] my-1"></div>
                  {subjectOptions.map(option => (
                    <div 
                      key={option}
                      className="px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer flex items-center space-x-2"
                      onClick={() => handleSubjectToggle(option)}
                    >
                      <input type="checkbox" className="cursor-pointer text-[#0055ff]" checked={subjects.includes(option)} readOnly />
                      <span className="text-[14px] text-[#333]">{option}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <GlobalMonitor subjects={subjects} />

        <div className="bg-white rounded shadow-sm p-4" data-ai-alt="核算模块">
          <div className="flex border-b border-[#e8e8e8] mb-6" data-ai-alt="分类标签" data-ai-list="true">
            {[{id: 'ruanzhuang', name: '软装核算'}, {id: 'zhengzhuang', name: '整装核算'}, {id: 'shejifei', name: '设计费核算'}].map(tab => (
              <div 
                key={tab.id}
                className={`px-6 py-3 cursor-pointer text-[16px] font-medium transition-colors ${activeTab === tab.id ? 'text-[#0055ff] border-b-2 border-[#0055ff]' : 'text-[#666] hover:text-[#0055ff]'}`}
                onClick={() => setActiveTab(tab.id)}
                data-ai-alt={`${tab.name}Tab`}
              >
                {tab.name}
              </div>
            ))}
          </div>
          
          <div data-ai-alt="标签内容区">
            {activeTab === 'ruanzhuang' && <Ruanzhuang subjects={subjects} />}
            {activeTab === 'zhengzhuang' && <Zhengzhuang subjects={subjects} />}
            {activeTab === 'shejifei' && <Shejifei subjects={subjects} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
