/**
 * 同期ジョブ全体（F01 → F02 → F03）。
 * F01 失敗時は F02・F03 は実行しない。F02 失敗時は F03 は実行しない。
 */
import { getEnv } from "@/lib/env";
import { createFileStateStore } from "@/lib/store/state-store";
import { fetchSchedules } from "@/jobs/f01-fetch-schedules";
import { detectDiff } from "@/lib/diff/detect-diff";
import { applyToCalendar } from "@/jobs/f03-google-calendar";

export type SyncJobResult =
  | { ok: true; message: string }
  | { ok: false; error: string; phase: "F01" | "F02" | "F03" | "env" };

export async function runSyncJob(): Promise<SyncJobResult> {
  let env;
  try {
    env = getEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-job] env validation failed:", message);
    return { ok: false, error: message, phase: "env" };
  }

  const store = createFileStateStore(env.STATE_FILE_PATH);

  // F01: 掲載スケジュール取得
  const fetchResult = await fetchSchedules();
  if (!fetchResult.ok) {
    console.error("[sync-job] F01 failed:", fetchResult.error);
    return { ok: false, error: fetchResult.error, phase: "F01" };
  }
  const currentEvents = fetchResult.events;

  // F02: 差分検知
  let previous;
  try {
    previous = await store.read();
  } catch (err) {
    console.error("[sync-job] F02 read state failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      phase: "F02",
    };
  }
  const diff = detectDiff(currentEvents, previous);

  // F03: Google カレンダー反映 + 前回結果保存
  const applyResult = await applyToCalendar(
    diff,
    currentEvents,
    previous,
    store
  );
  if (!applyResult.ok) {
    console.error("[sync-job] F03 failed:", applyResult.error);
    return { ok: false, error: applyResult.error, phase: "F03" };
  }

  return {
    ok: true,
    message: `Sync done. add=${diff.toAdd.length} update=${diff.toUpdate.length} delete=${diff.toDelete.length}`,
  };
}
