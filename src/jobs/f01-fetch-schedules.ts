/**
 * F01: 掲載スケジュール取得（詳細設計 3）。
 * AiNA MyPage にログインし、compass / live-course の 2URL から取得・パースする。
 */
import type { ScheduleEvent } from "@/lib/types/schedule";
import { getAinaSession } from "@/lib/aina/login";
import { getEnvForFetch } from "@/lib/env";
import { parseCompass } from "@/jobs/parsers/parse-compass";
import { parseLiveCourse } from "@/jobs/parsers/parse-live-course";

export type FetchSchedulesResult =
  | { ok: true; events: ScheduleEvent[] }
  | { ok: false; error: string };

/**
 * 環境変数で指定された URL にログインし、2URL からイベント一覧を取得する。
 * ログイン失敗・GET 失敗・パース失敗時は { ok: false, error } を返す。
 */
export async function fetchSchedules(): Promise<FetchSchedulesResult> {
  try {
    const env = getEnvForFetch();

    const { cookieHeader } = await getAinaSession();

    const [compassRes, liveCourseRes] = await Promise.all([
      fetch(env.AINA_SCHEDULE_URL_COMPASS, {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "UpdateSchedule/1.0 (batch)",
        },
      }),
      fetch(env.AINA_SCHEDULE_URL_LIVE_COURSE, {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "UpdateSchedule/1.0 (batch)",
        },
      }),
    ]);

    if (!compassRes.ok) {
      return {
        ok: false,
        error: `compass GET failed: ${compassRes.status} ${compassRes.statusText}`,
      };
    }
    if (!liveCourseRes.ok) {
      return {
        ok: false,
        error: `live-course GET failed: ${liveCourseRes.status} ${liveCourseRes.statusText}`,
      };
    }

    const compassHtml = await compassRes.text();
    const liveCourseHtml = await liveCourseRes.text();

    const compassEvents = parseCompass(compassHtml).map((e) => ({
      ...e,
      source: "compass" as const,
    }));
    const liveCourseEvents = parseLiveCourse(liveCourseHtml).map((e) => ({
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
