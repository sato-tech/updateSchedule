/**
 * compass ページの HTML をパースし、ScheduleEvent[] に変換（詳細設計 2.1）。
 * cheerio を使わず正規表現で抽出（Next ビルド時の File 未定義回避）。
 */
import type { ScheduleEvent } from "@/lib/types/schedule";

/** タグを除去してテキストのみ取得 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(\d{4})[年/](\d{1,2})[月/](\d{1,2})[日]?\s*(\d{1,2})?:?(\d{2})?/);
  if (m) {
    const [, y, mon, d, h, min] = m;
    const month = mon!.padStart(2, "0");
    const day = d!.padStart(2, "0");
    const hour = (h ?? "0").padStart(2, "0");
    const minute = (min ?? "0").padStart(2, "0");
    return `${y}-${month}-${day}T${hour}:${minute}:00+09:00`;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function parseCompass(html: string): Promise<ScheduleEvent[]> {
  const events: ScheduleEvent[] = [];
  const seen = new Set<string>();

  // time[datetime] を探し、その前後のブロックからタイトル・リンクを取得
  const timeRegex = /<time[^>]*\bdatetime\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = timeRegex.exec(html)) !== null) {
    const startAt = m[1]!.trim();
    const pos = m.index;
    const blockStart = Math.max(0, html.lastIndexOf("<tr", pos), html.lastIndexOf("<li", pos), html.lastIndexOf("<div", pos));
    const blockEnd = html.indexOf("</tr>", pos) !== -1 ? html.indexOf("</tr>", pos) + 5
      : html.indexOf("</li>", pos) !== -1 ? html.indexOf("</li>", pos) + 5
      : html.indexOf("</div>", pos) !== -1 ? html.indexOf("</div>", pos) + 6
      : Math.min(html.length, pos + 500);
    const block = html.slice(blockStart, blockEnd);
    const linkMatch = block.match(/<a\s+[^>]*href\s*=\s*["']([^"']+)["']/i);
    const url = linkMatch?.[1]?.trim();
    const text = stripHtml(block);
    const title = text.slice(0, 120).trim() || `イベント${i + 1}`;
    const sourceId = url ? `compass-${url}` : `compass-${i}-${startAt}`;
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);
    events.push({
      sourceId,
      title,
      startAt,
      url: url?.startsWith("http") ? url : undefined,
      source: "compass",
    });
    i++;
  }

  if (events.length > 0) return events;

  // table tbody tr を簡易に行ごとに
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  while ((m = trRegex.exec(html)) !== null) {
    const row = m[1]!;
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cells || cells.length < 2) continue;
    const title = stripHtml(cells[0]!).slice(0, 120).trim();
    const dateText = stripHtml(cells[1]!);
    const startAt = normalizeDate(dateText) ?? /(\d{4}-\d{2}-\d{2}T[\d:+-]+)/.exec(row)?.[1];
    if (!title || !startAt) continue;
    const linkMatch = row.match(/href\s*=\s*["']([^"']+)["']/i);
    const url = linkMatch?.[1]?.trim();
    const sourceId = url ? `compass-${url}` : `compass-${i}-${title}-${startAt}`;
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);
    events.push({
      sourceId,
      title,
      startAt,
      url: url?.startsWith("http") ? url : undefined,
      source: "compass",
    });
    i++;
  }

  return events;
}
