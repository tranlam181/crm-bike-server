/**
 * trang nay se popup thong tin barcode hoac qrcode
 * du lieu dau vao duoc truyen 
 */

import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';


@Component({
  selector: 'page-qr-bar-code',
  templateUrl: 'qr-bar-code.html'
})
export class QrBarCodePage {
  
  parent:any;
  codeType:any;
  isShowValue:boolean= false;

  qrBarData:any;

  qrCode:any;

  barCode:any;

  constructor(
      private viewCtrl: ViewController
    , private navParams: NavParams
  ) {}

  ngOnInit(){
    this.qrBarData = this.navParams.get("data");
    this.codeType = this.navParams.get("type");
    this.isShowValue = this.navParams.get("visible");
    this.parent = this.navParams.get("parent");

    this.createCode();
  }

  onClickClose(){
    if (this.parent) this.viewCtrl.dismiss()
  }

  createCode() {
    if (this.codeType==="BAR"){
      this.barCode = this.qrBarData;
    }else{
      this.qrCode = this.qrBarData;
    }
  }

}
