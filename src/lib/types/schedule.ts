/**
 * 詳細設計 2.1〜2.3 に基づく型定義。
 */

/** 取得元の識別（compass / live-course） */
export type ScheduleSource = "compass" | "live-course";

/**
 * 掲載スケジュール 1 件（詳細設計 2.1）
 * live-course のみ location / instructor / notes を使用。
 */
export interface ScheduleEvent {
  sourceId: string;
  title: string;
  startAt: string; // ISO8601
  endAt?: string;
  url?: string;
  isFull?: boolean;
  source: ScheduleSource;
  /** live-course のみ。compass では不要。 */
  location?: string;
  /** live-course のみ。説明文の組み立て用。 */
  instructor?: string;
  /** live-course のみ。説明文の組み立て用。 */
  notes?: string;
}

/**
 * 前回取得結果（詳細設計 2.2）。ストアに保存する形式。
 */
export interface PreviousFetchResult {
  fetchedAt: string; // ISO8601
  events: ScheduleEvent[];
  /** sourceId → Google Calendar eventId */
  googleEventIdMap?: Record<string, string>;
}

/**
 * 差分検知結果（詳細設計 2.3）
 */
export interface ToUpdateItem {
  sourceId: string;
  event: ScheduleEvent;
}

export interface ToDeleteItem {
  sourceId: string;
  googleEventId: string;
}

export interface DiffResult {
  toAdd: ScheduleEvent[];
  toUpdate: ToUpdateItem[];
  toDelete: ToDeleteItem[];
}
