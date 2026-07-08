const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  getDefaults: () => ipcRenderer.invoke("get-defaults"),
  readTemplateDir: (templateDir) => ipcRenderer.invoke("read-template-dir", templateDir),
  writeCaseFolder: (targetDir, files) =>
    ipcRenderer.invoke("write-case-folder", targetDir, files),
});
