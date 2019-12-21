// # DEPENDENCIES
const ipcRenderer = require("electron").ipcRenderer;
const { dialog, BrowserWindow, Menu, app } = require("electron").remote;
const fs = require("fs");
const path = require("path");

// # DOM ELEMENT IMPORT
const createLocalTaskBtn = getElement("id", "createLocalTaskBtn");
const createProxyTaskBtn = getElement("id", "createProxyTaskBtn");
const launchAllInstanceBtn = getElement("id", "launchAllInstanceBtn");
const toggleAllInstanceBtn = getElement("id", "toggleAllInstanceBtn");
const massReloadBtn = getElement("id", "massReloadBtn");
const addSelectorBtn = getElement("id", "addSelectorBtn");
const saveAutoFillConfigBtn = getElement("id", "saveAutoFillConfigBtn");
const tasks = getElement("id", "tasks");
const selectorBody = getElement("id", "selectorBody");

// # CREATE LOCAL TASK EVENT LISENTER
createLocalTaskBtn.addEventListener("click", createLocalTask);
// # CREATE PROXY TASK EVENT LISENTER
createProxyTaskBtn.addEventListener("click", createProxyTask);
// # LAUNCH ALL INSTANCE
launchAllInstanceBtn.addEventListener("click", launchAllInstance);
// # TOGGLE ALL INSTANCE
toggleAllInstanceBtn.addEventListener("click", toggleAllInstance);
// # ADD SELECTOR TO AUTOFILL
addSelectorBtn.addEventListener("click", addSelector);
// # SAVE AUTOFILL CONFIG
saveAutoFillConfigBtn.addEventListener("click", saveAutoFillConfig);
// # MASS RELOAD BROWSERE
massReloadBtn.addEventListener("click", massReload);

// # GET SELECTOR ULTITY FUNCTION
function getElement(type, selector) {
  switch (type) {
    case "id":
      return document.getElementById(selector);
    case "class":
      return document.getElementByClassName(selector);
    case "all":
      return document.querySelectorAll(selector);
    case "tag":
      return document.getElementByTagName(selector);
    default:
      return document.querySelector(selector);
  }
}

// # LAUNCH ALL INSTANCE
function launchAllInstance(e) {
  ipcRenderer.send("launch-all-instance");
}

// # TOGGLE ALL INSTANCE
function toggleAllInstance(e) {
  ipcRenderer.send("toggle-all-instance");
}

// # MASS RELOAD BROWSER
function massReload(e) {
  ipcRenderer.send("mass-reload-all");
}

