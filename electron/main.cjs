// Electron main process (CommonJS).
// Chạy: sau khi vite build, chạy electron . để mở app.
// Đóng gói .exe: dùng @electron/packager với target win32 (xem README-DESKTOP.md).
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const BASE_DIR = "D:\\GIAMDINH";
const TEMPLATE_DIR = "D:\\GIAMDINH\\BIEUMAU";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Quản lý hồ sơ giám định",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle("get-defaults", () => ({ baseDir: BASE_DIR, templateDir: TEMPLATE_DIR }));

ipcMain.handle("read-template-dir", (_e, templateDir) => {
  const dir = templateDir || TEMPLATE_DIR;
  if (!fs.existsSync(dir)) throw new Error(`Không tìm thấy thư mục mẫu: ${dir}`);
  const files = fs.readdirSync(dir).filter((f) => /\.(docx?|DOCX?)$/.test(f));
  return files.map((name) => ({
    name,
    data: fs.readFileSync(path.join(dir, name)).buffer,
  }));
});

ipcMain.handle("write-case-folder", (_e, targetDir, files) => {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const f of files) {
    fs.writeFileSync(path.join(targetDir, f.name), Buffer.from(f.data));
  }
  return { folderPath: targetDir };
});
