/**
 * compass ページの HTML をパースし、ScheduleEvent[] に変換（詳細設計 2.1）。
 * compass では title, startAt, endAt, sourceId, source を設定。場所・講師・備考は不要。
 *
 * パース仕様: 実際の HTML 構造が分かり次第、セレクタを定義する。
 * 例: イベント一覧のコンテナ .schedule-list、1件 .event、タイトル .title、日時 .date 等。
 */
import type { ScheduleEvent } from "@/lib/types/schedule";

export function parseCompass(html: string): ScheduleEvent[] {
  // TODO: HTML 仕様確定後に実装。cheerio でセレクタを指定し、sourceId / title / startAt / endAt を抽出。
  // 例: const $ = cheerio.load(html); $('.event').each((i, el) => { ... });
  void html;
  return [];
}