// # LOCAL TASK CREATOR
function createLocalTask(e) {
  const taskId = genUniqueID();

  const tr = document.createElement("tr");
  tr.classList.add(`taskId-${taskId}`);

  // # CREATE TASK TEMPLATE
  const taskTemplate = `
    <th scope="row" class="browserTask-id">${taskId}</th>
        <td class="browserTask-proxy">Local IP</td>
        <td class="browserTask taskId-${taskId} SetTitle">NULL</td>
        <td class="browserTask taskId-${taskId} SetStatus">NULL</td>
        <td class="task-controller">
        <div class="btnGroup">
            <button type="button" class="btn btn-secondary btn-sm" id="launchBrowser taskId-${taskId}">Launch</button>
            <button type="button" class="btn btn-success btn-sm" id="toggleBrowser taskId-${taskId}">Toggle</button>
            <button type="button" class="btn btn-info btn-sm" id="clearCookie taskId-${taskId}">Clear Cookie</button>
            <button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#autoFillConfig" id="autoFill taskId-${taskId}">AF</button>            
            <button type="button" class="btn btn-warning btn-sm" id="focus taskId-${taskId}">Focus</button>
            <button type="button" class="btn btn-danger btn-sm" id="delete taskId-${taskId}">Delete</button>
        </div>
    </td>
    `;

  // # APPEND TASK TEMPLATE TO TASKS BODY
  tr.innerHTML = taskTemplate;
  tasks.appendChild(tr);

  // # LAUNCH BROWSER
  getElement("id", `launchBrowser taskId-${taskId}`).addEventListener(
    "click",
    () => ipcRenderer.send(`launchBrowser taskId-${taskId}`)
  );

  // # TOGGLE BROWSER
  getElement("id", `toggleBrowser taskId-${taskId}`).addEventListener(
    "click",
    () => ipcRenderer.send(`toggleBrowser taskId-${taskId}`)
  );

  // # DELETE TASK BUTTON
  getElement("id", `delete taskId-${taskId}`).addEventListener("click", () => {
    ipcRenderer.send(`delete taskId-${taskId}`);
    // # DELETE TASK FROM BODY

    if (tasks.hasChildNodes()) {
      for (const node of tasks.childNodes) {
        if (node.classList.contains(`taskId-${taskId}`)) {
          // # REMOVE ELEMENT FROM THE BODY
          tasks.removeChild(node);
        }
      }
    }
  });

  // # CLEAR COOKIE
  getElement("id", `clearCookie taskId-${taskId}`).addEventListener(
    "click",
    () => {
      ipcRenderer.send(`clearCookie taskId-${taskId}`);
    }
  );

  // # UPDATE STATUS
  ipcRenderer.on(`browserTask taskId-${taskId} SetStatus`, (evt, data) => {
    getElement("", `.browserTask.taskId-${taskId}.SetStatus`).innerHTML = data;
  });

  // # UPDATE TITLE
  ipcRenderer.on(`browserTask taskId-${taskId} SetTitle`, (evt, data) => {
    getElement("", `.browserTask.taskId-${taskId}.SetTitle`).innerHTML = data;
  });

  // # DISABLE LAUNCH BUTTON
  ipcRenderer.on(`launchBrowser taskId-${taskId} hide`, evt => {
    getElement("id", `launchBrowser taskId-${taskId}`).disabled = true;
  });

  // # SENT TASK DATA TO MAIN PROCESS
  ipcRenderer.send("newInstanceTask", {
    id: taskId,
    proxy: null,
    url: "https://www.yeezysupply.com/"
  });
}

