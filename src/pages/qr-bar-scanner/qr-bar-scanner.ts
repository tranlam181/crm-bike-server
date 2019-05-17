import { Component } from '@angular/core';

import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ViewController, NavParams, AlertController } from 'ionic-angular';
import { ApiLocationService } from '../../services/apiLocationService';

@Component({
  selector: 'page-qr-bar-scanner',
  templateUrl: 'qr-bar-scanner.html'
})
export class QrBarScannerPage {

  parent: any;
  codeType: any;
  isShowValue: boolean = false;

  scannedData: any;

  constructor(
    private scanner: BarcodeScanner
    , private viewCtrl: ViewController
    , private navParams: NavParams
    , private apiLocation: ApiLocationService
    , private alertController: AlertController
  ) { }

  ngOnInit() {

    this.codeType = this.navParams.get("type");
    this.isShowValue = this.navParams.get("visible");
    this.parent = this.navParams.get("parent");

  }

  onClickScan() {
    this.scanCode();
  }

  onClickClose() {
    if (this.parent) this.viewCtrl.dismiss()
  }

  scanCode() {

    if (this.apiLocation.getPlatform().is_cordova) {

      this.scanner.scan()
        .then(data => {
          this.scannedData = data;
        })
        .catch(err => {
          console.log('err', err);
        })
    } else {

      this.alertController.create({
        title: 'Alert',
        subTitle: 'For Administrator',
        message: "Bạn phải cài đặt ứng dụng mới sử dụng được chức năng này",
        buttons: ['OK']
      }).present();
      
    }
  }

}
