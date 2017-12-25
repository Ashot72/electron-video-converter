import {Injectable} from "@angular/core";
import {AlertController, ToastController, LoadingController} from "ionic-angular";

@Injectable()
export class UtilService {

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  doAlert(title, subTitle, buttonText = 'Ok') {
    return this.alertController.create({ title, subTitle, buttons: [buttonText] });
  }

  doAlertConfirm(title, subTitle, cb) {
    return this.alertController.create({ title, subTitle, 
      buttons: [
        { text: 'No', role: 'cancel', handler: () => { cb(0); } },
        { text: 'Yes', handler: () => { cb(1); }}
      ]});
  }

  getToast(message, duration = 3000) {    
    return this.toastController.create({ message, duration });
  }

  loader(content: string) {
    return this.loadingController.create({ content });
  }
}
