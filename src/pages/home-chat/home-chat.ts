import { Component } from '@angular/core';
import { NavController, Events, NavParams, ModalController, ItemSliding, Item } from 'ionic-angular';

import { ApiStorageService } from '../../services/apiStorageService';
import { ChattingPrivatePage } from '../chatting-private/chatting-private';
import { ApiChatService } from '../../services/apiChatService';
import { ChattingRoomPage } from '../chatting-room/chatting-room';

@Component({
  selector: 'page-home-chat',
  templateUrl: 'home-chat.html'
})

export class HomeChatPage {

  chatManager:any ={};
  
  parent: any;

  mySocket: any;
  token:any;
  userInfo:any;

  socket: any;
  
  contacts: any = {};
  friends: any = [];
  chatRooms:any = []; 
  
  unreadMessages: any = {};
  privateMessages:any = {}; //{room_id:[{msg}],rooms:[{id:..,name:,avatar:}...],length:count}
  roomsMessages:any = {}; //{room_id:[{msg}],rooms:[{id:..,name:,avatar:}...],length:count}
  
  isSearch: boolean = false;
  searchString: string = '';
  shouldShowCancel: boolean = false;

  constructor(private navParams: NavParams, 
              private navCtrl: NavController,
              private modalCtrl: ModalController,
              private apiChat: ApiChatService,
              private events: Events,
              private apiStorage: ApiStorageService) {}
              
  ngOnInit() {
      
      this.socket = this.apiChat.getSocket(); //object lien lac socket
                
      this.parent = this.navParams.get('parent');  //goi tu form cha
      this.mySocket = this.navParams.get('my_socket'); //thong tin cua owner
      
      this.token = this.navParams.get('token');  //thong tin owner
      this.userInfo = this.navParams.get('user');  //thong tin owner

      this.unreadMessages = this.navParams.get('unread_messages'); //tin tuc chua doc
      this.privateMessages = this.navParams.get('private_messages'); //
      this.roomsMessages = this.navParams.get('rooms_messages'); //

      this.chatRooms = this.navParams.get('rooms'); //danh sach chatRooms lien lac
      
      this.contacts = this.navParams.get('contacts'); //unique user hien thi name, nickname, avatar
      this.friends = this.navParams.get('friends'); //ban be da ket noi
      //[{roomid:{name:'',...adding+...,users:[{username:[socketonline]}]}}]
      
      

     this.chatManager = {
      title: "Chatting Rooms of " + (this.userInfo&&this.userInfo.data?this.userInfo.data.nickname:this.userInfo.username)
      , search_bar: {hint: "Tìm số điện thoại hoặc tên nhóm"} 
      , buttons: [
          {color:"secondary", icon:"link", next:"ADD"}
        ]
      , items: []
    };

  }

  //lay user cua ban trong danh muc ban be
  getFriendUser(users){
   // console.log('users',this.userInfo.username,users);
    if (users&&users.length===2){
      for (let i=0;i<users.length;i++){
        //console.log('user 1', users[i], this.userInfo.username);
        if (users[i]!==this.userInfo.username) return users[i];
      }
    }
    return this.userInfo.username;
  }

  ionViewDidLoad() {
    //console.log('Form load home-chats')
    // console.log('chatRooms:',this.chatRooms); 
    // console.log('contacts:', this.contacts); 
    // console.log('friends:', this.friends); 
    //chuyen doi friends sang contacts
    this.friends.forEach(el=>{
      if (!this.contacts[el.username]){
        Object.defineProperty(this.contacts, el.username, {
          value: {
              fullname: el.fullname,
              nickname: el.nickname,
              address: el.address,
              image: el.image,
              avatar: el.avatar,
              relationship: 'friend'
          },
          //cho edit, cho for (let key in obj), khong cho xoa
          writable: true, enumerable: true, configurable: false 
      });
      }
    })

    this.chatRooms.forEach(el=>{
      if (el.type==="friend"){
        let friendUsername = this.getFriendUser(el.users);
        //console.log('ten ban ne',friendUsername);
        if (this.contacts[friendUsername]){
          el.name = this.contacts[friendUsername].fullname;
          el.avatar = this.contacts[friendUsername].avatar;
          el.nickname = this.contacts[friendUsername].nickname;
        }else if (!el.name){
          el.name = friendUsername;
        }
      }else if (el.type==="private"){
        el.name = 'OWNER: ' + this.contacts[this.userInfo.username].fullname;
        el.avatar = this.contacts[this.userInfo.username].avatar;
        el.nickname = this.contacts[this.userInfo.username].nickname;
      }
    })
    //doi tuong lay bat cau tu service
     //console.log('chatRooms:',this.chatRooms); 
  }

