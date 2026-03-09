/**
 * AiNA MyPage フォームログイン（詳細設計 3.1）。
 * ログインページが Next.js 等で JavaScript 描画のため、Playwright でヘッドレスブラウザから Cookie を取得する。
 */
import type { Page, BrowserContext } from "playwright";
import { getEnvForFetch } from "@/lib/env";

export type LoginResult = { cookieHeader: string };

/**
 * ログイン成功後に同じセッションでコールバックを実行する。
 * F01 で compass / live-course を開いて HTML 取得するために使用。
 */
export async function runWithAinaSession<T>(
  fn: (page: Page, context: BrowserContext) => Promise<T>
): Promise<T> {
  const env = getEnvForFetch();
  const loginUrl = env.AINA_LOGIN_URL;
  const id = env.AINA_LOGIN_ID;
  const password = env.AINA_LOGIN_PASSWORD;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "ja-JP",
    });
    const page = await context.newPage();

    await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 20000 });

    // パスワード入力が表示されるまで待つ（フォームが JS で描画される）
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });

    // メール/ID 用: type=email または type=text の最初の入力（パスワード以外）
    const idInput = page.locator(
      'form input[type="email"], form input[type="text"]'
    ).first();
    await idInput.fill(id);

    await page.fill('input[type="password"]', password);

    // 送信ボタン: type=submit を優先、なければ「ログイン」を含むボタン
    const submitByType = page.locator(
      'form button[type="submit"], form input[type="submit"], button[type="submit"], input[type="submit"]'
    ).first();
    try {
      await submitByType.click({ timeout: 5000 });
    } catch {
      await page.getByRole("button", { name: /ログイン/ }).first().click();
    }

    // ナビゲーション or 画面更新を待つ（ログイン後はリダイレクト or SPA で描画切り替え）
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // SPA では URL が変わらないことがあるため、「ログアウト」表示 or URL 変化を最大 10 秒待つ
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let success = false;
    for (let i = 0; i < 10; i++) {
      await delay(1000);
      const currentUrl = page.url();
      const body = await page.textContent("body").then((t) => t ?? "");
      const hasLogout = body.includes("ログアウト");
      const urlLeftLogin =
        currentUrl !== loginUrl && !currentUrl.startsWith(loginUrl + "?");
      if (hasLogout || urlLeftLogin) {
        success = true;
        break;
      }
    }

    if (!success) {
      const currentUrl = page.url();
      const body = await page.textContent("body").then((t) => t ?? "");
      throw new Error(
        `[F01] Login failed: still on login page after submit. url=${currentUrl} hasLogout=${body.includes("ログアウト")}`
      );
    }

    return await fn(page, context);
  } finally {
    await browser.close();
  }
}

/**
 * ログイン後に Cookie のみ取得する（従来の getAinaSession）。
 */
export async function getAinaSession(): Promise<LoginResult> {
  return runWithAinaSession(async (_page, context) => {
    const cookies = await context.cookies();
    const cookieHeader = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (!cookieHeader) {
      throw new Error("[F01] Login succeeded but no cookies were set");
    }
    return { cookieHeader };
  });
}
