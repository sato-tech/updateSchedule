/**
 * F02: 差分検知（詳細設計 4）。
 * 今回取得結果と前回取得結果を比較し、toAdd / toUpdate / toDelete を生成する。
 */
import type {
  ScheduleEvent,
  PreviousFetchResult,
  DiffResult,
  ToUpdateItem,
  ToDeleteItem,
} from "@/lib/types/schedule";

function eventEquals(a: ScheduleEvent, b: ScheduleEvent): boolean {
  return (
    a.title === b.title &&
    a.startAt === b.startAt &&
    (a.endAt ?? "") === (b.endAt ?? "") &&
    (a.isFull ?? false) === (b.isFull ?? false) &&
    (a.location ?? "") === (b.location ?? "") &&
    (a.instructor ?? "") === (b.instructor ?? "") &&
    (a.notes ?? "") === (b.notes ?? "")
  );
}

/**
 * 前回結果が無い場合は今回を全件 toAdd とする。
 * 2回目以降は sourceId で比較し、追加・変更・削除を検知する。
 */
export function detectDiff(
  currentEvents: ScheduleEvent[],
  previous: PreviousFetchResult | null
): DiffResult {
  const toAdd: ScheduleEvent[] = [];
  const toUpdate: ToUpdateItem[] = [];
  const toDelete: ToDeleteItem[] = [];

  if (!previous || previous.events.length === 0) {
    return { toAdd: currentEvents, toUpdate: [], toDelete: [] };
  }

  const prevMap = new Map(previous.events.map((e) => [e.sourceId, e]));
  const currIds = new Set(currentEvents.map((e) => e.sourceId));
  const prevIds = new Set(prevMap.keys());
  const googleEventIdMap = previous.googleEventIdMap ?? {};

  for (const e of currentEvents) {
    const prev = prevMap.get(e.sourceId);
    if (!prev) {
      toAdd.push(e);
      continue;
    }
    if (!eventEquals(e, prev)) {
      toUpdate.push({ sourceId: e.sourceId, event: e });
    }
  }

  for (const sourceId of Array.from(prevIds)) {
    if (!currIds.has(sourceId)) {
      const googleEventId = googleEventIdMap[sourceId];
      if (googleEventId) {
        toDelete.push({ sourceId, googleEventId });
      }
    }
  }

  return { toAdd, toUpdate, toDelete };
}
