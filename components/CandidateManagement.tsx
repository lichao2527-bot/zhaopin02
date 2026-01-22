
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Candidate, Job, Persona, BasicInfo, CandidateStatus } from '../types';
import { 
  Upload, FileText, Mic, CheckCircle2, Clock, Sparkles, Loader2, Search, Users, 
  Briefcase, MapPin, X, Plus, Zap, User, GraduationCap, Hammer, Award, Star, 
  CalendarCheck, CalendarDays, Timer, MessageSquareText, BrainCircuit, Volume2, 
  Fingerprint, Filter, ShieldCheck, Smartphone, Mail, HeartPulse, ExternalLink, 
  School, BookOpen, MessageCircle, Baby, Users2, ChevronDown, Edit2, Save,
  Activity, UserCheck, UserX, Eye, Download
} from 'lucide-react';
import { parseResumeData, generateInterviewQuestions } from '../services/geminiService';

interface Props {
  candidates: Candidate[];
  jobs: Job[];
  personas: Persona[];
  initialFilterJobId?: string;
  // DB Actions
  onAddCandidate: (candidate: Candidate) => Promise<void>;
  onUpdateCandidate: (candidate: Candidate) => Promise<void>;
}

// ----------------------------------------------------------------------
// 1. 复用时间选择器组件
// ----------------------------------------------------------------------
const DateTimeSliderPicker: React.FC<{
  value: string;
  onChange: (isoString: string) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const [dateOffset, setDateOffset] = useState(0);
  const [minutesOffset, setMinutesOffset] = useState(540); 

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setMinutesOffset(date.getHours() * 60 + date.getMinutes());
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

  return (
    <div className={`space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 ${className}`}>
      <div className="space-y-1">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black text-indigo-400 uppercase flex items-center tracking-widest"><CalendarDays size={12} className="mr-1.5" /> 调整日期</label>
          <span className="text-xs font-black text-indigo-700">{selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
        </div>
        <input type="range" min="-2" max="14" value={dateOffset} onChange={(e) => setDateOffset(parseInt(e.target.value))} className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black text-indigo-400 uppercase flex items-center tracking-widest"><Timer size={12} className="mr-1.5" /> 调整时间</label>
          <span className="text-xs font-black text-indigo-700">{Math.floor(minutesOffset / 60).toString().padStart(2, '0')}:{(minutesOffset % 60).toString().padStart(2, '0')}</span>
        </div>
        <input type="range" min="480" max="1320" step="15" value={minutesOffset} onChange={(e) => setMinutesOffset(parseInt(e.target.value))} className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. 辅助组件
// ----------------------------------------------------------------------

const EditableCell: React.FC<{ label: string; value: string | null | undefined; onSave: (val: string) => void; className?: string; multiline?: boolean; }> = ({ label, value, onSave, className, multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      if (multiline && inputRef.current) {
        const length = tempValue ? tempValue.length : 0;
        inputRef.current.setSelectionRange(length, length);
      }
    } else {
      setTempValue(value || '');
    }
  }, [isEditing, value, multiline, tempValue]);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onSave(tempValue || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (multiline) {
        if (!e.shiftKey) {
          e.preventDefault();
          handleBlur();
        }
      } else {
        handleBlur();
      }
    }
    if (e.key === 'Escape') {
      setTempValue(value || '');
      setIsEditing(false);
    }
  };

  return (
    <div className={`group flex flex-col px-3 py-1.5 border-r border-b border-slate-100 min-h-[46px] transition-all hover:bg-indigo-50/30 relative ${className}`} onDoubleClick={() => setIsEditing(true)}>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0 flex justify-between overflow-hidden">
        <span className="truncate">{label}</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px] text-indigo-400 font-normal normal-case transition-opacity cursor-pointer shrink-0 ml-1">编辑</span>
      </span>
      {isEditing ? (
        multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="w-full h-full min-h-[32px] bg-white border border-indigo-400 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 outline-none shadow-lg resize-none leading-tight"
            value={tempValue || ''}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="w-full bg-white border border-indigo-400 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 outline-none shadow-lg"
            value={tempValue || ''}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        )
      ) : (
        <div className={`text-xs font-bold leading-tight break-words whitespace-pre-wrap mt-0.5 ${value ? 'text-slate-800' : 'text-slate-300 italic'}`}>
          {value || '未填写'}
        </div>
      )}
    </div>
  );
};

