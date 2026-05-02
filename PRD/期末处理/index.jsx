import React, { useState, useEffect } from 'react';
import EnablePage from './pages/EnablePage';
import ParameterPage from './pages/ParameterPage';
import InventoryPage from './pages/InventoryPage';
import ProjectPage from './pages/ProjectPage';
import PeriodEndPage from './pages/PeriodEndPage';
import PostponeQueryPage from './pages/PostponeQueryPage';
import Toast from './components/Toast';

function App() {
  const [currentPage, setCurrentPage] = useState('enable');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handlePageChange = () => {
      const pageKey = document.querySelector('[data-page-key]')?.getAttribute('data-page-key');
      if (pageKey && pageKey !== currentPage) {
        setCurrentPage(pageKey);
      }
    };
    handlePageChange();
  }, [currentPage]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const tabs = [
    { key: 'enable', label: '启用管理' },
    { key: 'parameter', label: '参数管理' },
    { key: 'inventory', label: '库存关账' },
    { key: 'project', label: '项目关账' },
    { key: 'period-end', label: '期末结账' },
    { key: 'postpone-query', label: '顺延查询' },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'enable': return <EnablePage showToast={showToast} />;
      case 'parameter': return <ParameterPage showToast={showToast} />;
      case 'inventory': return <InventoryPage showToast={showToast} />;
      case 'project': return <ProjectPage showToast={showToast} />;
      case 'period-end': return <PeriodEndPage showToast={showToast} />;
      case 'postpone-query': return <PostponeQueryPage showToast={showToast} />;
      default: return <EnablePage showToast={showToast} />;
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#f0f2f5] text-gray-900 font-sans w-full"
      data-page-key={currentPage}
    >
      <header className="bg-white shadow-sm px-6 sticky top-0 z-10">
        <div className="flex items-center h-14">
          <div className="text-[#1677ff] font-bold text-lg mr-10" data-ai-alt="系统Logo">期末处理系统</div>
          <nav className="flex space-x-6 h-full" data-ai-alt="顶部导航">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentPage(tab.key)}
                className={`px-1 py-4 text-sm font-medium transition-colors border-b-2 h-full flex items-center ${
                  currentPage === tab.key 
                    ? 'border-[#1677ff] text-[#1677ff]' 
                    : 'border-transparent text-gray-600 hover:text-[#1677ff]'
                }`}
                data-ai-alt={`导航页签-${tab.label}`}
              >
                {tab.label}
                {tab.key === 'postpone-query' && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full scale-75">新</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-6 max-w-[1440px] mx-auto">
        {renderContent()}
      </main>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}

export default App;
