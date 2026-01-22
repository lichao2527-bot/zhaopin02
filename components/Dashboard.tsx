
import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { Job, Candidate } from '../types';
import { Briefcase, Users, FileCheck, UserPlus, BarChart3, Calendar, Filter } from 'lucide-react';

interface Props {
  jobs: Job[];
  candidates: Candidate[];
}

type TimeFilterType = 'today' | 'thisWeek' | 'thisMonth' | 'last7Days' | 'last30Days';

const Dashboard: React.FC<Props> = ({ jobs = [], candidates = [] }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('thisWeek');

  // 时间筛选逻辑
  const isInTimeRange = (dateStr: string, filter: TimeFilterType) => {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return date >= startOfToday;
      case 'thisWeek': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 以周一为开始
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return date >= startOfWeek;
      }
      case 'thisMonth': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= startOfMonth;
      }
      case 'last7Days': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return date >= sevenDaysAgo;
      }
      case 'last30Days': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return date >= thirtyDaysAgo;
      }
      default:
        return true;
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesJob = selectedJobId === 'all' || c.jobId === selectedJobId;
      const matchesTime = isInTimeRange(c.appliedAt, timeFilter);
      return matchesJob && matchesTime;
    });
  }, [candidates, selectedJobId, timeFilter]);

  const stats = useMemo(() => {
    return {
      openJobs: jobs.filter(j => j.status === '在招').length,
      periodResumes: filteredCandidates.length,
      newCandidates: filteredCandidates.filter(c => c.status === '新申请').length,
      firstRound: filteredCandidates.filter(c => c.status === '一轮面试').length,
      secondRound: filteredCandidates.filter(c => c.status === '二轮面试').length,
      thirdRound: filteredCandidates.filter(c => c.status === '三轮面试').length,
      hiredCount: filteredCandidates.filter(c => c.status === '已入职').length,
    };
  }, [jobs, filteredCandidates]);

  const chartData = [
    { name: '新申请', count: stats.newCandidates, color: '#6366f1' },
    { name: '一轮面试', count: stats.firstRound, color: '#818cf8' },
    { name: '二轮面试', count: stats.secondRound, color: '#a5b4fc' },
    { name: '三轮面试', count: stats.thirdRound, color: '#c7d2fe' },
    { name: '已入职', count: stats.hiredCount, color: '#22c55e' },
  ];

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 增强型筛选栏 */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
          <Calendar size={16} className="text-indigo-600" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">周期:</span>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as TimeFilterType)}
            className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="today">当日安排</option>
            <option value="thisWeek">本周动态</option>
            <option value="thisMonth">本月回顾</option>
            <option value="last7Days">近 7 天</option>
            <option value="last30Days">近 30 天</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
          <Filter size={16} className="text-indigo-600" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">岗位:</span>
          <select 
            value={selectedJobId} 
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[200px]"
          >
            <option value="all">全部在招岗位</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="在招岗位 (总)" value={stats.openJobs} icon={Briefcase} color="bg-indigo-600 shadow-indigo-100" />
        <StatCard label="周期内简历" value={stats.periodResumes} icon={FileCheck} color="bg-blue-500 shadow-blue-100" />
        <StatCard label="新增候选人" value={stats.newCandidates} icon={Users} color="bg-violet-500 shadow-violet-100" />
        <StatCard label="期间录用" value={stats.hiredCount} icon={UserPlus} color="bg-emerald-500 shadow-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 招聘漏斗图表 */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-xl flex items-center space-x-3 text-slate-800">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <BarChart3 className="text-indigo-600" size={20} />
              </div>
              <span>周期招聘漏斗分析</span>
            </h3>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              数据来源：{timeFilter === 'thisWeek' ? '本周' : '当前筛选周期'}
            </div>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 阶段详情统计 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-8">
             <div className="p-2 bg-indigo-50 rounded-lg">
                <Users size={20} className="text-indigo-600" />
             </div>
             <h3 className="font-bold text-xl text-slate-800">流程转化详情</h3>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { label: '一轮面试', count: stats.firstRound, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              { label: '二轮面试', count: stats.secondRound, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { label: '三轮面试', count: stats.thirdRound, color: 'bg-violet-50 text-violet-700 border-violet-100' },
            ].map((stage, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:border-indigo-200">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${stage.color}`}>{stage.label}</span>
                <span className="text-2xl font-black text-slate-800">{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">整体转化率 (申请 ➔ 录用)</span>
              <span className="font-black text-emerald-600 text-lg">
                {candidates.length > 0 ? ((stats.hiredCount / candidates.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div 
                 className="bg-emerald-500 h-full transition-all duration-1000" 
                 style={{ width: `${candidates.length > 0 ? (stats.hiredCount / candidates.length) * 100 : 0}%` }}
               ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
