# 简历优化 AI 调用流程详解

## 概览
系统调用了 **2 次 AI 模型**，分为两个阶段：
1. **第一阶段：原始简历诊断** (Baseline Review)
2. **第二阶段：简历优化** (Resume Optimization)

两个阶段都使用 `gpt-4-nano` 模型（在 Vercel 上运行）

---

## 第一次 AI 调用：原始简历诊断

### 调用点
文件：`/app/api/resume/optimize/route.ts` (第 71-88 行)

```typescript
const baselineResponse = await client.responses.parse({
  model: "gpt-4-nano",
  instructions: buildBaselineReviewInstructions(),
  input: buildBaselineReviewPrompt({...}),
  text: { format: zodTextFormat(resumeBaselineReviewSchema, ...) }
});
```

### 系统指令 (Instructions)
**目标**：完成"岗位解析 + 原始简历诊断"

**核心任务**：
1. **JD 解析** - 从岗位描述中抽取：
   - 核心职责 (3-8 条)
   - 必要要求 (3-8 条)
   - 优先要求 (0-6 条)
   - 行业信号、产品能力、ATS 关键词、硬性要求

2. **原始简历诊断** - 用 9 维 rubric 给原始简历打分：
   - **简历表现维度 (5 个)**：
     - 结构清晰度 (structureClarity)
     - 信息完整性 (informationCompleteness)
     - 结果量化 (resultQuantification)
     - 产品表达 (productExpression)
     - 重点取舍 (priorityFocus)
   
   - **岗位匹配维度 (4 个)**：
     - 职责命中度 (responsibilityCoverage)
     - 行业相关度 (industryRelevance)
     - ATS 关键词匹配 (atsKeywordMatch)
     - 硬性要求符合度 (hardRequirementFit)

**评分规则**：
- 每个维度给出 score/reason/evidence/improvement
- evidence 必须基于文本证据，不能脑补
- 未明确写出的学历、年限、证书、工具、行业背景不算满足

### 输入提示词 (Input Prompt)
包含以下信息：
- 岗位标题、类型（校招/实习 or 社招）
- 用户补充备注
- **完整的岗位 JD 文本**
- **完整的原始简历文本**
- 项目资料补充（如有）

### 输出结构 (`resumeBaselineReviewSchema`)
```typescript
{
  jobProfile: {
    targetTitle: string,
    jobTypeLabel: "校招/实习" | "社招",
    seniority: string,
    coreResponsibilities: string[],      // 3-8 条
    mustHaveRequirements: string[],      // 3-8 条
    preferredRequirements: string[],     // 0-6 条
    keywords: string[],                  // 6-20 个关键词
    industrySignals: string[],           // 1-8 条
    productCapabilities: string[],       // 4-10 条
    atsTerms: string[],                  // 6-20 个 ATS 术语
    hardRequirements: string[],          // 1-8 条硬性要求
    summary: string
  },
  
  baselineScores: {
    resumePresentation: {
      structureClarity: { score, reason, evidence[], improvement },
      informationCompleteness: { score, reason, evidence[], improvement },
      resultQuantification: { score, reason, evidence[], improvement },
      productExpression: { score, reason, evidence[], improvement },
      priorityFocus: { score, reason, evidence[], improvement },
      averageScore: number
    },
    jobMatch: {
      responsibilityCoverage: { score, reason, evidence[], improvement },
      industryRelevance: { score, reason, evidence[], improvement },
      atsKeywordMatch: { score, reason, evidence[], improvement },
      hardRequirementFit: { score, reason, evidence[], improvement },
      averageScore: number
    },
    overallScore: number (0-100)
  },
  
  baselineFindings: [
    {
      dimension: string,
      issue: string,              // 具体问题
      evidence: string[],         // 证据
      recommendation: string      // 改写建议
    }
    // 4-10 条
  ],
  
  rewritePriorities: [
    {
      priority: "high" | "medium" | "low",
      targetSection: string,      // 针对简历的哪个部分
      instruction: string,        // 具体改写指引
      reason: string             // 为什么要这样改
    }
    // 4-10 条
  ],
  
  keywordGapAnalysis: [
    {
      keyword: string,
      inOriginalResume: boolean,
      inOptimizedResume: boolean,  // 这个目前是 placeholder
      recommendation: string
    }
    // 4-12 项
  ],
  
  summary: string               // 原始简历最主要的问题
}
```

