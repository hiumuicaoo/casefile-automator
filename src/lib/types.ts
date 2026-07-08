export type LinhVuc = "DUONGVAN" | "TAILIEU" | "SUNGDAN";

export interface Officer {
  hoTen: string;
  capBac: string;
  chucVu: string;
}

export interface CaseInput {
  linh_vuc: LinhVuc;
  quyet_dinh_trung_cau: string;
  co_quan_trung_cau: string;
  co_quan_trung_cau_khac?: string;
  vu_so_x: number;
  vu_so_yy: string;
  vu_so_full: string;
  ngay_nhan: string; // ISO YYYY-MM-DD
  ngay_nhan_la_ngay_mo: boolean;
  trich_yeu: string;
  so_dang_ky_a: number;
  so_dang_ky_full: string;
  quyet_dinh_lap_so: number;
  ngay_bat_dau: string;
  ngay_bat_dau_la_ngay_mo: boolean;
  ngay_ket_thuc: string;
  giam_dinh_vien: Officer[];
  tro_ly: string[];
  cap_bac_lanh_dao: string;
  ho_ten_lanh_dao: string;
  chuc_vu_lanh_dao: string;
}

export interface CaseRow extends CaseInput {
  id: string;
  folder_path: string | null;
  tinh_trang_giao: "Đang giao" | "Đã giao";
  so_luu: string | null;
  scan: "Rồi" | "Chưa";
  nhap_phan_mem: "Rồi" | "Chưa";
  so_hoa: "Rồi" | "Chưa";
  nop_luu: "Rồi" | "Chưa";
  created_at: string;
  updated_at: string;
}
