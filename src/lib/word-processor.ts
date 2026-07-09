// Xử lý file .docx: đọc từ ArrayBuffer, tìm & thay thế placeholder trong document.xml
// (và header/footer XML), rồi trả về Blob .docx mới. Giữ nguyên định dạng font gốc
// bằng cách chỉ thay thế trong các thẻ <w:t>.
import PizZip from "pizzip";
import type { CaseInput } from "./types";
import { formatDdMmYyyy } from "./case-helpers";

/** Danh sách file mẫu cần copy cho mỗi hồ sơ (theo mô tả yêu cầu). */
export const TEMPLATE_FILES = [
  "1_B3-THONG KE TAI LIEU CO TRONG HO SO.docx",
  "2_B4-DANH SACH NGUOI NGHIEN CUU HO SO.docx",
  "3_B1-QUYET DINH LAP HO SO.docx",
  "4_QUYET DINH PHAN CONG.docx",
  "5_B1-QUYET DINH KET THUC HO SO.docx",
  "6_B15-BAN DINH THOI HAN BAO QUAN HO SO.docx",
  "7_PHIEU CHAM DIEM.docx",
  "X_B11-THONG BAO THONG TIN VE HO SO GDTP.docx",
] as const;

export type TemplateFileName = (typeof TEMPLATE_FILES)[number];

/** Trả về map placeholder -> giá trị áp dụng cho từng file. */
function buildReplacementsForFile(fileName: string, c: CaseInput): Record<string, string> {
  const nhan = formatDdMmYyyy(c.ngay_nhan);
  const batDau = formatDdMmYyyy(c.ngay_bat_dau);
  const ketThuc = formatDdMmYyyy(c.ngay_ket_thuc);

  // Ngày mở hồ sơ: dùng ngày nhận HOẶC ngày bắt đầu tuỳ tick
  const ngayMo = c.ngay_nhan_la_ngay_mo ? nhan : batDau;

  const coQuan =
    c.co_quan_trung_cau === "Khác" ? (c.co_quan_trung_cau_khac ?? "") : c.co_quan_trung_cau;

  const gdv1 = c.giam_dinh_vien[0];
  const gdv2 = c.giam_dinh_vien[1];
  const tl1 = c.tro_ly[0] ?? "";
  const tl2 = c.tro_ly[1] ?? "";

  const yearNhan = nhan.yyyy ? Number(nhan.yyyy) : new Date().getFullYear();

  const base: Record<string, string> = {
    "[Số đăng ký]": c.so_dang_ky_full,
    "[Vụ số]": c.vu_so_full,
    "[Trích yếu]": c.trich_yeu,
    "[Quyết định trưng cầu số]": c.quyet_dinh_trung_cau,
    "[Cơ quan trưng cầu]": coQuan,
    "[Quyết định lập số]": String(c.quyet_dinh_lap_so),
    "[Họ và tên lãnh đạo]": c.ho_ten_lanh_dao,
    "[Cấp bậc lãnh đạo]": c.cap_bac_lanh_dao,
    "[Chức vụ lãnh đạo]": c.chuc_vu_lanh_dao,
    "[Họ và tên GĐV]": gdv1?.hoTen ?? "",
    "[Cấp bậc GĐV]": gdv1?.capBac ?? "",
    "[Chức vụ GĐV]": gdv1?.chucVu ?? "",
    "[Ngày bắt đầu]": batDau.full,
    "[Ngày kết thúc]": ketThuc.full,
  };

  // File 6 dùng [yyyy] và [yyyy+60] theo năm của Ngày nhận
  if (fileName.startsWith("6_")) {
    base["[yyyy+60]"] = String(yearNhan + 60);
    base["[yyyy]"] = String(yearNhan);
  }

  // File 3, X_ và các file dùng [dd] [mm] [yyyy] cho ngày mở hồ sơ
  if (fileName.startsWith("3_") || fileName.startsWith("X_")) {
    base["[dd]"] = ngayMo.dd;
    base["[mm]"] = ngayMo.mm;
    base["[yyyy]"] = ngayMo.yyyy;
  }

  // File 4 dùng [dd] [mm] [yyyy] theo ngày bắt đầu
  if (fileName.startsWith("4_")) {
    base["[dd]"] = batDau.dd;
    base["[mm]"] = batDau.mm;
    base["[yyyy]"] = batDau.yyyy;
    // File 4: [Vụ số] chỉ lấy x
    base["[Vụ số]"] = String(c.vu_so_x);
    // GĐV / Trợ lý theo slot 1, 2
    base["[Cấp bậc GĐV 1]"] = gdv1?.capBac ?? "";
    base["[Họ và tên GĐV 1]"] = gdv1?.hoTen ?? "";
    base["[Cấp bậc GĐV 2]"] = gdv2?.capBac ?? "";
    base["[Họ và tên GĐV 2]"] = gdv2?.hoTen ?? "";
    base["[Trợ lý 1]"] = tl1;
    base["[Trợ lý 2]"] = tl2;
  }

  return base;
}

/** Thoát ký tự cho regex. */
function reEsc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Thoát ký tự đặc biệt XML (& < >) khi ghi giá trị vào XML. */
function xmlEscape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Trong .docx, một placeholder như [Vụ số] có thể bị Word tách ra nhiều <w:r><w:t>.
 * Trước khi replace, gộp các run cùng đoạn văn (đơn giản: xoá khoảng chèn giữa các
 * <w:t>...</w:t><w:t>...</w:t> liền kề trong cùng 1 paragraph) để chuỗi liền mạch.
 * Cách tiếp cận thực dụng: unwrap </w:t>[không phải mở <w:t>]*<w:t[^>]*> khi ở giữa các
 * text runs của cùng một placeholder. Chỉ xử lý các placeholder cụ thể để an toàn.
 */