### 返回被使用的部分
该阶段的输出被保存在 `baselineReview` 变量中，后续会被转发给结果页，也会被传入第二次调用。

---

## 第二次 AI 调用：简历优化

### 调用点
文件：`/app/api/resume/optimize/route.ts` (第 92-107 行)

```typescript
const optimizationResponse = await client.responses.parse({
  model: "gpt-4-nano",
  instructions: buildResumeOptimizationInstructions(),
  input: buildResumeOptimizationPrompt({
    jobProfile: baselineReview.jobProfile,
    baselineFindings: baselineReview.baselineFindings,
    rewritePriorities: baselineReview.rewritePriorities,
    keywordGapAnalysis: baselineReview.keywordGapAnalysis,
    originalResume: resumeText,
    notes,
    revisionNotes: body.revisionNotes,  // 用户改写建议（重新生成时）
    projectMaterials: projectMaterialsText
  }),
  text: { format: zodTextFormat(resumeOptimizationOutputSchema, ...) }
});
```

### 系统指令 (Instructions)
**目标**：基于第一阶段诊断，生成优化后简历并打出优化后评分

**核心规则**：
1. 简历是 marketing document，不是 job description
2. **不能捏造**：经历、数字、职责、工具、证书、行业背景、学历、语言、年限
3. 没有数字时不能造数，改成保守但清晰的表述
4. 优先复用 JD 原词（roadmap、user research、A/B test、cross-functional 等）
5. Summary 开放 2-4 条，必须具体
6. 每个 bullet 遵循 **XYZ+S 模式**：
   - 做成什么
   - 如何衡量
   - 怎么做到
   - 具体场景
7. 最少保证"动作 + 场景/对象 + 结果/价值"中两项以上
8. 把"负责/协助/跟进/对接"改为体现以下 PM 思维的表达：
   - 用户问题及需求判断
   - 方案取舍
   - 优先级判断
   - 跨团队推进
   - 上线反馈
   - 数据复盘

**输出评分**：
- 使用与第一阶段完全相同的 9 维 rubric
- 只基于优化后文本证据打分

### 输入提示词 (Input Prompt)
包含以下信息：
- 用户补充备注（如有）
- 用户改写建议 (revisionNotes)
- **第一阶段的 jobProfile**（JSON 格式）
- **第一阶段的 baselineFindings**（JSON 格式）
- **第一阶段的 rewritePriorities**（JSON 格式）
- **第一阶段的 keywordGapAnalysis**（JSON 格式）
- **原始简历文本**
- 项目资料补充（如有）

**这一步形成了上下文的"链"**：第一阶段的诊断结果直接成为第二阶段的输入

### 输出结构 (`resumeOptimizationOutputSchema`)
```typescript
{
  optimizedResume: {
    candidateName: string,
    headline: string,              // 一句话介绍
    contactLines: string[],        // 1-4 行联系方式
    summary: string[],             // 2-4 条总结
    
    experience: [
      {
        title: string,
        subtitle: string,
        bullets: string[1-5]       // 列出优化后的成就
      }
      // 1-5 条经历
    ],
    
    projects: [
      {
        title: string,
        subtitle: string,
        bullets: string[1-5]
      }
      // 0-4 个项目
    ],
    
    education: [
      {
        title: string,
        subtitle: string,
        bullets: string[1-5]
      }
      // 1-3 条教育
    ],
    
    skills: string[],              // 4-20 项技能
    
    additionalSections: [          // 0-3 个补充部分
      {
        title: string,
        subtitle: string,
        bullets: string[1-5]
      }
    ],
    
    highlightedKeywords: string[],  // 6-20 个突出的关键词
    changeLog: string[],            // 4-10 项改写摘要
    riskNotes: string[],            // 1-6 项风险提醒
    plainTextResume: string,        // 纯文本版简历
    markdownResume: string          // Markdown 版简历
  },
  
  afterScores: {
    // 同 baselineScores 的结构
    resumePresentation: { ... },
    jobMatch: { ... },
    overallScore: number
  },
  
  gapAnalysis: {
    strongMatches: string[],        // 2-6 个强匹配点
    reframedMatches: string[],      // 2-6 个重塑后的匹配点
    remainingGaps: string[]         // 1-6 个未覆盖的差距
  },
  
  coverLetterTalkingPoints: string[], // 3-5 个 cover letter 要点
  
  summary: string                   // 优化总结
}
```

### 返回被使用的部分
该阶段的输出被合并成最终的 API 响应

---