const BasicInfoDisplayGrid: React.FC<{ info: BasicInfo; rawText: string }> = ({ info, rawText }) => { const phone = info.phone || rawText.match(/1[3-9]\d{9}/)?.[0] || '-'; const email = info.email || rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || '-'; const row1 = [ { label: '姓名', value: info.name, icon: User, span: 'col-span-2' }, { label: '性别', value: info.gender, icon: HeartPulse, span: 'col-span-1' }, { label: '年龄', value: info.age, icon: Timer, span: 'col-span-1' }, { label: '婚姻', value: info.maritalStatus, icon: Users2, span: 'col-span-2' }, { label: '子女', value: info.childAge, icon: Baby, span: 'col-span-2' }, { label: '学历', value: info.education, icon: Award, span: 'col-span-2' }, { label: '城市', value: info.expectedCity || '-', icon: MapPin, span: 'col-span-2' }, ]; const row2 = [ { label: '院校', value: info.school, icon: School, span: 'col-span-3' }, { label: '专业', value: info.major, icon: BookOpen, span: 'col-span-3' }, { label: '毕业时间', value: info.graduationTime, icon: GraduationCap, span: 'col-span-2' }, { label: '工作年限', value: info.workExperience, icon: Briefcase, span: 'col-span-2' }, { label: '期望薪资', value: info.expectedSalary, icon: Zap, span: 'col-span-2' }, ]; const row3 = [ { label: '联系电话', value: phone, icon: Smartphone, span: 'col-span-3' }, { label: '微信号', value: info.wechat || '-', icon: MessageCircle, span: 'col-span-3' }, { label: '电子邮箱', value: email, icon: Mail, span: 'col-span-3' }, { label: '求职意向', value: info.jobIntent, icon: Star, span: 'col-span-3' }, ]; const allFields = [...row1, ...row2, ...row3]; return ( <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12 animate-in fade-in slide-in-from-top-4 duration-500"> <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between"> <div className="flex items-center space-x-2 text-indigo-600"> <Fingerprint size={18} /> <h4 className="text-xs font-black uppercase tracking-widest">1. 个人基础信息 (Personal Information)</h4> </div> <div className="text-[10px] font-bold text-slate-400 italic">核心画像字段已对齐</div> </div> <div className="grid grid-cols-2 md:grid-cols-8 lg:grid-cols-12 bg-white"> {allFields.map((f, i) => ( <div key={i} className={`flex flex-col px-3 py-1.5 border-r border-b border-slate-100 hover:bg-indigo-50/20 transition-all min-h-[46px] ${f.span ? `lg:${f.span}` : ''}`}> <div className="flex items-center space-x-1.5 mb-0.5"> <f.icon size={10} className="text-indigo-400 shrink-0" /> <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{f.label}</span> </div> <span className="text-xs font-bold text-slate-800 break-words leading-tight">{f.value || '-'}</span> </div> ))} </div> </div> ); };

