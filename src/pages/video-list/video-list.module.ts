import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VideoListPage } from './video-list';
import { RemoveGUIDPipe } from '../../pipes/removeGUID';
import { PipesModule } from '../../pipes/fileSizeModule';

@NgModule({
  declarations: [
    VideoListPage,
    RemoveGUIDPipe
  ],
  imports: [  
    PipesModule,   
    IonicPageModule.forChild(VideoListPage),
  ]
})
export class VideoListPageModule {}
