const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const PORT = 3000;
const isDev = process.env.NODE_ENV === "development";

let mainWindow = null;
let nextProcess = null;

// ---------------------------------------------------------------------------
// Resolve paths that work both in dev and in the packaged .app
// ---------------------------------------------------------------------------

function getAppRoot() {
  // In production, resources are at process.resourcesPath/app
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app");
  }
  return path.join(__dirname, "..");
}

function getDataDir() {
  // Store the SQLite DB in the OS user-data folder so it survives app updates
  const dataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

// ---------------------------------------------------------------------------
// Poll until Next.js is accepting connections
// ---------------------------------------------------------------------------

function waitForServer(url, retries = 40, interval = 500) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      if (remaining === 0) return reject(new Error("Next.js server did not start in time"));
      http
        .get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else setTimeout(() => check(remaining - 1), interval);
        })
        .on("error", () => setTimeout(() => check(remaining - 1), interval));
    };
    check(retries);
  });
}

// ---------------------------------------------------------------------------
// Spawn Next.js
// ---------------------------------------------------------------------------

function isServerRunning() {
  return new Promise((resolve) => {
    http
      .get(`http://localhost:${PORT}`, (res) => resolve(res.statusCode < 500))
      .on("error", () => resolve(false));
  });
}

async function startNextServer() {
  // In dev, reuse an already-running `next dev` server if present
  if (isDev && await isServerRunning()) {
    console.log(`[electron] Reusing existing server on port ${PORT}`);
    return;
  }

  const appRoot = getAppRoot();
  // In dev use the project's data/ dir so electron and `npm run dev` share the same DB.
  // In production use the OS user-data folder so the DB survives app updates.
  const dataDir = isDev ? path.join(appRoot, "data") : getDataDir();

  const env = {
    ...process.env,
    NODE_ENV: isDev ? "development" : "production",
    PORT: String(PORT),
    HABITUS_DATA_DIR: dataDir,
  };

  const script = isDev ? "dev" : "start";
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  // detached: true puts next/npm in its own process group so we can kill the
  // whole group (npm + next dev child) on quit, not just the npm wrapper.
  nextProcess = spawn(npmCmd, ["run", script], {
    cwd: appRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  nextProcess.stdout.on("data", (d) => process.stdout.write(`[next] ${d}`));
  nextProcess.stderr.on("data", (d) => process.stderr.write(`[next] ${d}`));

  nextProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Next.js exited with code ${code}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Create the BrowserWindow
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    titleBarStyle: "hiddenInset", // macOS: traffic lights inside frame
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // show once ready-to-show fires
    backgroundColor: "#0f172a", // prevents white flash before load
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open external links in the OS browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  await startNextServer();

  try {
    await waitForServer(`http://localhost:${PORT}`);
  } catch (err) {
    console.error(err.message);
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    // macOS: re-open window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProcess) {
    try {
      // Kill the entire process group (npm + its next dev child) to prevent orphans.
      process.kill(-nextProcess.pid, "SIGTERM");
    } catch (_) {
      nextProcess.kill();
    }
    nextProcess = null;
  }
});
