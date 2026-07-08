// Cầu nối chạy trong Electron. Khi chạy web preview -> fallback tải ZIP.
import type { CaseInput } from "./types";
import { TEMPLATE_FILES, processDocx } from "./word-processor";

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      readTemplateDir: (
        templateDir: string,
      ) => Promise<Array<{ name: string; data: ArrayBuffer }>>;
      writeCaseFolder: (
        targetDir: string,
        files: Array<{ name: string; data: Uint8Array }>,
      ) => Promise<{ folderPath: string }>;
      getDefaults: () => Promise<{ baseDir: string; templateDir: string }>;
    };
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI?.isElectron;
}

export interface GenerateResult {
  folderPath: string | null;
  zipBlob?: Blob;
}

/**
 * Tạo folder hồ sơ + sinh 8 file Word.
 * - Nếu chạy trong Electron: đọc mẫu từ D:\GIAMDINH\BIEUMAU, ghi ra D:\GIAMDINH\{LINH_VUC}\{VU_SO}
 * - Nếu chạy trong web: tải về 1 file ZIP chứa các file đã xử lý.
 */
export async function generateCaseFiles(input: CaseInput): Promise<GenerateResult> {
  const folderName = input.vu_so_full.replace(/[\\/:*?"<>|]/g, "_");

  if (isElectron() && window.electronAPI) {
    const api = window.electronAPI;
    const { baseDir, templateDir } = await api.getDefaults();
    const templates = await api.readTemplateDir(templateDir);
    const processed = templates
      .filter((t) => (TEMPLATE_FILES as readonly string[]).includes(t.name))
      .map((t) => ({
        name: t.name,
        data: processDocx(t.name, t.data, input),
      }));
    const targetDir = `${baseDir}\\${input.linh_vuc}\\${folderName}`;
    const { folderPath } = await api.writeCaseFolder(targetDir, processed);
    return { folderPath };
  }

  // Web fallback: cần template tải lên bởi user? -> báo lỗi thân thiện
  throw new Error(
    "Chức năng tạo file Word chỉ chạy trong app desktop (.exe). Vui lòng build & chạy Electron trên máy có D:\\GIAMDINH\\BIEUMAU.",
  );
}