  ionViewDidLeave() {
    
  }

  //Su dung search
  //---------------------
  goSearch(){
    this.isSearch = true;
  }

  searchEnter(){
    this.isSearch = false;
  }

  onInput(e){
    console.log(this.searchString);
  }

  /* callbackAddRoom = function(res){
    return new Promise((resolve,reject)=>{
      let users = [];
      let groupName;
      res.data.forEach(el=>{
        //el.room_name???
        groupName = el.title?el.title:'new Group';
        for (let key in el.details){
          if (el.details[key]){
            users.push(key)
          }
        }
      })

      //console.log('users new room:',users);
      
      if (users.length>0){
        let room_id = this.userInfo.username + "#" + new Date().getTime();
        let roomNew = 
          {
            id: room_id,
            name: groupName,
            image: ApiStorageService.mediaServer + "/db/get-private?func=avatar&token="+this.token,
            admins:[this.userInfo.username],
            users: users,
            created: new Date().getTime(),
            time:  new Date().getTime(),
            messages:[{
              text: (this.userInfo.data?this.userInfo.data.fullname:this.userInfo.username) + " Create group",
              created: new Date().getTime()
            }]
          }
          //6. user create newroom
          this.socket.emit('client-create-new-room',roomNew);  
      }

      resolve({next:'CLOSE'});
    })
  }.bind(this); */

  
/*   callbackChatRoom = function(res){
    return new Promise((resolve,reject)=>{
      resolve();
    })
  }.bind(this); */


  onClickItem(room){
    this.navCtrl.push(ChattingRoomPage, {
                        room: room,
                        parent:this,
                        socket: this.socket,
                        unread_messages: this.unreadMessages,
                        rooms_messages: this.roomsMessages, //doi nhan tin chat
                        contacts: this.contacts,
                        my_socket: this.mySocket
                      })
  }


  onClickItemPrivate(socketId){
    this.navCtrl.push(ChattingPrivatePage, {
      socket_id: socketId,
      parent:this,
      socket: this.socket,
      unread_messages: this.unreadMessages,
      private_messages: this.privateMessages, //doi tuong hung tin rieng
      contacts: this.contacts,
      my_socket: this.mySocket
    })
  }

  //onclick....
  onClickHeader(btn){
    if (btn.next==='ADD'){
      
    }
  }

  // Su dung slide Pages
  //--------------------------
  /**
   * Thay đổi kiểu bấm nút mở lệnh trên item sliding
   * @param slidingItem 
   * @param item 
   */
  openSwipeOptions(slidingItem: ItemSliding, item: Item, room:any ){
    room.visible = !room.visible;
    if (room.visible){
      let _offset =  "translate3d(-168px, 0px, 0px)"
      slidingItem.setElementClass("active-sliding", true);
      slidingItem.setElementClass("active-slide", true);
      slidingItem.setElementClass("active-options-right", true);
      item.setElementStyle("transform",_offset); 
    }else{
      this.closeSwipeOptions(slidingItem);
    }
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

  onClickDetails(slidingItem: ItemSliding, room: any, func: number){
    this.closeSwipeOptions(slidingItem);

  }
  //----------- end of sliding

  openModal(form,data?:any) {
    this.modalCtrl.create(form, data).present();
  }


}