import { Component, ViewChild, OnInit } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { VideoListPage } from '../pages/video-list/video-list';
import categories from '../categories';
import { IPage } from '../interfaces/page';
import { Auth } from '../providers/auth';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnInit {
  @ViewChild(Nav) nav: Nav;

  appPages:IPage[] = [];
  rootPage: string;
  isLoggedIn: boolean = false;
 
  constructor(
    public platform: Platform, 
    public statusBar: StatusBar, 
    public splashScreen: SplashScreen,
    public auth: Auth
    ) {
    this.initializeApp();
  }

  ngOnInit() { 
    this.addCategories();
    this.userAuth();   
  }

  addCategories() {
     categories.forEach((category, index) => {
        const { title, icon } = category;
        this.appPages.push({ title, name: 'VideoListPage', cid: (index + 1), icon });
     });
  }

  userAuth() {
      this.auth.user$.subscribe(user => {  
        this.isLoggedIn = user ? true : false;
        if (this.isInitialPage()) {        
          this.setRoot(this.appPages[0]);          
        }
      });    
  }

  isInitialPage() {
     const href = document.location.href;
     const lastFragment:any = href.split('/')[href.split('/').length-1];
     return (isNaN(lastFragment) || lastFragment === '');
  }

  initializeApp() {
    this.platform.ready().then(() => {  
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page: IPage) {
     this.setRoot(page);   
  }

  setRoot(page) {      
      if (this.isLoggedIn) {            
          const { cid, name } = page;      
          this.nav.setRoot(name, { cid }).catch((err: any) => {
            console.log(`Didn't set nav root: ${err}`);
          });          
      } else {               
          this.nav.setRoot('LoginPage').catch((err: any) => {
            console.log(`Didn't set nav root: ${err}`);
          });          
      }   
  }

  isCategoryActive(page: IPage) {
    const activeNav = this.nav.getActive();

    if (activeNav && activeNav.name === page.name) {
      const videoListPage = activeNav.instance as VideoListPage;
      const cid = videoListPage.navParams.data.cid || this.appPages[0].cid;

      if (cid == page.cid) return page.icon.replace('off', 'on');
    }
    return page.icon;
  }

  login() {     
    this.setRoot(this.appPages[0]); 
  }

  logout(event: any) {
    this.auth.logout();
  }
}


