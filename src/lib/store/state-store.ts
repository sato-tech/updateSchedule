/**
 * 前回取得結果のストア（詳細設計 2.2）。
 * 保存形式: JSON ファイル。読み書きインターフェースを抽象化し、将来 DB に差し替え可能にする。
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { PreviousFetchResult } from "@/lib/types/schedule";

export interface StateStore {
  read(): Promise<PreviousFetchResult | null>;
  write(data: PreviousFetchResult): Promise<void>;
}

/**
 * JSON ファイルで前回取得結果を永続化するストア。
 * ファイル不存在は初回扱い（null を返す）。JSON 破損時は初回扱いで続行するため、read は null を返す。
 */
export function createFileStateStore(filePath: string): StateStore {
  return {
    async read(): Promise<PreviousFetchResult | null> {
      try {
        const raw = await readFile(filePath, "utf-8");
        const data = JSON.parse(raw) as PreviousFetchResult;
        if (!data || typeof data.fetchedAt !== "string" || !Array.isArray(data.events)) {
          console.warn("[state-store] Invalid state file format, treating as first run");
          return null;
        }
        return data;
      } catch (err) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr?.code === "ENOENT") return null;
        console.warn("[state-store] Failed to read state file, treating as first run:", err);
        return null;
      }
    },

    async write(data: PreviousFetchResult): Promise<void> {
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    },
  };
}
