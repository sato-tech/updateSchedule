/**
 * 環境変数スキーマ（Zod）。未設定時は起動時エラー・ログ用。
 * 詳細設計・基本設計の設定項目に準拠。
 */
import path from "path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// プロジェクトルートの .env を明示的に読み込む（Next の読み込みが効かない場合の補完）
const root = process.cwd();
loadDotenv({ path: path.resolve(root, ".env") });
loadDotenv({ path: path.resolve(root, ".env.local") });
// .env に無い場合は .env.example をフォールバック（.env 未作成でも .env.example の値が使える）
if (
  !process.env.AINA_LOGIN_ID ||
  !process.env.AINA_LOGIN_PASSWORD
) {
  loadDotenv({ path: path.resolve(root, ".env.example") });
}

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

/** F01（AiNA 取得）用の環境変数のみ。同期ジョブ全体では getEnv() を使用。 */
export type EnvForFetch = Pick<
  Env,
  | "AINA_LOGIN_URL"
  | "AINA_LOGIN_ID"
  | "AINA_LOGIN_PASSWORD"
  | "AINA_SCHEDULE_URL_COMPASS"
  | "AINA_SCHEDULE_URL_LIVE_COURSE"
>;

const envForFetchSchema = z.object({
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
});

let cachedForFetch: EnvForFetch | null = null;

/**
 * F01・テスト画面用。AiNA 取得に必要な項目だけ検証する。
 * GOOGLE_CALENDAR_ID 等は不要。未設定時は throw。
 */
export function getEnvForFetch(): EnvForFetch {
  if (cachedForFetch) return cachedForFetch;
  const parsed = envForFetchSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error("[env] AiNA fetch: invalid or missing:", msg);
    const hint =
      ".env または .env.example の AINA_LOGIN_ID と AINA_LOGIN_PASSWORD を設定し、開発サーバーを再起動してください。";
    throw new Error(
      `Environment validation failed: ${JSON.stringify(msg)}。${hint}`
    );
  }
  cachedForFetch = parsed.data;
  return cachedForFetch;
}
