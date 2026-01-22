import { Job, Persona, Candidate } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  testConnection: async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('jobs').select('count');

      if (error) {
        console.error('Supabase connection test failed:', error);
        return { success: false, error };
      }

      console.log('Supabase connection test successful');
      return { success: true, data };
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
  },

  fetchAllData: async () => {
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('*');

      if (personasError) throw personasError;

      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('applied_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      const processedPersonas = (personas || []).map((p: any) => ({
        ...p,
        core_tags: Array.isArray(p.core_tags) ? p.core_tags.join(',') : p.core_tags || '',
        requirements: p.requirements || [],
        skills: p.skills || []
      }));

      console.log('Supabase data loaded:', {
        jobs: jobs?.length || 0,
        personas: personas?.length || 0,
        candidates: candidates?.length || 0
      });

      return {
        jobs: jobs || [],
        personas: processedPersonas,
        candidates: candidates || []
      };
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
      throw error;
    }
  },

  createJobAndPersona: async (job: Job, persona: Persona) => {
    try {
      console.log('Creating job and persona:', { job, persona });

      const personaData = {
        id: persona.id,
        title: persona.title,
        description: persona.description,
        responsibilities: persona.responsibilities,
        knowledge: persona.knowledge,
        skills_detail: persona.skills_detail,
        literacy: persona.literacy,
        experience: persona.experience,
        warning_traits: persona.warning_traits,
        core_tags: persona.core_tags,
        requirements: persona.requirements || [],
        skills: persona.skills || [],
        ai_suggestions: persona.aiSuggestions || ''
      };

      const { error: personaError } = await supabase
        .from('personas')
        .insert([personaData]);

      if (personaError) {
        console.error('Persona creation failed:', personaError);
        throw personaError;
      }

      const jobData = {
        id: job.id,
        title: job.title,
        location: job.location,
        salary: job.salary,
        persona_id: job.personaId,
        status: job.status,
        created_at: job.createdAt
      };

      const { error: jobError } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (jobError) {
        console.error('Job creation failed:', jobError);
        throw jobError;
      }

      console.log('Successfully created job and persona');
    } catch (error) {
      console.error('Error creating job/persona:', error);
      throw error;
    }
  },

  updateJob: async (job: Job) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: job.title,
          location: job.location,
          salary: job.salary,
          status: job.status
        })
        .eq('id', job.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  updatePersona: async (persona: Persona) => {
    try {
      const { error } = await supabase
        .from('personas')
        .update({
          title: persona.title,
          description: persona.description,
          responsibilities: persona.responsibilities,
          knowledge: persona.knowledge,
          skills_detail: persona.skills_detail,
          literacy: persona.literacy,
          experience: persona.experience,
          warning_traits: persona.warning_traits,
          core_tags: persona.core_tags,
          requirements: persona.requirements || [],
          skills: persona.skills || [],
          ai_suggestions: persona.aiSuggestions || ''
        })
        .eq('id', persona.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating persona:', error);
      throw error;
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('persona_id')
        .eq('id', jobId)
        .maybeSingle();

      await supabase
        .from('candidates')
        .delete()
        .eq('job_id', jobId);

      await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (jobData?.persona_id) {
        await supabase
          .from('personas')
          .delete()
          .eq('id', jobData.persona_id);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  createCandidate: async (candidate: Candidate) => {
    try {
      const candidateData = {
        id: candidate.id,
        name: candidate.name,
        job_id: candidate.jobId,
        resume_url: candidate.resumeUrl,
        full_resume_text: candidate.fullResumeText || '',
        basic_info: candidate.basicInfo || {},
        status: candidate.status,
        applied_at: candidate.appliedAt,
        interviews: candidate.interviews || []
      };

      const { error } = await supabase
        .from('candidates')
        .insert([candidateData]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  },

  updateCandidate: async (candidate: Candidate) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          name: candidate.name,
          resume_url: candidate.resumeUrl,
          full_resume_text: candidate.fullResumeText || '',
          basic_info: candidate.basicInfo || {},
          status: candidate.status,
          interviews: candidate.interviews || []
        })
        .eq('id', candidate.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  },

  deleteCandidate: async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  }
};

export const loginAnonymously = async () => {
  console.log('Using Supabase (no login required for anonymous access)');
  return null;
};
