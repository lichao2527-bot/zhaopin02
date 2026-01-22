
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar as CalendarIcon, 
  Search,
  Video,
  MonitorPlay,
  UserCheck,
  Zap,
  Loader2,
  Database,
  Cloud
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import JobManagement from './components/JobManagement';
import CandidateManagement from './components/CandidateManagement';
import InterviewCalendar from './components/InterviewCalendar';
import InterviewRoundPage from './components/InterviewRoundPage';
import { Job, Candidate, Persona } from './types';
import { db, loginAnonymously } from './services/db'; // Import CloudBase DB Service

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'calendar' | 'round1' | 'round2' | 'round3'>('dashboard');
  const [candidateFilter, setCandidateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // 1. Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 先进行匿名登录
        console.log('Attempting CloudBase login...');
        await loginAnonymously();

        // 测试 CloudBase 连接
        const connectionTest = await db.testConnection();
        console.log('CloudBase connection test:', connectionTest);

        if (!connectionTest.success) {
          console.error('CloudBase connection failed:', connectionTest.error);
          alert("CloudBase 连接测试失败，可能无法正常保存数据");
        }

        const data = await db.fetchAllData();
        setJobs(data.jobs || []);
        setPersonas(data.personas || []);
        setCandidates(data.candidates || []);
      } catch (error) {
        console.error("Failed to load initial data from CloudBase:", error);
        alert("连接 CloudBase 云端数据库失败，请检查网络");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleNavigateToCandidates = (jobId: string = 'all') => {
    setCandidateFilter(jobId);
    setActiveTab('candidates');
  };

  // --- Wrapper Functions for Data Mutation (Passed down to children) ---

  // Job Actions
  const handleAddJob = async (job: Job, persona: Persona) => {
    try {
      console.log('App: handleAddJob called with:', { job, persona });
      await db.createJobAndPersona(job, persona);
      console.log('App: Job and persona created successfully');
      setJobs(prev => [...prev, job]);
      setPersonas(prev => [...prev, persona]);
    } catch (e: any) {
      console.error('App: Error in handleAddJob:', e);
      console.error('App: Error message:', e?.message);
      console.error('App: Error details:', JSON.stringify(e, null, 2));
      alert(`创建岗位失败: ${e?.message || '未知错误'}`);
    }
  };

  const handleUpdateJob = async (updatedJob: Job, updatedPersona?: Persona) => {
    try {
      await db.updateJob(updatedJob);
      if (updatedPersona) {
        await db.updatePersona(updatedPersona);
        setPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
      }
      setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    } catch (e) {
      console.error(e);
      alert("更新岗位失败");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await db.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      // Optionally filter candidates locally too
      setCandidates(prev => prev.filter(c => c.jobId !== jobId));
    } catch (e) {
      console.error(e);
      alert("删除岗位失败");
    }
  };

  // Candidate Actions
  const handleAddCandidate = async (candidate: Candidate) => {
    try {
      await db.createCandidate(candidate);
      setCandidates(prev => [candidate, ...prev]); // Add to top
    } catch (e) {
      console.error(e);
      alert("添加候选人失败");
    }
  };

  // 这是一个通用的更新函数，用于更新候选人的任何字段（状态、面试记录、基础信息）
  const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
    try {
      // 乐观更新：先更新本地 UI，感觉更快
      setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
      // 后台异步同步
      await db.updateCandidate(updatedCandidate);
    } catch (e) {
      console.error(e);
      alert("同步数据到云端失败，请刷新重试");
    }
  };

  const NavigationItem = ({ id, icon: Icon, label, color = 'text-slate-600' }: { id: any, icon: any, label: string, color?: string }) => (
    <button
      onClick={() => {
        if (id === 'candidates') {
          setCandidateFilter('all');
        }
        setActiveTab(id);
      }}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : `${color} hover:bg-slate-100`
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">正在连接 CloudBase 云端数据...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 space-y-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">Z</div>
          <span className="text-xl font-bold tracking-tight">招聘<span className="text-indigo-600">系统</span></span>
        </div>

        <nav className="flex-1 flex flex-col space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-4">主控台</div>
          <NavigationItem id="dashboard" icon={LayoutDashboard} label="数据面板" />
          <NavigationItem id="jobs" icon={Briefcase} label="岗位管理" />
          <NavigationItem id="candidates" icon={Users} label="候选人库" />
          <NavigationItem id="calendar" icon={CalendarIcon} label="面试日历" />

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 mb-2 ml-4">面试专项</div>
          <NavigationItem id="round1" icon={Video} label="一轮视频面试" color="text-emerald-600" />
          <NavigationItem id="round2" icon={MonitorPlay} label="二轮视频面试" color="text-blue-600" />
          <NavigationItem id="round3" icon={UserCheck} label="三轮线下面试" color="text-violet-600" />
        </nav>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl text-white shadow-lg">
          <div className="flex items-center space-x-2 mb-2 text-indigo-400">
            <Cloud size={14} className="fill-current" />
            <p className="text-xs font-bold uppercase">云端存储模式</p>
          </div>
          <p className="text-[10px] opacity-90 leading-relaxed font-bold">腾讯云 CloudBase</p>
          <p className="text-[10px] opacity-50 mt-1">Env: ai-app</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && '欢迎回来'}
              {activeTab === 'jobs' && '岗位管理'}
              {activeTab === 'candidates' && '候选人流水线'}
              {activeTab === 'calendar' && '面试排程'}
              {activeTab === 'round1' && '一轮视频面试管理'}
              {activeTab === 'round2' && '二轮 AI 深度面试'}
              {activeTab === 'round3' && '三轮 终面决策引导'}
            </h1>
            <p className="text-slate-500">
              {activeTab.startsWith('round') ? '基于全链路数据驱动的智能化面试体验' : '高效、智能、精准的人力招聘平台'}
            </p>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard jobs={jobs} candidates={candidates} />}
        
        {/* Pass down DB wrapper functions instead of raw setters where possible, or use wrapped logic in components */}
        {activeTab === 'jobs' && (
          <JobManagement 
            jobs={jobs} 
            personas={personas} 
            onNavigateToCandidates={handleNavigateToCandidates}
            // Passing wrapper functions
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
          />
        )}
        
        {activeTab === 'candidates' && (
          <CandidateManagement 
            candidates={candidates} 
            jobs={jobs} 
            personas={personas} 
            initialFilterJobId={candidateFilter}
            onAddCandidate={handleAddCandidate}
            onUpdateCandidate={handleUpdateCandidate}
          />
        )}
        
        {activeTab === 'calendar' && <InterviewCalendar candidates={candidates} jobs={jobs} />}
        
        {activeTab === 'round1' && <InterviewRoundPage round={1} candidates={candidates} jobs={jobs} personas={personas} onUpdateCandidate={handleUpdateCandidate} />}
        {activeTab === 'round2' && <InterviewRoundPage round={2} candidates={candidates} jobs={jobs} personas={personas} onUpdateCandidate={handleUpdateCandidate} />}
        {activeTab === 'round3' && <InterviewRoundPage round={3} candidates={candidates} jobs={jobs} personas={personas} onUpdateCandidate={handleUpdateCandidate} />}
      </main>
    </div>
  );
};

export default App;
