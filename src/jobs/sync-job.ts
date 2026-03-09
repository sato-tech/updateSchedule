/**
 * 同期ジョブのエントリポイント（F01 → F02 → F03）。
 * 直接実行: npm run sync
 * または Vercel Cron から /api/cron/sync を呼ぶ。
 */
import { runSyncJob } from "./run-sync-job";

async function main() {
  const result = await runSyncJob();
  if (result.ok) {
    console.log("[sync-job]", result.message);
  } else {
    console.error("[sync-job] failed:", result.phase, result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[sync-job] unexpected error:", err);
  process.exit(1);
});
