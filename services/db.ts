
import { Job, Persona, Candidate } from '../types';
import cloudbase from '@cloudbase/js-sdk';

// --- CloudBase Configuration ---
let app: any;
let dbInstance: any;
let authInstance: any;

// 读取环境变量
const CLOUDBASE_ENV_ID = (import.meta as any).env.VITE_CLOUDBASE_ENV_ID;
const CLOUDBASE_REGION = (import.meta as any).env.VITE_CLOUDBASE_REGION;
const CLOUDBASE_ACCESS_KEY = (import.meta as any).env.VITE_CLOUDBASE_ACCESS_KEY;

try {
  app = (cloudbase as any).init({
    env: CLOUDBASE_ENV_ID,
    region: CLOUDBASE_REGION,
    accessKey: CLOUDBASE_ACCESS_KEY,
  });

  // 获取 auth 实例并进行匿名登录
  authInstance = app.auth({
    persistence: 'local' // 本地持久化登录状态
  });

  // 检查是否已登录，未登录则进行匿名登录
  const loginState = await authInstance.getLoginState();
  console.log('CloudBase login state:', loginState);

  if (loginState) {
    console.log('Already logged in');
  } else {
    console.log('Performing anonymous login...');
    const authResult = await authInstance.anonymousAuthProvider().signIn();
    console.log('CloudBase anonymous login success:', authResult);
  }

  dbInstance = app.database();

  console.log('CloudBase initialized successfully');
  console.log('CloudBase env:', CLOUDBASE_ENV_ID);
  console.log('CloudBase db instance:', dbInstance);
} catch (error) {
  console.error('CloudBase initialization failed:', error);
  throw error;
}

// Collection References
const JOBS_COL = "jobs";
const PERSONAS_COL = "personas";
const CANDIDATES_COL = "candidates";

// 匿名登录函数
export const loginAnonymously = async () => {
  try {
    if (!authInstance) {
      console.warn('Auth instance not initialized');
      return null;
    }

    // 检查是否已登录
    const loginState = await authInstance.getLoginState();
    console.log('Current login state:', loginState);

    if (loginState) {
      console.log('Already logged in');
      return loginState;
    }

    // 进行匿名登录
    console.log('Performing anonymous login...');
    const authResult = await authInstance.anonymousAuthProvider().signIn();
    console.log('Anonymous login success:', authResult);
    return authResult;
  } catch (error) {
    console.error('Anonymous login failed:', error);
    throw error;
  }
};

export const db = {
  // 测试函数：验证 CloudBase 连接
  testConnection: async () => {
    try {
      console.log('Testing CloudBase connection...');

      // 尝试获取 jobs 集合
      const testResult = await dbInstance.collection(JOBS_COL).get();
      console.log('CloudBase connection test result:', testResult);

      return { success: true, data: testResult };
    } catch (error) {
      console.error('CloudBase connection test failed:', error);
      return { success: false, error };
    }
  },

  // 1. 获取所有数据
  fetchAllData: async () => {
    try {
      // Fetch Jobs
      const jobsRes = await dbInstance.collection(JOBS_COL).get();
      const jobs = jobsRes.data || [];

      // Fetch Personas
      const personasRes = await dbInstance.collection(PERSONAS_COL).get();
      const personas = (personasRes.data || []).map((p: Persona) => ({
        ...p,
        // 确保 core_tags 始终是字符串类型
        core_tags: Array.isArray(p.core_tags) ? p.core_tags.join(',') : p.core_tags || ''
      }));

      // Fetch Candidates
      const candidatesRes = await dbInstance.collection(CANDIDATES_COL).get();
      const candidates = candidatesRes.data || [];

      console.log('CloudBase data loaded:', { jobs: jobs.length, personas: personas.length, candidates: candidates.length });
      return { jobs, personas, candidates };
    } catch (error) {
      console.error("Error fetching data from CloudBase:", error);
      throw error;
    }
  },

  // 2. 岗位 & 画像相关
  createJobAndPersona: async (job: Job, persona: Persona) => {
    try {
      console.log('Creating job and persona:', { job, persona });

      // Create Persona Document
      const personaResult = await dbInstance.collection(PERSONAS_COL).doc(persona.id).set(persona);
      console.log('Persona created:', personaResult);

      // 检查是否成功
      if (personaResult.code) {
        throw new Error(`Persona creation failed: ${personaResult.message}`);
      }

      // Create Job Document
      const jobResult = await dbInstance.collection(JOBS_COL).doc(job.id).set(job);
      console.log('Job created:', jobResult);

      // 检查是否成功
      if (jobResult.code) {
        throw new Error(`Job creation failed: ${jobResult.message}`);
      }

      console.log('Successfully created job and persona');
    } catch (error: any) {
      console.error("Error creating job/persona:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  },

  updateJob: async (job: Job) => {
    try {
      await dbInstance.collection(JOBS_COL).doc(job.id).update(job);
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  updatePersona: async (persona: Persona) => {
    try {
      await dbInstance.collection(PERSONAS_COL).doc(persona.id).update(persona);
    } catch (error) {
      console.error("Error updating persona:", error);
      throw error;
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      // 1. Get Job to find Persona ID
      const jobRes = await dbInstance.collection(JOBS_COL).doc(jobId).get();
      const jobData = jobRes.data[0] as Job;
      
      if (jobData) {
        // 2. Delete associated Candidates
        const candidatesRes = await dbInstance.collection(CANDIDATES_COL).where({
          jobId: dbInstance.command.eq(jobId)
        }).get();
        
        const deletePromises = candidatesRes.data.map((candidate: any) =>
          dbInstance.collection(CANDIDATES_COL).doc(candidate.id).remove()
        );
        await Promise.all(deletePromises);

        // 3. Delete Job
        await dbInstance.collection(JOBS_COL).doc(jobId).remove();

        // 4. Delete Persona
        if (jobData.personaId) {
          await dbInstance.collection(PERSONAS_COL).doc(jobData.personaId).remove();
        }
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  },

  // 3. 候选人相关
  createCandidate: async (candidate: Candidate) => {
    try {
      await dbInstance.collection(CANDIDATES_COL).doc(candidate.id).set(candidate);
    } catch (error) {
      console.error("Error creating candidate:", error);
      throw error;
    }
  },

  updateCandidate: async (candidate: Candidate) => {
    try {
      await dbInstance.collection(CANDIDATES_COL).doc(candidate.id).update(candidate);
    } catch (error) {
      console.error("Error updating candidate:", error);
      throw error;
    }
  },

  deleteCandidate: async (candidateId: string) => {
    try {
      await dbInstance.collection(CANDIDATES_COL).doc(candidateId).remove();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      throw error;
    }
  }
};
