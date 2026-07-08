import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listCases, updateCase } from "@/lib/case-api";
import type { CaseRow } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard tình trạng hồ sơ" }] }),
  component: Dashboard,
});

const LINH_VUC_LABEL: Record<string, string> = {
  DUONGVAN: "Đường vân",
  TAILIEU: "Tài liệu",
  SUNGDAN: "Súng-đạn",
};

function Dashboard() {
  const qc = useQueryClient();
  const { data: cases, isLoading } = useQuery({ queryKey: ["cases"], queryFn: listCases });
  const [filter, setFilter] = useState<string>("ALL");

  const rows = (cases ?? []).filter((c) => filter === "ALL" || c.linh_vuc === filter);

  async function patch(id: string, patch: Partial<CaseRow>) {
    try {
      await updateCase(id, patch);
      qc.invalidateQueries({ queryKey: ["cases"] });
    } catch (e) {
      toast.error("Không cập nhật được: " + (e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tình trạng hồ sơ giám định</h1>
          <p className="text-sm text-muted-foreground">Theo dõi tiến độ từng vụ. Tổng: {cases?.length ?? 0}</p>
        </div>
        <div className="flex gap-2">
          {(["ALL", "DUONGVAN", "TAILIEU", "SUNGDAN"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-md border px-3 py-1.5 text-sm ${filter === v ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
            >{v === "ALL" ? "Tất cả" : LINH_VUC_LABEL[v]}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Đang tải...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Chưa có hồ sơ nào.</p>
          <Link to="/new-case" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Tạo hồ sơ đầu tiên</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Lĩnh vực</th>
                <th className="px-3 py-3 text-left">Số vụ</th>
                <th className="px-3 py-3 text-left min-w-[200px]">Trích yếu</th>
                <th className="px-3 py-3 text-left">Số đăng ký</th>
                <th className="px-3 py-3 text-left">Tình trạng giao</th>
                <th className="px-3 py-3 text-left">Số lưu</th>
                <th className="px-3 py-3 text-center">SCAN</th>
                <th className="px-3 py-3 text-center">Nhập PM</th>
                <th className="px-3 py-3 text-center">Số hoá</th>
                <th className="px-3 py-3 text-center">Nộp lưu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t hover:bg-accent/30">
                  <td className="px-3 py-2.5"><span className="rounded bg-secondary px-2 py-0.5 text-xs">{LINH_VUC_LABEL[c.linh_vuc]}</span></td>
                  <td className="px-3 py-2.5 font-medium">{c.vu_so_full}</td>
                  <td className="px-3 py-2.5 max-w-[300px] truncate" title={c.trich_yeu}>{c.trich_yeu}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.so_dang_ky_full}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={c.tinh_trang_giao}
                      onChange={(e) => patch(c.id, { tinh_trang_giao: e.target.value as CaseRow["tinh_trang_giao"] })}
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      <option>Đang giao</option>
                      <option>Đã giao</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <SoLuuCell value={c.so_luu} onSave={(v) => patch(c.id, { so_luu: v })} />
                  </td>
                  <StatusCell value={c.scan} onChange={(v) => patch(c.id, { scan: v })} />
                  <StatusCell value={c.nhap_phan_mem} onChange={(v) => patch(c.id, { nhap_phan_mem: v })} />
                  <StatusCell value={c.so_hoa} onChange={(v) => patch(c.id, { so_hoa: v })} />
                  <StatusCell value={c.nop_luu} onChange={(v) => patch(c.id, { nop_luu: v })} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusCell({ value, onChange }: { value: "Rồi" | "Chưa"; onChange: (v: "Rồi" | "Chưa") => void }) {
  return (
    <td className="px-3 py-2.5 text-center">
      <button
        onClick={() => onChange(value === "Rồi" ? "Chưa" : "Rồi")}
        className={`rounded px-2.5 py-1 text-xs font-medium ${value === "Rồi" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}`}
      >{value}</button>
    </td>
  );
}

function SoLuuCell({ value, onSave }: { value: string | null; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value ?? "");
  if (!editing && !value) {
    return <button onClick={() => setEditing(true)} className="rounded border border-dashed px-2 py-1 text-xs text-muted-foreground hover:bg-accent">+ Thêm</button>;
  }
  if (editing) {
    return (
      <div className="flex gap-1">
        <input value={v} onChange={(e) => setV(e.target.value)} className="w-20 rounded border bg-background px-1.5 py-0.5 text-xs" autoFocus />
        <button onClick={() => { onSave(v); setEditing(false); }} className="rounded bg-primary px-2 text-xs text-primary-foreground">✓</button>
      </div>
    );
  }
  return <button onClick={() => setEditing(true)} className="text-xs hover:underline">{value}</button>;
}
