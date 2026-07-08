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

  // Web fallback: fetch templates từ /BIEUMAU/, xử lý và tải ZIP
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const root = zip.folder(folderName)!;
  for (const name of TEMPLATE_FILES) {
    const url = `/BIEUMAU/${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Không tải được biểu mẫu: ${name} (HTTP ${res.status})`);
    }
    const buf = await res.arrayBuffer();
    const out = processDocx(name, buf, input);
    root.file(name, out);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  // Trigger download
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob);
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { folderPath: null, zipBlob };
}
