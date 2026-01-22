
import React, { useMemo, useState } from 'react';
import { Candidate, Job } from '../types';
import { ChevronLeft, ChevronRight, Clock, User, CalendarDays, Sparkles, MapPin, CalendarCheck2, Inbox } from 'lucide-react';

interface Props {
  candidates: Candidate[];
  jobs: Job[];
}

const InterviewCalendar: React.FC<Props> = ({ candidates, jobs }) => {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  // 获取所有面试并排序
  const allInterviews = useMemo(() => {
    return candidates.flatMap(c => 
      c.interviews.map(i => ({
        ...i,
        candidateName: c.name,
        candidateId: c.id,
        jobTitle: jobs.find(j => j.id === c.jobId)?.title || '未知岗位'
      }))
    ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [candidates, jobs]);

  // 辅助函数：判断是否是同一天
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // 当前选中日期的面试
  const selectedDayInterviews = useMemo(() => {
    return allInterviews.filter(inv => isSameDay(new Date(inv.scheduledAt), selectedDay));
  }, [allInterviews, selectedDay]);

  // 日历逻辑计算
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, month: month - 1, year, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, currentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year, currentMonth: false });
    }
    return days;
  }, [viewDate]);

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const currentMonthLabel = viewDate.toLocaleString('zh-CN', { month: 'long', year: 'numeric' });
  const today = new Date();

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
      {/* 日历主网格 */}
      <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <CalendarDays size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{currentMonthLabel}</h3>
          </div>
          <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => {
                const now = new Date();
                setViewDate(now);
                setSelectedDay(now);
              }}
              className="px-4 py-2 text-xs font-black text-slate-600 hover:text-indigo-600 uppercase tracking-widest transition-colors"
            >
              返回今日
            </button>
            <button 
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/30">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {calendarData.map((cell, i) => {
            const cellDate = new Date(cell.year, cell.month, cell.day);
            const isToday = isSameDay(cellDate, today);
            const isSelected = isSameDay(cellDate, selectedDay);
            const dayInterviews = allInterviews.filter(inv => isSameDay(new Date(inv.scheduledAt), cellDate));

            return (
              <div 
                key={i} 
                onClick={() => setSelectedDay(cellDate)}
                className={`min-h-[120px] p-3 border-r border-b border-slate-100 transition-all cursor-pointer relative group flex flex-col ${
                  i % 7 === 6 ? 'border-r-0' : ''
                } ${!cell.currentMonth ? 'bg-slate-50/10 opacity-30' : 'bg-white'} ${
                  isSelected ? 'bg-indigo-50/40 z-10 shadow-[inset_0_0_0_2px_#6366f1]' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                    isToday 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
                      : isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 group-hover:text-slate-900'
                  }`}>
                    {cell.day}
                  </span>
                  {dayInterviews.length > 0 && (
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1.5 flex-1 overflow-hidden pointer-events-none">
                  {dayInterviews.slice(0, 3).map((inv, idx) => {
                    const timeStr = new Date(inv.scheduledAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div 
                        key={idx} 
                        className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-0.5 overflow-hidden"
                      >
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-900 leading-none">
                          <span className="truncate flex-1 mr-1">{inv.candidateName}</span>
                          <span className="text-indigo-600 text-[8px] font-bold shrink-0">{timeStr}</span>
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-slate-400 leading-none">
                           <span className="truncate flex-1 mr-1">{inv.jobTitle}</span>
                           <span className="bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-bold shrink-0 scale-90 origin-right">{inv.round}轮</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayInterviews.length > 3 && (
                    <div className="text-[8px] font-black text-indigo-400 pl-1 mt-1">
                      + 还有 {dayInterviews.length - 3} 场面试
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：动态显示当日日程 */}
      <div className="flex flex-col h-full space-y-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 text-indigo-600 mb-2">
            <CalendarCheck2 size={20} className="stroke-[2.5]" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">日程详情看板</h4>
          </div>
          <p className="text-xl font-black text-slate-900 leading-tight">
            {isSameDay(selectedDay, today) ? '今日面试安排' : selectedDay.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {selectedDayInterviews.length === 0 ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-4 opacity-70 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Inbox size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">暂无排程</p>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">这一天目前没有面试计划</p>
              </div>
            </div>
          ) : (
            selectedDayInterviews.map((inv, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4 relative overflow-hidden group hover:-translate-y-1 transition-all animate-in fade-in slide-in-from-right-4"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                      {inv.candidateName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-base leading-tight">{inv.candidateName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">第 {inv.round} 轮</span>
                         <span className="text-[10px] font-bold text-slate-500">{inv.jobTitle}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center text-[11px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <Clock size={14} className="mr-2 text-indigo-500 shrink-0" />
                    <span>
                      {new Date(inv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-2 text-slate-300">|</span>
                      时长预计 45 分钟
                    </span>
                  </div>
                  <div className="flex items-center text-[11px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <User size={14} className="mr-2 text-indigo-500 shrink-0" />
                    <span className="truncate">主面官：人力资源部负责人 / 业务主管</span>
                  </div>
                </div>
                
                <div className="pt-2">
                   <button className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-[0.15em] flex items-center justify-center space-x-2">
                     <Sparkles size={12} />
                     <span>进入 AI 面试间</span>
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 底部装饰提示 */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
           <div className="flex items-center space-x-2 mb-2">
             <Sparkles size={14} className="text-indigo-200" />
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">智能排程提醒</p>
           </div>
           <p className="text-xs font-bold leading-relaxed opacity-90">系统已根据面试官负载自动优化今日路线，建议提前 5 分钟开启 AI 助手进行简历复核。</p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default InterviewCalendar;
