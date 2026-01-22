
import React, { useState } from 'react';
import { Job, Persona, Location } from '../types';
import { 
  Plus, 
  MapPin, 
  Sparkles, 
  Wand2, 
  Loader2, 
  X, 
  ClipboardList, 
  BookOpen, 
  Cpu, 
  Heart, 
  Briefcase, 
  CheckCircle, 
  Eye, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Tags,
  Wallet,
  ListTodo
} from 'lucide-react';
import { refinePersona } from '../services/geminiService';

interface Props {
  jobs: Job[];
  personas: Persona[];
  onNavigateToCandidates: (jobId: string) => void;
  // New props for DB operations
  onAddJob: (job: Job, persona: Persona) => Promise<void>;
  onUpdateJob: (job: Job, persona?: Persona) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
}

const InputField = ({ label, icon: Icon, value, onChange, placeholder, rows = 6, isEditable = true, colorClass = "text-indigo-600" }: any) => (
  <div className="space-y-3">
    <label className="flex items-center space-x-2 text-sm font-black text-slate-700 uppercase tracking-widest">
      <Icon size={18} className={colorClass} />
      <span>{label}</span>
    </label>
    {isEditable ? (
      <textarea 
        rows={rows}
        className="w-full px-6 py-5 text-base leading-relaxed rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none resize-none transition-all bg-white shadow-sm placeholder:text-slate-300"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    ) : (
      <div className="p-6 bg-slate-50 rounded-2xl text-base leading-relaxed text-slate-700 whitespace-pre-wrap border border-slate-100">
        {value || '尚未填写'}
      </div>
    )}
  </div>
);

