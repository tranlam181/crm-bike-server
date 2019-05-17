import { Component } from '@angular/core';
import { LoadingController, ToastController, ItemSliding, AlertController, ModalController, ViewController, NavParams, NavController } from 'ionic-angular';

import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { ApiImageService } from '../../services/apiImageService';


@Component({
  selector: 'page-friends',
  templateUrl: 'friends.html'
})
export class FriendsPage {

  countView = 1;

  //du lieu khoi tao ban dau
  userInfo: any;
  parent:any;
  callback:any;
  contacts:any = {};

  removeFriends:any = [];
  friends:any = [];
  newFriends:any = [];
  publicFriends: any = [];
  morePublic:number= this.countView;
  moreNewFriends:number= this.countView;
  moreFriends:number= this.countView;

  //cac tuy chon
  dynamicFriends: any = {};
  options: any = [];
  friendOptions: any = [];
  friendViews:any;

  //thanh tim kiem
  isSearch: boolean = false;
  searchString: string = '';
  shouldShowCancel:boolean = false;



  constructor(
    private apiAuth: ApiAuthService,
    private apiStorage: ApiStorageService,
    private apiImage: ApiImageService,
    private viewCtrl: ViewController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private navCtrl: NavController
    ) { }


  ngOnInit() {

    this.dynamicFriends.title="DANH SÁCH BẠN BÈ"
    this.dynamicFriends.search_bar="Tìm theo số điện thoại"
    this.dynamicFriends.buttons = [{
      color:"danger", icon:"close", next:"CLOSE"
    }]

    this.options = [
      { color: "secondary", icon: "contact", name: "Kết bạn", next: "ADD-FRIEND" }
      , { color: "danger", icon: "trash", name: "Hủy", next: "REMOVE" }
    ]
    
    this.friendOptions = [
       { color: "danger", icon: "trash", name: "Hủy kết bạn", next: "REMOVE" }
    ]

    this.userInfo = this.navParams.get("user");
    this.callback = this.navParams.get("callback");
    this.parent = this.navParams.get("parent");
    this.contacts = this.navParams.get("contacts");
    this.friends = this.navParams.get("friends");
    this.newFriends = this.navParams.get("new_friends");

    //console.log(this.userInfo, this.contacts, this.friends, this.newFriends);

    this.prepairViewFriend();

  }


  checkExistsFriends(username:string,isRemove?:boolean){
    if (this.userInfo&&this.userInfo.username===username) return true;
    if (this.friends&&this.friends.findIndex(x => x.username === username)>=0) return true;
    if (this.newFriends&&this.newFriends.findIndex(x => x.username === username)>=0) return true;
    if (!isRemove&&this.removeFriends&&this.removeFriends.findIndex(x => x.username === username)>=0) return true;
    return false;
  }

  prepairViewFriend(){
    //lay danh muc username da huy ket ban
    this.removeFriends = this.apiStorage.getUserRemoveFriends(this.userInfo);

    //bạn có thể tìm một số điện thoại để yêu cầu kết bạn (user đó đang ở chế độ ẩn danh)
    
    //danh sách bạn có thể biết (do user public contacts lấy ra - hiển thị avatar, tên và nickname, địa chỉ)
    if (this.contacts){
      for (let key in this.contacts){
        //loai bo userInfo, friends, va newFriends
        if (!this.checkExistsFriends(key)){
          this.publicFriends.push({
            username: key,
            fullname: this.contacts[key].fullname,
            nickname: this.contacts[key].nickname,
            phone: this.contacts[key].phone,
            address: this.contacts[key].address,
            avatar: this.contacts[key].avatar,
            image: this.contacts[key].image,
            relationship: this.contacts[key].relationship
          })
        }
      }
    }
    //danh sách bạn bè trong danh bạ của bạn (hiển thị 2 bạn đầu tiên - yêu cầu kết bạn)

    //danh sách bạn bè của bạn (hiển thị 2 bạn đầu tiên - yêu cầu hủy kết bạn)

  }


  onClickMore(type){
    if (type==='PUBLIC'&&this.morePublic<this.publicFriends.length) this.morePublic +=this.countView;    
    if (type==='PUBLIC-CLOSE') this.morePublic =this.countView; 

    if (type==='NEW-FRIEND'&&this.moreNewFriends<this.newFriends.length) this.moreNewFriends +=this.countView;    
    if (type==='NEW-FRIEND-CLOSE') this.moreNewFriends =this.countView; 

    if (type==='FRIEND'&&this.moreFriends<this.friends.length) this.moreFriends +=this.countView;    
    if (type==='FRIEND-CLOSE') this.moreFriends =this.countView; 

  }


