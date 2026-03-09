import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function TestPage() {
  const now = new Date();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          動作確認用テスト画面
        </h1>
        <div className="mt-6 space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <span className="font-medium text-gray-500">ステータス:</span>
            <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">
              表示成功
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="font-medium text-gray-500">表示日時:</span>
            <span className="font-mono">
              {format(now, "yyyy/MM/dd HH:mm:ss", { locale: ja })}
            </span>
          </p>
          <p className="mt-4 text-gray-500">
            この画面が表示されていれば、Next.js アプリは正常に動作しています。
          </p>
        </div>
      </div>
    </main>
  );
}
