import { Component, } from '@angular/core';
import { ApiStorageService } from '../../services/apiStorageService';
import { ApiAuthService } from '../../services/apiAuthService';
import { LoadingController, ModalController, NavController, Events } from 'ionic-angular';
import { OwnerImagesPage } from '../owner-images/owner-images';
import { ApiContactService } from '../../services/apiContactService';
import { ApiChatService } from '../../services/apiChatService';
import { FriendsPage } from '../friends/friends';
import { DynamicCardSocialPage } from '../dynamic-card-social/dynamic-card-social';
import { HomeChatPage } from '../home-chat/home-chat';

@Component({
  selector: 'page-home-menu',
  templateUrl: 'home-menu.html',
})
export class HomeMenuPage {

  dynamicTree: any = {
    title: "Home",
    items: []
  };

  maxOnePage = 6;
  curPageIndex = 0;
  lastPageIndex = 0;
  maxPage = 10; //toi da cua trang de khong bi lag

  contacts = {}  // this.apiContact.getUniqueContacts()

  userInfo: any; // this.apiAuth.getUserInfo()
  token: any;     // this.apiStorage.getToken() hoac ApiStorageService.token

  isLoaded: boolean = true;

  mySocket:any;
  unreadMssages: any;
  privateMessages: any;
  roomsMessages: any;

  chatRooms: any;
  chatFriends: any;
  chatNewFriends: any;
  

  constructor(
    private apiStorage: ApiStorageService
    , private apiAuth: ApiAuthService
    , private apiContact: ApiContactService
    , private apiChat: ApiChatService
    , private loadingCtrl: LoadingController
    , private navCtrl: NavController
    , private modalCtrl: ModalController
    , private events: Events
  ) { }

  ngOnInit() {

    this.refreshNews();

    this.events.subscribe('event-main-login-checked'
      , (data => {

        this.token = data.token;
        this.userInfo = data.user;

        this.contacts = this.apiContact.getUniqueContacts();

        //console.log('Contact for new',this.contacts);
        //them danh ba cua nguoi login vao
        if (this.userInfo&&this.userInfo.data) {
          if (!this.contacts[this.userInfo.username]) {
            Object.defineProperty(this.contacts, this.userInfo.username, {
              value: {
                fullname: this.userInfo.data.fullname,
                nickname: this.userInfo.data.nickname,
                image: this.userInfo.data.image ? this.userInfo.data.image : undefined,
                avatar: this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image,
                relationship: ['private']
              },
              writable: true, enumerable: true, configurable: true
            });
          } else {
            if (this.userInfo.data.image){
              this.contacts[this.userInfo.username].image = this.userInfo.data.image;
              this.contacts[this.userInfo.username].avatar = this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image;
            } 
          }
        }
        //doi 3 giay sau neu login tu dong bang token
        //thi moi lay thong tin cua user
        setTimeout(() => {
          this.getHomeNews(true);
        }, 3000);
      })
    )


    this.events.subscribe('event-chat-init-room'
      , (data => {
        this.mySocket = data.my_socket;
        this.unreadMssages = data.unread_messages;
        this.privateMessages = data.private_messages;
        this.roomsMessages = data.rooms_messages;
        this.chatRooms = data.rooms;
        this.chatFriends = data.friends;
        this.chatNewFriends = data.new_friends;

      })
    )

  }


  async refreshNews() {
    //lay publicUser truoc tien roi moi tiep tuc cac buoc khac
    let publicUsers = await this.apiContact.getPublicUsers(true);
    //neu co roi thi moi di checking login

    //thong tin tu public user
    this.token = this.apiStorage.getToken();
    this.userInfo = this.apiAuth.getUserInfo();
    this.contacts = this.apiContact.getUniqueContacts();

    this.getHomeNews(true);

    //this.dynamicTree.items.push(items);
    //doc tu bo nho len lay danh sach da load truoc day ghi ra 
    //this.dynamicTree = this.apiStorage.getHome();
    let chattingData = this.apiChat.getRoomsFriends();

    this.mySocket = chattingData.my_socket;
    this.unreadMssages = chattingData.unread_messages;
    this.privateMessages = chattingData.private_messages;
    this.roomsMessages = chattingData.rooms_messages;

    this.chatRooms = chattingData.rooms;
    this.chatFriends = chattingData.friends;
    
    this.chatNewFriends = chattingData.new_friends;


  }

