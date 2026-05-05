import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPostgresPool } from "@/lib/postgres";

export const runtime = "nodejs";
export const maxDuration = 30;

const SHARED_RESUME_RECORDS_KEY = "ai4pm:shared-resume-records";
const FALLBACK_RECORDS_FILE = path.join(process.cwd(), ".data", "resume-records.json");
const RECORDS_NAMESPACE = "shared-resume-records";

function buildKvErrorMessage() {
  return "共享记录存储未配置完成，请先在 Vercel 项目中绑定 Redis/KV 环境变量。";
}

function buildPostgresErrorMessage() {
  return "共享记录数据库连接失败，请检查 Neon 的 DATABASE_URL 配置。";
}

function isKvConfiguredError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /missing|required|redis|kv|environment variable|token|url/i.test(message);
}

async function readFallbackRecords() {
  try {
    const raw = await readFile(FALLBACK_RECORDS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/ENOENT/i.test(message)) {
      return [];
    }

    throw error;
  }
}

async function writeFallbackRecords(records: unknown[]) {
  await mkdir(path.dirname(FALLBACK_RECORDS_FILE), { recursive: true });
  await writeFile(FALLBACK_RECORDS_FILE, JSON.stringify(records), "utf8");
}

async function ensureRecordsTable() {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_shared_state (
      namespace TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return pool;
}

async function readDatabaseRecords() {
  const pool = await ensureRecordsTable();
  if (!pool) {
    return null;
  }

  const result = await pool.query<{ payload: unknown }>(
    `SELECT payload FROM app_shared_state WHERE namespace = $1 LIMIT 1`,
    [RECORDS_NAMESPACE]
  );
  const payload = result.rows[0]?.payload;
  return Array.isArray(payload) ? payload : [];
}

async function writeDatabaseRecords(records: unknown[]) {
  const pool = await ensureRecordsTable();
  if (!pool) {
    return false;
  }

  await pool.query(
    `
      INSERT INTO app_shared_state (namespace, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (namespace)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `,
    [RECORDS_NAMESPACE, JSON.stringify(records)]
  );

  return true;
}

export async function GET() {
  try {
    const databaseRecords = await readDatabaseRecords();
    if (databaseRecords !== null) {
      return NextResponse.json({
        ok: true,
        records: databaseRecords,
        storage: "postgres"
      });
    }

    const records = await kv.get<unknown[]>(SHARED_RESUME_RECORDS_KEY);
    return NextResponse.json({
      ok: true,
      records: Array.isArray(records) ? records : [],
      storage: "kv"
    });
  } catch (error) {
    if (isKvConfiguredError(error)) {
      const records = await readFallbackRecords();
      return NextResponse.json({
        ok: true,
        records,
        storage: "file"
      });
    }

    if (process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          detail: error instanceof Error ? buildPostgresErrorMessage() : "读取共享记录失败。"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        detail: error instanceof Error ? buildKvErrorMessage() : "读取共享记录失败。"
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  let records: unknown[] | null = null;

  try {
    const body = (await request.json()) as { records?: unknown };

    if (!Array.isArray(body.records)) {
      return NextResponse.json({ detail: "缺少合法的记录列表。" }, { status: 400 });
    }

    records = body.records;

    const wroteToDatabase = await writeDatabaseRecords(records);
    if (wroteToDatabase) {
      return NextResponse.json({
        ok: true,
        storage: "postgres"
      });
    }

    await kv.set(SHARED_RESUME_RECORDS_KEY, records);

    return NextResponse.json({
      ok: true,
      storage: "kv"
    });
  } catch (error) {
    if (isKvConfiguredError(error) && records) {
      await writeFallbackRecords(records);
      return NextResponse.json({
        ok: true,
        fallback: true,
        storage: "file"
      });
    }

    if (process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          detail: error instanceof Error ? buildPostgresErrorMessage() : "保存共享记录失败。"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        detail: error instanceof Error ? buildKvErrorMessage() : "保存共享记录失败。"
      },
      { status: 500 }
    );
  }
}