const BasicInfoGrid: React.FC<{ candidate: Candidate; onUpdate: (id: string, updates: Partial<BasicInfo>) => void; }> = ({ candidate, onUpdate }) => { const info = candidate.basicInfo || { name: candidate.name, gender: "", age: "", school: "", major: "", education: "", graduationTime: "", workExperience: "", expectedSalary: "", expectedCity: "", jobIntent: "", maritalStatus: "", childAge: "", address: "", willingness: "", phone: "", wechat: "", email: "" }; const updateField = (field: keyof BasicInfo, val: string) => { onUpdate(candidate.id, { [field]: val }); }; return ( <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-500"> <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between"> <div className="flex items-center space-x-2 text-indigo-600"> <Fingerprint size={16} /> <h4 className="text-[11px] font-black uppercase tracking-widest">核心画像基础信息 (双击可编辑)</h4> </div> <div className="text-[9px] font-bold text-slate-400 italic">AI 自动解析提取</div> </div> <div className="grid grid-cols-2 md:grid-cols-8 lg:grid-cols-12 bg-white"> <EditableCell label="姓名" value={info.name} onSave={(v) => updateField('name', v)} className="lg:col-span-2" /> <EditableCell label="性别" value={info.gender} onSave={(v) => updateField('gender', v)} className="lg:col-span-1" /> <EditableCell label="年龄" value={info.age} onSave={(v) => updateField('age', v)} className="lg:col-span-1" /> <EditableCell label="婚姻" value={info.maritalStatus} onSave={(v) => updateField('maritalStatus', v)} className="lg:col-span-2" /> <EditableCell label="子女" value={info.childAge} onSave={(v) => updateField('childAge', v)} className="lg:col-span-2" /> <EditableCell label="学历" value={info.education || ''} onSave={(v) => updateField('education', v)} className="lg:col-span-2" /> <EditableCell label="期望城市" value={info.expectedCity} onSave={(v) => updateField('expectedCity', v)} className="lg:col-span-2" /> <EditableCell label="最高学历院校" value={info.school || ''} onSave={(v) => updateField('school', v)} className="lg:col-span-3" /> <EditableCell label="专业" value={info.major || ''} onSave={(v) => updateField('major', v)} className="lg:col-span-3" /> <EditableCell label="毕业时间" value={info.graduationTime} onSave={(v) => updateField('graduationTime', v)} className="lg:col-span-2" /> <EditableCell label="工作年限" value={info.workExperience} onSave={(v) => updateField('workExperience', v)} className="lg:col-span-2" /> <EditableCell label="期望薪资" value={info.expectedSalary} onSave={(v) => updateField('expectedSalary', v)} className="lg:col-span-2" /> <EditableCell label="联系电话" value={info.phone || ''} onSave={(v) => updateField('phone', v)} className="lg:col-span-3" /> <EditableCell label="微信号" value={info.wechat || ''} onSave={(v) => updateField('wechat', v)} className="lg:col-span-3" /> <EditableCell label="电子邮箱" value={info.email || ''} onSave={(v) => updateField('email', v)} className="lg:col-span-3" /> <EditableCell label="求职意向" value={info.jobIntent} onSave={(v) => updateField('jobIntent', v)} className="lg:col-span-3" /> <EditableCell label="居住地址" value={info.address} onSave={(v) => updateField('address', v)} className="lg:col-span-6" multiline={true} /> <EditableCell label="意愿度" value={info.willingness} onSave={(v) => updateField('willingness', v)} className="lg:col-span-6 bg-indigo-50/20" multiline={true} /> </div> </div> ); };

