import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { fetchSchedules } from "@/jobs/f01-fetch-schedules";
import type { ScheduleEvent } from "@/lib/types/schedule";

/** 毎回 F01 を実行して最新の取得結果を表示する */
export const dynamic = "force-dynamic";

/** ISO8601 を短い日時表示に */
function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), "MM/dd HH:mm", { locale: ja });
  } catch {
    return iso;
  }
}

export default async function TestAinaPage() {
  const fetchedAt = new Date();
  const result = await fetchSchedules();

  const events = result.ok ? result.events : [];
  const sourceUrls = {
    compass: "https://mypage.ai-na.co.jp/user/compass",
    "live-course": "https://mypage.ai-na.co.jp/user/live-course",
  };

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          AiNA 取得情報の動作確認
        </h1>

        {/* 取得結果サマリ */}
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">取得結果</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <p className="flex items-center gap-2">
              <span className="font-medium text-gray-500">ステータス:</span>
              {result.ok ? (
                <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">
                  取得成功
                </span>
              ) : (
                <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">
                  取得失敗
                </span>
              )}
            </p>
            {!result.ok && (
              <p className="text-red-600">{result.error}</p>
            )}
            <p className="flex items-center gap-2">
              <span className="font-medium text-gray-500">取得件数:</span>
              <span className="font-mono">{events.length} 件</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium text-gray-500">取得日時:</span>
              <span className="font-mono">
                {format(fetchedAt, "yyyy/MM/dd HH:mm:ss", { locale: ja })}
              </span>
            </p>
          </div>
        </section>

        {/* 取得元URL（参考） */}
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">取得元（AiNA MyPage）</h2>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>
              <span className="font-medium text-gray-500">compass:</span>{" "}
              <a
                href={sourceUrls.compass}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {sourceUrls.compass}
              </a>
            </li>
            <li>
              <span className="font-medium text-gray-500">live-course:</span>{" "}
              <a
                href={sourceUrls["live-course"]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {sourceUrls["live-course"]}
              </a>
            </li>
          </ul>
        </section>

        {/* イベント一覧 */}
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">
            取得したスケジュール一覧（{events.length} 件）
          </h2>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              現在は F01 がプレースホルダのため 0 件です。ログイン・パース実装後にここに表示されます。
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <ScheduleTable events={events} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ScheduleTable({ events }: { events: ScheduleEvent[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="px-3 py-2 text-left font-medium text-gray-700">取得元</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">タイトル</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">開始</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">終了</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">場所</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">講師</th>
        </tr>
      </thead>
      <tbody>
        {events.map((ev) => (
          <tr key={ev.sourceId} className="border-b border-gray-100">
            <td className="px-3 py-2 text-gray-600">{ev.source}</td>
            <td className="px-3 py-2">{ev.title}</td>
            <td className="px-3 py-2 font-mono text-gray-600">
              {formatDateTime(ev.startAt)}
            </td>
            <td className="px-3 py-2 font-mono text-gray-600">
              {ev.endAt ? formatDateTime(ev.endAt) : "—"}
            </td>
            <td className="px-3 py-2 text-gray-600">{ev.location ?? "—"}</td>
            <td className="px-3 py-2 text-gray-600">{ev.instructor ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
