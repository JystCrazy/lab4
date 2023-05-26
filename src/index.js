const { app, BrowserWindow } = require('electron');
const path = require('path');

const videoSelectBtn = document.getElementById("videoSelectBtn");
const { desktopCapturer, remote } = require("electron");
const{ Menu } = remote;

videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
types: ["window", "screen"]
});
console.log(inputSources);
const videoOptionsMenu = Menu.buildFromTemplate(
  inputSources.map(source => {
    return{
      label: source.name,
      click: () => selectSource(source)
    };
  })
);

videoOptionsMenu.popup();
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const videoElement = document.querySelector("video");
// Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  
  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();
 // Create the Media Recorder
 const options = { mimeType: 'video/webm; codecs=vp9' };
 mediaRecorder = new MediaRecorder(stream, options);

 // Register Event Handlers
 mediaRecorder.ondataavailable = handleDataAvailable;
 mediaRecorder.onstop = handleStop;

}

const { writeFile } = require("fs");
const { dialog } = remote;

const startBtn = document.getElementById("startBtn");
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Запись";
};

const stopBtn = document.getElementById("stopBtn");

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Старт";
};

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log("Видео записано!");
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("video saved successfully!"));
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
