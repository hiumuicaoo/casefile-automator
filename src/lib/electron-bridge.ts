// Cầu nối chạy trong Electron. Khi chạy web/preview -> fetch từ server route.
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
      getDefaults: () => Promise<{
        baseDir: string;
        templateDirTruongPhong: string;
        templateDirPhoTruongPhong: string;
      }>;
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

/** Chọn "role" theo chức vụ lãnh đạo ký. */
function pickRole(chucVu: string): "truongphong" | "photruongphong" {
  return chucVu === "Trưởng phòng" ? "truongphong" : "photruongphong";
}

/**
 * Tạo folder hồ sơ + sinh 8 file Word.
 * - Electron: đọc mẫu từ D:\GIAMDINH\BIEUMAU_TRUONGPHONG hoặc BIEUMAU_PHOTRUONGPHONG
 *   (chọn theo chức vụ lãnh đạo ký), ghi ra D:\GIAMDINH\{LINH_VUC}\{VU_SO}.
 * - Web: fetch mẫu từ /api/templates/<role>/<name>, tải về ZIP.
 */
export async function generateCaseFiles(input: CaseInput): Promise<GenerateResult> {
  const folderName = input.vu_so_full.replace(/[\\/:*?"<>|]/g, "_");
  const role = pickRole(input.chuc_vu_lanh_dao);

  if (isElectron() && window.electronAPI) {
    const api = window.electronAPI;
    const defaults = await api.getDefaults();
    const templateDir =
      role === "truongphong"
        ? defaults.templateDirTruongPhong
        : defaults.templateDirPhoTruongPhong;
    const templates = await api.readTemplateDir(templateDir);
    const processed = templates
      .filter((t) => (TEMPLATE_FILES as readonly string[]).includes(t.name))
      .map((t) => ({
        name: t.name,
        data: processDocx(t.name, t.data, input),
      }));
    if (processed.length === 0) {
      throw new Error(`Không tìm thấy biểu mẫu trong: ${templateDir}`);
    }
    const targetDir = `${defaults.baseDir}\\${input.linh_vuc}\\${folderName}`;
    const { folderPath } = await api.writeCaseFolder(targetDir, processed);
    return { folderPath };
  }

  // Web fallback: fetch từ server route (đọc file trên máy chủ)
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const root = zip.folder(folderName)!;
  for (const name of TEMPLATE_FILES) {
    const url = `/api/templates/${role}/${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Không tải được biểu mẫu (${role}): ${name} — HTTP ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    const out = processDocx(name, buf, input);
    root.file(name, out);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob);
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { folderPath: null, zipBlob };
}
