/**
 * F03: Google カレンダー反映（詳細設計 5）。
 * 差分に従い Calendar API で追加・更新・削除し、前回取得結果を保存する。
 */
import { google } from "googleapis";
import type {
  DiffResult,
  ScheduleEvent,
  PreviousFetchResult,
} from "@/lib/types/schedule";
import type { StateStore } from "@/lib/store/state-store";
import { getEnv } from "@/lib/env";

export type ApplyToCalendarResult =
  | { ok: true; newEventIdMap: Record<string, string> }
  | { ok: false; error: string };

const TIMEZONE = "Asia/Tokyo";

/** live-course 用の説明文（講師と備考を結合） */
function buildDescription(event: ScheduleEvent): string | undefined {
  if (event.source !== "live-course") return undefined;
  const parts: string[] = [];
  if (event.instructor) parts.push(`講師: ${event.instructor}`);
  if (event.notes) parts.push(`備考: ${event.notes}`);
  return parts.length > 0 ? parts.join("\n") : undefined;
}

/** カレンダー API 用のイベント本文を組み立て（詳細設計 2.1） */
function buildEventResource(event: ScheduleEvent): {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
} {
  const summary = event.isFull ? `[満員] ${event.title}` : event.title;
  const startAt = event.startAt;
  const endAt = event.endAt ?? event.startAt;

  const resource: ReturnType<typeof buildEventResource> = {
    summary,
    start: { dateTime: startAt, timeZone: TIMEZONE },
    end: { dateTime: endAt, timeZone: TIMEZONE },
  };
  if (event.source === "live-course") {
    const desc = buildDescription(event);
    if (desc) resource.description = desc;
    if (event.location) resource.location = event.location;
  }
  return resource;
}

/**
 * toAdd / toUpdate / toDelete を Google Calendar API で反映し、
 * 今回の取得結果と eventId マッピングをストアに保存する。
 */
export async function applyToCalendar(
  diff: DiffResult,
  currentEvents: ScheduleEvent[],
  previous: PreviousFetchResult | null,
  store: StateStore
): Promise<ApplyToCalendarResult> {
  const env = getEnv();
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      ok: false,
      error:
        "GOOGLE_APPLICATION_CREDENTIALS is required. Set the path to your service account JSON key file.",
    };
  }

  let auth;
  try {
    auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[F03] Google Auth init failed:", message);
    return { ok: false, error: `Auth init failed: ${message}` };
  }

  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = env.GOOGLE_CALENDAR_ID;
  const existingMap = previous?.googleEventIdMap ?? {};
  const newEventIdMap: Record<string, string> = { ...existingMap };

  // toAdd: events.insert
  for (const event of diff.toAdd) {
    try {
      const resource = buildEventResource(event);
      const res = await calendar.events.insert({
        calendarId,
        requestBody: resource,
      });
      const id = res.data.id;
      if (id) newEventIdMap[event.sourceId] = id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[F03] events.insert failed for", event.sourceId, message);
      // 設計: 当該件をログに残し、可能な範囲で続行
    }
  }

  // toUpdate: events.update
  for (const { sourceId, event } of diff.toUpdate) {
    const eventId = existingMap[sourceId];
    if (!eventId) {
      console.error("[F03] No eventId for toUpdate", sourceId);
      continue;
    }
    try {
      const resource = buildEventResource(event);
      await calendar.events.update({
        calendarId,
        eventId,
        requestBody: resource,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[F03] events.update failed for", sourceId, message);
    }
  }

  // toDelete: events.delete
  for (const { sourceId, googleEventId } of diff.toDelete) {
    try {
      await calendar.events.delete({
        calendarId,
        eventId: googleEventId,
      });
      delete newEventIdMap[sourceId];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[F03] events.delete failed for", sourceId, message);
    }
  }

  const next: PreviousFetchResult = {
    fetchedAt: new Date().toISOString(),
    events: currentEvents,
    googleEventIdMap: newEventIdMap,
  };
  await store.write(next);
  return { ok: true, newEventIdMap };
}
