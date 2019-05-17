import { Component } from '@angular/core';
import { NavController, ModalController, Platform, LoadingController, AlertController, Events } from 'ionic-angular';

import { DynamicFormMobilePage } from '../dynamic-form-mobile/dynamic-form-mobile';
import { ApiHttpPublicService } from '../../services/apiHttpPublicServices';
import { DynamicFormWebPage } from '../dynamic-form-web/dynamic-form-web';
import { ApiStorageService } from '../../services/apiStorageService';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiMediaService } from '../../services/apiMediaService';
import { HomeMenuPage } from '../home-menu/home-menu';
import { QrBarCodePage } from '../qr-bar-code/qr-bar-code';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  userInfo:any;
  token: any;

  constructor(
    private navCtrl: NavController
    , private pubService: ApiHttpPublicService
    , private auth: ApiAuthService
    , private apiStorageService: ApiStorageService
    , private apiMedia: ApiMediaService //goi trong callback
    , private events: Events    //goi trong callback
    , private platform: Platform
    , private modalCtrl: ModalController
    , private loadingCtrl: LoadingController
    , private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    //console.log('2. ngOnInit Home');
    this.checkTokenLogin();
  }


  checkTokenLogin(){
    
    this.token = this.apiStorageService.getToken();

    if (this.token) {

      let loading = this.loadingCtrl.create({
        content: 'Đang kiểm tra từ máy chủ xác thực ...'
      });
      loading.present();

      this.auth.authorize
        (this.token)
        .then(data => {
          
          if (data.user_info){

              
              let userInfo = this.auth.getUserInfo();
              //neu co data tuc co khai bao user roi
              if (userInfo.data) this.auth.injectToken(); //Tiêm token cho các phiên làm việc lấy số liệu cần xác thực
              this.callLoginOk(data.user_info);
  
              loading.dismiss();
            
          }else{
            console.log('no User Info',data);
            loading.dismiss();
            throw "no data.user_info";
          }

        })
        .catch(err => {
          loading.dismiss();
          console.log('Token invalid: ', err);
          this.auth.deleteToken();
          this.ionViewDidLoad_Login();

        });
    } else {
      this.ionViewDidLoad_Login();
    }
  }


  /**
   * Khi xac thuc duoc otp thong tin nay se hien thi
   * Tuy nhien, neu userInfo.data khong co du lieu, tuc chua dang ky user
   * thi se tu dong bat len cua so nhap thong tin ca nhan xem nhu chua cho phep login
   * @param userInfo 
   */
  callLoginOk(userInfo) {

    this.userInfo = userInfo;
    
    if (userInfo.data){

      let data = {
        title: "Đã Login"
        , buttons: [
          {color:"primary", icon: "barcode", command: "CODE-GENERATOR" , next:"CALLBACK"} 
        ]
        , items: [
          {
            type: "details",
            details: [
              {
                name: "Username(*)",
                value: userInfo.username
              },
              {
                name: "Họ và tên(*)",
                value: userInfo.data?userInfo.data.fullname:""
              },
              {
                name: "Nickname(*)",
                value: userInfo.data?userInfo.data.nickname:""
              },
              {
                name: "Địa chỉ(*)",
                value: userInfo.data?userInfo.data.address:""
              },
              {
                name: "Điện thoại(*)",
                value: userInfo.data?userInfo.data.phone:""
              },
              {
                name: "Email(*)",
                value: userInfo.data?userInfo.data.email:""
              },
              {
                name: "Địa chỉ ip",
                value: userInfo.req_ip
              },
              {
                name: "Địa chỉ nguồn",
                value: userInfo.origin
              },
              {
                name: "Thiết bị",
                value: userInfo.req_device
              },
              {
                name: "Mức xác thực",
                value: userInfo.level
              },
              {
                name: "Thời gian khởi tạo",
                value: userInfo.iat * 1000,
                pipe_date: "HH:mm:ss dd/MM/yyyy"
              },
              {
                name: "Thời gian hết hạn",
                value: userInfo.exp * 1000,
                pipe_date: "HH:mm:ss dd/MM/yyyy"
              },
              {
                name: "Giờ GMT",
                value: userInfo.local_time,
                pipe_date: "HH:mm:ss dd/MM/yyyy"
              }
            ]
          },
          { 
            type: "button"
          , options: [
            { name: "Sửa (*)", command:"EDIT" , next: "CALLBACK"}
            ,{ name: "Logout", command:"EXIT" , next: "CALLBACK"}
            ,{ name: "Quay về", command:"HOME" , next: "CALLBACK"}
          ]
        }
        ]
      }
      
      this.navCtrl.push(DynamicFormWebPage
        , {
          parent: this, //bind this for call
          callback: this.callbackUserInfo,
          step: 'form-user-info',
          form: data
        });
    }else if (this.userInfo){
      //khi chua co thong tin ca nhan
      //yeu cau nhap thong tin ca nhan
      let phoneNumber = this.userInfo.data&&this.userInfo.data.phone?this.userInfo.data.phone:this.userInfo.username;
      phoneNumber = phoneNumber.indexOf('0')===0&&phoneNumber.indexOf('+')<0?phoneNumber:'0'+phoneNumber;

        let data = {
          title: "TẠO THÔNG TIN CÁ NHÂN"
          , home_disable: true //khong cho nut hom
          , items: [
             {          name: "USER " + this.userInfo.username, type: "title"}
            , { key: "nickname", name: "Biệt danh(*)", hint:"Nickname", type: "text", input_type: "text", icon: "heart", value: this.userInfo.data?this.userInfo.data.nickname:"", validators: [{required: true, min: 1}]}
            , { key: "name", name: "Họ và tên (*)", hint:"Họ và tên đầy đủ", type: "text", input_type: "text", icon: "person", value: this.userInfo.data?this.userInfo.data.fullname:"", validators: [{required: true, min: 5}]}
            , { key: "address", name: "Địa chỉ (*)", hint:"Địa chỉ đầy đủ", type: "text", input_type: "text", icon: "pin", value: this.userInfo.data?this.userInfo.data.address:"", validators: [{required: true, min: 5}]}
            , { key: "phone", name: "Điện thoại (*)", hint: "Yêu cầu định dạng số điện thoại nhé", type: "text", input_type: "tel", icon: "call", validators: [{ pattern: "^[0-9]*$" }], value: phoneNumber}
            , { key: "email", name: "email(*)", hint: "Yêu cầu định dạng email nhé", type: "text", input_type: "email", icon: "mail", validators: [{ pattern: "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$" }], value: this.userInfo.data?this.userInfo.data.email:""}
            , { key: "broadcast_status", name: "Quyền riêng tư", hint: "Lựa chọn quyền riêng tư", type: "select", icon: "md-globe", value: this.userInfo.data?this.userInfo.data.broadcast_status:"1", options: [{ name: "Chỉ mình tôi", value: 0 }, { name: "Cho mọi người", value: 1 }, { name: "Chỉ bạn bè tôi", value: 2 }, { name: "Bạn của bạn tôi", value: 3 }]}
            , { 
              type: "button"
            , options: [
                { name: "Logout", command:"EXIT" , next: "CALLBACK"}
              , { name: "Tạo mới", command:"CREATE", url: ApiStorageService.authenticationServer+"/ext-auth/save-user-info", token: this.token, next: "CALLBACK"}
            ]
          }
          ]
        }
        
        this.openModal(DynamicFormWebPage
          , {
            parent: this, //bind this for call
            callback: this.callbackUserInfo,
            step: 'form-user-create',
            form: data
          });

    }

  }


  callEditForm(){
    //truy van thong tin tu may chu boi user nay
    

    if (this.userInfo){
      let phoneNumber = this.userInfo.data&&this.userInfo.data.phone?this.userInfo.data.phone:this.userInfo.username;
      phoneNumber = phoneNumber.indexOf('0')===0&&phoneNumber.indexOf('+')<0?phoneNumber:'0'+phoneNumber;

      let data = {
        title: "Sửa thông tin cá nhân"
        , items: [
           {          name: "USER " + this.userInfo.username, type: "title"}
          , { key: "nickname", name: "Biệt danh(*)", hint:"Nickname", type: "text", input_type: "text", icon: "heart", value: this.userInfo.data?this.userInfo.data.nickname:"", validators: [{required: true, min: 1}]}
          , { key: "name", name: "Họ và tên (*)", hint:"Họ và tên đầy đủ", type: "text", input_type: "text", icon: "person", value: this.userInfo.data?this.userInfo.data.fullname:"", validators: [{required: true, min: 5}]}
          , { key: "address", name: "Địa chỉ (*)", hint:"Địa chỉ đầy đủ", type: "text", input_type: "text", icon: "pin", value: this.userInfo.data?this.userInfo.data.address:"", validators: [{required: true, min: 5}]}
          , { key: "phone", name: "Điện thoại (*)", hint: "Yêu cầu định dạng số điện thoại nhé", type: "text", input_type: "tel", icon: "call", validators: [{ pattern: "^[0-9]*$" }], value: phoneNumber}
          , { key: "email", name: "email(*)", hint: "Yêu cầu định dạng email nhé", type: "text", input_type: "email", icon: "mail", validators: [{ pattern: "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$" }], value: this.userInfo.data?this.userInfo.data.email:""}
          , { key: "broadcast_status", name: "Quyền riêng tư", hint: "Lựa chọn quyền riêng tư", type: "select", icon: "md-globe", value: this.userInfo.data?this.userInfo.data.broadcast_status:"1", options: [{ name: "Chỉ mình tôi", value: 0 }, { name: "Cho mọi người", value: 1 }, { name: "Chỉ bạn bè tôi", value: 2 }, { name: "Bạn của bạn tôi", value: 3 }]}
          , { 
            type: "button"
          , options: [
            { name: "Bỏ qua", command:"CLOSE" , next: "CLOSE"}
            , { name: "Cập nhập", command:"UPDATE", url: ApiStorageService.authenticationServer+"/ext-auth/save-user-info", token: this.token, next: "CALLBACK"}
          ]
        }
        ]
      }

      this.openModal(DynamicFormWebPage
        , {
          parent: this, //bind this for call
          callback: this.callbackUserInfo,
          step: 'form-user-edit',
          form: data
        });
    }

  }

  callbackUserInfo = function (res) {
    //console.log('Goi logout',res);
    return new Promise((resolve, reject) => {
      if (res.button&&res.button.command==="EXIT"){
        this.auth.deleteToken();
        this.ionViewDidLoad_Login();
        this.events.publish('user-log-out-ok');
        //console.log('Goi logout');
        this.checkTokenLogin(); //kiem tra lai login xem
        resolve({next:"CLOSE"}); //vi dung modal nen phai dong lai

      }

      if (res.button&&res.button.command==="EDIT"){
        this.callEditForm();
      }

      if (res.button&&res.button.command==="HOME"){
        //this.navCtrl.setRoot(HomeMenuPage); //vi push nen khong can dong
        this.navCtrl.popToRoot(); //tro ve trang chu ban dau
      }
      
      if (res.button&&res.button.command==="CREATE"){
        
        //luu token truoc khi goi su kien kiem tra login
        if (this.token) this.apiStorageService.saveToken(this.token);
        this.events.publish('user-log-in-ok');
        this.checkTokenLogin(); //kiem tra lai login xem
        resolve({next:"CLOSE"}); //vi dung modal nen phai dong lai

      } 

      if (res.button&&res.button.command==="UPDATE"){
        
        if (this.token) this.apiStorageService.saveToken(this.token);
        this.events.publish('user-log-in-ok'); 
        this.navCtrl.push(HomeMenuPage);
        resolve({next:"CLOSE"}); //vi dung modal nen phai dong lai

      }else{
        resolve();
      }
      
      if (res.button&&res.button.command==="CODE-GENERATOR"){
        this.openModal(QrBarCodePage
            , {
              parent: this,
              type: 'QR',
              visible: false,
              data: this.token
              });  
      }

      
    });

  }.bind(this);


  ionViewDidLoad_Login() {
    //console.log('3. ionViewDidLoad Home');

    this.pubService.getDataForm('form-phone.json')
      .then(data => {
        if (this.platform.platforms()[0] === 'core') {

          setTimeout(() => {
            this.navCtrl.push(DynamicFormWebPage
              , {
                parent: this, //bind this for call
                callback: this.callbackFunction,
                step: 'form-phone',
                form: data
              });
          }, 1000);

        } else {

          this.navCtrl.push(DynamicFormMobilePage
            , {
              parent: this, //bind this for call
              callback: this.callbackFunction,
              step: 'form-phone',
              form: data
            });

        }
      })
      .catch(err => console.log("err ngOnInit()", err))
  }


  /**
   *  ham goi lai gui ket qua new button next
   * @param res 
   */
  callbackFunction = function (res) {
      
    return new Promise((resolve, reject) => {

      if (res && res.error) {
        this.presentAlert('Lỗi:<br>' + JSON.stringify(res.error.error));
        resolve();
      } else if (res && res.step === 'form-phone' && res.data) {
        // console.log('forward data:', res.data.database_out);
        if (res.data.database_out && res.data.database_out.status === 0) {
          this.presentAlert('Chú ý:<br>' + JSON.stringify(res));
        }
        //gui nhu mot button forward
        resolve({
          next: "NEXT" //mo form tiep theo
          , next_data: {
            step: 'form-key',
            data: //new form 
            {
              items: [
                { name: "Nhập mã OTP", type: "title" }
                , { key: "key", name: "Mã OTP", hint: "Nhập mã OTP gửi đến điện thoại", type: "text", input_type: "text", validators: [{ required: true, min: 6, max: 6, pattern: "^[0-9A-Z]*$" }] }
                , {
                  type: "button"
                  , options: [
                    { name: "Trở về", next: "BACK" }
                    , { name: "Xác nhận OTP", next: "CALLBACK", url: "https://c3.mobifone.vn/api/ext-auth/confirm-key", token: res.data.token }
                  ]
                }]
            }
          }
        });
      } else if (res && res.step === 'form-key' && res.data.token) {
        //lay duoc token
        //ktra token co user, image thi pass new ko thi gui ...
        //console.log('token verified:', res.data.token);
        // neu nhu gai quyet xong
        let loading = this.loadingCtrl.create({
          content: 'Đang xử kiểm tra từ máy chủ Tài nguyên....'
        });
        loading.present();

        this.apiMedia.authorizeFromResource(res.data.token)
          .then(login => {
            //console.log('data', login);
            if (login.status
              && login.user_info
              && login.token
            ) {
              
              this.token = res.data.token;
              //tiem token cho phien xac thuc tiep theo
              
              if (login.user_info.data) {
                this.apiStorageService.saveToken(this.token);
                this.events.publish('user-log-in-ok');
              }
              //da login thanh cong, kiem tra token 
              this.callLoginOk(login.user_info);
              
            } else {
              this.presentAlert('Dữ liệu xác thực không đúng <br>' + JSON.stringify(login))
            }

            loading.dismiss();
            resolve();
          })
          .catch(err => {
            this.presentAlert('Lỗi xác thực - authorizeFromResource'+ JSON.stringify(err))
            loading.dismiss();
            resolve();
          })
      } else {
        resolve();
      }

    });
  }.bind(this);

  openModal(form,data) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }

  presentAlert(msg) {
    this.alertCtrl.create({
      title: 'For Administrator',
      subTitle: msg,
      buttons: ['Dismiss']
    }).present();
  }

}
