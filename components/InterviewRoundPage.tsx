import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Candidate, Job, Persona, CandidateStatus } from '../types';
import { 
  Mic, Loader2, Sparkles, BrainCircuit, Download, Edit3, RefreshCw, MessageCircle,
  CalendarDays, Timer, CalendarCheck, UserPlus, Filter, Search, ClipboardCheck,
  CheckCircle2, Briefcase, MapPin, CheckCircle, AlertCircle, CalendarPlus,
  ArrowRightCircle, X, TrendingUp, Lightbulb, FileText, Clock, Save, Edit2, Users
} from 'lucide-react';
import { 
  generatePersonnelAssessment, 
  processInterviewAudio,
  generateInterviewQuestions
} from '../services/geminiService';

interface Props {
  round: 1 | 2 | 3;
  candidates: Candidate[];
  jobs: Job[];
  personas: Persona[];
  setCandidates?: React.Dispatch<React.SetStateAction<Candidate[]>>; // Optional now
  onUpdateCandidate: (candidate: Candidate) => Promise<void>; // New prop
}

const DateTimeSliderPicker: React.FC<{
  value: string;
  onChange: (isoString: string) => void;
  darkMode?: boolean;
}> = ({ value, onChange, darkMode = true }) => {
  const [dateOffset, setDateOffset] = useState(0);
  const [minutesOffset, setMinutesOffset] = useState(540); 

  useEffect(() => {
     if (value) {
        const d = new Date(value);
        setMinutesOffset(d.getHours() * 60 + d.getMinutes());
     }
  }, []);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dateOffset);
    d.setHours(Math.floor(minutesOffset / 60), minutesOffset % 60, 0, 0);
    return d;
  }, [dateOffset, minutesOffset]);

  useEffect(() => {
     onChange(selectedDate.toISOString());
  }, [selectedDate]);

  const bgClass = darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200';
  const textLabelClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const textValueClass = darkMode ? 'text-white' : 'text-indigo-900';
  const trackClass = darkMode ? 'bg-white/10' : 'bg-indigo-100';

  return (
    <div className={`space-y-5 p-5 rounded-2xl border ${bgClass}`}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className={`text-[10px] font-black uppercase flex items-center ${textLabelClass}`}>
            <CalendarDays size={14} className="mr-1.5 text-indigo-400" /> 调整日期
          </label>
          <span className={`text-sm font-bold ${textValueClass}`}>
            {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </span>
        </div>
        <input type="range" min="-7" max="23" value={dateOffset} onChange={(e) => setDateOffset(parseInt(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-400 ${trackClass}`} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className={`text-[10px] font-black uppercase flex items-center ${textLabelClass}`}>
            <Timer size={14} className="mr-1.5 text-indigo-400" /> 调整时间
          </label>
          <span className={`text-sm font-bold ${textValueClass}`}>
            {Math.floor(minutesOffset / 60).toString().padStart(2, '0')}:{(minutesOffset % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <input type="range" min="480" max="1320" step="15" value={minutesOffset} onChange={(e) => setMinutesOffset(parseInt(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-400 ${trackClass}`} />
      </div>
    </div>
  );
};

const InterviewRoundPage: React.FC<Props> = ({ round, candidates, jobs, personas, onUpdateCandidate }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [filterJobId, setFilterJobId] = useState<string>('all');
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<{type: 'success'|'error'|'none', message: string}>({type: 'none', message: ''});
  const [nextRoundDate, setNextRoundDate] = useState('');
  
  const [logicContent, setLogicContent] = useState<string>('');
  const [questionContent, setQuestionContent] = useState<string>('');
  const [isEditingLogic, setIsEditingLogic] = useState(false);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCandidateId, setInviteCandidateId] = useState<string | null>(null);
  const [inviteDate, setInviteDate] = useState('');
  const [inviteJobFilter, setInviteJobFilter] = useState('all');

  // Header 区域的时间修改状态
  const [isReschedulingHeader, setIsReschedulingHeader] = useState(false);
  const [headerTempDate, setHeaderTempDate] = useState('');

  // 评价文本框的本地状态
  const [evaluationText, setEvaluationText] = useState('');

  const audioInputRef = useRef<HTMLInputElement>(null);

  const stageCandidates = useMemo(() => {
    const statusMap = { 1: '一轮面试', 2: '二轮面试', 3: '三轮面试' };
    return candidates.filter(c => {
      const matchesStatus = c.status === statusMap[round];
      const matchesJob = filterJobId === 'all' || c.jobId === filterJobId;
      return matchesStatus && matchesJob;
    });
  }, [candidates, round, filterJobId]);

  const activeCandidate = candidates.find(c => c.id === selectedId);
  const job = jobs.find(j => j.id === activeCandidate?.jobId);
  const persona = personas.find(p => p.id === job?.personaId);
  
  // 获取当前轮次的面试信息
  const currentInterview = activeCandidate?.interviews.find(i => i.round === round);

  const eligibleCandidates = useMemo(() => {
    const sourceStatusMap: Record<number, CandidateStatus> = { 1: '新申请', 2: '一轮面试', 3: '二轮面试' };
    const requiredStatus = sourceStatusMap[round];
    return candidates.filter(c => c.status === requiredStatus && (inviteJobFilter === 'all' || c.jobId === inviteJobFilter));
  }, [candidates, round, inviteJobFilter]);

  useEffect(() => {
    if (activeCandidate) {
      // 切换候选人时，重置编辑状态
      setIsReschedulingHeader(false);
      const interview = activeCandidate.interviews.find(i => i.round === round);
      
      // 同步评价内容到本地状态
      setEvaluationText(interview?.evaluation || '');

      if (interview && interview.questions && interview.questions.length > 0) {
        const savedText = interview.questions.join('\n\n');
        setQuestionContent(savedText);
        setLogicContent('（已加载历史生成的题目）');
        setAiContent(`（历史记录）<<<SPLIT_HERE>>>${savedText}`);
      } else {
        setQuestionContent('');
        setLogicContent('');
        setAiContent(null);
      }
    }
  }, [selectedId, round]);

  // Robust Parsing
  useEffect(() => {
    if (aiContent && !aiContent.startsWith('（历史记录）')) {
      const parts = aiContent.split('<<<SPLIT_HERE>>>');
      if (parts.length >= 2) {
        setLogicContent(parts[0].trim());
        setQuestionContent(parts[1].trim());
      } else {
        // Fallback Strategy
        if (aiContent.includes("Part 2:")) {
             const splitIdx = aiContent.indexOf("Part 2:");
             setLogicContent(aiContent.substring(0, splitIdx).trim());
             setQuestionContent(aiContent.substring(splitIdx).trim());
        } else {
             setLogicContent("（AI 未返回结构化逻辑，请直接查看下方题目）");
             setQuestionContent(aiContent);
        }
      }
    }
  }, [aiContent]);

  const saveQuestionsToCandidate = async (questionsText: string) => {
    if (!selectedId || !activeCandidate) return;
    const questionArray = questionsText.split('\n').filter(line => line.trim().length > 0);
    
    const interviews = [...activeCandidate.interviews];
    const existingIdx = interviews.findIndex(i => i.round === round);
    if (existingIdx > -1) { 
        interviews[existingIdx] = { ...interviews[existingIdx], questions: questionArray }; 
    } else { 
        interviews.push({ id: `i-${Date.now()}`, round: round as 1|2|3, scheduledAt: new Date().toISOString(), questions: questionArray, status: 'pending' }); 
    }
    
    await onUpdateCandidate({ ...activeCandidate, interviews });
  };

  const handleGenerateAIQuestions = async (isRegenerate: boolean = false) => {
    if (!activeCandidate || !job || !persona) return;
    setLoading(true);
    if (!isRegenerate) { 
        setAiContent(null); 
        setLogicContent('AI 正在分析画像并生成逻辑...'); 
        setQuestionContent(''); 
    }
    try {
      const history = activeCandidate.interviews.filter(i => i.round < round).map(i => {
           const summary = i.aiSummary ? `[第${i.round}轮-AI录音复盘]: ${i.aiSummary}` : '';
           const evalText = i.evaluation ? `[第${i.round}轮-面试官评价]: ${i.evaluation}` : '';
           return `${summary}\n${evalText}`;
      }).join('\n\n----------------\n\n');
      const manualCorrection = isRegenerate ? logicContent : '';
      const questions = await generateInterviewQuestions(
        job.title, persona.description, activeCandidate.name, round,
        history, activeCandidate.fullResumeText || '', persona.core_tags || '', manualCorrection
      );
      
      setAiContent(questions);
      
      // Robust saving logic
      const parts = questions.split('<<<SPLIT_HERE>>>');
      let qPart = questions;
      if (parts.length >= 2) {
          qPart = parts[1].trim();
      } else if (questions.includes("Part 2:")) {
          qPart = questions.substring(questions.indexOf("Part 2:")).trim();
      }
      
      await saveQuestionsToCandidate(qPart);
      setIsEditingLogic(false);
    } catch (err) { console.error(err); if (!isRegenerate) setAiContent("生成失败，请重试。"); } finally { setLoading(false); }
  };

  const handleDownloadWord = () => {
    if (!questionContent || !activeCandidate || !job) return;

    // 格式化处理：将 Markdown 风格文本转换为适合 Word 的 HTML
    let formattedBody = questionContent
        // 加粗
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        // 标题
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        // 列表项
        .replace(/^\d+\. (.*$)/gim, '<b>$&</b>') // 数字列表加粗
        .replace(/^- (.*$)/gim, '• $1');

    // 将每一行文本包裹在 <p> 中，确保 Word 中有正确的行间距
    formattedBody = formattedBody.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        // 如果已经是标题，保持原样
        if (trimmed.startsWith('<h')) return trimmed;
        return `<p style="margin-bottom: 10pt; line-height: 1.5;">${trimmed}</p>`;
    }).join('');

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${activeCandidate.name} - 第${round}轮面试建议</title>
        <style>
          /* 通用样式 */
          body { font-family: 'Microsoft YaHei', 'Calibri', sans-serif; font-size: 11pt; color: #333; }
          
          /* 标题样式 */
          h1 { color: #4338ca; font-size: 20pt; font-weight: bold; border-bottom: 2px solid #4338ca; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
          h2 { color: #1e1b4b; font-size: 16pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; background-color: #e0e7ff; padding: 5px 10px; border-left: 5px solid #4338ca; }
          h3 { color: #3730a3; font-size: 14pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
          
          /* 信息框样式 */
          .meta-box { border: 1px solid #cbd5e1; background-color: #f1f5f9; padding: 15px; border-radius: 4px; margin-bottom: 25px; }
          .meta-item { margin: 5px 0; font-size: 10.5pt; color: #475569; }
          
          /* 正文样式 */
          p { margin-bottom: 10pt; line-height: 1.5; text-align: justify; }
          b { color: #0f172a; }
          
          /* 页脚 */
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9pt; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <h1>AI 深度洞察面试建议</h1>
        
        <div class="meta-box">
          <p class="meta-item"><strong>候选人：</strong>${activeCandidate.name}</p>
          <p class="meta-item"><strong>应聘岗位：</strong>${job.title}</p>
          <p class="meta-item"><strong>面试轮次：</strong>第 ${round} 轮</p>
          <p class="meta-item"><strong>导出时间：</strong>${new Date().toLocaleString()}</p>
        </div>

        <div>
          ${formattedBody}
        </div>

        <div class="footer">
          -- Generated by 招聘系统 AI 助手 --
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlString], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeCandidate.name}_第${round}轮面试建议.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleScheduleNextRound = async () => {
    if (!selectedId || !nextRoundDate || !activeCandidate) return;
    const nextRound = (round + 1) as 1 | 2 | 3;
    const statusMap: Record<number, CandidateStatus> = { 2: '二轮面试', 3: '三轮面试' };
    
    const interviews = [...activeCandidate.interviews];
    interviews.push({ id: `i-${Date.now()}`, round: nextRound, scheduledAt: nextRoundDate, questions: [] });
    
    await onUpdateCandidate({
        ...activeCandidate,
        status: statusMap[nextRound],
        interviews
    });

    setNextRoundDate('');
    setProcessStatus({ type: 'success', message: `已成功邀约候选人参加第 ${nextRound} 轮面试` });
    setSelectedId(null); 
  };

  const handleRejectCandidate = async () => {
    if (!selectedId || !activeCandidate) return;
    if (window.confirm(`确定要将候选人 ${activeCandidate?.name} 标记为“不合格”吗？`)) {
       await onUpdateCandidate({ ...activeCandidate, status: '已拒绝' });
       setProcessStatus({ type: 'success', message: '已记录淘汰决策，候选人状态已更新' });
       setSelectedId(null);
    }
  };

  const handleConfirmInviteFromLibrary = async () => {
    if (!inviteCandidateId || !inviteDate) return;
    const candidate = candidates.find(c => c.id === inviteCandidateId);
    if (!candidate) return;

    const statusMap: Record<number, CandidateStatus> = { 1: '一轮面试', 2: '二轮面试', 3: '三轮面试' };
    const interviews = [...candidate.interviews];
    interviews.push({ id: `i-${Date.now()}`, round: round, scheduledAt: inviteDate, questions: [] });
    
    await onUpdateCandidate({
        ...candidate,
        status: statusMap[round],
        interviews
    });

    setIsInviteModalOpen(false); setInviteCandidateId(null); setInviteDate(''); setProcessStatus({ type: 'success', message: '已成功从人才库添加候选人并排程' });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCandidate || !job) return;
    setIsAudioProcessing(true); setProcessStatus({type: 'none', message: ''});
    try {
      const base64Data = await fileToBase64(file);
      const audioUrl = URL.createObjectURL(file);
      const summary = await processInterviewAudio({ data: base64Data, mimeType: file.type }, job.title, round);
      
      const updatedInterviews = [...activeCandidate.interviews];
      const current = updatedInterviews.find(i => i.round === round);
      if (current) { 
          current.aiSummary = summary; 
          current.recordingUrl = audioUrl; 
      } else { 
          updatedInterviews.push({ id: `i-${Date.now()}`, round: round as 1 | 2 | 3, scheduledAt: new Date().toISOString(), aiSummary: summary, recordingUrl: audioUrl, evaluation: "由录音解析生成。" }); 
      }
      
      await onUpdateCandidate({ ...activeCandidate, interviews: updatedInterviews });

      setProcessStatus({type: 'success', message: '录音已上传并成功整理'});
    } catch (err) { console.error(err); setProcessStatus({type: 'error', message: '解析录音时出错，请重试'}); } finally { setIsAudioProcessing(false); if (audioInputRef.current) audioInputRef.current.value = ''; }
  };

  const handleAssessment = async (notes: string) => {
    if (!selectedId || !activeCandidate) return;
    // Don't set global loading state here to prevent UI flicker on blur
    try {
      const assessment = await generatePersonnelAssessment(notes, round);
      
      const interviews = [...activeCandidate.interviews];
      const current = interviews.find(i => i.round === round);
      if (current) { 
          current.aiSummary = assessment; 
          current.evaluation = notes; 
      } else { 
          interviews.push({ id: `i-${Date.now()}`, round: round as 1 | 2 | 3, scheduledAt: new Date().toISOString(), aiSummary: assessment, evaluation: notes }); 
      }
      
      await onUpdateCandidate({ ...activeCandidate, interviews });

    } catch (err) { console.error(err); }
  };

  const saveHeaderReschedule = async () => {
    if (!selectedId || !headerTempDate || !activeCandidate) return;
    
    const interviews = [...activeCandidate.interviews];
    const idx = interviews.findIndex(i => i.round === round);
    if (idx !== -1) { 
        interviews[idx] = { ...interviews[idx], scheduledAt: headerTempDate }; 
    }
    
    await onUpdateCandidate({ ...activeCandidate, interviews });
    setIsReschedulingHeader(false);
  };

  return (
    <div className="flex h-full gap-8">
      {/* 侧边栏 */}
      <div className="w-80 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2"><ClipboardCheck size={16} className="text-indigo-600" /><span>待面试名单 ({stageCandidates.length})</span></h3>
            <button onClick={() => setIsInviteModalOpen(true)} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center space-x-1" title="从人才库添加"><UserPlus size={14} /><span className="text-[10px] font-bold px-1">捞取</span></button>
          </div>
          <div className="relative">
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={filterJobId} onChange={(e) => setFilterJobId(e.target.value)} className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none font-bold">
              <option value="all">全部岗位</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {stageCandidates.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm italic">当前阶段无候选人</div> : stageCandidates.map(c => {
              const itemInterview = c.interviews.find(i => i.round === round);
              let interviewTime = null;
              if (itemInterview?.scheduledAt) { const d = new Date(itemInterview.scheduledAt); interviewTime = `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }
              return (
                <button key={c.id} onClick={() => { setSelectedId(c.id); setAiContent(null); setProcessStatus({type: 'none', message: ''}); }} className={`w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-all ${selectedId === c.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600 shadow-inner' : 'border-l-4 border-l-transparent'}`}>
                  <div className="flex justify-between items-center mb-1.5"><span className="font-bold text-slate-900 truncate mr-2 text-sm">{c.name}</span><div className="flex items-center shrink-0 space-x-1.5">{interviewTime && (<span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center whitespace-nowrap">{interviewTime}</span>)}{itemInterview?.evaluation && <CheckCircle2 size={14} className="text-emerald-500" />}</div></div>
                  <p className="text-xs text-slate-500 truncate font-medium">{jobs.find(j => j.id === c.jobId)?.title}</p>
                </button>
              );
            })}
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-32">
        {!activeCandidate ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 space-y-4 min-h-[400px]">
            <Users size={32} className="opacity-20" />
            <p className="text-sm font-bold">请选择左侧候选人开始面试</p>
          </div>
        ) : (
          <>
            {/* Header Area with Reschedule */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col shrink-0 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-100">{activeCandidate.name.charAt(0)}</div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{activeCandidate.name}</h2>
                    <div className="flex items-center space-x-3 mt-1 text-slate-500 text-xs font-bold">
                      <span className="flex items-center"><Briefcase size={12} className="mr-1" />{job?.title}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center"><MapPin size={12} className="mr-1" />{job?.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                   <button onClick={() => handleGenerateAIQuestions(false)} disabled={loading} className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase tracking-widest">{loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}<span>AI 生成面试题</span></button>
                </div>
              </div>

              {/* 面试时间 & 修改区 */}
              {currentInterview && (
                 <div className="pt-4 border-t border-slate-50">
                    {!isReschedulingHeader ? (
                       <div className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                          <div className="flex items-center space-x-2 text-indigo-800">
                             <Clock size={16} />
                             <span className="text-xs font-black uppercase tracking-widest">当前面试时间：</span>
                             <span className="text-sm font-bold bg-white px-2 py-0.5 rounded shadow-sm">
                                {currentInterview.scheduledAt ? new Date(currentInterview.scheduledAt).toLocaleString() : '未安排'}
                             </span>
                          </div>
                          <button 
                            onClick={() => { setIsReschedulingHeader(true); setHeaderTempDate(currentInterview.scheduledAt || new Date().toISOString()); }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 border border-indigo-100 transition-all"
                          >
                             <Edit2 size={12} /> <span>修改时间</span>
                          </button>
                       </div>
                    ) : (
                       <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center mb-3">
                             <h5 className="text-[11px] font-black text-indigo-800 uppercase tracking-widest flex items-center"><Clock size={12} className="mr-1.5"/>调整面试时间</h5>
                             <button onClick={() => setIsReschedulingHeader(false)} className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400"><X size={14} /></button>
                          </div>
                          <DateTimeSliderPicker value={headerTempDate} onChange={setHeaderTempDate} darkMode={false} />
                          <div className="flex justify-end space-x-2 mt-3">
                             <button onClick={() => setIsReschedulingHeader(false)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 bg-white border border-slate-200">取消</button>
                             <button onClick={saveHeaderReschedule} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-md hover:bg-indigo-700 flex items-center"><Save size={12} className="mr-1.5" /> 保存修改</button>
                          </div>
                       </div>
                    )}
                 </div>
              )}
            </div>

            {processStatus.type !== 'none' && (
              <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm border shrink-0 animate-in fade-in slide-in-from-top-4 ${processStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {processStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}<span className="font-bold">{processStatus.message}</span>
              </div>
            )}

             {/* AI 建议面试题区域 */}
             {aiContent && (
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] shadow-xl shadow-indigo-200 animate-in zoom-in duration-500 flex flex-col shrink-0">
                <div className="bg-black/20 backdrop-blur-md p-6 border-b border-white/10 rounded-t-[2.5rem]">
                   <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2 text-white"><BrainCircuit size={16} className="text-indigo-200" /><h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">AI 生成逻辑溯源</h3></div>
                      {!isEditingLogic ? (<button onClick={() => setIsEditingLogic(true)} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-all border border-white/5"><Edit3 size={12} /> <span>修改思路</span></button>) : (<div className="flex space-x-2"><button onClick={() => setIsEditingLogic(false)} className="px-3 py-1.5 text-[10px] font-bold text-white/60 hover:text-white">取消</button><button onClick={() => handleGenerateAIQuestions(true)} disabled={loading} className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-[10px] font-black text-white transition-all shadow-lg">{loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}<span>重生成</span></button></div>)}
                   </div>
                   {isEditingLogic ? (<textarea value={logicContent} onChange={(e) => setLogicContent(e.target.value)} className="w-full h-24 bg-black/20 text-indigo-50 text-xs leading-relaxed p-3 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 focus:bg-black/40 transition-all resize-none font-medium" placeholder="请输入新的生成逻辑..." />) : (<div className="text-xs text-indigo-100/90 leading-relaxed whitespace-pre-wrap font-medium pl-1 border-l-2 border-indigo-400/50 max-h-40 overflow-y-auto custom-scrollbar">{logicContent || '正在解析逻辑...'}</div>)}
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-5"><div className="flex items-center space-x-3"><Lightbulb size={20} className="text-yellow-300" /><h3 className="text-base font-black uppercase tracking-widest text-white">深度面试题</h3></div><button onClick={handleDownloadWord} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors border border-white/20 text-white"><Download size={14} /><span>导出 Word</span></button></div>
                  <div className="prose prose-invert prose-sm max-w-none"><div className="text-sm font-medium leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10 whitespace-pre-wrap text-white/95 shadow-inner min-h-[150px]">{questionContent || (loading ? 'AI 正在思考题目...' : '（暂无题目内容，请点击重试）')}</div></div>
                  <p className="text-[10px] mt-4 opacity-50 italic font-bold text-indigo-100 text-center">系统将基于上方的逻辑持续优化出题质量</p>
                </div>
              </div>
             )}

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-black text-slate-800 flex items-center space-x-2 text-base"><MessageCircle size={20} className="text-indigo-600" /><span>面试录入 (Round {round})</span></h3>
              <div onClick={() => audioInputRef.current?.click()} className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-indigo-50/30 transition-all group"><Mic size={32} className="text-indigo-300 group-hover:text-indigo-600 transition-colors" /><p className="text-xs font-black text-slate-500 group-hover:text-indigo-600 uppercase tracking-widest">{isAudioProcessing ? '正在智能整理音频...' : '点击或拖拽上传面试录音'}</p><input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioFileSelect} /></div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">主观面试评语</label>
                <textarea 
                  className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none resize-none transition-all" 
                  placeholder="请记录面试过程中的关键表现，AI 将自动分析候选人画像..." 
                  value={evaluationText} 
                  onChange={(e) => setEvaluationText(e.target.value)} 
                  onBlur={(e) => e.target.value && handleAssessment(e.target.value)} 
                />
              </div>
            </div>

            {round < 3 && (<div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl animate-in slide-in-from-bottom-8"><div className="flex items-center space-x-3 mb-6"><CalendarPlus className="text-indigo-400" size={24} /><h3 className="text-lg font-black uppercase tracking-widest">晋级下一阶段</h3></div><div className="space-y-6"><p className="text-[11px] text-slate-400 font-bold leading-relaxed">如果该候选人表现卓越，请设定第 {round + 1} 轮面试的时间。确认后流程将自动推进。</p><DateTimeSliderPicker value={nextRoundDate} onChange={(iso) => setNextRoundDate(iso)} /><button onClick={handleScheduleNextRound} disabled={!nextRoundDate} className="w-full py-4 bg-indigo-600 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 disabled:opacity-50 uppercase tracking-[0.2em]"><ArrowRightCircle size={18} /><span>确认晋级并邀约新环节</span></button></div></div>)}

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-colors">
              <div className="flex items-center space-x-4"><div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors"><X size={20} /></div><div><h4 className="text-sm font-black text-slate-800 group-hover:text-red-600 transition-colors">标记为不合格</h4><p className="text-[10px] text-slate-400 font-bold mt-0.5">终止面试流程并归档至已拒绝库</p></div></div>
              <button onClick={handleRejectCandidate} className="px-5 py-2.5 rounded-xl border-2 border-slate-100 text-slate-400 font-black text-xs hover:border-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">确认淘汰</button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h3 className="font-black text-slate-800 flex items-center space-x-2 text-base"><TrendingUp size={20} className="text-indigo-600" /><span>AI 结构化复盘结论</span></h3>
                  <div className="px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100"><span className="text-[10px] font-black text-indigo-600 uppercase">Gemini 3 Pro</span></div>
                </div>
                <div className="w-full">
                  {activeCandidate.interviews.find(i => i.round === round)?.aiSummary ? (
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap font-bold leading-relaxed shadow-inner">
                       {activeCandidate.interviews.find(i => i.round === round)?.aiSummary}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-30 space-y-4 py-8"><BrainCircuit size={64} className="text-indigo-200" /><div className="text-center"><p className="text-sm font-black uppercase tracking-widest text-slate-400">正在等待数据...</p><p className="text-[10px] text-slate-300 font-bold mt-1">上传录音或输入评语后自动生成报告</p></div></div>
                  )}
                </div>
              </div>
          </>
        )}
      </div>

      {isInviteModalOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col"><div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><UserPlus size={20} /></div><div><h2 className="text-xl font-black text-slate-900">邀约面试 (Round {round})</h2><p className="text-xs text-slate-500 font-bold mt-0.5">从人才库中挑选符合条件的候选人</p></div></div><button onClick={() => setIsInviteModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X size={24} /></button></div><div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar"><div className="space-y-4"><div className="flex justify-between items-center"><h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">1. 选择候选人</h4><div className="relative w-48"><select value={inviteJobFilter} onChange={(e) => setInviteJobFilter(e.target.value)} className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"><option value="all">筛选岗位...</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select></div></div><div className="h-48 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50"><div className="overflow-y-auto h-full p-2 space-y-2 custom-scrollbar">{eligibleCandidates.length === 0 ? (<div className="h-full flex items-center justify-center text-slate-400 text-xs italic">暂无符合当前轮次 ({round === 1 ? '新申请' : round === 2 ? '一轮完成' : '二轮完成'}) 的候选人</div>) : (eligibleCandidates.map(c => (<div key={c.id} onClick={() => setInviteCandidateId(c.id)} className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${inviteCandidateId === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'}`}><div className="flex items-center space-x-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${inviteCandidateId === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-indigo-600'}`}>{c.name.charAt(0)}</div><div><p className="text-sm font-black">{c.name}</p><p className={`text-[10px] opacity-80 ${inviteCandidateId === c.id ? 'text-indigo-100' : 'text-slate-500'}`}>{jobs.find(j => j.id === c.jobId)?.title}</p></div></div>{inviteCandidateId === c.id && <CheckCircle size={18} />}</div>)))}</div></div></div><div className="space-y-4"><h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">2. 设定面试时间</h4><DateTimeSliderPicker value={inviteDate} onChange={setInviteDate} darkMode={false} /></div></div><div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end space-x-4"><button onClick={() => setIsInviteModalOpen(false)} className="px-6 py-3 rounded-xl border-2 border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">取消</button><button onClick={handleConfirmInviteFromLibrary} disabled={!inviteCandidateId || !inviteDate} className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all">确认排程并移入面试组</button></div></div></div>)}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: #6366f1; cursor: pointer; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }`}</style>
    </div>
  );
};

export default InterviewRoundPage;