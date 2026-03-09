# タスク管理（todo.md）

ルール: [.cursor/rules/todo.mdc](.cursor/rules/todo.mdc) に従い、機能実装後・随時このファイルを更新する。

## ステータス凡例

- [ ] 未着手
- [x] 完了
- [~] 進行中
- [!] 問題あり

## 優先順位

- 🔴 緊急
- 🟡 重要
- 🟢 通常
- ⚪ 低優先

---

## タスク一覧

### ドキュメント・ルール整備

- [x] 要件定義・設計のたたき台整備（docs/01〜04、SEルール・スキル）
  - docs/01_ヒアリングシート.md、02_要件定義書.md、03_基本設計書.md、04_詳細設計書.md
  - .cursor/rules/se-conduct.mdc、.cursor/skills/requirements-and-design/SKILL.md
  - 優先: 🟢 通常

### プロジェクト基盤（techstack.mdc 準拠）

- [x] 技術スタックに基づくプロジェクト初期化
  - Next.js 14.2.25、React 18、TypeScript、Shadcn/ui、Tailwind、Clerk、Prisma（SQLite）
  - 依存関係: 上記が完了後に機能タスクを追加
  - 優先: 🟡 重要

### ドキュメント具体化

- [x] ヒアリングシートをベースに要件定義書を修正
  - docs/02_要件定義書.md を 01 に合わせて更新済み
  - 優先: 🟢 通常

- [x] 基本設計書を要件定義に合わせて具体化
  - docs/03_基本設計書.md をバッチ型（AiNA MyPage → 前回比較 → Google カレンダー）で更新済み
  - 優先: 🟢 通常

### 動作確認

- [x] 動作確認用テスト画面の追加
  - `/test` にテストページを追加（表示日時・ステータス表示で実行結果を確認可能）
  - 優先: 🟢 通常

- [x] AiNA 取得情報の画面表示
  - `/test/aina` で F01 取得結果を表示（取得結果サマリ・取得元URL・スケジュール一覧）
  - 優先: 🟢 通常

### 今後のタスク（ドキュメント・確認）

- [x] 詳細設計書の具体化
  - docs/04_詳細設計書.md を 03 に合わせて更新済み（F01 取得・F02 差分検知・F03 反映、データ構造、エラー処理）
  - 優先: 🟢 通常

- [ ] 要確認項目の解消（任意・並行可）
  - 間隔の最小・最大・デフォルト、「満員」の表示仕様、利用規約確認
  - 優先: ⚪ 低優先

---

## 実装タスク（docs/02〜04 に基づく）

**前提**: プロジェクト基盤（Next.js / Prisma / 環境変数）が整っていること。本システムは画面を持たないバッチ（同期ジョブ）を想定。

### 基盤・設定

- [x] 環境変数スキーマと .env.example の整備
  - AINA_LOGIN_URL, AINA_LOGIN_ID, AINA_LOGIN_PASSWORD, AINA_SCHEDULE_URL_COMPASS, AINA_SCHEDULE_URL_LIVE_COURSE, GOOGLE_CALENDAR_ID, SYNC_INTERVAL_CRON（または間隔用）、前回取得結果の保存先（例: STATE_FILE_PATH）
  - 未設定時の起動時エラー・ログ（src/lib/env.ts で Zod 検証）
  - 優先: 🟡 重要

### データ構造・型（詳細設計 2.1〜2.3）

- [x] 掲載スケジュール1件の型定義（2.1）
  - sourceId, title, startAt, endAt, url, isFull, source(compass|live-course), location, instructor, notes
  - live-course のみ location / instructor / notes を使用（src/lib/types/schedule.ts）
  - 優先: 🟡 重要

- [x] 前回取得結果の型とストア形式（2.2）
  - fetchedAt, events[], googleEventIdMap（sourceId → eventId）
  - 保存形式: JSON ファイル（createFileStateStore）、読み書きインターフェース（StateStore）で抽象化
  - 優先: 🟡 重要

