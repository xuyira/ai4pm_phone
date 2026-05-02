export type FeatureType = "experience" | "resume" | "delivery" | "interview";
export type ExperienceStatus = "pending_questions" | "completed";
export type ResumeStatus = "completed";

export type RecordItem = {
  id: string;
  type: FeatureType;
  title: string;
  subtitle: string;
  timestamp: string;
  status: ExperienceStatus | ResumeStatus | "coming_soon";
  route: string;
  description: string;
};

export const currentUser = {
  name: "徐怡然",
  studentId: "124032910110",
  email: "124032910110@sjtu.edu.cn",
  headline: "默认单用户模式，AI 结果会在当前设备会话内保留，便于继续查看与导出。"
};

export const features = [
  {
    type: "experience" as const,
    title: "经历深挖",
    desc: "上传简历后，AI 会先生成追问，再结合你的补充沉淀成结构化经历库。",
    href: "/experience/upload",
    tone: "warm-yellow",
    icon: "✦",
    tag: "已开放"
  },
  {
    type: "resume" as const,
    title: "简历优化",
    desc: "上传简历和岗位 JD，生成优化结果，并展示简历表现与岗位匹配评分。",
    href: "/resume/upload",
    tone: "warm-lime",
    icon: "▣",
    tag: "已开放"
  },
  {
    type: "delivery" as const,
    title: "岗位投递",
    desc: "敬请期待：自动整理高匹配岗位，辅助生成投递话术与海投计划。",
    href: "/profile/records/delivery",
    tone: "warm-blue",
    icon: "➜",
    tag: "敬请期待"
  },
  {
    type: "interview" as const,
    title: "模拟面试",
    desc: "敬请期待：围绕目标岗位生成模拟面试题，并提供答题复盘建议。",
    href: "/profile/records/interview",
    tone: "warm-purple",
    icon: "◌",
    tag: "敬请期待"
  }
];

export const records: RecordItem[] = [
  {
    id: "exp-questions-1",
    type: "experience",
    title: "AI 工具产品实习",
    subtitle: "待补充 · 生成了 4 个深挖问题",
    timestamp: "2026.04.28 20:45",
    status: "pending_questions",
    route: "/profile/records/experience/exp-questions-1",
    description: "第一次 AI 分析已完成，可继续补充回答并生成最终经历库。"
  },
  {
    id: "exp-result-1",
    type: "experience",
    title: "校园项目：课程排课助手",
    subtitle: "已完成 · 结构化经历库已生成",
    timestamp: "2026.04.25 22:10",
    status: "completed",
    route: "/profile/records/experience/exp-result-1",
    description: "最终经历库已保存，可继续复制、查看和沉淀项目表达。"
  },
  {
    id: "resume-1",
    type: "resume",
    title: "腾讯产品策划",
    subtitle: "校招/实习 · 优化后总分 84",
    timestamp: "2026.04.29 21:05",
    status: "completed",
    route: "/profile/records/resume/resume-1",
    description: "已完成一次完整优化，结果默认保存到云端。"
  },
  {
    id: "resume-2",
    type: "resume",
    title: "字节跳动增长产品经理",
    subtitle: "社招 · 优化后总分 81",
    timestamp: "2026.04.22 19:15",
    status: "completed",
    route: "/profile/records/resume/resume-2",
    description: "岗位匹配与表达清晰度均有提升。"
  }
];

export const experienceProjects = [
  {
    title: "AI 工具产品实习",
    period: "2024.06 - 2024.09",
    team: "某效率工具团队"
  },
  {
    title: "校园项目：课程排课助手",
    period: "2023.10 - 2024.01",
    team: "校团出行项目"
  },
  {
    title: "自定义补充",
    period: "",
    team: "手动添加"
  }
];

export const experienceQuestions = [
  "这个需求最初为什么被提出来？用户痛点多分布在哪几个环节？",
  "你在这个项目里推动哪项产品动作时，最卡住又最有价值？",
  "功能上线后，你们用什么指标判断它是否有效？"
];

export function getFeatureLabel(type: FeatureType) {
  switch (type) {
    case "experience":
      return "经历深挖";
    case "resume":
      return "简历优化";
    case "delivery":
      return "岗位投递";
    case "interview":
      return "模拟面试";
  }
}