const ResumeRenderer: React.FC<{ candidate: Candidate }> = ({ candidate }) => { const content = candidate.fullResumeText || ""; const info = candidate.basicInfo; const cleanText = (text: string) => text.replace(/[#_~`]/g, '').replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').trim(); const sections = useMemo(() => { const sectionTitles = ["1. 个人基础信息 (Personal Information)", "2. 教育背景 (Education)", "3. 工作/实习经历 (Work Experience)", "4. 项目经历 (Project Experience)", "5. 技能与证书 (Skills & Certifications)", "6. 自我评价 (Summary/Self-Evaluation)"]; const result: { title: string; content: string; icon: any }[] = []; const icons = [User, GraduationCap, Briefcase, Hammer, Award, Star]; let currentSectionIndex = -1; candidate.fullResumeText?.split('\n').forEach(line => { const foundIndex = sectionTitles.findIndex(title => line.includes(title.split(' (')[0].split('. ')[1]) || line.includes(title)); if (foundIndex !== -1) { currentSectionIndex = foundIndex; result[currentSectionIndex] = { title: sectionTitles[foundIndex], content: '', icon: icons[foundIndex] }; } else if (currentSectionIndex !== -1) { result[currentSectionIndex].content += line + '\n'; } }); return result.filter(s => s !== undefined); }, [candidate.fullResumeText]); if (sections.length === 0) return <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">{cleanText(content)}</div>; return ( <div className="space-y-16 relative"> {sections.map((section, idx) => { const isBasicInfo = idx === 0; return ( <div key={idx} className="relative"> {idx < sections.length - 1 && <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-indigo-50 -mb-16"></div>} <div className="flex items-start space-x-8"> <div className="relative z-10 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0 transform"> <section.icon size={24} /> </div> <div className="flex-1 min-w-0"> {!isBasicInfo && ( <div className="flex items-center space-x-4 mb-8 pt-1"> <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">{section.title}</h2> <div className="h-px flex-1 bg-slate-100"></div> </div> )} {isBasicInfo && info ? ( <BasicInfoDisplayGrid info={info} rawText={section.content} /> ) : ( <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm"> <div className="space-y-6"> {section.content.split('\n').map((line, lidx) => { const trimmed = line.trim(); if (!trimmed) return null; const cleaned = cleanText(trimmed); if (cleaned.includes('|')) { const parts = cleaned.split('|').map(p => p.trim()); return ( <div key={lidx} className="bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4"> <div className="flex-1"> <h3 className="text-lg font-bold text-slate-900 mb-1">{parts[0]}</h3> {parts[1] && <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{parts[1]}</p>} </div> {parts[2] && <div className="shrink-0 px-4 py-1.5 bg-white border border-indigo-200 rounded-xl shadow-sm"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{parts[2]}</span></div>} </div> ); } if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) { return <div key={lidx} className="flex items-start space-x-3 py-1.5 group/line"><div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 group-hover/line:bg-indigo-600 transition-colors"></div><p className="text-slate-600 font-medium leading-relaxed text-[13px]">{cleaned.replace(/^[-•*\d.]+\s*/, '')}</p></div>; } return <p key={lidx} className="text-slate-500 font-medium text-sm leading-relaxed mb-2 pl-1">{cleaned}</p>; })} </div> </div> )} </div> </div> </div> ); })} </div> ); };

// ----------------------------------------------------------------------
// 3. 主组件 (CandidateManagement)
// ----------------------------------------------------------------------
const CandidateManagement: React.FC<Props> = ({ candidates, jobs, personas, initialFilterJobId, onAddCandidate, onUpdateCandidate }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [filterJobId, setFilterJobId] = useState<string>(initialFilterJobId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [importJobId, setImportJobId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inviteDates, setInviteDates] = useState<Record<number, string>>({});
  
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  
  // 修改时间相关的状态
  const [editingSchedule, setEditingSchedule] = useState<{ id: string, round: number } | null>(null);
  const [tempScheduleDate, setTempScheduleDate] = useState<string>('');

  // 侧边栏状态页签
  const [sidebarTab, setSidebarTab] = useState<'active' | 'hired' | 'rejected'>('active');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateQuestions = async (round: number) => {
    const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
    const candidateJob = selectedCandidate ? jobs.find(j => j.id === selectedCandidate.jobId) : null;
    const jobPersona = candidateJob ? personas.find(p => p.id === candidateJob.personaId) : null;

    if (!selectedCandidate || !candidateJob || !jobPersona) return;
    setIsGeneratingQuestions(true);
    try {
      const qText = await generateInterviewQuestions(
        candidateJob.title, jobPersona.description, selectedCandidate.name, round, '', 
        selectedCandidate.fullResumeText || '', jobPersona.core_tags || ''
      );
      const parts = qText.split('<<<SPLIT_HERE>>>');
      const realQ = parts.length >= 2 ? parts[1] : qText;
      const qArray = realQ?.split('\n').filter(l => l.trim().length > 0) || [];

      const updatedInterviews = [...selectedCandidate.interviews];
      const existingIdx = updatedInterviews.findIndex(i => i.round === round);
      
      if (existingIdx !== -1) { 
        updatedInterviews[existingIdx] = { ...updatedInterviews[existingIdx], questions: qArray };
      } else { 
        updatedInterviews.push({ id: `i-${Date.now()}`, round: round as 1 | 2 | 3, scheduledAt: new Date().toISOString(), questions: qArray, status: 'pending' }); 
      }
      
      const updatedCandidate = { ...selectedCandidate, interviews: updatedInterviews };
      await onUpdateCandidate(updatedCandidate);

    } catch (err) { console.error(err); } finally { setIsGeneratingQuestions(false); }
  };

  const updateCandidateStatus = async (id: string, status: CandidateStatus) => {
    const c = candidates.find(x => x.id === id);
    if (c) {
        await onUpdateCandidate({ ...c, status });
    }
  };

  const updateBasicInfo = async (id: string, updates: Partial<BasicInfo>) => {
    const c = candidates.find(x => x.id === id);
    if (c) {
        await onUpdateCandidate({ ...c, basicInfo: { ...c.basicInfo, ...updates } as BasicInfo });
    }
  };

  const toggleRound = (round: number) => setExpandedRound(prev => prev === round ? null : round);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // 1. Tab 筛选
      let matchTab = false;
      if (sidebarTab === 'active') {
        matchTab = c.status !== '已入职' && c.status !== '已拒绝';
      } else if (sidebarTab === 'hired') {
        matchTab = c.status === '已入职';
      } else if (sidebarTab === 'rejected') {
        matchTab = c.status === '已拒绝';
      }

      // 2. 岗位 & 搜索筛选
      const matchesJob = filterJobId === 'all' || c.jobId === filterJobId;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchTab && matchesJob && matchesSearch;
    });
  }, [candidates, filterJobId, searchQuery, sidebarTab]);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const candidateJob = selectedCandidate ? jobs.find(j => j.id === selectedCandidate.jobId) : null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setSelectedFile(file); }
  };

  const handleStartFileImport = async () => {
    if (!selectedFile || !importJobId) return;
    setIsProcessing(true);
    setImportProgress(0); 
    const progressInterval = setInterval(() => { setImportProgress(prev => { if (prev >= 92) return prev; return prev + Math.floor(Math.random() * 8) + 1; }); }, 400);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => { reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.readAsDataURL(selectedFile); });
      const mimeType = selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const result = await parseResumeData({ fileName: selectedFile.name, fileData: { data: base64Data, mimeType: mimeType } });
      clearInterval(progressInterval); setImportProgress(100);
      const newId = `c-${Date.now()}`;
      // Ensure resumeUrl is created
      const resumeUrl = URL.createObjectURL(selectedFile);
      const newCandidate: Candidate = { 
          id: newId, 
          name: result.basicInfo?.name || selectedFile.name.split('.')[0], 
          jobId: importJobId, 
          resumeUrl: resumeUrl, // STORED HERE
          fullResumeText: result.fullContent, 
          basicInfo: result.basicInfo, 
          status: '新申请', 
          appliedAt: new Date().toISOString(), 
          interviews: [] 
      };
      
      await onAddCandidate(newCandidate);
      
      setSelectedCandidateId(newId);
      setTimeout(() => { setIsImportModalOpen(false); setIsProcessing(false); setImportProgress(0); setSelectedFile(null); }, 800);
    } catch (err) { clearInterval(progressInterval); setIsProcessing(false); }
  };

  // 保存修改后的时间
  const saveReschedule = async () => {
    if (!editingSchedule || !tempScheduleDate || !selectedCandidate) return;
    
    const updatedInterviews = [...selectedCandidate.interviews];
    const idx = updatedInterviews.findIndex(i => i.round === editingSchedule.round);
    if (idx !== -1) {
        updatedInterviews[idx] = { ...updatedInterviews[idx], scheduledAt: tempScheduleDate };
        await onUpdateCandidate({ ...selectedCandidate, interviews: updatedInterviews });
    }
    
    setEditingSchedule(null);
    setTempScheduleDate('');
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* ⚠️ SIDEBAR - 包含状态 Tabs */}
      <div className="w-80 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-50 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center space-x-2"><Users size={18} className="text-indigo-600" /><span className="text-sm">候选人库</span></h3>
            <button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center"><Plus size={16} /></button>
          </div>

          {/* 状态分类 Tab */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
             <button onClick={() => setSidebarTab('active')} className={`flex-1 py-1.5 flex items-center justify-center space-x-1.5 rounded-lg text-[10px] font-bold transition-all ${sidebarTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Activity size={12} /><span>进行中</span>
             </button>
             <button onClick={() => setSidebarTab('hired')} className={`flex-1 py-1.5 flex items-center justify-center space-x-1.5 rounded-lg text-[10px] font-bold transition-all ${sidebarTab === 'hired' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <UserCheck size={12} /><span>已入职</span>
             </button>
             <button onClick={() => setSidebarTab('rejected')} className={`flex-1 py-1.5 flex items-center justify-center space-x-1.5 rounded-lg text-[10px] font-bold transition-all ${sidebarTab === 'rejected' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <UserX size={12} /><span>已淘汰</span>
             </button>
          </div>

          <div className="space-y-2">
             <div className="relative">
              <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={filterJobId} onChange={(e) => setFilterJobId(e.target.value)} className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none appearance-none font-medium">
                <option value="all">全部岗位</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="搜索姓名..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredCandidates.length === 0 ? (
             <div className="p-8 text-center text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">暂无{sidebarTab === 'active' ? '进行中' : (sidebarTab === 'hired' ? '已入职' : '已淘汰')}的候选人</p>
             </div>
          ) : (
            filteredCandidates.map(candidate => (
            <button key={candidate.id} onClick={() => setSelectedCandidateId(candidate.id)} className={`w-full text-left px-5 py-4 flex items-center space-x-3 border-b border-slate-50 hover:bg-slate-50 transition-all ${selectedCandidateId === candidate.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${sidebarTab === 'hired' ? 'bg-emerald-100 text-emerald-600' : (sidebarTab === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-indigo-600')}`}>
                 {candidate.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center"><p className="font-bold text-slate-900 truncate text-sm">{candidate.name}</p><span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">{new Date(candidate.appliedAt).toLocaleDateString()}</span></div>
                <div className="flex items-center space-x-2 mt-0.5"><span className="text-[10px] text-slate-500 truncate">{jobs.find(j => j.id === candidate.jobId)?.title}</span></div>
              </div>
            </button>
          )))}
        </div>
      </div>

      {/* 右侧主视图 */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {!selectedCandidate ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400"><Users size={64} className="mb-4 opacity-10" /><p>请选择左侧候选人查看详情</p></div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
               <div className="flex justify-between items-center">
                <div className="flex items-center space-x-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${selectedCandidate.status === '已入职' ? 'bg-emerald-500 shadow-emerald-200' : (selectedCandidate.status === '已拒绝' ? 'bg-rose-500 shadow-rose-200' : 'bg-indigo-600 shadow-indigo-100')}`}>
                     {selectedCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCandidate.name}</h2>
                    <div className="flex items-center space-x-3 mt-1 text-slate-500 text-xs">
                       <span className="flex items-center"><Briefcase size={12} className="mr-1" />{candidateJob?.title}</span>
                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                       <span className="flex items-center"><MapPin size={12} className="mr-1" />{candidateJob?.location}</span>
                    </div>
                  </div>
                </div>
                <select value={selectedCandidate.status} onChange={(e) => updateCandidateStatus(selectedCandidate.id, e.target.value as CandidateStatus)} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm">
                  {['新申请', '一轮面试', '二轮面试', '三轮面试', '已入职', '已拒绝'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar bg-slate-50/30">
               {/* 档案区 */}
               <section>
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">候选人档案报告</h4>
                    <button onClick={() => setIsPreviewOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"><Zap size={14} className="text-indigo-600" /><span>查看简历全文本分析报告</span></button>
                 </div>
                 
                 {/* ✅ 新增：原始简历文件卡片 */}
                 <div className="mb-6 p-5 border border-slate-100 rounded-2xl flex items-center justify-between bg-white hover:border-indigo-200 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-inner">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {selectedCandidate.name}_个人简历.pdf
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center">
                          <ShieldCheck size={10} className="mr-1 text-emerald-500" />
                          原始文件已归档，可随时调阅
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                       {/* 预览按钮 */}
                       <button 
                         onClick={() => window.open(selectedCandidate.resumeUrl, '_blank')} 
                         className="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all"
                       >
                         <Eye size={14} />
                         <span>预览</span>
                       </button>
                       {/* 下载按钮 */}
                       <a 
                         href={selectedCandidate.resumeUrl} 
                         download={`${selectedCandidate.name}_原始简历.pdf`} 
                         className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-all"
                       >
                         <Download size={14} />
                         <span>下载原件</span>
                       </a>
                    </div>
                 </div>

                 <BasicInfoGrid candidate={selectedCandidate} onUpdate={updateBasicInfo} />
               </section>

               <section>
                 <div className="flex items-center space-x-2 mb-6"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">全链路面试环节追踪 (点击展开)</h4><div className="h-px flex-1 bg-slate-200"></div></div>
                 <div className="space-y-4">
                   {[1, 2, 3].map(round => {
                     const interview = selectedCandidate.interviews.find(i => i.round === round);
                     const isExpanded = expandedRound === round;
                     const hasData = interview?.evaluation || interview?.aiSummary || (interview?.questions && interview.questions.length > 0);
                     const isEditingThis = editingSchedule?.id === selectedCandidate.id && editingSchedule?.round === round;

                     return (
                       <div key={round} className={`border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm ${hasData ? 'border-indigo-100 bg-white' : 'border-slate-200 bg-white'}`}>
                         <div 
                           onClick={() => toggleRound(round)}
                           className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors ${hasData ? 'bg-white border-b border-slate-100' : 'bg-white'}`}
                         >
                           <div className="flex items-center space-x-4">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${hasData ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>{round}</div>
                             <div className="flex-1">
                               <p className={`text-xs font-black uppercase tracking-widest ${hasData ? 'text-slate-800' : 'text-slate-400'}`}>第 {round} 轮面试环节</p>
                               {/* 标题栏时间显示 */}
                               {interview && interview.scheduledAt && (
                                 <div className="flex items-center mt-0.5 space-x-2">
                                    <p className="text-[10px] font-bold text-indigo-600 flex items-center">
                                       <Clock size={10} className="mr-1" />
                                       面试时间：{new Date(interview.scheduledAt).toLocaleString('zh-CN', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                    </p>
                                    {!interview.evaluation && !isEditingThis && (
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setEditingSchedule({ id: selectedCandidate.id, round }); setTempScheduleDate(interview.scheduledAt); setExpandedRound(round); }}
                                         className="p-1 hover:bg-indigo-100 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
                                         title="修改面试时间"
                                       >
                                          <Edit2 size={10} />
                                       </button>
                                    )}
                                 </div>
                               )}
                             </div>
                           </div>
                           <div className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-100' : ''}`}>
                              <ChevronDown size={18} className="text-slate-400" />
                           </div>
                         </div>

                         {isExpanded && (
                           <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                             
                             {isEditingThis && (
                               <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in zoom-in-95 duration-200">
                                  <div className="flex justify-between items-center mb-3">
                                     <h5 className="text-[11px] font-black text-indigo-800 uppercase tracking-widest flex items-center"><Clock size={12} className="mr-1.5"/>调整面试时间</h5>
                                     <button onClick={() => setEditingSchedule(null)} className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400"><X size={14} /></button>
                                  </div>
                                  <DateTimeSliderPicker value={tempScheduleDate} onChange={setTempScheduleDate} className="mb-3" />
                                  <div className="flex justify-end space-x-2">
                                     <button onClick={() => setEditingSchedule(null)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100">取消</button>
                                     <button onClick={saveReschedule} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-md hover:bg-indigo-700 flex items-center">
                                        <Save size={12} className="mr-1.5" /> 保存修改
                                     </button>
                                  </div>
                               </div>
                             )}

                             {/* 详情页时间显示 Banner */}
                             {interview?.scheduledAt && !isEditingThis && (
                               <div className="mb-6 flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                                     <CalendarCheck size={20} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">面试预约时间</p>
                                     <p className="text-sm font-bold text-slate-800">
                                        {new Date(interview.scheduledAt).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                     </p>
                                  </div>
                               </div>
                             )}

                             <div className="space-y-6">
                               {interview?.aiSummary && (
                                 <div className="mb-8">
                                    <div className="flex items-center space-x-2 text-slate-800 mb-3"><BrainCircuit size={18} className="text-indigo-600" /><h5 className="text-[11px] font-black uppercase tracking-widest">AI 结构化复盘结论</h5></div>
                                    <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[1.5rem] text-sm leading-relaxed text-indigo-900 shadow-sm font-bold border-l-4 border-l-indigo-600 min-h-[400px] max-h-[800px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                                       {interview.aiSummary}
                                    </div>
                                 </div>
                               )}
                               
                               {interview?.questions && interview.questions.length > 0 ? (
                                  <div className="mb-8">
                                     <div className="flex items-center space-x-2 text-slate-800 mb-3"><FileText size={18} className="text-indigo-600" /><h5 className="text-[11px] font-black uppercase tracking-widest">已生成的面试题目</h5></div>
                                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm text-slate-700 shadow-inner">
                                        <ul className="list-disc pl-5 space-y-3">
                                           {interview.questions.map((q, idx) => (
                                              <li key={idx} className="leading-relaxed">{q}</li>
                                           ))}
                                        </ul>
                                     </div>
                                  </div>
                               ) : (
                                  <div className="mb-8 text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                                     <p className="text-xs text-slate-400">暂无生成的面试题目</p>
                                     <button onClick={(e) => {e.stopPropagation(); generateQuestions(round);}} className="mt-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">立即生成</button>
                                  </div>
                               )}
                               
                               {interview?.evaluation && (
                                  <div className="mb-4">
                                    <div className="flex items-center space-x-2 text-slate-800 mb-3"><MessageSquareText size={18} className="text-indigo-600" /><h5 className="text-[11px] font-black uppercase tracking-widest">面试官评价</h5></div>
                                    <div className="p-6 bg-white border border-slate-200 rounded-[1.5rem] text-sm leading-relaxed text-slate-700 shadow-sm whitespace-pre-wrap">{interview.evaluation}</div>
                                  </div>
                               )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
               </section>
            </div>
          </>
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300 flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div><h3 className="text-xl font-bold text-slate-900">导入新候选人</h3><p className="text-sm text-slate-500 mt-1">AI 将自动读取姓名及关联岗位</p></div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest">关联目标岗位</label>
                <select value={importJobId} onChange={(e) => setImportJobId(e.target.value)} disabled={isProcessing} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">请选择招聘岗位...</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
              </div>
              <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-10 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-indigo-400 transition-colors"><Upload size={32} className="text-slate-300" /><p className="text-sm font-bold text-slate-600">{selectedFile ? selectedFile.name : '点击上传简历原件'}</p><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} /></div>
              {isProcessing ? (
                <div className="space-y-3"><div className="flex justify-between text-xs font-bold text-slate-500"><span>AI 正在深度解析简历...</span><span>预估剩余 3-5 秒</span></div><div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200"><div className="h-full bg-indigo-600 transition-all duration-300 ease-out" style={{ width: `${importProgress}%` }}></div></div></div>
              ) : (<button onClick={handleStartFileImport} disabled={isProcessing || !selectedFile || !importJobId} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50">开始 AI 解析</button>)}
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[80] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20"><h3 className="text-xl font-black text-slate-900">{selectedCandidate.name} - 简历全文本分析报告</h3><button onClick={() => setIsPreviewOpen(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={28} /></button></div>
            <div className="flex-1 overflow-y-auto p-12 bg-slate-50/20 custom-scrollbar"><div className="max-w-4xl mx-auto"><ResumeRenderer candidate={selectedCandidate} /></div></div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #6366f1; cursor: pointer; border-radius: 50%; border: 4px solid white; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4); transition: transform 0.2s ease; } input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.1); }`}</style>
    </div>
  );
};

export default CandidateManagement;
