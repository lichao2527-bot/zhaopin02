
import OpenAI from 'openai';

const apiKey = (import.meta as any).env.VITE_API_KEY;
const baseURL = (import.meta as any).env.VITE_GLM_API || 'https://openrouter.ai/api/v1';

const client = new OpenAI({
  baseURL: baseURL,
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // 仅用于开发环境，生产环境请使用后端代理
});

// 使用推荐的文本模型
const MODEL_NAME = "google/gemini-3-flash-preview";

export const refinePersona = async (data: {
  title: string;
  responsibilities: string;
  knowledge: string;
  skills: string;
  literacy: string;
  experience: string;
  warning_traits?: string;
  core_tags?: string;
}) => {
  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system' as const,
        content: '你是一个专业的 HR 专家，负责优化和润色岗位招聘需求。'
      },
      {
        role: 'user' as const,
        content: `请对以下岗位的招聘需求进行"智能润色"和专业化提升。
岗位名称：${data.title}

当前输入内容：
- 核心职责：${data.responsibilities}
- 专业知识：${data.knowledge}
- 专业技能：${data.skills}
- 职业素养：${data.literacy}
- 经验要求：${data.experience}
- 警惕特质：${data.warning_traits || '待补充'}
- 核心能力标签：${data.core_tags || '待补充'}

请在保留原意的基础上，将其转化为更专业、更具吸引力的招聘文案。
必须仅返回一个 JSON 对象，包含以下字段：responsibilities, knowledge, skills, literacy, experience, warning_traits, core_tags。`
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (e) {
    console.error("AI 响应解析失败", e);
    return null;
  }
};

