
export type Location = '北京' | '青岛' | '线上兼职';

export type CandidateStatus = '新申请' | '一轮面试' | '二轮面试' | '三轮面试' | '已入职' | '已拒绝';

export interface Persona {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  knowledge: string;
  skills_detail: string;
  literacy: string;
  experience: string;
  warning_traits: string;
  core_tags: string;
  requirements: string[];
  skills: string[];
  aiSuggestions?: string;
}

export interface Job {
  id: string;
  title: string;
  location: Location;
  salary: string;
  personaId: string;
  createdAt: string;
  status: '在招' | '已结束';
}

export interface Interview {
  id: string;
  round: 1 | 2 | 3;
  scheduledAt: string;
  status?: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  recordingUrl?: string;
  aiSummary?: string;
  score?: number;
  questions?: string[];
  evaluation?: string;
}

export interface BasicInfo {
  name: string;
  gender: string;
  age: string;
  school?: string;      // 最高学历院校
  major?: string;       // 专业
  education?: string;   // 学历
  graduationTime: string;
  workExperience: string;
  expectedSalary: string;
  expectedCity: string;
  jobIntent: string;
  maritalStatus: string;
  childAge: string;
  address: string;
  willingness: string;
  phone?: string;       // 新增：电话
  wechat?: string;      // 新增：微信
  email?: string;       // 新增：邮箱
}

export interface Candidate {
  id: string;
  name: string;
  jobId: string;
  resumeUrl: string;
  fullResumeText?: string;
  basicInfo?: BasicInfo; // 新增结构化基础信息
  status: CandidateStatus;
  appliedAt: string;
  interviews: Interview[];
}

export interface DashboardStats {
  openJobs: number;
  weeklyResumes: number;
  newCandidates: number;
  firstRoundInterviews: number;
  secondRoundInterviews: number;
  thirdRoundInterviews: number;
  hiredCount: number;
}
