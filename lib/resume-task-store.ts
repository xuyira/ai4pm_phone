import postgres from "postgres";
import {
  type DiagnoseRequest,
  type OptimizeRequest,
  parseDiagnoseRequest,
  parseOptimizeRequest,
  runResumeDiagnosis,
  runResumeOptimization
} from "@/lib/resume-ai";

type ResumeTaskStage = "diagnosis" | "optimization";
type ResumeTaskStatus = "queued" | "running" | "completed" | "failed";

type ResumeTaskBase = {
  id: string;
  stage: ResumeTaskStage;
  status: ResumeTaskStatus;
  createdAt: number;
  updatedAt: number;
  error: string | null;
  result: unknown | null;
};

type ResumeDiagnosisTask = ResumeTaskBase & {
  stage: "diagnosis";
  input: DiagnoseRequest;
};

type ResumeOptimizationTask = ResumeTaskBase & {
  stage: "optimization";
  input: ReturnType<typeof parseOptimizeRequest>;
};

export type ResumeServerTask = ResumeDiagnosisTask | ResumeOptimizationTask;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("缺少 DATABASE_URL，无法启用数据库持久任务。");
}

const sql = postgres(connectionString, {
  max: 1,
  prepare: false
});

let initPromise: Promise<void> | null = null;

async function ensureTasksTable() {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`
        create table if not exists resume_tasks (
          id text primary key,
          stage text not null,
          status text not null,
          input jsonb not null,
          result jsonb,
          error text,
          created_at bigint not null,
          updated_at bigint not null
        )
      `;
    })();
  }

  await initPromise;
}

function toTask(row: {
  id: string;
  stage: ResumeTaskStage;
  status: ResumeTaskStatus;
  input: unknown;
  result: unknown;
  error: string | null;
  created_at: number;
  updated_at: number;
}) {
  return {
    id: row.id,
    stage: row.stage,
    status: row.status,
    input: row.input,
    result: row.result,
    error: row.error,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  } as ResumeServerTask;
}

async function insertTask(task: ResumeServerTask) {
  await ensureTasksTable();
  const serializedResult = task.result === null ? null : sql.json((task.result ?? null) as never);
  await sql`
    insert into resume_tasks (
      id, stage, status, input, result, error, created_at, updated_at
    ) values (
      ${task.id},
      ${task.stage},
      ${task.status},
      ${sql.json(task.input)},
      ${serializedResult},
      ${task.error},
      ${task.createdAt},
      ${task.updatedAt}
    )
  `;
}

async function updateTask(taskId: string, patch: Partial<ResumeServerTask>) {
  await ensureTasksTable();
  const current = await getResumeTask(taskId);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...patch,
    updatedAt: Date.now()
  } as ResumeServerTask;
  const serializedResult = next.result === null ? null : sql.json((next.result ?? null) as never);

  await sql`
    update resume_tasks
    set status = ${next.status},
        input = ${sql.json(next.input)},
        result = ${serializedResult},
        error = ${next.error},
        updated_at = ${next.updatedAt}
    where id = ${taskId}
  `;

  return next;
}

export async function runTask(taskId: string) {
  const task = await getResumeTask(taskId);
  if (!task || task.status === "completed" || task.status === "failed") {
    return;
  }

  await updateTask(taskId, { status: "running", error: null });

  try {
    const result =
      task.stage === "diagnosis"
        ? await runResumeDiagnosis(task.input as DiagnoseRequest)
        : await runResumeOptimization(
            task.input as ReturnType<typeof parseOptimizeRequest>
          );

    await updateTask(taskId, {
      status: "completed",
      result,
      error: null
    });
  } catch (error) {
    await updateTask(taskId, {
      status: "failed",
      error: error instanceof Error ? error.message : "任务执行失败。",
      result: null
    });
  }
}

export async function createDiagnosisTask(body: Partial<DiagnoseRequest>) {
  const input = parseDiagnoseRequest(body);
  const task: ResumeDiagnosisTask = {
    id: crypto.randomUUID(),
    stage: "diagnosis",
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    error: null,
    result: null,
    input
  };

  await insertTask(task);
  return task;
}

export async function createOptimizationTask(body: Partial<OptimizeRequest>) {
  const input = parseOptimizeRequest(body);
  const task: ResumeOptimizationTask = {
    id: crypto.randomUUID(),
    stage: "optimization",
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    error: null,
    result: null,
    input
  };

  await insertTask(task);
  return task;
}

export async function getResumeTask(taskId: string) {
  await ensureTasksTable();
  const rows = await sql<{
    id: string;
    stage: ResumeTaskStage;
    status: ResumeTaskStatus;
    input: unknown;
    result: unknown;
    error: string | null;
    created_at: number;
    updated_at: number;
  }[]>`
    select id, stage, status, input, result, error, created_at, updated_at
    from resume_tasks
    where id = ${taskId}
    limit 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return toTask(rows[0]);
}
