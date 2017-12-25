import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/storage';
import { AngularFireDatabase } from 'angularfire2/database';
import { UUID } from 'angular2-uuid';
import { Observable } from 'rxjs/Observable';
import { ElectronService } from 'ngx-electron';
import { ISnapshot } from '../interfaces/snapshot';
import { IVideo } from '../interfaces/video';

// if we require node module here (e.g. const fs = require('fs');) it will not work and will be an empty object.
// The reason is that we include server side modules in Angular which is for browser.
// Electron requires NodeJS and the browser can't access the file system, only the server can.
// But Electron renders index.html file using node so we can require electron via the index.html
// In index.html we have var fs = require('fs'). It is in try/catch block. This way we will not get an exception
// if we run the app in browser (not in Electron shell) as requiring modules is only in NodeJS.
declare var fs: any;  
declare var path: any;  
declare var https: any;  

@Injectable()
export class VideoData {

  constructor(
      private db: AngularFireDatabase,
      public electron: ElectronService
      ) { }

  getVideos(catId: number, queryText: string = ''): Observable<IVideo[]> {    
    return this.db.list('files', ref => ref.orderByChild('catId').equalTo(catId))
    .snapshotChanges().map(actions => 
      actions.map(action => {      
        const $key = action.payload.key;
        const data = action.payload.val();        
        return { $key, ...data };
      })     
      .filter(video => video.name.toLowerCase().substring(37).includes(queryText.toLowerCase().trim()))
      .reverse()
    )
  }

  uploadVideos(catId: number, files: any, cb) {
    Promise.all(files.map((file, i) => {
       const uuid = UUID.UUID();

       return firebase.storage().ref(`${uuid}_${file.name}`).put(file)    
        .on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot: ISnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;          
          cb(null, null, i, progress.toFixed(2));      
        }, error => cb(error), 
           () => this.db.list('files').push({
               catId, 
               size: file.size, 
               name: `${uuid}_${file.name}`, 
               date: new Date().toISOString() })
            .then(() => cb(null, file)));        
    }));
  }

  downloadVideo(video: IVideo): Promise<any> { 
      return firebase.storage().ref(video.name).getDownloadURL().then(url => url);   
  }

 downloadVideos(videos: IVideo[]): Promise<any> {   
     const documentsPath = this.electron.remote.app.getPath('videos');
     this.removeFiles(path.join(documentsPath, 'converter'));

    return Promise.all(videos.map(video => {
      const storage = firebase.storage().ref(video.name);     
      const writeFileName = path.join(documentsPath, 'converter', video.name);

      return new Promise(resolve => {
        storage.getDownloadURL().then(url => {               
          const file = fs.createWriteStream(writeFileName);
          https.get(url, stream => stream.pipe(file).on('close', () => resolve()));             
        });
      });
    }));
  }

  deleteVideo(video: IVideo): Promise<any> {
     return this.db.list('files').remove(video.$key).then(() => firebase.storage().ref(video.name).delete());     
  }

  private removeFiles = dirPath => {
    let files;
    try { files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files && files.length > 0) {   
      for (let file of files) {
        let filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);        
        }        
      }
    }
  }
}