- [x] 差分検知結果の型定義（2.3）
  - toAdd[], toUpdate[], toDelete[]（src/lib/types/schedule.ts）
  - 優先: 🟢 通常

### F01: 掲載スケジュール取得（JOB-01）

- [x] AiNA MyPage フォームログイン処理
  - GET ログインページ → POST ID/パスワード、Cookie 保持、ログイン成功判定（src/lib/aina/login.ts）
  - 環境変数未設定・ログイン失敗時はエラー終了・ログ
  - 優先: 🟡 重要

- [x] compass / live-course の取得とパース
  - 同一 Playwright セッションでログイン後に 2URL を開き、描画済み HTML を取得（F01）
  - parse-compass.ts: table / .event / time[datetime] 等の複数パターンで抽出（cheerio・動的 import）
  - parse-live-course.ts: 上記に加え location, instructor, notes をクラス名・ラベルから抽出
  - 優先: 🟡 重要

- [x] 2URL 結果のマージと F01 出力
  - 2 配列を 1 つにマージ、各要素に source を付与。F01 はプレースホルダ（空配列返却）で枠のみ実装済み
  - 優先: 🟢 通常

### F02: 差分検知（JOB-02）

- [x] 前回取得結果の読み込み
  - ストアから 2.2 を読み込み。存在しない場合は初回扱い（src/lib/store/state-store.ts）
  - ファイル不存在は初回扱い、JSON 破損時は初回扱いで続行
  - 優先: 🟡 重要

- [x] 追加・変更・削除の検知ロジック
  - 初回: 今回結果を全件 toAdd。2回目以降: sourceId 比較で toAdd / toDelete / toUpdate（src/lib/diff/detect-diff.ts）
  - 優先: 🟡 重要

### F03: Google カレンダー反映（JOB-03）

- [x] Google Calendar API 認証の組み込み
  - サービスアカウント（GOOGLE_APPLICATION_CREDENTIALS で JSON キーファイルのパスを指定）
  - GOOGLE_CALENDAR_ID 未設定・認証失敗時はエラー終了・ログ（src/jobs/f03-google-calendar.ts）
  - 優先: 🟡 重要

- [x] toAdd / toUpdate / toDelete の API 実行
  - 追加: events.insert。live-course は location・description（講師+備考）を設定、compass は省略
  - 更新: googleEventIdMap から eventId を取得して events.update。満員時はタイトルに [満員] を付与
  - 削除: events.delete。返却 eventId を sourceId と対応付けてマッピングに保持
  - 優先: 🟡 重要

- [x] 前回取得結果の上書き保存
  - 今回の取得結果と更新後の googleEventIdMap を 2.2 形式でストアに保存（F03 内で store.write）
  - プレースホルダでは API 未呼び出しのためマッピングは既存のまま。保存失敗時は runSyncJob で throw
  - 優先: 🟡 重要

### 同期ジョブ全体・定期実行（M4）

- [x] 同期ジョブの組み立て
  - F01 → F02 → F03 の順で実行。F01 失敗時は F02・F03 は実行しない。F02 失敗時は F03 は実行しない（src/jobs/run-sync-job.ts）
  - 想定外例外はスタックトレースをログに記録してジョブ終了
  - 優先: 🟡 重要

- [ ] 定期実行の設定（Cron）
  - Vercel Cron または他スケジューラで指定間隔にジョブを起動
  - SYNC_INTERVAL_CRON（または間隔設定）に従う
  - 優先: 🟡 重要

### 任意機能（W1）

- [ ] 間隔の簡単な変更
  - 設定ファイル（例: config.json）または簡易 UI で実行間隔を変更可能にする
  - 優先: ⚪ 低優先

---

## メモ

- 新規タスク追加時は上記形式（チェックボックス、詳細・依存・優先度）で追記する。
- 日次で進捗確認、週次で完了タスク確認・未完了の再評価を行う。
- **実装状況**: F01 はログイン〜同一 Playwright で compass/live-course 取得・cheerio パースまで一通り実装済み。F03 は Google Calendar API 実装済み。実際の HTML 構造に応じてセレクタの調整が必要な場合あり。