const JobManagement: React.FC<Props> = ({ jobs, personas, onNavigateToCandidates, onAddJob, onUpdateJob, onDeleteJob }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [showSuccessTip, setShowSuccessTip] = useState(false);
  
  // Detail Modal Edit State
  const [editPersona, setEditPersona] = useState<Partial<Persona & { specific_tasks?: string }>>({});
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editSalary, setEditSalary] = useState('');

  const [newJob, setNewJob] = useState({
    title: '',
    location: '北京' as Location,
    salary: '',
    responsibilities: '',
    specific_tasks: '', 
    knowledge: '',
    skills: '',
    literacy: '',
    experience: '',
    warning_traits: '',
    core_tags: ''
  });

  const handleSmartPolish = async (isManualEdit: boolean = false) => {
    const title = isManualEdit ? editJobTitle : newJob.title;
    if (!title || isRefining) return;
    
    setIsRefining(true);
    try {
      const sourceData = isManualEdit ? {
        title: editJobTitle,
        responsibilities: editPersona.responsibilities || '',
        knowledge: editPersona.knowledge || '',
        skills: editPersona.skills_detail || '',
        literacy: editPersona.literacy || '',
        experience: editPersona.experience || '',
        warning_traits: editPersona.warning_traits || '',
        core_tags: editPersona.core_tags || ''
      } : {
        title: newJob.title,
        responsibilities: newJob.responsibilities,
        knowledge: newJob.knowledge,
        skills: newJob.skills,
        literacy: newJob.literacy,
        experience: newJob.experience,
        warning_traits: newJob.warning_traits,
        core_tags: newJob.core_tags
      };

      const polishedData = await refinePersona(sourceData);
      
      if (polishedData) {
        if (isManualEdit) {
          setEditPersona(prev => ({
            ...prev,
            responsibilities: polishedData.responsibilities,
            knowledge: polishedData.knowledge,
            skills_detail: polishedData.skills,
            literacy: polishedData.literacy,
            experience: polishedData.experience,
            warning_traits: polishedData.warning_traits,
            core_tags: polishedData.core_tags
          }));
        } else {
          setNewJob(prev => ({
            ...prev,
            responsibilities: polishedData.responsibilities,
            knowledge: polishedData.knowledge,
            skills: polishedData.skills,
            literacy: polishedData.literacy,
            experience: polishedData.experience,
            warning_traits: polishedData.warning_traits,
            core_tags: polishedData.core_tags
          }));
        }
        setShowSuccessTip(true);
        setTimeout(() => setShowSuccessTip(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCreateJob = async () => {
    console.log('handleCreateJob called with newJob:', newJob);

    const personaId = `p-${Date.now()}`;
    const combinedResponsibilities = newJob.responsibilities +
      (newJob.specific_tasks ? `\n\n【具体工作任务】：\n${newJob.specific_tasks}` : "");

    const newPersona: Persona = {
      id: personaId,
      title: newJob.title,
      description: newJob.specific_tasks || `针对 ${newJob.title} 的结构化人才画像`,
      responsibilities: combinedResponsibilities,
      knowledge: newJob.knowledge,
      skills_detail: newJob.skills,
      literacy: newJob.literacy,
      experience: newJob.experience,
      warning_traits: newJob.warning_traits,
      core_tags: newJob.core_tags,
      aiSuggestions: '已完成 AI 智能润色',
      requirements: [newJob.experience],
      skills: [newJob.skills]
    };

    const job: Job = {
      id: `j-${Date.now()}`,
      title: newJob.title,
      location: newJob.location,
      salary: newJob.salary || '面议',
      personaId: personaId,
      createdAt: new Date().toISOString().split('T')[0],
      status: '在招'
    };

    console.log('Calling onAddJob with:', { job, personaId });

    try {
      // Call DB Wrapper
      await onAddJob(job, newPersona);
      console.log('onAddJob completed successfully');
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('handleCreateJob error:', error);
      throw error; // Re-throw to let parent handle it
    }
  };

  const resetForm = () => {
    setNewJob({ 
      title: '', 
      location: '北京', 
      salary: '',
      responsibilities: '',
      specific_tasks: '',
      knowledge: '',
      skills: '',
      literacy: '',
      experience: '',
      warning_traits: '',
      core_tags: ''
    });
  };

  const handleViewDetail = (job: Job) => {
    const persona = personas.find(p => p.id === job.personaId);
    setSelectedJob(job);
    if (persona) {
      setEditPersona({
        ...persona,
        specific_tasks: persona.description.includes('针对') ? '' : persona.description
      });
      setEditJobTitle(job.title);
      setEditSalary(job.salary);
    }
    setIsEditing(false);
    setIsDetailModalOpen(true);
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('确定要删除该岗位吗？这将移除所有关联信息。')) {
      await onDeleteJob(id);
    }
  };

  const toggleJobStatus = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      const updatedJob = { ...job, status: job.status === '在招' ? '已结束' : '在招' } as Job;
      await onUpdateJob(updatedJob);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedJob || !editPersona.id) return;

    const updatedJob: Job = { ...selectedJob, title: editJobTitle, salary: editSalary };
    const updatedPersona: Persona = { 
        ...editPersona, 
        title: editJobTitle,
        description: editPersona.specific_tasks || (personas.find(p=>p.id===editPersona.id)?.description || '')
    } as Persona;

    await onUpdateJob(updatedJob, updatedPersona);
    
    setIsEditing(false);
    setSelectedJob(updatedJob);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} />
          <span>创建新岗位</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => toggleJobStatus(job.id)}
                title={job.status === '在招' ? '标记为结束' : '重新开放'}
                className={`p-2 rounded-lg transition-colors ${job.status === '在招' ? 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {job.status === '在招' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              <button 
                onClick={() => handleDeleteJob(job.id)}
                title="删除岗位"
                className="p-2 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                job.status === '在招' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {job.status}
              </div>
              <span className="text-slate-400 text-xs">{job.createdAt}</span>
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors pr-12">{job.title}</h3>
            <div className="flex items-center text-slate-500 text-sm space-x-4">
              <span className="flex items-center">
                <MapPin size={14} className="mr-1" />
                {job.location}
              </span>
              <span className="flex items-center text-indigo-600 font-bold">
                <Wallet size={14} className="mr-1" />
                {job.salary}
              </span>
            </div>
            
            {personas.find(p => p.id === job.personaId)?.core_tags && (() => {
              const persona = personas.find(p => p.id === job.personaId);
              if (!persona || !persona.core_tags) return null;

              // 处理 core_tags 可能是数组或字符串的情况
              let tags: string[];
              if (Array.isArray(persona.core_tags)) {
                tags = persona.core_tags;
              } else {
                tags = persona.core_tags.split(',');
              }

              return (
                <div className="mt-4 flex flex-wrap gap-1.5 overflow-hidden max-h-12">
                  {tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100">
                      {String(tag).trim()}
                    </span>
                  ))}
                </div>
              );
            })()}

            <div className="mt-6 pt-6 border-t border-slate-50 flex space-x-2">
              <button 
                onClick={() => handleViewDetail(job)}
                className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1"
              >
                <Eye size={14} />
                <span>详情 / 编辑</span>
              </button>
              <button 
                onClick={() => onNavigateToCandidates(job.id)}
                className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                查看候选人
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
             <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      className="text-2xl font-black tracking-tight text-slate-900 border-b-2 border-indigo-600 outline-none w-full max-w-md bg-slate-50 px-2 py-1 rounded-t-lg"
                      placeholder="职位名称"
                    />
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Wallet size={16} className="text-indigo-600" />
                        <input 
                          type="text"
                          value={editSalary}
                          onChange={(e) => setEditSalary(e.target.value)}
                          className="text-sm font-bold text-indigo-600 border-b border-indigo-200 outline-none bg-indigo-50/30 px-2 py-0.5 rounded"
                          placeholder="薪资范畴"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">{selectedJob.title} - 岗位详情</h2>
                    <div className="flex items-center space-x-3 mt-1">
                       <span className="flex items-center text-slate-500 text-sm"><MapPin size={14} className="mr-1" />{selectedJob.location}</span>
                       <span className="text-slate-300">|</span>
                       <span className="flex items-center text-indigo-600 font-bold text-sm"><Wallet size={14} className="mr-1" />{selectedJob.salary}</span>
                       <span className="text-slate-300">|</span>
                       <span className="text-slate-500 text-sm">发布于 {selectedJob.createdAt}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center space-x-2 px-4 font-bold text-sm"
                  >
                    <Edit3 size={18} />
                    <span>进入编辑</span>
                  </button>
                )}
                <button onClick={() => { setIsDetailModalOpen(false); setIsEditing(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
               <div className="max-w-3xl mx-auto space-y-12">
                  {isEditing && (
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-4">
                      <div className="flex items-center space-x-3 text-indigo-900">
                        <Sparkles size={24} className="text-indigo-600" />
                        <div>
                          <p className="font-bold text-sm">AI 辅助编辑已就绪</p>
                          <p className="text-xs text-indigo-700/70">手动修改细节或点击右侧按钮进行全局润色</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSmartPolish(true)}
                        disabled={isRefining}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 flex items-center space-x-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
                      >
                        {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        <span>AI 智能重写</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-10">
                    <InputField 
                      label="核心职责" 
                      icon={ClipboardList} 
                      isEditable={isEditing}
                      value={editPersona.responsibilities}
                      onChange={(v: string) => setEditPersona({...editPersona, responsibilities: v})}
                    />

                    {/* ✅ 新增：具体工作任务编辑 */}
                    <InputField 
                      label="具体工作任务 (Daily Tasks)" 
                      icon={ListTodo} 
                      isEditable={isEditing}
                      rows={6}
                      placeholder="列出该岗位每天/每周具体的执行动作，例如：撰写日/周报、维护社群活跃度..."
                      value={editPersona.specific_tasks}
                      onChange={(v: string) => setEditPersona({...editPersona, specific_tasks: v})}
                    />

                    <InputField 
                      label="专业知识" 
                      icon={BookOpen} 
                      isEditable={isEditing}
                      value={editPersona.knowledge}
                      onChange={(v: string) => setEditPersona({...editPersona, knowledge: v})}
                    />

                    <InputField 
                      label="专业技能" 
                      icon={Cpu} 
                      isEditable={isEditing}
                      value={editPersona.skills_detail}
                      onChange={(v: string) => setEditPersona({...editPersona, skills_detail: v})}
                    />

                    <InputField 
                      label="职业素养" 
                      icon={Heart} 
                      isEditable={isEditing}
                      value={editPersona.literacy}
                      onChange={(v: string) => setEditPersona({...editPersona, literacy: v})}
                    />

                    <InputField 
                      label="经验要求" 
                      icon={Briefcase} 
                      isEditable={isEditing}
                      value={editPersona.experience}
                      onChange={(v: string) => setEditPersona({...editPersona, experience: v})}
                    />

                    <InputField 
                      label="警惕特质" 
                      icon={AlertTriangle} 
                      isEditable={isEditing}
                      rows={4}
                      colorClass="text-orange-500"
                      value={editPersona.warning_traits}
                      onChange={(v: string) => setEditPersona({...editPersona, warning_traits: v})}
                    />

                    <InputField 
                      label="核心能力标签" 
                      icon={Tags} 
                      isEditable={isEditing}
                      rows={2}
                      value={editPersona.core_tags}
                      onChange={(v: string) => setEditPersona({...editPersona, core_tags: v})}
                    />
                  </div>
               </div>
            </div>

            <div className="px-10 py-8 border-t border-slate-100 flex space-x-6 bg-white sticky bottom-0 z-10">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      const original = personas.find(p => p.id === selectedJob.personaId);
                      if (original) setEditPersona(original);
                      setEditJobTitle(selectedJob.title);
                      setEditSalary(selectedJob.salary);
                    }}
                    className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-sm flex items-center justify-center space-x-2"
                  >
                    <RotateCcw size={18} />
                    <span>取消修改</span>
                  </button>
                  <button 
                    onClick={handleSaveEdits}
                    className="flex-1 px-8 py-5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-widest text-sm flex items-center justify-center space-x-2"
                  >
                    <Save size={18} />
                    <span>保存所有更改</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-sm"
                  >
                    关闭
                  </button>
                  <button 
                    onClick={() => { setIsDetailModalOpen(false); onNavigateToCandidates(selectedJob.id); }}
                    className="flex-1 px-8 py-5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-widest text-sm"
                  >
                    查看此岗位候选人
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">发布新招聘岗位</h2>
                <p className="text-sm text-slate-500 mt-1">详细描述岗位需求，AI 将为您提供一键润色支持</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">职位名称</label>
                    <input 
                      type="text" 
                      placeholder="例如: 资深视觉设计师"
                      className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-lg font-bold transition-all bg-slate-50/50"
                      value={newJob.title}
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">工作地点</label>
                    <select 
                      className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none bg-slate-50/50 text-lg font-bold transition-all"
                      value={newJob.location}
                      onChange={e => setNewJob({...newJob, location: e.target.value as Location})}
                    >
                      <option value="北京">北京</option>
                      <option value="青岛">青岛</option>
                      <option value="线上兼职">线上兼职</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest flex items-center">
                      <Wallet size={14} className="mr-1 text-indigo-600" />
                      <span>岗位薪资</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如: 15k-25k"
                      className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-lg font-bold transition-all bg-slate-50/50"
                      value={newJob.salary}
                      onChange={e => setNewJob({...newJob, salary: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-3">
                    <Sparkles size={24} className="text-indigo-600" />
                    <h3 className="text-2xl font-black text-slate-900">核心画像维度</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    {showSuccessTip && (
                      <span className="text-emerald-600 text-sm font-bold flex items-center animate-in fade-in slide-in-from-right-2">
                        <CheckCircle size={16} className="mr-1" />
                        润色成功
                      </span>
                    )}
                    <button 
                      onClick={() => handleSmartPolish(false)}
                      disabled={isRefining || !newJob.title}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 transition-all shadow-xl shadow-indigo-100"
                    >
                      {isRefining ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                      <span>{isRefining ? '正在深度润色...' : 'AI 智能润色文案'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-12 pb-10">
                  <InputField 
                    label="核心职责" 
                    icon={ClipboardList} 
                    rows={8}
                    placeholder="详细描述该岗位的核心工作内容、关键绩效指标（KPI）..."
                    value={newJob.responsibilities}
                    onChange={(v: string) => setNewJob({...newJob, responsibilities: v})}
                  />

                  {/* ✅ 新增：创建时的具体工作任务输入 */}
                  <InputField 
                    label="具体工作任务 (Daily Tasks)" 
                    icon={ListTodo} 
                    rows={6}
                    placeholder="例如：1. 每天上午10点前发布社群早报；2. 每周五输出周度数据复盘报告..."
                    value={newJob.specific_tasks}
                    onChange={(v: string) => setNewJob({...newJob, specific_tasks: v})}
                  />
                  
                  <InputField 
                    label="专业知识" 
                    icon={BookOpen} 
                    rows={6}
                    placeholder="岗位所需的理论知识储备..."
                    value={newJob.knowledge}
                    onChange={(v: string) => setNewJob({...newJob, knowledge: v})}
                  />

                  <InputField 
                    label="专业技能" 
                    icon={Cpu} 
                    rows={6}
                    placeholder="具体工具软件使用..."
                    value={newJob.skills}
                    onChange={(v: string) => setNewJob({...newJob, skills: v})}
                  />

                  <InputField 
                    label="职业素养" 
                    icon={Heart} 
                    rows={6}
                    placeholder="团队协作、沟通能力..."
                    value={newJob.literacy}
                    onChange={(v: string) => setNewJob({...newJob, literacy: v})}
                  />

                  <InputField 
                    label="经验要求" 
                    icon={Briefcase} 
                    rows={6}
                    placeholder="相关工作年限、项目经验..."
                    value={newJob.experience}
                    onChange={(v: string) => setNewJob({...newJob, experience: v})}
                  />

                  <InputField 
                    label="警惕特质" 
                    icon={AlertTriangle} 
                    rows={4}
                    colorClass="text-orange-500"
                    placeholder="面试中需要特别警惕的信号..."
                    value={newJob.warning_traits}
                    onChange={(v: string) => setNewJob({...newJob, warning_traits: v})}
                  />

                  <InputField 
                    label="核心能力标签" 
                    icon={Tags} 
                    rows={2}
                    placeholder="例如: React, 沟通能力..."
                    value={newJob.core_tags}
                    onChange={(v: string) => setNewJob({...newJob, core_tags: v})}
                  />
                </div>
              </div>
            </div>

            <div className="px-10 py-8 border-t border-slate-100 flex space-x-6 bg-white sticky bottom-0 z-10">
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-widest text-sm"
              >
                放弃创建
              </button>
              <button 
                onClick={handleCreateJob}
                disabled={!newJob.title}
                className="flex-1 px-8 py-5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest text-sm"
              >
                正式发布岗位
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default JobManagement;
