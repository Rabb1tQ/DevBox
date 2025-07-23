const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

function getIconPath() {
  const iconPaths = [
    path.join(__dirname, '../public/favicon.ico'),
    path.join(__dirname, '../dist/favicon.ico'),
    path.join(process.resourcesPath, 'public/favicon.ico')
  ]
  
  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      console.log('找到图标路径:', iconPath)
      return iconPath
    }
  }
  console.warn('未找到图标文件')
  return undefined
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getIconPath(),
    frame: true,  // 保留窗口边框
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 移除菜单栏
  win.removeMenu()

  // 开发环境使用本地服务器，生产环境使用打包后的文件
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8080')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
