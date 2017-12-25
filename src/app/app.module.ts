import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { MyApp } from './app.component';
import { UtilService } from '../providers/util.service';
import { VideoData } from '../providers/video-data';
import { Auth } from '../providers/auth';
import { firebaseConfig } from '../firebaseConfig';
import { NgxElectronModule } from 'ngx-electron';

@NgModule({
  declarations: [
    MyApp,  
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    NgxElectronModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    StatusBar,
    SplashScreen,
    UtilService,    
    VideoData,  
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    Auth   
  ]
})
export class AppModule {}
