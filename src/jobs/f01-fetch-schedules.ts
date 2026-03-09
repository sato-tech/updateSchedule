/**
 * F01: 掲載スケジュール取得（詳細設計 3）。
 * ログイン後、同じ Playwright セッションで compass / live-course を開き、描画済み HTML をパースする。
 */
import type { ScheduleEvent } from "@/lib/types/schedule";
import { runWithAinaSession } from "@/lib/aina/login";
import { getEnvForFetch } from "@/lib/env";
import { parseCompass } from "@/jobs/parsers/parse-compass";
import { parseLiveCourse } from "@/jobs/parsers/parse-live-course";

export type FetchSchedulesResult =
  | { ok: true; events: ScheduleEvent[] }
  | { ok: false; error: string };

/**
 * ログインし、compass / live-course を開いてイベント一覧を取得する。
 * 両ページは JS 描画のため Playwright で描画後に HTML を取得してパースする。
 */
export async function fetchSchedules(): Promise<FetchSchedulesResult> {
  try {
    const env = getEnvForFetch();

    const { compassHtml, liveCourseHtml } = await runWithAinaSession(
      async (page, _context) => {
        await page.goto(env.AINA_SCHEDULE_URL_COMPASS, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        const compassHtml = await page.content();

        await page.goto(env.AINA_SCHEDULE_URL_LIVE_COURSE, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        const liveCourseHtml = await page.content();

        return { compassHtml, liveCourseHtml };
      }
    );

    const compassEvents = (await parseCompass(compassHtml)).map((e) => ({
      ...e,
      source: "compass" as const,
    }));
    const liveCourseEvents = (await parseLiveCourse(liveCourseHtml)).map((e) => ({
      ...e,
      source: "live-course" as const,
    }));

    const events: ScheduleEvent[] = [...compassEvents, ...liveCourseEvents];

    return { ok: true, events };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[F01] fetchSchedules error:", message);
    return { ok: false, error: message };
  }
}
