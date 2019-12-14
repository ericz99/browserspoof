/*
 * @Author: eric.zhang
 * @Date: 2019-12-12 22:07:23
 * @Last Modified by: eric.zhang
 * @Last Modified time: 2019-12-14 00:42:14
 */

const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const client = require("discord-rich-presence")("654913152667877396");
const path = require("path");

// # Autoreload
require("electron-reload")(path.resolve(__dirname, ".."));

// # Discord RPC
client.updatePresence({
  state: "Version 0.0.1-alpha",
  details: "Killing the browsers",
  startTimestamp: Date.now(),
  endTimestamp: Date.now() + 1337,
  largeImageKey: "largeimage",
  smallImageKey: "🧐",
  instance: true
});

// # Main window
let mainWin;

function initWindow() {
  // # remove application menu
  Menu.setApplicationMenu(null);

  app.on("ready", () => {
    // Create the browser window.
    mainWin = new BrowserWindow({
      width: 1200,
      height: 800,
      resizable: false,
      center: true,
      fullscreenable: false,
      title: "SpoofBrowser",
      show: false,
      icon: path.resolve(__dirname, "img", "icon-win.ico"),
      webPreferences: {
        nodeIntegration: true
      }
    });

    mainWin.once("ready-to-show", () => {
      mainWin.show();
    });

    // and load the index.html of the app.
    mainWin.loadFile(path.resolve(__dirname, "index.html"));

    // Set Menu to null
    mainWin.setMenu(null);

    // Open the DevTools.
    mainWin.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWin.on("closed", () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWin = null;
    });
  });
}

// # Initalize window
initWindow();

const localTasks = [];

// # CREATE NEW LOCAL TASk
ipcMain.on("newLocalTask", (evt, data) => {
  console.log("creating task");
  localTasks.push(new LocalTaskInstance(data.id, data.url, data.proxy));
});

// # LAUNCH ALL INSTANCE
ipcMain.on("launch-all-instance", (evt, data) => {
  console.log("launching all tasks");
  let taskIndex = 0;
  for (let i = 0; i < localTasks.length; i++) {
    taskIndex++;
    if (!localTasks[i].isLaunched) {
      localTasks[i].launchBrowser();
      mainWin.webContents.send(`launchBrowser taskId-${taskIndex} hide`);
    }
  }
});

// # TOGGLE ALL INSTANCE
ipcMain.on("toggle-all-instance", (evt, data) => {
  let taskIndex = 0;
  for (let i = 0; i < localTasks.length; i++) {
    taskIndex++;
    localTasks[i].toggleBrowser();
  }
});

class LocalTaskInstance {
  constructor(id, url, proxy) {
    this.id = id;
    this.proxy = proxy == null ? "Local IP" : proxy;
    this.url = url;
    this.win = null;
    this.status = "";
    this.isLaunched = false;

    // # initalize instance
    this.init();
  }

  init() {
    this.setStatus("Idle");

    // # LAUNCH BROWSER BUT LET IT STAY HIDDEN
    ipcMain.on(`launchBrowser taskId-${this.id}`, evt => {
      this.launchBrowser();
      mainWin.webContents.send(`launchBrowser taskId-${this.id} hide`);
    });

    // # LISTEN TO OPEN BROSWER EVENT
    ipcMain.on(`toggleBrowser taskId-${this.id}`, evt => {
      this.toggleBrowser();
    });

    // # LISTEN TO DELETE TASK EVENT
    ipcMain.on(`delete taskId-${this.id}`, evt => {
      // this.toggleBrowser();
      console.log(mainWin.getChildWindows());
    });
  }

  // LAUNCH BROWSER
  launchBrowser() {
    // # SET LAUNCH TO TRUE
    this.isLaunched = true;
    // # SET STATUS

    this.setStatus("Launched Browser");
    // # remove application menu
    Menu.setApplicationMenu(null);

    // Create the browser window.
    this.win = new BrowserWindow({
      width: 500,
      height: 500,
      resizable: false,
      fullscreenable: false,
      title: `${this.proxy} - taskId-${this.id}`,
      icon: path.resolve(__dirname, "img", "icon-win.ico"),
      show: true,
      parent: mainWin,
      webPreferences: {
        nodeIntegration: true
      }
    });

    // and load the index.html of the app.
    this.win.loadURL("https://yeezysupply.com", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    });

    // Set Menu to null
    this.win.setMenu(null);

    // # Fixed title not showing
    this.win.on("page-title-updated", evt => {
      evt.preventDefault();
    });

    // Emitted when the window is closed.
    this.win.on("closed", () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.win = null;
    });
  }

  // # TOGGLE BROWSER
  toggleBrowser() {
    const win = this.win;

    if (!win.isVisible()) {
      // # show browser
      win.show();
    } else {
      // # hide browser
      win.hide();
    }
  }

  // # SET STATUS COMMAND
  setStatus(status) {
    this.status = status;
    mainWin.webContents.send(`localTask taskId-${this.id} SetStatus`, status);
  }
}