  /** lay tin tuc moi nhat */
  getHomeNews(isRenew?: boolean) {
    if (isRenew) {
      this.lastPageIndex = this.curPageIndex > 0 ? this.curPageIndex : this.lastPageIndex;
      this.curPageIndex = 0;
    }else{
      this.lastPageIndex = this.curPageIndex > this.lastPageIndex ? this.curPageIndex : this.lastPageIndex;
    }
    this.getJsonPostNews(this.userInfo ? true : false)
      .then(items => {
        if (isRenew) {
          let isHaveNew = false;
          items.reverse().forEach((el, idx) => {
            let index = this.dynamicTree.items
              .findIndex(x => x.group_id === el.group_id);
            //console.log(idx, el, index);
            if (index >= 0) {
              //this.dynamicTree.items.splice(index, 1, el);
            } else {
              this.dynamicTree.items.unshift(el);
              isHaveNew = true;
            }
          })
          if (isHaveNew && this.lastPageIndex > 0) this.lastPageIndex--;
        } else {
          this.curPageIndex = this.curPageIndex < this.lastPageIndex ? this.lastPageIndex : this.curPageIndex;
          items.forEach((el, idx) => {
            let index = this.dynamicTree.items
              .findIndex(x => x.group_id === el.group_id);
            if (index >= 0) {
              //this.dynamicTree.items.splice(index, 1, el);
            } else {
              this.dynamicTree.items.push(el);
            }
          })
        }
        //Array.prototype.push.apply(this.dynamicTree.items,items);
      })
      .catch(err => { })
      ;
  }

  /**
   * thuc hien post json gom:
   * token,
   * contacts list user 
   * result: 
   * server se kiem tra token 
   * neu co token se doc tin cua user + tin cua contacts moi nhat
   * neu khong co token hoac khong hop le
   * sever tra ket qua la tin public cua contact truyen len
   * 
   */
  getJsonPostNews(isToken?: boolean) {

    let offset = this.curPageIndex * this.maxOnePage;
    let limit = this.maxOnePage;

    let follows = [];
    for (let key in this.contacts) {
      follows.push(key);
    }

    let json_data = {
      limit: limit,
      offset: offset,
      follows: follows
    }
    //console.log('json_data',json_data);

    return this.apiAuth.postDynamicForm(ApiStorageService.mediaServer
      + "/db/public-groups", json_data)
      .then(data => {

        //console.log('public-groups',data);

        let items = [];
        data.forEach(el => {

          let medias = [];
          if (el.medias) {
            el.medias.forEach(e => {
              e.image = ApiStorageService.mediaServer + "/db/get-file/" + encodeURI(e.url);
              medias.push(e);
            })
          }

          el.medias = medias;
          el.actions = {
            like: { name: "LIKE", color: "primary", icon: "thumbs-up", next: "LIKE" }
            , comment: { name: "COMMENT", color: "primary", icon: "chatbubbles", next: "COMMENT" }
            , share: { name: "SHARE", color: "primary", icon: "share-alt", next: "SHARE" }
          }

          items.push(el);

        });

        if (items.length > 0) this.curPageIndex++;
        //da doc duoc trang 1
        return items;

      })
      .catch(err => { return [] })
  }


  getPrivateNews() {

    if (this.userInfo) {

      let loading = this.loadingCtrl.create({
        content: 'Đợi lấy dữ liệu cá nhân...'
      });
      loading.present();
      //chuyen thu tuc lay thong tin sang keo len, keo xuong
      this.apiAuth.getDynamicUrl(ApiStorageService.mediaServer + "/db/list-groups?limit=6&offset=0", true)
        .then(data => {

          let items = [];
          data.forEach(el => {

            let medias = [];
            if (el.medias) {
              el.medias.forEach(e => {
                e.image = ApiStorageService.mediaServer + "/db/get-file/" + encodeURI(e.url);
                medias.push(e);
              })
            }

            el.medias = medias;
            //actions va results se lay tu csdl quyen thiet lap cua nguoi post len
            el.actions = {
              like: { name: "LIKE", color: "primary", icon: "thumbs-up", next: "LIKE" }
              , comment: { name: "COMMENT", color: "primary", icon: "chatbubbles", next: "COMMENT" }
              , share: { name: "SHARE", color: "primary", icon: "share-alt", next: "SHARE" }
            }

            items.push(el);

          });

          // this.dynamicTree.items = items;
          // this.apiStorage.saveHome(this.dynamicTree);

          loading.dismiss();
        })
        .catch(err => {
          loading.dismiss();
        })
    }
  }

  // Xử lý sự kiện click button theo id
  onClickAdd() {
    this.openModal(OwnerImagesPage, { parent: this });
  }

