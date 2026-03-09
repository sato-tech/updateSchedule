import { NextResponse } from "next/server";
import { runSyncJob } from "@/jobs/run-sync-job";

/**
 * Vercel Cron 等から呼ばれる同期ジョブのエントリポイント。
 * F01 → F02 → F03 の同期ジョブを実行する。
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runSyncJob();
  if (result.ok) {
    return NextResponse.json({ ok: true, message: result.message });
  }
  return NextResponse.json(
    { ok: false, error: result.error, phase: result.phase },
    { status: 500 }
  );
}
