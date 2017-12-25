import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class Auth {
  user$: Observable<firebase.User>

  constructor( private afAuth: AngularFireAuth) {   
    this.user$ = this.afAuth.authState;
  }

  login(email: string, password: string) {
     return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    this.afAuth.auth.signOut();
  }
}
