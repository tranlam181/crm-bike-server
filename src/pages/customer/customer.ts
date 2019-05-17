import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, ItemSliding, ModalController, ToastController } from 'ionic-angular';

import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { ApiResourceService } from '../../services/apiResourceServices'
import { DynamicFormWebPage } from '../dynamic-form-web/dynamic-form-web';

@Component({
  selector: 'page-customer',
  templateUrl: 'customer.html'
})
export class CustomerPage {
  
  maxCurrentId:number=0; //su dung de them khach hang moi

  customersOrigin:any = [];

  isSearch: boolean = false;
  searchString:string='';
  
  customers:any = [];

  isLoaded: boolean = true;
  maxOnePage = 20;
  curPageIndex = 0;
  lastPageIndex = 0;


  staffs: any;
  prices: any;
  areas: any

  constructor(
              private navCtrl: NavController,
              private apiAuth : ApiAuthService,
              private apiStorage: ApiStorageService, 
              private resource: ApiResourceService,
              private loadingCtrl: LoadingController,
              private toastCtrl: ToastController,
              private alertCtrl: AlertController,
              private modalCtrl: ModalController
              ) {

  }

  ngOnInit(){
    this.getCustomers(); //cai nay lay tu load trang dau luon
  }

 async getCustomers(){
    let loading = this.loadingCtrl.create({
      content: 'Đang lấy danh sách khách hàng...'
    });
    loading.present();
    //doc 20 khach hang thoi, roi doc tiep
    //...
    try{
      this.customersOrigin = await this.resource.getAllCutomers()
      this.maxCurrentId = Math.max.apply(Math, this.customersOrigin.map((o)=>{return o.stt}));
    }catch(e){
      this.customersOrigin = [];
      this.alertCtrl.create({
        title: 'Alert',
        subTitle: 'For Administrator',
        message: "Lỗi đọc dữ liệu khách hàng",
        buttons: ['OK']
      }).present();
    }
    
    this.customers = this.customersOrigin.slice(0,20);



    //lay cac tham so thiet lap
    this.staffs = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer+"/db/json-parameters"
                                                              +"?type=4", true);
    this.prices = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer+"/db/json-prices", true);
    this.areas = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer+"/db/json-parameters"
                                                            +"?type=6", true);

    
    //console.log(this.staffs, this.prices, this.areas);

    loading.dismiss();
    
  }


  getCustomerPage(isRenew?: boolean){
    
    if (isRenew) {
      this.curPageIndex--;
    }else{
      this.curPageIndex++;
    }

    let offset = this.curPageIndex * this.maxOnePage;
    let limit = offset + this.maxOnePage;
    //console.log(offset,this.customers);
    this.customers = this.customers.concat(this.customersOrigin.slice(offset,limit));

  }

  goSearch(){
    this.isSearch = true;
  }

  onInput(e){
    this.customers = this.customersOrigin.filter(x=>(
      x.full_name.toLowerCase().indexOf(this.searchString.toLowerCase())>=0
      ||
      x.cust_id.toLowerCase().indexOf(this.searchString.toLowerCase())>=0
      ||
      x.area.toLowerCase().indexOf(this.searchString.toLowerCase())>=0
      ||
      x.staff.toLowerCase().indexOf(this.searchString.toLowerCase())>=0
      ||
      (x.phone&&x.phone.indexOf(this.searchString)>=0)
      ))
  }

  searchEnter(){
    this.isSearch = false;
  }

  onClickItem(cus){
    
    //console.log(cus);

    let areaOptions = [];
    let staffOptions = [];
    let priceOptions = [];

    this.areas.forEach(el => {
      areaOptions.push({ name: el.description, value: parseInt(el.code)})
    });
    this.staffs.forEach(el => {
      staffOptions.push(
        { name: el.description, value: parseInt(el.code)}
        )
    });

    this.prices.forEach(el => {
      priceOptions.push(
        { name: el.description, value: parseInt(el.code)}
        )
    });



    let form = {
      title: "Chỉnh sửa Khách hàng"
      , buttons: [
        {color:"danger", icon:"close", next:"CLOSE"} 
      ]
      , items: [
        { type: "title",          name: "MKH: " + cus.cust_id}
        , { type: "text", key: "id", disabled: true, value: cus.id, name: "Mã quản lý", input_type: "text", icon: "information" }
        , { type: "text", key: "full_name",  value: cus.full_name, name: "Họ và tên", input_type: "text", icon: "person" }
        , { type: "select", key: "area_id", name: "Khu vực", value: cus.area_id,  options: areaOptions, icon: "globe"}
        , { type: "select", key: "staff_id", name: "Người quản lý", value: cus.staff_id,  options: staffOptions , icon: "man" }
        , { type: "select", key: "price_id", name: "Loại khách hàng", value: cus.price_id,  options: priceOptions , icon: "logo-usd"}
        , { type: "text", key: "address", name: "Địa chỉ khách hàng", value: cus.address, icon: "pin"}
        , { type: "text", key: "phone", name: "Điện thoại khách (để nhắn tin)", value: cus.phone, icon: "call"}
        , { type: "text", key: "email", name: "Email của khách (nếu có)", value: cus.email, icon: "mail"}
        , { type: "text", key: "organization_name", name: "Tên của tổ chức (nếu có)", value: cus.organization_name, icon: "people"}
        , { type: "text", key: "tax_no", name: "Mã số thuế (nếu có)", value: cus.tax_no, icon: "send"}
        , { 
          type: "button"
        , options: [
          { name: "Reset", next: "RESET" }
          , { name: "Cập nhật", next: "CALLBACK" , url: ApiStorageService.resourceServer + "/db/edit-customer", token: true, signed: true }
        ]
        }
      ]
    }

    this.openModal(DynamicFormWebPage,{
      parent: this,
      form: form,
      callback: this.callbackCustomer
    })
  }
  
  callbackCustomer = function (res){
    
     return new Promise((resolve, reject) => {
       if (res.error){
        /* this.alertCtrl.create({
          title: 'Alert',
          subTitle: 'For Administrator',
          message: "ERROR: " + res.error.message,
          buttons: ['OK']
        }).present(); */
        this.presentToast("ERROR: "+res.error.message) //chờ người dùng đóng
      }else{
        //thong bao cap nhap thanh cong
        if (res.data){
          this.presentToast("Cập nhật thành công!",3000) //hiển thị 3 giây
          //thay doi du lieu hien thi bang bang ghi moi
          let index = this.customers.findIndex(x=>x.id===res.data.id);
          if (index>=0){
            this.customers.splice(index,1,res.data)
          }
          index = this.customersOrigin.findIndex(x=>x.id===res.data.id);
          if (index>=0){
            this.customersOrigin.splice(index,1,res.data)
          }
        }else{
          this.presentToast("Lỗi không có dữ liệu trả về") //chờ người dùng đóng
        }
        
      }
      resolve({next:"CLOSE"})

     })
  }.bind(this);

  newCustomter(){
    
  }

  /**
   * Thay đổi cách bấm nút đóng lệnh bằng nút trên item sliding
   * @param slidingItem 
   */
  closeSwipeOptions(slidingItem: ItemSliding){
    slidingItem.close();
    slidingItem.setElementClass("active-sliding", false);
    slidingItem.setElementClass("active-slide", false);
    slidingItem.setElementClass("active-options-right", false);
  }
  onClickDetails(slidingItem: ItemSliding, cus: any, func: string){
    this.closeSwipeOptions(slidingItem);
    if (func==="EDIT"){
      //console.log(cus,func);
      this.onClickItem(cus);

    }
  }


  doInfinite(infiniteScroll, direction) {
    if (direction === 'UP') {
      //console.log('UP', this.curPageIndex, this.lastPageIndex);
      if (!this.isLoaded) {
        this.getCustomerPage(true);
      }
      setTimeout(() => {
        this.isLoaded = true;
        infiniteScroll.complete();
      }, 1000);
    } else {
      //console.log('DOWN', this.curPageIndex, this.lastPageIndex);
      this.getCustomerPage(false);
      this.isLoaded = false; //khi keo xuong duoi thi o tren moi cho phep
      setTimeout(() => {
        infiniteScroll.complete();
      }, 1000);
    }
  }

  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
        modal.onDidDismiss(data=>{
          //console.log('ket qua xu ly popup xong',data);
        })
    modal.present();
  }

  presentToast(message, duration?: 0 | 3000 | 5000) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: duration?duration:undefined, //default for click ok
      showCloseButton: duration?false:true, //hien thi nut close nhu xem roi
      //cssClass: duration?"toast-container-white":"toast-container-red",
      position: 'middle' // "top", "middle", "bottom".
    });
  
    toast.onDidDismiss(() => {
      //console.log('Dismissed toast'); //click ok
    });
  
    toast.present();
  }

}
