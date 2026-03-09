/**
 * 環境変数スキーマ（Zod）。未設定時は起動時エラー・ログ用。
 * 詳細設計・基本設計の設定項目に準拠。
 */
import { z } from "zod";

const envSchema = z.object({
  // AiNA MyPage
  AINA_LOGIN_URL: z.string().url().default("https://mypage.ai-na.co.jp/login"),
  AINA_LOGIN_ID: z.string().min(1, "AINA_LOGIN_ID is required"),
  AINA_LOGIN_PASSWORD: z.string().min(1, "AINA_LOGIN_PASSWORD is required"),
  AINA_SCHEDULE_URL_COMPASS: z
    .string()
    .url()
    .default("https://mypage.ai-na.co.jp/user/compass"),
  AINA_SCHEDULE_URL_LIVE_COURSE: z
    .string()
    .url()
    .default("https://mypage.ai-na.co.jp/user/live-course"),

  // Google Calendar
  GOOGLE_CALENDAR_ID: z.string().min(1, "GOOGLE_CALENDAR_ID is required"),

  // 前回取得結果の保存先（JSON ファイルのパス）
  STATE_FILE_PATH: z.string().default("./data/sync-state.json"),

  // 定期実行（Cron 式または間隔分）。任意
  SYNC_INTERVAL_CRON: z.string().optional(),

  // Vercel Cron 認証用（API 呼び出し時に Bearer で検証）
  CRON_SECRET: z.string().optional(),

  // Prisma（SQLite）
  DATABASE_URL: z.string().default("file:./dev.db"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error("[env] Invalid or missing environment variables:", msg);
    throw new Error(
      `Environment validation failed: ${JSON.stringify(msg, null, 2)}`
    );
  }
  return parsed.data;
}

/** サーバー・ジョブ用。未設定時は throw。 */
let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  cached = loadEnv();
  return cached;
}

/** バッチ・Cron で必須の項目だけ検証する（Google 認証前など、部分利用用） */
export function getEnvForFetch(): Pick<
  Env,
  | "AINA_LOGIN_URL"
  | "AINA_LOGIN_ID"
  | "AINA_LOGIN_PASSWORD"
  | "AINA_SCHEDULE_URL_COMPASS"
  | "AINA_SCHEDULE_URL_LIVE_COURSE"
> {
  const e = getEnv();
  return {
    AINA_LOGIN_URL: e.AINA_LOGIN_URL,
    AINA_LOGIN_ID: e.AINA_LOGIN_ID,
    AINA_LOGIN_PASSWORD: e.AINA_LOGIN_PASSWORD,
    AINA_SCHEDULE_URL_COMPASS: e.AINA_SCHEDULE_URL_COMPASS,
    AINA_SCHEDULE_URL_LIVE_COURSE: e.AINA_SCHEDULE_URL_LIVE_COURSE,
  };
}
