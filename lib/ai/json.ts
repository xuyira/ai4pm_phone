export function extractJsonText(raw: string) {
  const trimmed = raw.trim();

  // 1. 直接就是 JSON
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // continue
  }

  // 2. ```json ... ``` 或 ``` ... ```
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  // 3. 从第一个 { 到最后一个 } 截取
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    const candidate = trimmed.slice(objectStart, objectEnd + 1).trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  // 4. 从第一个 [ 到最后一个 ] 截取
  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    const candidate = trimmed.slice(arrayStart, arrayEnd + 1).trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  throw new Error("模型返回的内容中未提取到合法 JSON。");
}
