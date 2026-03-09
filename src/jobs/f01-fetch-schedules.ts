/**
 * F01: 掲載スケジュール取得（詳細設計 3）。
 * AiNA MyPage にログインし、compass / live-course の 2URL から取得・パースする。
 * 実際の HTML 構造が分かり次第、パース処理を実装する。
 */
import type { ScheduleEvent } from "@/lib/types/schedule";

export type FetchSchedulesResult =
  | { ok: true; events: ScheduleEvent[] }
  | { ok: false; error: string };

/**
 * 環境変数で指定された URL にログインし、2URL からイベント一覧を取得する。
 * 現時点ではプレースホルダ（空配列を返す）。ログイン・パースは HTML 仕様確定後に実装。
 */
export async function fetchSchedules(): Promise<FetchSchedulesResult> {
  // TODO: GET ログインページ → POST ID/パスワード → Cookie 保持
  // TODO: compass / live-course を GET → HTML パース → 2.1 の配列に変換 → マージ
  console.log("[F01] fetchSchedules placeholder - returning empty list");
  return { ok: true, events: [] };
}
