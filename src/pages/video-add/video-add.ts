import { Component, NgZone, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { IonicPage, ViewController, NavController, NavParams } from 'ionic-angular';
import { VideoData } from '../../providers/video-data';
import { UtilService } from '../../providers/util.service';

@IonicPage()
@Component({
  selector: 'page-video-add',
  templateUrl: 'video-add.html',
})
export class VideoAddPage {
  @ViewChildren('progressBars') progressBars: QueryList<any>

  files: any = [];
  isDisabled: boolean = false;
  fileExts: string[] = ['avi', 'flv', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 
                        'ogg', 'ogv', 'vob', 'webm', 'wmv'];

  constructor(
        public zone: NgZone,
        public navCtrl: NavController, 
        public navParams: NavParams,
        public viewCtrl: ViewController,
        public videoData: VideoData,
        public utilSrv: UtilService,
        public renderer : Renderer2
        ) { 
          this.isDisabled = false;
        }

  dropped(event: any) {
    for (let file of event.files) {   
      file.fileEntry.file(info => {
        this.addFiles(info);          
      });
    }
  }

  selected(event: any) {
    const target = event.target || event.srcElement;
    const files = target.files;
    for (let file of files) {
      this.addFiles(file);  
    }
  }

  fileExt = (name) => {
    return name.substr(name.lastIndexOf('.') + 1).toLowerCase();
  }

  addFiles(file: any) {     
    // file type is browser specific and can be empty. We quess the file type form extension
    if (file.type.includes('video/') || (file.type === '' && this.fileExts.includes(this.fileExt(file.name)))) {
        this.zone.run(() => {          
          if (this.files.some(fl => fl.name === file.name)) {           
             this.utilSrv.doAlert('Warning', `File '${file.name}' has already been added.`).present();
          } else {
             this.files.push(file);
          }          
         });
      }  
  }

  removeFile(file: any) {
    this.utilSrv.doAlertConfirm('Confirm', `Are you sure you want to delete '${file.name}' file.`, (res: boolean) => {
      if (res) {
        this.removeFileFromArray(file);  
      }
    }).present();   
  }

  removeFileFromArray(file: any) {
    for (let i = 0; i < this.files.length; i++) 
    {
      if (this.files[i].name === file.name) {
          this.files.splice(i, 1);
          break;
      }
    } 
  }

  upload() {   
    const progressBars = this.progressBars.toArray();
    const cid: number = parseInt(this.navParams.get('cid'), 10);
  
    this.isDisabled = true;
    this.videoData.uploadVideos(cid, this.files, ((error, file, i, progress) => {      
      if (error) {
         this.utilSrv.doAlert('Error', `Error while uploading files: '${error}'.`).present();
         this.isDisabled = false;
      } else if (progress) {
         this.renderer.setAttribute(progressBars[i].nativeElement, "value", progress);        
      } else {
         this.removeFileFromArray(file);     
      }      
    }));
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