  closeSwipeOptions(slidingItem: ItemSliding) {
    slidingItem.close();
    slidingItem.setElementClass("active-sliding", false);
    slidingItem.setElementClass("active-slide", false);
    slidingItem.setElementClass("active-options-right", false);
  }

  onClickDetails(slidingItem: ItemSliding, btn: any, contact:any, idx: number, type: any) {
    this.closeSwipeOptions(slidingItem);
    //console.log(btn,contact);
    if (btn.next==="REMOVE" || btn.next==="ADD-FRIEND"){
      if (type==="PUBLIC") this.publicFriends.splice(idx,1);
      if (type==="NEW-FRIEND") this.newFriends.splice(idx,1);
        
      if (type==="FRIEND") {
        this.friends.splice(idx,1);
        this.apiStorage.saveUserChatFriends(this.userInfo,this.friends);
      }
      if (btn.next==="ADD-FRIEND") {
        this.friends.push(contact);
        this.apiStorage.saveUserChatFriends(this.userInfo,this.friends);
        let index = this.removeFriends.findIndex(x=>x.username===contact.username);
        if (index>=0) {
          this.removeFriends.splice(index,1);
          this.apiStorage.saveUserRemoveFriends(this.userInfo,this.removeFriends);
        }
      }else{
        this.removeFriends.push(contact);
        this.apiStorage.saveUserRemoveFriends(this.userInfo,this.removeFriends);
      }
    }

  }

  onClickHeader(btn){
    this.next(btn);
  }

  next(btn) {

    if (btn) {
      if (btn.next == 'CLOSE') {
        if (this.parent) this.viewCtrl.dismiss(btn)
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
      } 
    }
  }

  //Su dung search
  // thanh tim kiem
  //---------------------
  goSearch(){
    this.isSearch = true;
  }
  searchEnterEsc(){
    this.isSearch = false;
  }

  searchEnter(){
    this.isSearch = false;
    let username = this.searchString&&this.searchString.indexOf('0')===0?this.searchString.slice(1):this.searchString;
    //console.log('tim user theo username',username);
    this.searchString = "";
    this.apiAuth.postDynamicForm(ApiStorageService.authenticationServer+"/ext-auth/post-users-info?",{username:username},true)
    .then(async data=>{
      if (data
        &&data.status
        &&data.users
        &&data.users.length>0){
          let user = data.users[0];
          //console.log('user',user);
          if (!this.checkExistsFriends(user.username,true)){
            if (user.image){
              user.avatar = await this.apiImage.createBase64Image(user.image,32); //thuc hien lay anh ve ghi vao luon
            }else {
              //tam thoi lay avatar cac user chua set nhu nay
              user.avatar = await this.apiImage.createBase64Image(ApiStorageService.mediaServer + "/db/get-private?func=avatar&user=" + user.username + "&token=" + this.apiStorage.getToken(),32);
              //khi cac user da set thi ta se lay kieu nay
              //user.avatar = "/assets/imgs/no-image-go.jpg";
            }
            this.publicFriends.unshift({
              username: user.username,
              fullname: user.fullname,
              nickname: user.nickname,
              phone: user.phone,
              address: user.address,
              avatar: user.avatar,
              image: user.image,
              relationship: this.apiAuth.getBroadcastStatus(user.broadcast_status)
            })
          }else{
            //da la ban be roi
            this.toastCtrl.create({
              message: "Bạn và " + username + " đã là bạn của nhau",
              duration: 3000,
              position: 'bottom'//pos == 0 ? 'top' : pos == 1 ? 'middle' : 'bottom'
            }).present();
          }
      }else{
        //khong tim thay ban nao
        this.toastCtrl.create({
          message: "Người dùng " + username + " chưa đăng ký",
          duration: 3000,
          position: 'middle'
        }).present();
      }
    })
    .catch(err=>{
      //co loi khi tim kiem
      this.toastCtrl.create({
        message: "Có lỗi khi tìm kiếm " + JSON.stringify(err),
        duration: 3000,
        position: 'middle'
      }).present();
    })
  }

  onInputSearch(e){
    //console.log(e.target.value,this.searchString);
  }


}




