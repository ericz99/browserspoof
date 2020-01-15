/*
 * @Author: eric.zhang
 * @Date: 2019-12-12 22:07:23
 * @Last Modified by: eric.zhang
 * @Last Modified time: 2019-12-19 10:01:50
 */

const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  session,
  Notification
} = require("electron");
const path = require("path");
const UserAgent = require('user-agents');

// # Autoreload
// require("electron-reload")(path.resolve(__dirname, ".."));

// # Main window
let mainWin;

function initWindow() {
  // # remove application menu
  Menu.setApplicationMenu(null);

  app.on("ready", () => {
    // Create the browser window.
    mainWin = new BrowserWindow({
      width: 1300,
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
    // mainWin.webContents.openDevTools();

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

// # CREATE NEW LOCAL TASk
ipcMain.on("newInstanceTask", (evt, data) => {
  console.log("creating task");
  new LocalTaskInstance(data.id, data.url, data.proxy);
});

// # TOGGLE ALL INSTANCE
ipcMain.on("toggle-all-instance", (evt, data) => {
  const getAllChild = mainWin.getChildWindows();
  let taskIndex = 0;
  for (let i = 0; i < getAllChild.length; i++) {
    taskIndex++;
    if (!getAllChild[i].isVisible()) {
      getAllChild[i].show();
      mainWin.webContents.send(
        `browserTask taskId-${taskIndex} SetStatus`,
        "Open"
      );
    } else {
      getAllChild[i].hide();
      mainWin.webContents.send(
        `browserTask taskId-${taskIndex} SetStatus`,
        "Close"
      );
    }
  }
});

// # MASS RELOAD BROWSER
ipcMain.on("mass-reload-all", evt => {
  const getAllChild = mainWin.getChildWindows();

  if (getAllChild.length > 0) {
    for (let i = 0; i < getAllChild.length; i++) {
      getAllChild[i].reload();
    }
  }
});

class LocalTaskInstance {
  constructor(id, url, proxy) {
    this.id = id;
    this.proxyHostPort = this.getProxyHostPort(proxy);
    this.proxy = this.getProxyData(proxy);
    this.mainProxy = proxy;
    this.url = url;
    this.win = null;
    this.status = "";
    this.isLaunched = false;
    this.isDeleted = false;
    this.userAgent = new UserAgent(/Chrome/, { deviceCategory: 'desktop' }).toString().replace(/\|"/g, "");

    // # initalize instance
    this.init();
  }

  init() {
    this.setStatus("Not Launch");

    // # LAUNCH BROWSER BUT LET IT STAY HIDDEN
    ipcMain.on(`launchBrowser taskId-${this.id}`, evt => {
      if (!this.isLaunched && !this.isDeleted) {
        this.launchBrowser();
        mainWin.webContents.send(`launchBrowser taskId-${this.id} hide`);
      }
    });

    // # LAUNCH ALL BROWSER BUT LET IT STAY HIDDEN
    ipcMain.on(`launch-all-instance`, evt => {
      if (!this.isLaunched && !this.isDeleted) {
        this.launchBrowser();
        mainWin.webContents.send(`launchBrowser taskId-${this.id} hide`);
      }
    });

    // # LISTEN TO OPEN BROSWER EVENT
    ipcMain.on(`toggleBrowser taskId-${this.id}`, evt => {
      if (this.isLaunched) {
        this.toggleBrowser();
      }
    });

    // # LISTEN TO DELETE TASK EVENT
    ipcMain.on(`delete taskId-${this.id}`, evt => {
      if (this.isLaunched) {
        // # JUST DESTROY THE WINDOW AND IT WON"T BE USED
        this.win.destroy();
        // # SET AS DELETE SO IT WON"T BE USED AND WILL BE GC
        this.isDeleted = true;
      } else {
        // # SET AS DELETE SO IT WON"T BE USED AND WILL BE GC
        this.isDeleted = true;
      }
    });

    // # LISTEN TO CLEAR COOKIE CACHE
    ipcMain.on(`clearCookie taskId-${this.id}`, evt => {
      console.log("cleared cookie");
      if (this.isLaunched) {
        // # clear cache
        // this.win.webContents.session.clearStorageData(); // do not use
        // this.win.webContents.session.defaultSession.clearCache();
        console.log(this.win.getTitle());
        console.log(this.win.webContents.session);
        // # reload browser
        this.win.reload();
      }
    });
  }

  getProxyData(proxy) {
    if (proxy) {
      const splitProxy = proxy.split(":");
      const hostPort = `${splitProxy[0]}:${splitProxy[1]}`;

      // # ONLY RETURN IF PROXY IS USER PASS
      if (splitProxy.length > 2) {
        return {
          host: splitProxy[0],
          port: splitProxy[1],
          user: splitProxy[2],
          pass: splitProxy[3]
        };
      }

      // ELSE ITS IP AUTH
      return {
        host: splitProxy[0],
        port: splitProxy[1]
      };
    }
  }

  getProxyHostPort(proxy) {
    if (proxy) {
      const splitProxy = proxy.split(":");
      const final = splitProxy[0] + ":" + splitProxy[1];
      return final;
    }
  }

  // LAUNCH BROWSER
  launchBrowser() {
    this.setStatus("Open");
    // # SET LAUNCH TO TRUE
    this.isLaunched = true;
    // # remove application menu
    Menu.setApplicationMenu(null);

    // Create the browser window.
    this.win = new BrowserWindow({
      width: 500,
      height: 500,
      resizable: true,
      fullscreenable: false,
      title: this.displayTitle(),
      icon: path.resolve(__dirname, "img", "icon-win.ico"),
      show: true,
      parent: mainWin,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false,
        session,
        partition: `persist:task_id_${this.id}`
      }
    });

    // # load using proxy or not
    if (this.proxy) {
      this.win.webContents.session.setProxy(
        {
          proxyRules: this.proxyHostPort
        },
        () => { }
      );

      // # LOAD CUSTOM WEB
      this.win.loadURL(this.url, {
        userAgent: this.userAgent
      });

      // # LOGIN IF PROXY HAVE USER PASS
      this.win.webContents.on(
        "login",
        (event, authenticationResponseDetails, authInfo, callback) => {
          if (authInfo.isProxy) {
            event.preventDefault();
            // # FILL
            callback(this.proxy.user, this.proxy.pass); //supply credentials to server
          }
        }
      );
    } else {
      this.win.loadURL(this.url, {
        userAgent: this.userAgent
      });
    }

    // Set Menu to null
    this.win.setMenu(null);

    // # Fixed title not showing
    this.win.on("page-title-updated", (evt, title) => {
      evt.preventDefault();
      // # update title when title update
      mainWin.webContents.send(`browserTask taskId-${this.id} SetTitle`, title);
      // # if title change, notify user
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
      // # update status
      this.setStatus("Open");
    } else {
      // # hide browser
      win.hide();
      // # update status
      this.setStatus("Close");
    }
  }

  // # set title
  displayTitle() {
    return `${
      this.proxyHostPort == null ? "Local IP" : this.proxyHostPort
      } - taskId-${this.id}`;
  }

  // # SET STATUS COMMAND
  setStatus(status) {
    this.status = status;
    mainWin.webContents.send(`browserTask taskId-${this.id} SetStatus`, status);
  }
}
