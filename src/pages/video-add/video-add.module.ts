import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VideoAddPage } from './video-add';
import { FileDropModule } from 'ngx-file-drop';
import { PipesModule } from '../../pipes/fileSizeModule';

@NgModule({
  declarations: [
    VideoAddPage      
  ],
  imports: [
    FileDropModule,
    PipesModule,
    IonicPageModule.forChild(VideoAddPage)
  ],
})
export class VideoAddPageModule {}
