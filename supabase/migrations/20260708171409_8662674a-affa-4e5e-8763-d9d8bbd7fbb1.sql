
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  linh_vuc TEXT NOT NULL CHECK (linh_vuc IN ('DUONGVAN','TAILIEU','SUNGDAN')),
  quyet_dinh_trung_cau TEXT NOT NULL,
  co_quan_trung_cau TEXT NOT NULL,
  co_quan_trung_cau_khac TEXT,
  vu_so_x INTEGER NOT NULL,
  vu_so_yy TEXT NOT NULL,
  vu_so_full TEXT NOT NULL,
  ngay_nhan DATE NOT NULL,
  ngay_nhan_la_ngay_mo BOOLEAN NOT NULL DEFAULT false,
  trich_yeu TEXT NOT NULL,
  so_dang_ky_a INTEGER NOT NULL,
  so_dang_ky_full TEXT NOT NULL,
  quyet_dinh_lap_so INTEGER NOT NULL,
  ngay_bat_dau DATE NOT NULL,
  ngay_bat_dau_la_ngay_mo BOOLEAN NOT NULL DEFAULT false,
  ngay_ket_thuc DATE NOT NULL,
  giam_dinh_vien JSONB NOT NULL DEFAULT '[]'::jsonb,
  tro_ly JSONB NOT NULL DEFAULT '[]'::jsonb,
  cap_bac_lanh_dao TEXT NOT NULL,
  ho_ten_lanh_dao TEXT NOT NULL,
  chuc_vu_lanh_dao TEXT NOT NULL,
  folder_path TEXT,
  -- Tracking states (Phần 3)
  tinh_trang_giao TEXT NOT NULL DEFAULT 'Đang giao' CHECK (tinh_trang_giao IN ('Đang giao','Đã giao')),
  so_luu TEXT,
  scan TEXT NOT NULL DEFAULT 'Chưa' CHECK (scan IN ('Rồi','Chưa')),
  nhap_phan_mem TEXT NOT NULL DEFAULT 'Chưa' CHECK (nhap_phan_mem IN ('Rồi','Chưa')),
  so_hoa TEXT NOT NULL DEFAULT 'Chưa' CHECK (so_hoa IN ('Rồi','Chưa')),
  nop_luu TEXT NOT NULL DEFAULT 'Chưa' CHECK (nop_luu IN ('Rồi','Chưa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Public insert cases" ON public.cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cases" ON public.cases FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete cases" ON public.cases FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.tg_cases_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER cases_updated_at BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.tg_cases_updated_at();

CREATE INDEX cases_linh_vuc_idx ON public.cases(linh_vuc);
CREATE INDEX cases_created_at_idx ON public.cases(created_at DESC);
