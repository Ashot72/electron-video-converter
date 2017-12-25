import { Component, NgZone, ViewChild, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { IonicPage, NavController, NavParams, 
         ModalController, Refresher, Searchbar } from 'ionic-angular';
import 'intl'; // IOS pipe issue
import 'intl/locale-data/jsonp/en';
import { ISubscription } from "rxjs/Subscription";
import { ElectronService } from 'ngx-electron';
import * as moment from 'moment';
import { UtilService } from '../../providers/util.service';
import { IVideo } from '../../interfaces/video';
import categories from '../../categories';
import { VideoData } from '../../providers/video-data';
import { Auth } from '../../providers/auth';

declare var path: any; 

@IonicPage({
  segment: 'videos/:cid'
})
@Component({
  selector: 'page-video-list',
  templateUrl: 'video-list.html',
})
export class VideoListPage {
  @ViewChild('searchbar') searchbar: Searchbar;
  @ViewChildren('progressBars') progressBars: QueryList<any>

  queryText:string = '';
  cid: number;
  title: string;
  videos: IVideo[] = [];
  isLoggedIn: boolean = false;
  authSubscription: ISubscription;
  videoSubscription: ISubscription;

  constructor(
         public zone: NgZone,
         public navCtrl: NavController, 
         public navParams: NavParams,
         public modalCtrl: ModalController,
         public videoData: VideoData,
         public utilSrv: UtilService,
         public auth: Auth,
         public electron: ElectronService,
         public renderer : Renderer2
         ) {          
      this.cid = parseInt(navParams.data.cid, 10);
      this.title = categories[this.cid - 1]['title'];
  }

  ionViewDidLoad() {      
    // We checked user permission in app.components.ts file but we have to check here as well.
    // The reason is that we use deep linking and if the user tries to access the URL directly such as http://localhost:8100/#/videos/1
    // he will get firebase database access error. 
    this.authSubscription = this.auth.user$.subscribe(user => user ? this.getVideos() : this.navCtrl.setRoot('LoginPage'));
 }

 get isElectronApp() {
   return this.electron.isElectronApp;
 }

  getVideos(refresher?: Refresher, fromSearch: boolean = false) {              
        let loader = this.utilSrv.loader('Loading videos...');
        loader.present().then(() => {                  
          this.videoSubscription = this.videoData.getVideos(this.cid, this.queryText).subscribe((videos: IVideo[]) => {                 
              this.videos = videos.map((video, index) => Object.assign({ i: index }, video));  

              loader.dismiss();
              if (refresher) { refresher.complete(); }   

              if (fromSearch) {          
                setTimeout(_ => this.searchbar.setFocus(), 1000);
              }            
          });              
    }) 
    .catch(err => {
      loader.dismiss();
      this.utilSrv.doAlert('Get Videos', `Error  videos: ${err.message || 'Server error'}`);
    });               
  }

  doRefresh(refresher: Refresher) {
     this.getVideos(refresher);
  }

  addVideo(event: any) {
    this.modalCtrl.create('VideoAddPage', { cid: this.cid }).present();
  }

  onChange(video: IVideo, event: any) {   
    const ext = video.name.substr(video.name.lastIndexOf('.') + 1);
    if (event.toLowerCase() === ext.toLowerCase()) {  
        video.type = ''; 
        this.utilSrv.doAlert('Video type selection', `File '${video.name.substring(37)}' already has 
                                      '${ext}' extension. Please select another type. `).present();      
               
    }   
  }

  convertVideos(event: any) {
    const vodesToConvert: IVideo[] = this.videos.filter(video => video.type && video.type !== '');
    if (vodesToConvert.length > 0) {         
          let loader = this.utilSrv.loader('Downloading videos...');
          loader.present().then(() => {  
             this.videoData.downloadVideos(vodesToConvert)
            .then(() => {
               loader.dismiss();
               this.utilSrv.getToast(`All videos successfully downloaded. Converting videos ...`).present();   

                 // send videos to convert       
                 this.electron.ipcRenderer.send('videos:convert', { videos: vodesToConvert });   

                 // get conversion info
                 const progressBars = this.progressBars.toArray();         
                 this.electron.ipcRenderer.on('conversion:progress', (event, { video, timemark, duration }) => {                 
                   if (timemark) {                   
                       const progress = `${(Math.ceil(moment.duration(timemark).asSeconds() / moment.duration(duration).asSeconds() * 100 ))}`; 

                       // Should make progress bar visible in advance to see initial values clearly      
                       progressBars[video.i].nativeElement.style.display = 'block';       
                       this.zone.run(() => this.renderer.setAttribute(progressBars[video.i].nativeElement, "value", progress));                      
                   }
                 });

                 // conversion complete
                 this.electron.ipcRenderer.on('conversions:complete', (event, args) => 
                    this.utilSrv.getToast(`Videos converted successfully.`).present()
                 );
            })
            .catch(err => {
               loader.dismiss();
               this.utilSrv.doAlert('Download Videos(s)', `Error while downloading videos: ${err.message || 'Server error'}`).present()
            })
          });                   
    } else {
       this.utilSrv.doAlert('Convert Video', 'Please select video(s) type to convert.').present();
    }   
  }

 downloadVideo(video: IVideo) {   
   this.utilSrv.getToast(`Downloading video '${video.name.substring(37)}'.`).present()
   this.videoData.downloadVideo(video).then(url => window.location.href = url);  
 }

  deleteVideo(video: IVideo) {    
     this.utilSrv.doAlertConfirm('Confirm', `Are you sure you want to delete '${video.name.substring(37)}' video ?`, (res: boolean) => {
      if (res) {
        this.videoData.deleteVideo(video)
       .then(() => this.utilSrv.getToast(`Video '${video.name.substring(37)}' successfully deleted.`).present())
       .catch(err => this.utilSrv.doAlert('Delete Video', `Error while deleting video: ${err.message || 'Server error'}`).present());  
      }
     }).present();      
  }

  openFolder(event: any) {
    const documentsPath = this.electron.remote.app.getPath('videos');
    this.electron.shell.openExternal(path.join(documentsPath, 'converter'))
  }

  ionViewWillUnload() {     
    this.authSubscription.unsubscribe();
    if (this.videoSubscription) {
      this.videoSubscription.unsubscribe();
    }
  }
}
