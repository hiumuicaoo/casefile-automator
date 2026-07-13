// Server route: đọc file .docx mẫu trên máy chủ và trả về cho client.
// - Ưu tiên đọc từ thư mục mount trên host: /app/templates/BIEUMAU_<ROLE>/<name>
//   (map từ /var/lib/casefile-templates trên Ubuntu host, xem docker-compose.yml)
// - Fallback về public/BIEUMAU_<ROLE>/ đi kèm trong build (dùng cho dev/preview).
import { createFileRoute } from "@tanstack/react-router";

const ROLE_TO_DIR: Record<string, string> = {
  truongphong: "BIEUMAU_TRUONGPHONG",
  photruongphong: "BIEUMAU_PHOTRUONGPHONG",
};

export const Route = createFileRoute("/api/templates/$role/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const dir = ROLE_TO_DIR[params.role];
        if (!dir) return new Response("Unknown role", { status: 400 });
        const name = decodeURIComponent(params.name);
        if (name.includes("..") || name.includes("/") || name.includes("\\")) {
          return new Response("Bad name", { status: 400 });
        }

        const fs = await import("node:fs/promises");
        const path = await import("node:path");

        const candidates = [
          path.join("/app/templates", dir, name),          // mount volume trên server
          path.join(process.cwd(), "templates", dir, name), // dev local
          path.join(process.cwd(), "public", dir, name),   // fallback built-in
        ];

        for (const p of candidates) {
          try {
            const buf = await fs.readFile(p);
            return new Response(new Uint8Array(buf), {
              headers: {
                "Content-Type":
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Cache-Control": "no-cache",
              },
            });
          } catch {
            /* try next */
          }
        }
        return new Response(`Không tìm thấy biểu mẫu: ${dir}/${name}`, { status: 404 });
      },
    },
  },
});
