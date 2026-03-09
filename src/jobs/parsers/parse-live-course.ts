/**
 * live-course ページの HTML をパースし、ScheduleEvent[] に変換（詳細設計 2.1）。
 * live-course では compass 項目に加え、location, instructor, notes をパースする。
 *
 * パース仕様: 実際の HTML 構造が分かり次第、セレクタを定義する。
 * 例: イベント一覧のコンテナ、1件の要素、場所 .location、講師 .instructor、備考 .notes 等。
 */
import type { ScheduleEvent } from "@/lib/types/schedule";

export function parseLiveCourse(html: string): ScheduleEvent[] {
  // TODO: HTML 仕様確定後に実装。cheerio でセレクタを指定し、上記項目を抽出。
  void html;
  return [];
}
