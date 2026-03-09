export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-xl font-semibold">Update Schedule</h1>
      <p className="mt-2 text-sm text-gray-500">
        ［バッチ運用］同期は Cron で実行されます。設定は .env を参照してください。
      </p>
    </main>
  );
}
