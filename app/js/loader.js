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
const tasks = getElement("id", "tasks");

// # CREATE LOCAL TASK EVENT LISENTER
createLocalTaskBtn.addEventListener("click", createLocalTask);
// # CREATE PROXY TASK EVENT LISENTER
createProxyTaskBtn.addEventListener("click", createProxyTask);
// # LAUNCH ALL INSTANCE
launchAllInstanceBtn.addEventListener("click", launchAllInstance);
// # TOGGLE ALL INSTANCE
toggleAllInstanceBtn.addEventListener("click", toggleAllInstance);

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

// # CUT TEXT IF TOO LONG
function adjustTextLength(str) {}

// # LAUNCH ALL INSTANCE
function launchAllInstance(e) {
  ipcRenderer.send("launch-all-instance");
}

// # TOGGLE ALL INSTANCE
function toggleAllInstance(e) {
  ipcRenderer.send("toggle-all-instance");
}

// # LOCAL TASK CREATOR
function createLocalTask(e) {
  const taskId = tasks.childElementCount + 1;

  const tr = document.createElement("tr");
  tr.classList.add(`taskId-${taskId}`);

  // # CREATE TASK TEMPLATE
  const taskTemplate = `
    <th scope="row" class="localTask local-id">${taskId}</th>
        <td class="localTask local-proxy">Local IP</td>
        <td class="localTask taskId-${taskId} SetTitle">NULL</td>
        <td class="localTask taskId-${taskId} SetStatus">NULL</td>
        <td class="task-controller">
        <div class="btnGroup">
            <button type="button" class="btn btn-secondary" id="launchBrowser taskId-${taskId}">Launch</button>
            <button type="button" class="btn btn-success" id="toggleBrowser taskId-${taskId}">Toggle</button>
            <button type="button" class="btn btn-info" id="clearCookie taskId-${taskId}">Clear Cookie</button>
            <button type="button" class="btn btn-primary" id="autoFill taskId-${taskId}">AF</button>            
            <button type="button" class="btn btn-warning" id="focus taskId-${taskId}">Focus</button>
            <button type="button" class="btn btn-danger" id="delete taskId-${taskId}">Delete</button>
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
  getElement("id", `delete taskId-${taskId}`).addEventListener("click", () =>
    ipcRenderer.send(`delete taskId-${taskId}`)
  );

  // # UPDATE STATUS
  ipcRenderer.on(`localTask taskId-${taskId} SetStatus`, (evt, data) => {
    getElement("", `.localTask.taskId-${taskId}.SetStatus`).innerHTML = data;
  });

  // # DISABLE LAUNCH BUTTON
  ipcRenderer.on(`launchBrowser taskId-${taskId} hide`, evt => {
    getElement("id", `launchBrowser taskId-${taskId}`).disabled = true;
  });

  // # SENT TASK DATA TO MAIN PROCESS
  ipcRenderer.send("newLocalTask", {
    id: taskId,
    proxy: null,
    url: "https://yeezysupply.com"
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
      let taskCount = tasks.childElementCount + 1;

      for (let i = 0; i < proxyList.length; i++) {
        if (!proxyList[i] == "") {
          const taskID = taskCount++;
          const tr = document.createElement("tr");
          tr.classList.add(`taskId-${taskID}`);

          // # CREATE TASK TEMPLATE
          const taskTemplate = `
            <th scope="row" class="proxy-task proxy-id">${taskID}</th>
                <td class="proxy-task proxy">${proxyList[i]}</td>
                <td class="proxy-task taskId-${taskID} SetTitle">NULL</td>
                <td class="proxy-task taskId-${taskID} SetStatus">NULL</td>
                <td class="task-controller">
                <div class="btnGroup">
                    <button type="button" class="btn btn-success" id="toggleBrowser taskId-${taskID}">Toggle</button>
                    <button type="button" class="btn btn-info" id="clearCookie taskId-${taskID}">Clear Cookie</button>
                    <button type="button" class="btn btn-primary" id="autoFill taskId-${taskID}">AF</button>            
                    <button type="button" class="btn btn-warning" id="focus taskId-${taskID}">Focus</button>
                    <button type="button" class="btn btn-danger" id="delete taskId-${taskID}">Delete</button>
                </div>
            </td>
            `;

          // # APPEND TASK TEMPLATE TO TASKS BODY
          tr.innerHTML = taskTemplate;
          tasks.appendChild(tr);
        }
      }
    });
  });
}
