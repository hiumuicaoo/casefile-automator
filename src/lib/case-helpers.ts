// Helpers cho Phần 1 - tính toán vụ số, số đăng ký, format ngày.

export const LINH_VUC_OPTIONS = [
  { value: "DUONGVAN", label: "Đường vân" },
  { value: "TAILIEU", label: "Tài liệu" },
  { value: "SUNGDAN", label: "Súng - đạn" },
] as const;

export const CO_QUAN_MAC_DINH = "Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà";

export const CAP_BAC_GDV = ["Trung uý", "Thượng uý", "Đại uý", "Thiếu tá", "Trung tá", "Thượng tá"] as const;
export const CHUC_VU_GDV = ["Cán bộ", "Phó Đội trưởng", "Đội trưởng", "Phó Trưởng phòng"] as const;
export const CAP_BAC_LD = ["Thiếu tá", "Trung tá", "Thượng tá", "Đại tá"] as const;
export const CHUC_VU_LD = ["Trưởng phòng", "Phó Trưởng phòng"] as const;

/**
 * Tính "yy" theo mốc 15/12 hàng năm.
 * 15/12/2025 - 14/12/2026 => yy = 26
 */
export function computeVuSoYy(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth() + 1;
  const d = referenceDate.getDate();
  const belongsToNextYear = m === 12 && d >= 15;
  const yearNum = belongsToNextYear ? y + 1 : y;
  return String(yearNum).slice(-2);
}

export function computeVuSoFull(x: number | string, referenceDate?: Date): string {
  return `${x}/GT-${computeVuSoYy(referenceDate)}`;
}

/** aGTmmyy/511CH — mm và yy lấy từ ngayNhan (YYYY-MM-DD) */
export function computeSoDangKy(a: number | string, ngayNhanIso: string): string {
  if (!ngayNhanIso) return `${a}GT/511CH`;
  const d = new Date(ngayNhanIso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${a}GT${mm}${yy}/511CH`;
}

export function formatDdMmYyyy(iso: string): { dd: string; mm: string; yyyy: string; full: string } {
  if (!iso) return { dd: "", mm: "", yyyy: "", full: "" };
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return { dd, mm, yyyy, full: `${dd}/${mm}/${yyyy}` };
}
