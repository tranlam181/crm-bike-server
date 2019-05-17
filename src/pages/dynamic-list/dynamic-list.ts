import { Component, ViewChild } from '@angular/core';
import { NavController, ItemSliding, Platform, NavParams, ViewController, LoadingController, AlertController } from 'ionic-angular';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiHttpPublicService } from '../../services/apiHttpPublicServices';
import { AutoCompleteComponent } from 'ionic2-auto-complete';
import { ApiAutoCompleteService } from '../../services/apiAutoCompleteService';

@Component({
  selector: 'page-dynamic-list',
  templateUrl: 'dynamic-list.html'
})
export class DynamicListPage {
  
  @ViewChild('searchBar') searchbar: AutoCompleteComponent;

  dynamicList: any = {}; 
  dynamicListOrigin: any = {
    title: "Danh sách kiểu viber"
    , search_bar: {placeholder: "Tìm cái gì đó từ list items này?"
                  , is_search:false
                  , search_string:""} 
    , correct_bar:{ options: { placeholder: "Tìm từ API auto-complete?"}
                   , is_search:false
                   , search_string:"" } 
    , buttons: [
        {color:"primary", icon:"notifications", next:"NOTIFY"
          , alerts:{length:0}
        }
      ]
    , items: [
        {
            image: "assets/imgs/img_forest.jpg"
            ,title:"Là tiêu đề của đề mục"
            ,content:"Sau khi đánh cồng khai trương phiên giao dịch đầu xuân Kỷ Hợi 2019 tại Sở Giao dịch chứng khoán Hà Nội vào sáng 12-2, Thủ tướng Chính phủ Nguyễn Xuân Phúc khẳng định tầm quan trọng của thị trường chứng khoán Việt Nam."
            ,note: Date.now()
        }
        ,{
            icon:"contact"
            ,title:"Là tiêu đề nội dung 2"
            ,content:"Trong những ngày đánh bắt đầu năm, 3 ngư dân Quảng Trị đã thu hoạch được mẻ cá bè gần 140 tấn; trong đó một ngư dân trúng mẻ cá siêu khủng nặng hơn 100 tấn."
            ,note: Date.now()
        }
    ]
  };
  
  parent:any;
  callback: any; 
  
  
  isLoaded: boolean = true;
  maxPages = 0;
  maxOnePage = 20;
  curPageIndex = 0;
  lastPageIndex = 0;


  constructor(  private platform: Platform
              , private apiAuth: ApiAuthService
              , private viewCtrl: ViewController
              , private alertCtrl: AlertController
              , private navCtrl: NavController
              , private apiAutoComplete: ApiAutoCompleteService
              , private loadingCtrl: LoadingController
              , private navParams: NavParams
             ) {}

  ngOnInit(){
    this.dynamicListOrigin = this.navParams.get("form") ? this.navParams.get("form") : this.dynamicListOrigin;
    this.resetForm();
    
    this.parent = this.navParams.get("parent");
    this.callback = this.navParams.get("callback");
    let call_waiting_data = this.navParams.get("call_waiting_data");
    
    if (call_waiting_data){
      call_waiting_data(this.parent)
      .then(list=>{
        this.resetForm(list);
      })
    }

  }

  resetForm(list?:any) {

    //khoi tao dynamicList
    this.dynamicList.title = this.dynamicListOrigin.title;
    this.dynamicList.search_bar = this.dynamicListOrigin.search_bar;
    this.dynamicList.correct_bar = this.dynamicListOrigin.correct_bar;
    this.dynamicList.buttons = this.dynamicListOrigin.buttons;
    this.dynamicList.items = [];

    if (list&&list.length>0){
      this.dynamicList.items = list;
    }else{

      this.apiAuth.getDynamicUrl("assets/data/countries.json")
      .then(countries=>{
        //vi du lay list danh sach cua cac quoc gia
        this.maxPages = Math.floor(countries.length/this.maxOnePage);
        //Lấy danh sách các quốc gia, cờ, dân số, diện tích, độc lập hay chưa?
        //tiền tệ, 
        this.dynamicListOrigin.items = [];

        countries.forEach(el => {
          el.title = el.name;
          el.image = el.flag;
          el.content = (el.altSpellings&&el.altSpellings.length>0?"Tên đầy đủ :" + el.altSpellings[el.altSpellings.length-1] + "\n":"")
                      +"Thủ đô :" + el.capital + ";\n"
                      +"Diện tích :" + el.area + "km2;\n"
                      +"Dân số :" + el.population + "người;\n"
                      + (el.languages&&el.languages.length>0?"Ngôn ngữ :" + el.languages[0].nativeName +";\n":"")
                      +"Mã số điện thoại :" + el.callingCodes + ";\n"
                      +"Múi giờ :" + el.timezones + ";\n"
                      +(el.homePages?"homePages : " + el.homePages + " ;":"")
                      
          
          el.note = Date.now();
          this.dynamicListOrigin.items.push(el);
        });

        this.getMorePage(true);

      })
      .catch(err=>console.log(err))
      //cho hien thi 12 dòng đầu thôi, các dòng tiếp theo sẽ cuộn lên để đọc theo trang
      //this.dynamicList = this.dynamicListOrigin;
    }
  }


  onClickUrl(url){
    console.log('click?',url);
  }

// Su dung slide Pages
  //--------------------------
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
  //----------- end of sliding


  //Su dung search
  //---------------------
  goSearch(func){
    /* console.log(this.searchbar);
    this.searchbar.setFocus(); */
    if (func==='SEARCH'&&this.dynamicList&&this.dynamicList.search_bar) this.dynamicList.search_bar.is_search = true;
    if (func==='CORRECT'&&this.dynamicList&&this.dynamicList.correct_bar) this.dynamicList.correct_bar.is_search = true;
  }

