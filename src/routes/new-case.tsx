import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LINH_VUC_OPTIONS, CO_QUAN_MAC_DINH, CAP_BAC_GDV, CHUC_VU_GDV,
  CAP_BAC_LD, CHUC_VU_LD, computeVuSoFull, computeVuSoYy, computeSoDangKy,
} from "@/lib/case-helpers";
import type { CaseInput, LinhVuc, Officer } from "@/lib/types";
import { insertCase } from "@/lib/case-api";
import { generateCaseFiles, isElectron } from "@/lib/electron-bridge";

export const Route = createFileRoute("/new-case")({
  head: () => ({ meta: [{ title: "Tạo hồ sơ mới" }] }),
  component: NewCase,
});

function NewCase() {
  const nav = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [linhVuc, setLinhVuc] = useState<LinhVuc>("DUONGVAN");
  const [qdTrungCau, setQdTrungCau] = useState("");
  const [coQuan, setCoQuan] = useState(CO_QUAN_MAC_DINH);
  const [coQuanKhac, setCoQuanKhac] = useState("");
  const [vuSoX, setVuSoX] = useState<number | "">("");
  const [ngayNhan, setNgayNhan] = useState(today);
  const [ngayNhanMo, setNgayNhanMo] = useState(true);
  const [trichYeu, setTrichYeu] = useState("");
  const [soDangKyA, setSoDangKyA] = useState<number | "">("");
  const [qdLapSo, setQdLapSo] = useState<number | "">("");
  const [ngayBatDau, setNgayBatDau] = useState(today);
  const [ngayBatDauMo, setNgayBatDauMo] = useState(false);
  const [ngayKetThuc, setNgayKetThuc] = useState(today);
  const [gdvs, setGdvs] = useState<Officer[]>([{ hoTen: "", capBac: CAP_BAC_GDV[0], chucVu: CHUC_VU_GDV[0] }]);
  const [troLys, setTroLys] = useState<string[]>([""]);
  const [capBacLd, setCapBacLd] = useState<string>(CAP_BAC_LD[0]);
  const [hoTenLd, setHoTenLd] = useState("");
  const [chucVuLd, setChucVuLd] = useState<string>(CHUC_VU_LD[0]);
  const [saving, setSaving] = useState(false);

  const vuSoYy = useMemo(() => computeVuSoYy(), []);
  const vuSoFull = useMemo(() => (vuSoX === "" ? "" : computeVuSoFull(vuSoX)), [vuSoX]);
  const soDangKyFull = useMemo(
    () => (soDangKyA === "" ? "" : computeSoDangKy(soDangKyA, ngayNhan)),
    [soDangKyA, ngayNhan],
  );

  function toggleNgayMo(which: "nhan" | "batdau") {
    if (which === "nhan") { setNgayNhanMo(true); setNgayBatDauMo(false); }
    else { setNgayNhanMo(false); setNgayBatDauMo(true); }
  }

  function addGdv() {
    if (gdvs.length >= 3) return;
    setGdvs([...gdvs, { hoTen: "", capBac: CAP_BAC_GDV[0], chucVu: CHUC_VU_GDV[0] }]);
  }
  function removeGdv(i: number) { setGdvs(gdvs.filter((_, idx) => idx !== i)); }
  function updateGdv(i: number, patch: Partial<Officer>) {
    setGdvs(gdvs.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }
  function addTroLy() { if (troLys.length < 2) setTroLys([...troLys, ""]); }
  function removeTroLy(i: number) { setTroLys(troLys.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validation
    if (!qdTrungCau.trim()) return toast.error("Nhập Quyết định trưng cầu số");
    if (coQuan === "Khác" && !coQuanKhac.trim()) return toast.error("Nhập tên cơ quan khác");
    if (vuSoX === "" || Number(vuSoX) <= 0) return toast.error("Nhập vụ số hợp lệ");
    if (!trichYeu.trim()) return toast.error("Nhập trích yếu");
    if (soDangKyA === "") return toast.error("Nhập số đăng ký");
    if (qdLapSo === "") return toast.error("Nhập quyết định lập số");
    if (!ngayNhanMo && !ngayBatDauMo) return toast.error("Chọn 1 ngày làm ngày mở hồ sơ");
    if (gdvs.some((g) => !g.hoTen.trim())) return toast.error("Nhập họ tên đầy đủ GĐV");
    if (!hoTenLd.trim()) return toast.error("Nhập họ tên lãnh đạo");

    const cleanTroLys = troLys.map((t) => t.trim()).filter(Boolean);

    const input: CaseInput = {
      linh_vuc: linhVuc,
      quyet_dinh_trung_cau: qdTrungCau.trim(),
      co_quan_trung_cau: coQuan,
      co_quan_trung_cau_khac: coQuan === "Khác" ? coQuanKhac.trim() : undefined,
      vu_so_x: Number(vuSoX),
      vu_so_yy: vuSoYy,
      vu_so_full: vuSoFull,
      ngay_nhan: ngayNhan,
      ngay_nhan_la_ngay_mo: ngayNhanMo,
      trich_yeu: trichYeu.trim(),
      so_dang_ky_a: Number(soDangKyA),
      so_dang_ky_full: soDangKyFull,
      quyet_dinh_lap_so: Number(qdLapSo),
      ngay_bat_dau: ngayBatDau,
      ngay_bat_dau_la_ngay_mo: ngayBatDauMo,
      ngay_ket_thuc: ngayKetThuc,
      giam_dinh_vien: gdvs,
      tro_ly: cleanTroLys,
      cap_bac_lanh_dao: capBacLd,
      ho_ten_lanh_dao: hoTenLd.trim(),
      chuc_vu_lanh_dao: chucVuLd,
    };

    setSaving(true);
    try {
      let folderPath: string | null = null;
      const r = await generateCaseFiles(input);
      folderPath = r.folderPath;
      if (isElectron()) {
        toast.success("Đã tạo thư mục: " + folderPath);
      } else {
        toast.success("Đã sinh 8 biểu mẫu và tải ZIP về máy (web preview).");
      }
      await insertCase(input, folderPath);
      toast.success("Đã lưu hồ sơ");
      nav({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Tạo hồ sơ giám định mới</h1>
        <p className="text-sm text-muted-foreground">Nhập đủ thông tin, phần mềm sẽ tự tạo thư mục và 8 biểu mẫu Word tương ứng.</p>
      </div>

      {/* ===== THÔNG TIN HỒ SƠ ===== */}
      <section className="rounded-lg border bg-card">
        <header className="border-b bg-muted/40 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Thông tin hồ sơ</h2>
        </header>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Lĩnh vực">
            <select value={linhVuc} onChange={(e) => setLinhVuc(e.target.value as LinhVuc)} className={inputCls}>
              {LINH_VUC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Quyết định trưng cầu số">
            <input value={qdTrungCau} onChange={(e) => setQdTrungCau(e.target.value)} className={inputCls} placeholder="VD: 123/QĐ-CSĐT" />
          </Field>
          <Field label="Cơ quan trưng cầu" className="md:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={coQuan} onChange={(e) => setCoQuan(e.target.value)} className={inputCls + " sm:flex-1"}>
                <option>{CO_QUAN_MAC_DINH}</option>
                <option>Khác</option>
              </select>
              {coQuan === "Khác" && (
                <input value={coQuanKhac} onChange={(e) => setCoQuanKhac(e.target.value)} placeholder="Nhập tên cơ quan..." className={inputCls + " sm:flex-1"} />
              )}
            </div>
          </Field>
          <Field label={`Vụ số (yy tự tính = ${vuSoYy})`}>
            <div className="flex items-center gap-2">
              <input type="number" min="1" value={vuSoX} onChange={(e) => setVuSoX(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls + " w-24"} />
              <span className="text-sm text-muted-foreground">/GT-{vuSoYy}</span>
              {vuSoFull && <span className="ml-auto rounded bg-secondary px-2 py-1 text-xs font-mono">{vuSoFull}</span>}
            </div>
          </Field>
          <Field label="Ngày nhận">
            <div className="flex items-center gap-3">
              <input type="date" value={ngayNhan} onChange={(e) => setNgayNhan(e.target.value)} className={inputCls} />
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={ngayNhanMo} onChange={() => toggleNgayMo("nhan")} />
                Ngày mở hồ sơ
              </label>
            </div>
          </Field>
          <Field label="Trích yếu" className="md:col-span-2">
            <textarea value={trichYeu} onChange={(e) => setTrichYeu(e.target.value)} rows={2} className={inputCls} placeholder="Nội dung trích yếu..." />
          </Field>
          <Field label="Số đăng ký">
            <div className="flex items-center gap-2">
              <input type="number" min="1" value={soDangKyA} onChange={(e) => setSoDangKyA(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls + " w-24"} />
              {soDangKyFull && <span className="ml-auto rounded bg-secondary px-2 py-1 text-xs font-mono">{soDangKyFull}</span>}
            </div>
          </Field>
          <Field label="Quyết định lập số">
            <input type="number" min="1" value={qdLapSo} onChange={(e) => setQdLapSo(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
      </section>

      {/* ===== CÔNG TÁC GIÁM ĐỊNH ===== */}
      <section className="rounded-lg border bg-card">
        <header className="border-b bg-muted/40 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Công tác giám định</h2>
        </header>
        <div className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ngày bắt đầu">
              <div className="flex items-center gap-3">
                <input type="date" value={ngayBatDau} onChange={(e) => setNgayBatDau(e.target.value)} className={inputCls} />
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={ngayBatDauMo} onChange={() => toggleNgayMo("batdau")} />
                  Ngày mở hồ sơ
                </label>
              </div>
            </Field>
            <Field label="Ngày kết thúc">
              <input type="date" value={ngayKetThuc} onChange={(e) => setNgayKetThuc(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Giám định viên</label>
              {gdvs.length < 3 && <button type="button" onClick={addGdv} className="text-xs text-primary hover:underline">+ Thêm GĐV</button>}
            </div>
            <div className="space-y-2">
              {gdvs.map((g, i) => (
                <div key={i} className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-[1fr_150px_180px_auto]">
                  <input value={g.hoTen} onChange={(e) => updateGdv(i, { hoTen: e.target.value })} className={inputCls} placeholder={`Họ và tên GĐV ${i + 1}`} />
                  <select value={g.capBac} onChange={(e) => updateGdv(i, { capBac: e.target.value })} className={inputCls}>
                    {CAP_BAC_GDV.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <select value={g.chucVu} onChange={(e) => updateGdv(i, { chucVu: e.target.value })} className={inputCls}>
                    {CHUC_VU_GDV.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {i > 0 && <button type="button" onClick={() => removeGdv(i)} className="text-xs text-destructive hover:underline">Xoá</button>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Trợ lý</label>
              {troLys.length < 2 && <button type="button" onClick={addTroLy} className="text-xs text-primary hover:underline">+ Thêm trợ lý</button>}
            </div>
            <div className="space-y-2">
              {troLys.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input value={t} onChange={(e) => setTroLys(troLys.map((x, idx) => idx === i ? e.target.value : x))} className={inputCls + " flex-1"} placeholder={`Họ tên trợ lý ${i + 1}`} />
                  {i > 0 && <button type="button" onClick={() => removeTroLy(i)} className="text-xs text-destructive hover:underline px-2">Xoá</button>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Lãnh đạo ký</label>
            <div className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-3">
              <select value={capBacLd} onChange={(e) => setCapBacLd(e.target.value)} className={inputCls}>
                {CAP_BAC_LD.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={hoTenLd} onChange={(e) => setHoTenLd(e.target.value)} className={inputCls} placeholder="Họ và tên lãnh đạo" />
              <select value={chucVuLd} onChange={(e) => setChucVuLd(e.target.value)} className={inputCls}>
                {CHUC_VU_LD.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => nav({ to: "/" })} className="rounded-md border bg-card px-4 py-2 text-sm hover:bg-accent">Huỷ</button>
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {saving ? "Đang lưu..." : "Lưu hồ sơ & tạo biểu mẫu"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