// # PROXY TASK CREATOR
function createProxyTask(e) {
  // # OPEN DIALOG TO VIEW FOLDER
  dialog.showOpenDialog().then(files => {
    const { filePaths: filePath } = files;

    // # read file data
    fs.readFile(filePath[0], "utf8", (err, data) => {
      if (err) throw err;

      // # got data
      const proxyList = data.toString().split("\n");

      for (let i = 0; i < proxyList.length; i++) {
        if (!proxyList[i] == "") {
          const taskId = genUniqueID();
          const tr = document.createElement("tr");
          tr.classList.add(`taskId-${taskId}`);

          // # CREATE TASK TEMPLATE
          const taskTemplate = `
            <th scope="row" class="browserTask-id">${taskId}</th>
                <td class="browserTask-proxy">${proxyList[i]}</td>
                <td class="browserTask taskId-${taskId} SetTitle">NULL</td>
                <td class="browserTask taskId-${taskId} SetStatus">NULL</td>
                <td class="task-controller">
                <div class="btnGroup">
                    <button type="button" class="btn btn-secondary btn-sm" id="launchBrowser taskId-${taskId}">Launch</button>
                    <button type="button" class="btn btn-success btn-sm" id="toggleBrowser taskId-${taskId}">Toggle</button>
                    <button type="button" class="btn btn-info btn-sm" data-toggle="modal" data-target="#autoFillConfig" id="clearCookie taskId-${taskId}">Clear Cookie</button>
                    <button type="button" class="btn btn-primary btn-sm" id="autoFill taskId-${taskId}">AF</button>            
                    <button type="button" class="btn btn-warning btn-sm" id="focus taskId-${taskId}">Focus</button>
                    <button type="button" class="btn btn-danger btn-sm" id="delete taskId-${taskId}">Delete</button>
                </div>
            </td>
            `;

          // # APPEND TASK TEMPLATE TO TASKS BODY
          tr.innerHTML = taskTemplate;
          tasks.appendChild(tr);

          // # LAUNCH BROWSER
          getElement(
            "id",
            `launchBrowser taskId-${taskId}`
          ).addEventListener("click", () =>
            ipcRenderer.send(`launchBrowser taskId-${taskId}`)
          );

          // # TOGGLE BROWSER
          getElement(
            "id",
            `toggleBrowser taskId-${taskId}`
          ).addEventListener("click", () =>
            ipcRenderer.send(`toggleBrowser taskId-${taskId}`)
          );

          // # DELETE TASK BUTTON
          getElement("id", `delete taskId-${taskId}`).addEventListener(
            "click",
            () => {
              ipcRenderer.send(`delete taskId-${taskId}`);
              // # DELETE TASK FROM BODY

              if (tasks.hasChildNodes()) {
                for (const node of tasks.childNodes) {
                  if (node.classList.contains(`taskId-${taskId}`)) {
                    // # REMOVE ELEMENT FROM THE BODY
                    tasks.removeChild(node);
                  }
                }
              }
            }
          );

          // # CLEAR COOKIE
          getElement("id", `clearCookie taskId-${taskId}`).addEventListener(
            "click",
            () => {
              ipcRenderer.send(`clearCookie taskId-${taskId}`);
            }
          );

          // # DISABLE LAUNCH BUTTON
          ipcRenderer.on(`launchBrowser taskId-${taskId} hide`, evt => {
            getElement("id", `launchBrowser taskId-${taskId}`).disabled = true;
          });

          // # UPDATE STATUS
          ipcRenderer.on(
            `browserTask taskId-${taskId} SetStatus`,
            (evt, data) => {
              getElement(
                "",
                `.browserTask.taskId-${taskId}.SetStatus`
              ).innerHTML = data;
            }
          );

          // # UPDATE TITLE
          ipcRenderer.on(
            `browserTask taskId-${taskId} SetTitle`,
            (evt, data) => {
              getElement(
                "",
                `.browserTask.taskId-${taskId}.SetTitle`
              ).innerHTML = data;
            }
          );

          // # DISABLE LAUNCH BUTTON
          ipcRenderer.on(`launchBrowser taskId-${taskId} hide`, evt => {
            getElement("id", `launchBrowser taskId-${taskId}`).disabled = true;
          });

          // # SENT TASK DATA TO MAIN PROCESS
          ipcRenderer.send("newInstanceTask", {
            id: taskId,
            proxy: proxyList[i],
            url: "https://www.yeezysupply.com/"
          });
        }
      }
    });
  });
}

// # ADD SELECTOR FUNCTION
function addSelector(e) {
  const selectorId = selectorBody.childElementCount + 1;
  const selectorElem = document.createElement("div");
  selectorElem.classList.add("form-group", "row");
  selectorElem.setAttribute("id", `selector-${selectorId}`);

  const template = `
                <label
                  for="colFormLabelSm"
                  class="col-sm-2 col-form-label col-form-label-sm"
                  >Selector ${selectorId}</label
                >
                <div class="col-sm-4">
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    id="selectorAttr"
                    placeholder="Selector"
                  />
                </div>
                <div class="col-sm-4">
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    id="selectorValue"
                    placeholder="Value"
                  />
                </div>
                <div class="col-sm-2">
                  <button type="button" class="btn btn-danger btn-sm">
                    Delete
                  </button>
                </div>
    `;

  // # APPEND TEMPLATE TO SELECTOR ELEM
  selectorElem.innerHTML = template;
  selectorBody.appendChild(selectorElem);
}

// # SAVE AUTOFILL CONFIG CONTENT
// TODO: finish saving autofill confirguation and add data storage for user configuration
function saveAutoFillConfig(e) {}

// # GENERATE A UNIQUE TASK ID
function genUniqueID() {
  return Math.random()
    .toString(36)
    .substr(2, 9);
}
