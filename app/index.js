const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const buildDB = require('./buildDB.js')
let mainWin, db;

async function createWindow () {
  try {
    db = await buildDB();
    db.exec('SELECT * FROM patient_documents_text', (e, r) => {
      console.log(e, r)
    })
  } catch (e) {
    return dialog.showMessageBox({
      type: 'error',
      buttons: [ 'Close' ],
      title: 'Fatal Error',
      message: `A fatal error occured during load.\nThe application will now exit.`,
      detail: e.message
    }, () => {
      mainWin = null;
      app.quit();
    })
  }
  mainWin = new BrowserWindow({ width: 800, height: 600 })
  mainWin.loadFile(__dirname + '/../source/main.html')

  mainWin.on('closed', () => {
    mainWin = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWin === null) {
    createWindow()
  }
})
