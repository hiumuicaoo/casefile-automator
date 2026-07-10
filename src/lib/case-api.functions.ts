import { createServerFn } from "@tanstack/react-start";
import type { CaseInput, CaseRow } from "./types";

// Chỉ khai báo type; import pg thật sự nằm trong handler để không lộ ra client bundle.
type SqlRow = Record<string, unknown>;

function rowToCase(r: SqlRow): CaseRow {
  return {
    id: r.id as string,
    linh_vuc: r.linh_vuc as CaseRow["linh_vuc"],
    quyet_dinh_trung_cau: r.quyet_dinh_trung_cau as string,
    co_quan_trung_cau: r.co_quan_trung_cau as string,
    co_quan_trung_cau_khac: (r.co_quan_trung_cau_khac as string) ?? undefined,
    vu_so_x: r.vu_so_x as number,
    vu_so_yy: r.vu_so_yy as string,
    vu_so_full: r.vu_so_full as string,
    ngay_nhan: (r.ngay_nhan instanceof Date ? r.ngay_nhan.toISOString().slice(0, 10) : String(r.ngay_nhan)),
    ngay_nhan_la_ngay_mo: r.ngay_nhan_la_ngay_mo as boolean,
    trich_yeu: r.trich_yeu as string,
    so_dang_ky_a: r.so_dang_ky_a as number,
    so_dang_ky_full: r.so_dang_ky_full as string,
    quyet_dinh_lap_so: r.quyet_dinh_lap_so as number,
    ngay_bat_dau: (r.ngay_bat_dau instanceof Date ? r.ngay_bat_dau.toISOString().slice(0, 10) : String(r.ngay_bat_dau)),
    ngay_bat_dau_la_ngay_mo: r.ngay_bat_dau_la_ngay_mo as boolean,
    ngay_ket_thuc: (r.ngay_ket_thuc instanceof Date ? r.ngay_ket_thuc.toISOString().slice(0, 10) : String(r.ngay_ket_thuc)),
    giam_dinh_vien: r.giam_dinh_vien as CaseRow["giam_dinh_vien"],
    tro_ly: r.tro_ly as CaseRow["tro_ly"],
    cap_bac_lanh_dao: r.cap_bac_lanh_dao as string,
    ho_ten_lanh_dao: r.ho_ten_lanh_dao as string,
    chuc_vu_lanh_dao: r.chuc_vu_lanh_dao as string,
    folder_path: (r.folder_path as string) ?? null,
    tinh_trang_giao: r.tinh_trang_giao as CaseRow["tinh_trang_giao"],
    so_luu: (r.so_luu as string) ?? null,
    scan: r.scan as CaseRow["scan"],
    nhap_phan_mem: r.nhap_phan_mem as CaseRow["nhap_phan_mem"],
    so_hoa: r.so_hoa as CaseRow["so_hoa"],
    nop_luu: r.nop_luu as CaseRow["nop_luu"],
    created_at: (r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)),
    updated_at: (r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at)),
  };
}

export const listCasesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getPool } = await import("./db.server");
  const { rows } = await getPool().query("SELECT * FROM public.cases ORDER BY created_at DESC");
  return rows.map(rowToCase);
});

export const insertCaseFn = createServerFn({ method: "POST" })
  .inputValidator((data: { input: CaseInput; folderPath: string | null }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const i = data.input;
    const { rows } = await getPool().query(
      `INSERT INTO public.cases (
        linh_vuc, quyet_dinh_trung_cau, co_quan_trung_cau, co_quan_trung_cau_khac,
        vu_so_x, vu_so_yy, vu_so_full, ngay_nhan, ngay_nhan_la_ngay_mo,
        trich_yeu, so_dang_ky_a, so_dang_ky_full, quyet_dinh_lap_so,
        ngay_bat_dau, ngay_bat_dau_la_ngay_mo, ngay_ket_thuc,
        giam_dinh_vien, tro_ly, cap_bac_lanh_dao, ho_ten_lanh_dao, chuc_vu_lanh_dao,
        folder_path
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb,$19,$20,$21,$22
      ) RETURNING *`,
      [
        i.linh_vuc, i.quyet_dinh_trung_cau, i.co_quan_trung_cau, i.co_quan_trung_cau_khac ?? null,
        i.vu_so_x, i.vu_so_yy, i.vu_so_full, i.ngay_nhan, i.ngay_nhan_la_ngay_mo,
        i.trich_yeu, i.so_dang_ky_a, i.so_dang_ky_full, i.quyet_dinh_lap_so,
        i.ngay_bat_dau, i.ngay_bat_dau_la_ngay_mo, i.ngay_ket_thuc,
        JSON.stringify(i.giam_dinh_vien), JSON.stringify(i.tro_ly),
        i.cap_bac_lanh_dao, i.ho_ten_lanh_dao, i.chuc_vu_lanh_dao,
        data.folderPath,
      ],
    );
    return rowToCase(rows[0]);
  });

// Chỉ cho phép cập nhật các cột tracking (không cho sửa dữ liệu nhập ban đầu qua đường này).
const ALLOWED_PATCH_COLS = new Set([
  "tinh_trang_giao", "so_luu", "scan", "nhap_phan_mem", "so_hoa", "nop_luu", "folder_path",
]);

export const updateCaseFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; patch: Record<string, unknown> }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const entries = Object.entries(data.patch).filter(([k]) => ALLOWED_PATCH_COLS.has(k));
    if (entries.length === 0) return { ok: true };
    const sets = entries.map(([k], idx) => `${k} = $${idx + 2}`).join(", ");
    const values = entries.map(([, v]) => v);
    await getPool().query(`UPDATE public.cases SET ${sets} WHERE id = $1`, [data.id, ...values]);
    return { ok: true };
  });