## API 最终返回体 (route.ts 第 115-144 行)

```typescript
{
  ok: true,
  result: {
    // 来自第一阶段
    jobProfile: {...},                    // 岗位解析
    baselineFindings: [...],              // 原始诊断问题
    rewritePriorities: [...],             // 改写优先级
    keywordGapAnalysis: [...],            // 关键词差距
    beforeScores: {...},                  // 优化前评分
    
    // 来自第二阶段
    optimizedResumeText: string,          // 纯文本版简历
    optimizedResumeMarkdown: string,      // Markdown 版简历
    optimizedResumeDoc: { ... },          // 结构化简历对象（用于导出 DOCX）
    jobKeywords: [...],                   // 亮点关键词
    gapAnalysis: { ... },                 // 匹配度分析
    coverLetterTalkingPoints: [...],      // Cover letter 要点
    changeLog: [...],                     // 改写摘要
    riskNotes: [...],                     // 风险提醒
    afterScores: { ... },                 // 优化后评分
    overallDelta: number,                 // 总分提升幅度
    summary: string                       // 优化总结
  }
}
```

---

## 结果页显示的内容

### 显示项目列表（按顺序）

1. **标题** - "AI简历优化结果"（居中）

2. **Step 指示条** - 显示"上传简历与 JD" → "AI 处理中" → "结果页"

3. **可展开的信息框**：
   - "上传的简历" - 可点开查看原始简历全文
   - "目标岗位" - 可点开查看岗位详情

4. **评分面板**
   - 优化后总分 (afterScores.overallScore)
   - 简历表现雷达图 (5 维：结构、完整、量化、产品表达、重点取舍)
   - 岗位匹配雷达图 (4 维：职责命中、行业相关、ATS 词匹配、硬要求)
   - 总分提升幅度 (overallDelta)

5. **优化后简历预览**
   - 前 14 行的优化后简历文本预览
   - 命中的前 8 个关键词
   - 导出 DOCX / 导出 PDF 按钮

6. **补充建议并重新生成**
   - 文本框输入改写建议
   - 根据建议重新生成（会再次调用完整的两阶段流程）

7. **改写摘要** (changeLog)
   - 展示 4-10 项改写摘要标签

8. **岗位画像摘要** (jobProfile)
   - 岗位总结文本
   - 前 10 个岗位关键词

9. **原始简历诊断** (baselineFindings)
   - 逐条展示诊断问题
   - 每条包含：维度 / 问题 / 证据 / 建议

10. **改写优先级** (rewritePriorities)
    - 逐条展示改写指标 (High/Medium/Low)
    - 每条包含：优先级 / 针对部分 / 具体指引 / 原因

11. **其他（后续）**
    - 风险提醒 (riskNotes)
    - Cover letter 要点 (coverLetterTalkingPoints)
    - 岗位匹配度分析 (gapAnalysis)
    - 原始 vs 优化后评分对比

---

## 数据流向图

```
用户输入
├── 简历文本 + JD + 岗位信息
│
↓ [API: /resume/optimize]
│
├─→ [AI Call 1: Baseline Review]
│   ├─ 输入：简历 + JD
│   ├─ 输出：jobProfile, baselineScores, baselineFindings, 
│   │         rewritePriorities, keywordGapAnalysis, summary
│   │
│   └─→ [AI Call 2: Resume Optimization]
│       ├─ 输入：第一阶段所有输出 + 原始简历 + JD
│       └─ 输出：optimizedResume, afterScores, gapAnalysis, 
│                 coverLetterTalkingPoints, summary
│
↓ [API Response]
│
└─→ [Result Page] 显示所有计算结果和分析

用户可以：
- 阅读分析
- 导出优化后简历（DOCX）
- 填写改写建议 → [再次触发完整两阶段流程]
```

---

## 关键设计点

1. **两阶段流程** - 诊断与优化分离
   - 第一阶段为第二阶段提供诊断依据
   - 第二阶段在明确诊断基础上进行精准优化

2. **完整的输入传递** - 避免信息丢失
   - 第一阶段所有诊断结果被完整传给第二阶段
   - 第二阶段在改进时保持一致的改写优先级

3. **结构化输出** - 便于展示和导出
   - 简历被拆解成结构化部分（experience/projects/education 等）
   - 易于用于 DOCX 导出或其他格式转换

4. **可重新生成** - 支持迭代
   - 用户可加入改写建议再次生成
   - 原始评分保持不变，便于对比