  onClickChatUser() {
    //ktra user cua minh login tu dau:
    // cai nay yc co mat khau tu dat 
    // ktra xac thuc voi may chu ok thi list ra ktra
    console.log('my socket', this.mySocket);

  }

  //vao trang home-chat
  onClickChatRoom() {
    this.navCtrl.push(HomeChatPage, {
      parent: this,             //biet goi parent
      my_socket: this.mySocket, //thong tin owner
      token: this.token,       //thong tin owner
      user: this.userInfo,     //thong tin owner

      unread_messages: this.unreadMssages, //thong tin chua doc
      rooms: this.chatRooms,    //thong tin dang online chat
      private_messages: this.privateMessages,    //thong tin dang online chat
      rooms_messages: this.roomsMessages,    //thong tin dang online chat

      contacts: this.contacts, //thong tin cua user co anh dai dien unique
      friends: this.chatFriends //thong tin ban be chat (<contacts array)
      //neu rooms co > 2 user thi goi la room neu khong goi la ca nhan 
      //
    });
  }

  //thuc hien ket ban
  onClickChatFriend() {
    this.openModal(FriendsPage, {
      user: this.userInfo,
      parent: this,
      contacts: this.contacts,
      friends: this.chatFriends,
      new_friends: this.chatNewFriends
    })
  }

  doInfinite(infiniteScroll, direction) {
    if (direction === 'UP') {
      //console.log('UP', this.curPageIndex, this.lastPageIndex);
      if (!this.isLoaded) {
        this.getHomeNews(true);
      }
      setTimeout(() => {
        this.isLoaded = true;
        infiniteScroll.complete();
      }, 1000);
    } else {
      //console.log('DOWN', this.curPageIndex, this.lastPageIndex);
      this.getHomeNews(false);
      this.isLoaded = false; //khi keo xuong duoi thi o tren moi cho phep
      setTimeout(() => {
        infiniteScroll.complete();
      }, 1000);
    }

  }

  onClickMedia(idx, item) {
    //console.log('picture click', idx, item);
    let paragraphs = [];
    if (item.medias){
      item.medias.forEach(el => {
        paragraphs.push({
          medias: [
            { image: el.image}
          ]
        })
      });
    }
    let formData = {
      title: this.contacts[item.user]&&this.contacts[item.user].fullname?this.contacts[item.user].fullname +(this.contacts[item.user].nickname?"("+this.contacts[item.user].nickname+")":""):item.user
      , buttons: [
        { color: "danger", icon: "close", next: "CLOSE" }
      ]
      , items: [
        {
          short_detail: {
            avatar: this.contacts[item.user]&&this.contacts[item.user].avatar?this.contacts[item.user].avatar:"assets/imgs/no-image-go.jpg"
            , h1: this.contacts[item.user]&&this.contacts[item.user].fullname?this.contacts[item.user].fullname:this.contacts[item.user]&&this.contacts[item.user].nickname?this.contacts[item.user].nickname:item.user
            , note: item.time
            , action: { color: "primary", icon: "more", next: "MORE" }
          }
          , content: {
            p: item.content //ghi noi dung bai viet
            , paragraphs: paragraphs
            //ghi nickname cua user viet bai
            , note:this.contacts[item.user]&&this.contacts[item.user].nickname?this.contacts[item.user].nickname:this.contacts[item.user]&&this.contacts[item.user].fullname?this.contacts[item.user].fullname:item.user
          }
          , results: item.results
          , actions: item.actions
        }
      ]
    }

    this.openModal(DynamicCardSocialPage, {
      parent: this,
      callback: this.callBackProcess,
      form: formData
    })
  }


  //neu user cua user = voi user dang login
  onClickShortDetails(item) {
    //console.log('short details', this.userInfo.username, item.user);
    if (this.userInfo
      &&item.user===this.userInfo.username){
      console.log('Menu của user, có quyền ẩn tin tức này hoặc chia sẻ với quyền hạn bạn bè, public, ...');
    }else{
      //day la tin tuc cua nguoi khac, minh khong muon hien thi thi report thong tin nay
      //
      console.log('Cần report tin tức này hoặc ẩn tin tức này trên trang của mình...');
    }
    
  }

  onClickAvatars(btn, item) {
    console.log('action', btn, item);
  }

  onClickActions(btn, item) {
    console.log('action', btn, item);
  }


  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }


  callBackProcess = function (res) {
    return new Promise((resolve, reject) => {
      resolve();
    })
  }.bind(this);

}
