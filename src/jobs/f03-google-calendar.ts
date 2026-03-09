/**
 * F03: Google カレンダー反映（詳細設計 5）。
 * 差分に従い Calendar API で追加・更新・削除し、前回取得結果を保存する。
 * 認証・API 実装は別途追加する。
 */
import type { DiffResult, ScheduleEvent, PreviousFetchResult } from "@/lib/types/schedule";
import type { StateStore } from "@/lib/store/state-store";

export type ApplyToCalendarResult =
  | { ok: true; newEventIdMap: Record<string, string> }
  | { ok: false; error: string };

/**
 * toAdd / toUpdate / toDelete を Google Calendar API で反映し、
 * 今回の取得結果と eventId マッピングをストアに保存する。
 * 現時点ではプレースホルダ（マッピングは空のまま保存）。
 */
export async function applyToCalendar(
  diff: DiffResult,
  currentEvents: ScheduleEvent[],
  previous: PreviousFetchResult | null,
  store: StateStore
): Promise<ApplyToCalendarResult> {
  // TODO: Google API 認証 → toAdd で events.insert → toUpdate で events.update → toDelete で events.delete
  // TODO: 返却 eventId を sourceId と対応付けて newEventIdMap に反映
  console.log("[F03] applyToCalendar placeholder - no API calls yet");

  const existingMap = previous?.googleEventIdMap ?? {};
  const newEventIdMap = { ...existingMap };
  // プレースホルダ: 新規追加分の ID は未取得のため、ここでは維持しない（実装時に挿入結果でマージする）

  const next: PreviousFetchResult = {
    fetchedAt: new Date().toISOString(),
    events: currentEvents,
    googleEventIdMap: newEventIdMap,
  };
  await store.write(next);
  return { ok: true, newEventIdMap };
}
