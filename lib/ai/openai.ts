import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  // 支持 AiHubMix 配置
  const useAiHubMix = process.env.AIHUBMIX_API_KEY && process.env.USE_AIHUBMIX === "true";

  if (useAiHubMix) {
    if (!process.env.AIHUBMIX_API_KEY) {
      throw new Error("缺少 AIHUBMIX_API_KEY 环境变量。");
    }

    if (!client) {
      client = new OpenAI({
        apiKey: process.env.AIHUBMIX_API_KEY,
        baseURL: "https://aihubmix.com/v1"
      });
    }
  } else {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("缺少 OPENAI_API_KEY 环境变量。请配置 OPENAI_API_KEY 或 AIHUBMIX_API_KEY。");
    }

    if (!client) {
      client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  return client;
}
