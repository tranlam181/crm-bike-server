import { Component, ViewChild, HostListener } from '@angular/core';
import { Platform, Nav, MenuController, ModalController, Events, LoadingController, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoginPage } from '../pages/login/login';
import { ApiStorageService } from '../services/apiStorageService';
import { ApiAuthService } from '../services/apiAuthService';
import { HomeMenuPage } from '../pages/home-menu/home-menu';
import { OwnerImagesPage } from '../pages/owner-images/owner-images';

import { ApiImageService } from '../services/apiImageService';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { InvoicePage } from '../pages/invoice/invoice';
import { CustomerPage } from '../pages/customer/customer';
import { ApiContactService } from '../services/apiContactService';
import { ApiChatService } from '../services/apiChatService';
import { ApiResourceService } from '../services/apiResourceServices';
import { ParametersPage } from '../pages/parameters/parameters';
import { ReportPage } from '../pages/report/report';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) navCtrl: Nav;

  //ham nhan key press tren web
  keyCode: any;
  @HostListener('document:keyup', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.keyCode = event.keyCode;
    //console.log('key',this.keyCode);
    //se cho tat ca cac hotkey go duoc
  }

  rootPage: any = HomeMenuPage;

  treeMenu = [];
  callbackTreeMenu: any;
  
  userInfo: any;
  token: any;

  keyPair: any;

  constructor(
    private menuCtrl: MenuController, //goi trong callback
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private apiStorage: ApiStorageService,
    private apiImage: ApiImageService,
    private apiAuth: ApiAuthService,
    private apiContact: ApiContactService,
    private apiChat: ApiChatService,
    private events: Events,
    private inAppBrowser: InAppBrowser, //goi trong callback
    private platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen
  ) {
    this.platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  ngOnInit() {

    this.callbackTreeMenu = this.callbackTree;

    this.ionViewDidLoad_main();

    this.apiAuth.generatorKeyPairDevice()
    .then(key=>{
      this.keyPair = key;
      //console.log('key resolve',this.keyPair);
    });

  }

  ionViewDidLoad_main() {
    
    this.checkTokenLogin();

    this.events.subscribe('user-log-in-ok', (() => {
      this.checkTokenLogin();
    }));

    this.events.subscribe('user-log-out-ok', (() => {
      this.checkTokenLogin();
    }));

  }

  /**
   * login ok get image and background
   * add to contacts
   */
  async userChangeImage() {
    //du lieu da duoc dang ky 
    if (this.userInfo.data) {
      try {
          this.userInfo.data.image = await this.apiImage
          .createBase64Image(ApiStorageService.mediaServer + "/db/get-private?func=avatar&token=" + this.apiStorage.getToken(), 120)
        
          this.userInfo.data.background = await this.apiImage
           .createBase64Image(ApiStorageService.mediaServer + "/db/get-private?func=background&token=" + this.apiStorage.getToken(), 300)
      } catch (e) { }

    } else {
      //du lieu chua dang ky user 
      //yeu cau dang ky user
      this.navCtrl.push(LoginPage);
    }

  }

  checkTokenLogin() {
    this.token = this.apiStorage.getToken();
    if (this.token) {

      let loading = this.loadingCtrl.create({
        content: 'Đợi xác thực...'
      });
      loading.present();

      this.apiAuth.authorize
        (this.token)
        .then(async data => {
              
              this.userInfo = data.user_info;
              //Tiêm token cho các phiên làm việc lấy số liệu cần xác thực
              if (this.userInfo && this.userInfo.data) {

                this.apiAuth.injectToken();
                //thay doi anh dai dien va anh background
                this.userChangeImage();
                //login ok ... contacts, friends, ids, pass
                //await this.apiContact.delay(1000); //doi 1 giay de lay het anh
                //ban dau moi khoi tao chua co Friend, ta moi khoi tao khi nao co thi moi di tiep
                let friends = await this.apiContact.prepareFriends(this.userInfo);
      
                this.apiChat.initChatting(this.token,this.userInfo, friends);

              } else {

                this.navCtrl.push(LoginPage);

              }
              this.resetTreeMenu();
              loading.dismiss();
        })
        .catch(err => {
          this.resetTreeMenu();
          loading.dismiss();
        });
    } else {
      this.userInfo = undefined;
      this.resetTreeMenu();
    }

  }

  getPage(stringPage){
    let page = this.rootPage;
    switch(stringPage) {
      case "HomeMenuPage":
        page = HomeMenuPage;
        break;
      case "InvoicePage":
        page = InvoicePage;
        break;
      case "CustomerPage":
        page = CustomerPage;
        break;
      case "LoginPage":
        page = LoginPage;
        break;
      case "ReportPage":
        page = ReportPage;
        break;
      case "ParametersPage":
        page = ParametersPage;
        break;
      default:
        page = HomeMenuPage;
    }
    return page;
  }
  

  resetTreeMenu() {

    //tuy thuoc vao tung user se co menu khac nhau


    if (this.userInfo) {

      this.treeMenu = [
        {
          name: "Trang chủ",
          size: "1.3em",
          click: true,
          next: this.rootPage,
          icon: "home"
        }
        ,
        {
          name: "Quản lý hóa đơn",
          size: "1.3em",
          click: true,
          next: this.getPage('InvoicePage'),
          icon: "list-box"
        }
        ,
        {
          name: "Khách hàng",
          size: "1.3em",
          click: true,
          next: this.getPage('CustomerPage'),
          icon: "people"
        }
        ,
        {
          name: "Login",
          size: "1.3em",
          click: true,
          next: this.getPage('LoginPage'),
          icon: "log-in"
        }
      ]
    }else{
      this.treeMenu = [
          {
            name: "Trang chủ",
            size: "1.3em",
            click: true,
            next: this.rootPage,
            icon: "home"
          }
        ]
    }

    //bao hieu da login xong
    this.events.publish('event-main-login-checked', {
      token: this.token,
      user: this.userInfo
    });

  }

  callbackTree = function (item, idx, parent, isMore: boolean) {
    if (item.visible) {
      parent.forEach((el, i) => {
        if (idx !== i) this.expandCollapseAll(el, false)
      })
    }

    if (isMore) {
      if (item.next) {
        this.navCtrl.push(item.next,{parent:this});
        this.menuCtrl.close();
        /* if (item.next === this.rootPage) {
          //lam gi voi trang chu??? khong can
        } */

      } else if (item.in_app_browser && item.url) {
        //mo kieu new window
        var target = "_blank"; //mo trong inappbrowser
        var options = "hidden=no,toolbar=yes,location=yes,presentationstyle=fullscreen,clearcache=yes,clearsessioncache=yes";
        this.inAppBrowser.create(item.url, target, options);

      } else if (item.popup_iframe && item.url) {

        if (this.platform.is('ios')) {
          //mo kieu popup cua ios doc link
          this.inAppBrowser.create(item.url, '_blank');
        } else {
          //mo keu popup
          this.openModal(item.popup_iframe
            , {
              parent: this,
              link: item.url
            });
        }

      } else if (item.url) {
        //neu ios, browser, android??
        if (this.platform.is('ios')) {
          this.inAppBrowser.create(item.url);
        } else {
          window.open(item.url, '_system');
        }
      }
    }

  }.bind(this)

  onClickUser() {
    this.navCtrl.push(LoginPage);
    this.menuCtrl.close();
  }


  callbackChangeImage = function (res: any) {
    return new Promise((resolve, reject) => {
      this.userChangeImage();
      resolve({ next: 'CLOSE' })
    })
  }.bind(this)

  onClickUserImage(func) {
    this.openModal(OwnerImagesPage,
      {
        parent: this
        , func: func
        , callback: this.callbackChangeImage
      });
  }

  onClickLogin() {
    this.navCtrl.push(LoginPage);
    this.menuCtrl.close();
  }

  onClickHeader(btn) {
    if (btn.next === "EXPAND") this.treeMenu.forEach(el => this.expandCollapseAll(el, true))
    if (btn.next === "COLLAPSE") this.treeMenu.forEach(el => this.expandCollapseAll(el, false))
  }

  expandCollapseAll(el, isExpand: boolean) {
    if (el.subs) {
      el.visible = isExpand;
      el.subs.forEach(el1 => {
        this.expandCollapseAll(el1, isExpand)
      })
    }
  }

  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }
  

}

