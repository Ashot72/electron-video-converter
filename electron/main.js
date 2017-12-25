const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
const ffmpeg = require('fluent-ffmpeg');

let win, splashScreen;
const iconPath = path.join(__dirname, 'images'); 
const isDarwin = process.platform === 'darwin'; 
const videosPath = path.join(app.getPath('videos'), 'converter');

if (isDarwin) {
  // Setting ffmpeg path to ffmpeg binary for os x so that ffmpeg can be packaged with the app.
  ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");
}

createVideosDirectory = () => {
  const showError = err => err && dialog.showErrorBox('Directory Create Error', err.message);

  fs.stat(videosPath, (err, stats) => {    
    if (err && err.code !== 'ENOENT') {
        return showError(err);
    } else if (err || !stats.isDirectory()) { 
        fs.mkdir(videosPath, showError);  
    }
  });
}

createSplashScreen = () => {
    splashScreen = new BrowserWindow({
        width: 400,
        height: 400,
        titleBarStyle: 'hidden',
        alwaysOnTop: true,
        closable: false,     
        skipTaskbar: true,
        show: true,
        minimizable: false,
        maximizible: false,
        sizable: false,   
        center: true,
        frame: false        
    });

    // web dev option
    // splashScreen.loadURL('http://localhost:8100/assets/imgs/videosplash.png');

     splashScreen.loadURL(url.format({
      pathname: path.join(__dirname, '../www/assets/imgs/videosplash.png'),
      protocol: 'file:',
      slashes: true
    }));
}

createWindow = () => {
    createSplashScreen();
    createVideosDirectory();

    win = new BrowserWindow({
        width: 1400,
        height: 800,
        title: 'Video Converter',
        icon: path.join(iconPath, isDarwin ? 'icon.png' : 'icon.ico'),
        show: false,
        webPreferences: { backgroundThrottling: false }        
    });

    // web dev option
    //  win.loadURL('http://localhost:8100');

    win.loadURL(url.format({
      pathname: path.join(__dirname, '../www/index.html'),
      protocol: 'file:',
      slashes: true
    })); 

    win.once('ready-to-show', () => {
        if(splashScreen && splashScreen.isVisible()) {
            splashScreen.destroy();
            splashScreen = null;
        }
        if(!win.isVisible()) win.show();
    });

    win.on('closed', () => win = null);
}

app.on('ready', createWindow);

// Only MacOS has a dock property.
if(app.dock) {
   app.dock.setIcon(path.join(iconPath, 'icon.png'));
}

app.on('window-all-closed', () => {
  // On macOS it is common for applicatins and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if(!isDarwin) { app.quit(); }
});

app.on('activate', () => {
  if(win === null) {
    // On macOS it's common to re-create a window in the app 
    // when the doc icon is clicked and there are no toher window open
    createWindow();
  }
});

ipcMain.on('videos:convert',(event, { videos }) => {
   const promises = (videos.map(video => {     
       const outputName = video.name.split('.')[0];
       const outputPath = path.join(videosPath, `${outputName}.${video.type}`);
       
       return new Promise((resolve, reject) => {
         let duration;
         ffmpeg(path.join(videosPath, video.name)) 
            .output(outputPath)
            .on('codecData', data => duration = data.duration)  
            .on('progress', ({ timemark }) => win.webContents.send('conversion:progress', { video, timemark, duration }))     
            .on('error', err => reject(err))
            .on('end', () => resolve('Video conversion complete.'))  
            .run();          
       });
   })); 

   Promise.all(promises)
     .then(() => {
         win.webContents.send('conversions:complete');
         shell.openExternal(videosPath);
     })    
     .catch(err => dialog.showErrorBox('Video conversion error', err.message));
});