function normalizePlaceholders(xml: string, placeholders: string[]): string {
  let out = xml;
  for (const ph of placeholders) {
    // Ghép các <w:t>...</w:t> bị tách khiến chuỗi placeholder không tìm thấy.
    // Tạo regex khớp chuỗi placeholder với các dấu ngắt </w:t>...</w:t> xen giữa từng ký tự.
    const chars = [...ph].map(reEsc);
    // Giữa mỗi ký tự cho phép tối đa 1 lần chuyển run: </w:t></w:r><w:r ...><w:rPr>...</w:rPr><w:t ...>
    // Giới hạn chặt để KHÔNG nuốt qua các paragraph/table/cell khác.
    const runBreak =
      `(?:</w:t></w:r><w:r\\b(?:(?!</w:r>|<w:p\\b|<w:tbl\\b|</w:tbl>|<w:tr\\b|</w:tr>|<w:tc\\b|</w:tc>)[\\s\\S]){0,400}<w:t[^>]*>)?`;
    const pattern = chars
      .map((ch, i) => (i === 0 ? ch : `${runBreak}${ch}`))
      .join("");
    const re = new RegExp(pattern, "g");
    out = out.replace(re, ph);

  }
  return out;
}

/**
 * Thay thế "KT. TRƯỞNG PHÒNG\nPHÓ TRƯỞNG PHÒNG" thành "TRƯỞNG PHÒNG"
 * khi chức vụ lãnh đạo là "Trưởng phòng". Cụm này thường nằm trong bảng/paragraph
 * riêng, có thể có <w:br/> hoặc 2 paragraphs. Xử lý cả 2 dạng.
 */
function handleTruongPhong(xml: string, chucVu: string): string {
  if (chucVu !== "Trưởng phòng") return xml;
  // Bỏ dòng "KT. TRƯỞNG PHÒNG" và giữ "TRƯỞNG PHÒNG"
  // Trường hợp cùng 1 paragraph, phân cách bởi <w:br/>
  let out = xml.replace(
    /(<w:t[^>]*>)([^<]*?)KT\.\s*TRƯỞNG PHÒNG([^<]*?)(<\/w:t>)([\s\S]*?)(<w:t[^>]*>)([^<]*?)PHÓ TRƯỞNG PHÒNG([^<]*?)(<\/w:t>)/g,
    (_m, a, b, c, d, mid, e, f, g, h) => {
      // Xoá "KT. TRƯỞNG PHÒNG" ở run trước, đổi "PHÓ TRƯỞNG PHÒNG" -> "TRƯỞNG PHÒNG"
      return `${a}${b}${c}${d}${mid}${e}${f}TRƯỞNG PHÒNG${g}${h}`;
    },
  );
  // Trường hợp cùng 1 <w:t>: "KT. TRƯỞNG PHÒNG<w:br/>PHÓ TRƯỞNG PHÒNG"
  out = out.replace(
    /KT\.\s*TRƯỞNG PHÒNG\s*(<w:br\/>|<w:br \/>|\n)\s*PHÓ TRƯỞNG PHÒNG/g,
    "TRƯỞNG PHÒNG",
  );
  return out;
}

/** Xoá dòng còn placeholder GĐV 2 / Trợ lý 2 chưa dùng trong file 4. */
function stripUnusedSlots(xml: string, c: CaseInput): string {
  let out = xml;
  const hasGdv2 = !!c.giam_dinh_vien[1];
  const hasTl2 = !!c.tro_ly[1];
  if (!hasGdv2) {
    // Xoá cả paragraph chứa "[Cấp bậc GĐV 2]" hoặc "[Họ và tên GĐV 2]"
    out = out.replace(
      /<w:p[^>]*>[\s\S]*?\[(?:Cấp bậc GĐV 2|Họ và tên GĐV 2)\][\s\S]*?<\/w:p>/g,
      "",
    );
  }
  if (!hasTl2) {
    out = out.replace(/<w:p[^>]*>[\s\S]*?\[Trợ lý 2\][\s\S]*?<\/w:p>/g, "");
  }
  return out;
}

/** Xử lý 1 file docx đầu vào (ArrayBuffer) và trả về Uint8Array đã thay thế. */
export function processDocx(fileName: string, buffer: ArrayBuffer, c: CaseInput): Uint8Array {
  const zip = new PizZip(buffer);
  const targets = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
  ];

  const replacements = buildReplacementsForFile(fileName, c);
  const placeholders = Object.keys(replacements);

  for (const path of targets) {
    const file = zip.file(path);
    if (!file) continue;
    let xml = file.asText();

    // Bước 1: gộp placeholder bị tách
    xml = normalizePlaceholders(xml, placeholders);

    // Bước 2 (chỉ file 4): xoá slot chưa dùng
    if (fileName.startsWith("4_")) {
      xml = stripUnusedSlots(xml, c);
    }

    // Bước 3: thay thế
    for (const [ph, val] of Object.entries(replacements)) {
      xml = xml.split(ph).join(xmlEscape(val));
    }

    // Bước 4: xử lý KT. TRƯỞNG PHÒNG
    xml = handleTruongPhong(xml, c.chuc_vu_lanh_dao);

    zip.file(path, xml);
  }

  return zip.generate({ type: "uint8array" });
}