export const parseResumeData = async (options: {
  fileName?: string;
  textContent?: string;
  fileData?: { data: string; mimeType: string };
}) => {
  const { textContent, fileData } = options;

  let content: string;
  if (fileData) {
    content = `请分析上传的图片简历。`;
  } else if (textContent) {
    content = `简历原文内容如下：\n${textContent}`;
  } else {
    throw new Error("必须提供 textContent 或 fileData");
  }

  const systemPrompt = `你是一个专业的简历分析专家。请将提供的简历内容整理为以下标准结构，并提取基础画像信息。

**核心绝不动摇准则：**
1. **绝对原文搬运**：对于"3. 工作/实习经历"、"4. 项目经历"、"6. 自我评价"这三个核心部分，必须**完全照搬**简历中的原始文字描述。
   - **严禁**进行任何缩写、改写、润色、总结或删除。
   - **严禁**擅自使用 STAR 法则重写，除非原文本身就是那样写的。
   - 必须保留原文的所有细节、数据和描述，确保信息 100% 完整。
2. **结构化提取**：仅负责将现有信息分类到指定模块，并识别关键信息填入 basicInfo。

**报告排版结构（Markdown 格式）：**
1. 个人基础信息 (Personal Information)
   - 包含：姓名、联系电话、电子邮箱、所在城市、个人主页（GitHub等）。
   - 严禁提取：身份证号、详细住址、政治面貌。

2. 教育背景
   - 倒序排列。包含学校、专业、学历、时间、GPA/奖学金。

3. 工作/实习经历 (Work Experience)
   - 格式头：公司名称 | 职位名称 | 在职时间
   - 内容：(在此处直接粘贴原文，保留原文的换行、项目符号和所有细节)

4. 项目经历 (Project Experience)
   - 格式头：项目名称 | 角色 | 时间
   - 内容：(在此处直接粘贴原文，保留原文的换行、项目符号和所有细节)

5. 技能与证书 (Skills & Certifications)
   - 专业技能、语言、职业资格。

6. 自我评价 (Summary/Self-Evaluation)
   - 内容：(在此处直接粘贴原文)

请返回 JSON，包含 basicInfo 对象（提取的字段）和 fullContent（按上述顺序排版的 Markdown 报告）。`;

  const userPrompt = `${content}

请确保返回的 JSON 结构如下：
{
  "basicInfo": {
    "name": "",
    "gender": "",
    "age": "",
    "school": "",
    "major": "",
    "education": "",
    "graduationTime": "",
    "workExperience": "",
    "expectedSalary": "",
    "expectedCity": "",
    "jobIntent": "",
    "maritalStatus": "",
    "childAge": "",
    "address": "",
    "willingness": "",
    "phone": "",
    "wechat": "",
    "email": ""
  },
  "fullContent": ""
}`;

  try {
    if (fileData) {
      // 支持多模态输入
      const response = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          {
            role: 'user' as const,
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${fileData.mimeType};base64,${fileData.data}` }
              },
              {
                type: 'text',
                text: userPrompt
              }
            ]
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } else {
      const response = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    }
  } catch (e) {
    console.error("Resume parsing failed:", e);
    return {
      basicInfo: { name: options.fileName || "未知", gender: "", age: "", school: "", major: "", education: "", graduationTime: "", workExperience: "", expectedSalary: "", expectedCity: "", jobIntent: "", maritalStatus: "", childAge: "", address: "", willingness: "", phone: "", wechat: "", email: "" },
      fullContent: textContent || "无法解析简历内容。"
    };
  }
};

export const processInterviewAudio = async (_audioData: { data: string; mimeType: string }, jobTitle: string, round: number) => {
  const prompt = `你是一个资深面试官助手。这是一段应聘 ${jobTitle} 岗位第 ${round} 轮面试的录音。请整理对话摘要和评估结论。`;
  try {
    // 注意：OpenAI Chat API 不支持直接音频输入
    // 这里假设音频数据已经是文本格式，或者需要使用 Whisper API 先转录
    // 如果需要处理实际音频，请使用 OpenAI Whisper API
    // 示例：const transcription = await client.audio.transcriptions.create({ file: audioFile, model: 'whisper-1' });
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'user' as const,
          content: `${prompt}\n\n（注意：当前音频处理功能需要使用 Whisper API 进行转录，这里假设音频已被转换为文本）`
        }
      ]
    });
    return response.choices[0]?.message?.content || "音频解析失败。";
  } catch (e) {
    return "音频解析失败。";
  }
};

export const generateInterviewQuestions = async (
  jobTitle: string,
  persona: string,
  candidateName: string,
  round: number,
  history: string = '',
  resumeText: string = '',
  coreTags: string = '',
  manualLogicCorrection: string = ''
) => {
  let systemInstruction = "";

  // --- 角色定义 ---
  if (round === 1) {
    systemInstruction = `### 角色设定：一轮面试官（资深HR）。核心任务：【基于岗位画像的初筛】。
考察重点：画像匹配度核实、职业素养、风险排查（反驳型人格）、沟通基础。`;
  } else if (round === 2) {
    systemInstruction = `### 角色设定：二轮面试官（业务负责人）。核心任务：【专业能力与业务思维考察】。
考察重点：核心能力深挖、业务/技术思维、场景化落地、现场口述题目。`;
  } else if (round === 3) {
    systemInstruction = `### 角色设定：终面面试官（公司老板）。核心任务：【实操验证与综合匹配度】。
考察重点：实操能力验证（必须包含现场笔试/代码/话术题）、自我复盘、综合匹配。`;
  }

  // --- 人工干预 ---
  let userOverride = "";
  if (manualLogicCorrection) {
    userOverride = `⚠️ **最高优先级指令：人工修正**
面试官已审查并修改了生成逻辑。请**忽略**你之前的自动判断，**完全遵循**以下修正后的思路来生成题目：
"${manualLogicCorrection}"`;
  }

  const prompt = `${systemInstruction}

---
**候选人信息**：${candidateName} (应聘岗位: ${jobTitle})
**岗位人才画像**：${persona}
**核心能力标签**：${coreTags}
**简历内容**：${resumeText ? resumeText.substring(0, 3000) : '暂无'}
**历史面试记录**：${history ? history : '无'}

${userOverride}

---
**【严格输出格式要求】**
请务必将返回内容分为两部分，中间使用 "<<<SPLIT_HERE>>>" 严格分隔。
顺序必须是：先逻辑，后题目。

**Part 1: 生成逻辑溯源 (Logic Analysis)**
简要列出出题依据（如"基于简历XX项目..."、"基于画像XX要求..."）。

<<<SPLIT_HERE>>>

**Part 2: 面试题目 (Questions)**
这里必须列出 5 个具体的面试题及其考察意图。**此部分绝不能为空！**
`;

  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'user' as const,
        content: prompt
      }
    ],
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || "";
};

export const summarizeInterview = async (notes: string) => {
  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'user' as const,
        content: `请总结面试记录：${notes}`
      }
    ],
    temperature: 0.5
  });
  return response.choices[0]?.message?.content || "";
};

export const generatePersonnelAssessment = async (notes: string, round: number) => {
  const prompt = `你是一个资深面试官。请针对第 ${round} 轮面试的记录进行专业人才评估：\n${notes}`;
  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'user' as const,
        content: prompt
      }
    ],
    temperature: 0.6
  });
  return response.choices[0]?.message?.content || "";
};