  searchEnter(func){
    if (func==='SEARCH'&&this.dynamicList&&this.dynamicList.search_bar) {
      this.dynamicList.search_bar.is_search = false;
      console.log('string?:',this.dynamicList.search_bar.search_string);
    }
    if (func==='CORRECT'&&this.dynamicList&&this.dynamicList.correct_bar) this.dynamicList.correct_bar.is_search = false;
  }

  onInput(ev){
    //go tung chu, thi lay va tim kiem trong mang filter
    console.log('search?',ev.target.value);
    if (ev.target.value){
      this.dynamicList.items = this.dynamicListOrigin.items.filter(x=>x.name.toLowerCase().startsWith(ev.target.value.toLowerCase()));
    } else {
      this.getMorePage(true);
    }

  }

  
  searchCorrectSelect(ev,what){
    console.log('select item',what,ev);
    //hoi xem dong y chon dua vao ko?
    if (what==='SELECTED'){
      this.alertCtrl.create({
        title: 'Xác nhận',
        message: 'Bạn muốn chọn ' + ev.name + ' này phải không?',
        buttons: [
          {
            text: 'Bỏ qua',
            role: 'cancel',
            handler: () => {
              //console.log('Cancel clicked');
              if (this.dynamicList&&this.dynamicList.correct_bar) this.dynamicList.correct_bar.is_search = false;
            }
          },
          {
            text: 'Chọn',
            handler: () => {
              ev.title = ev.name;
              ev.image = ev.flag;
              ev.content = (ev.altSpellings&&ev.altSpellings.length>0?"Tên đầy đủ :" + ev.altSpellings[ev.altSpellings.length-1] + "\n":"")
                          +"Thủ đô :" + ev.capital + ";\n"
                          +"Diện tích :" + ev.area + "km2;\n"
                          +"Dân số :" + ev.population + "người;\n"
                          + (ev.languages&&ev.languages.length>0?"Ngôn ngữ :" + ev.languages[0].nativeName +";\n":"")
                          +"Mã số điện thoại :" + ev.callingCodes + ";\n"
                          +"Múi giờ :" + ev.timezones + ";\n"
              
              ev.note = Date.now();
              this.dynamicList.items.unshift(ev);
              if (this.dynamicList&&this.dynamicList.correct_bar) this.dynamicList.correct_bar.is_search = false;
            }
          }
        ]
      }).present();
      if (this.dynamicList&&this.dynamicList.correct_bar) this.dynamicList.correct_bar.search_string = "";
    }else{
      if (this.dynamicList&&this.dynamicList.correct_bar && this.dynamicList.correct_bar.search_string !== null) {
        this.dynamicList.correct_bar.is_search = false;
      }
    }
  }

  onClickHeader(btn){
    console.log(btn);
    this.processCommand(btn);
  }

  onClickDetails(item: ItemSliding, btn: any, func: any){
    this.closeSwipeOptions(item);
    btn.func = func;
    console.log(btn);
    this.processCommand(btn);
  }

  processCommand(btn){
    this.next(btn)
  }


  /**
   * Page process
   */

  getMorePage(isRenew?: boolean){
    
    if (isRenew) {
      if (this.curPageIndex>0) this.curPageIndex--;
    }else{
      if (this.curPageIndex<=this.maxPages) this.curPageIndex++;
    }

    let offset = this.curPageIndex * this.maxOnePage;
    let limit = this.maxOnePage;

    if (offset < this.dynamicListOrigin.items.length) this.dynamicList.items = this.dynamicList.items.concat(this.dynamicListOrigin.items.slice(offset, offset + limit));
    
    //thong bao so trang con lai trong mang
    let notify = this.dynamicList.buttons.find(x=>x.next==='NOTIFY');
    if (notify) notify.alerts.length = this.maxPages  - this.curPageIndex;
    
    console.log('page',this.maxPages,this.curPageIndex);

  }

  doInfinite(infiniteScroll, direction) {
    if (direction === 'UP') {
      console.log('UP', this.curPageIndex, this.lastPageIndex);
      if (!this.isLoaded) {
        this.getMorePage(true);
      }
      setTimeout(() => {
        this.isLoaded = true;
        infiniteScroll.complete();
      }, 1000);
    } else {
      console.log('DOWN', this.curPageIndex, this.lastPageIndex);
      this.getMorePage(false);
      this.isLoaded = false; //khi keo xuong duoi thi o tren moi cho phep
      setTimeout(() => {
        infiniteScroll.complete();
      }, 1000);
    }
  }


  next(btn) {

    if (btn) {
      if (btn.next == 'EXIT') {
        this.platform.exitApp();
      } else if (btn.next == 'RESET') {
        this.resetForm();
      } else if (btn.next == 'CLOSE') {
        if (this.parent) this.viewCtrl.dismiss(btn.next_data)
      } else if (btn.next == 'HOME') {
        if (this.parent) this.navCtrl.popToRoot()
      } else if (btn.next == 'BACK') {
        if (this.parent) this.navCtrl.pop()
      } else if (btn.next == 'CALLBACK') {
        if (this.callback) {
          this.callback(btn.next_data)
            .then(nextStep => this.next(nextStep));
        } else {
          if (this.parent) this.navCtrl.pop()
        }
      } else if (btn.next == 'NEXT' && btn.next_data && btn.next_data.data) {
        btn.next_data.callback = this.callback; //gan lai cac function object
        btn.next_data.parent = this.parent;     //gan lai cac function object
        btn.next_data.form = btn.next_data.data; //gan du lieu tra ve tu server
        this.navCtrl.push(DynamicListPage, btn.next_data);
      }
    }

  }

}
