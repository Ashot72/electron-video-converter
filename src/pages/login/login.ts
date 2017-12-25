import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { UtilService } from '../../providers/util.service';
import { IUser } from '../../interfaces/user';
import { Auth } from '../../providers/auth';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  user: IUser = {} as any;
  submitted: boolean = false;

  constructor(
     public utilSrv: UtilService,
     public auth: Auth
     ) { }

  submit(form: NgForm) {
    this.submitted = true;

    if (form.valid) {             
      this.submitted = false;  
      this.login();   
    } 
  }

  login() {
    let loader = this.utilSrv.loader('Logining...');
    loader.present().then(() => {
       this.auth.login(this.user.email, this.user.password)
       .then(() => loader.dismiss())  
       .catch(err => {
          loader.dismiss();
          this.utilSrv.doAlert('Login Error', `Error while logging in: ${err.message || 'Server error'}`).present();
      });    
    });
   
  }
}
