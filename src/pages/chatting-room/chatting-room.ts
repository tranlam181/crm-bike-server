import { Component, ViewChild } from '@angular/core';
import { NavController, Events, NavParams, ModalController, Content } from 'ionic-angular';

import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';

@Component({
  selector: 'page-chatting-room',
  templateUrl: 'chatting-room.html'
})

/**
 * cho biet day la room nao
 * chuyen doi du lieu chua doc thanh doc 
 * ghi lai lich su trao doi thong tin
 */
export class ChattingRoomPage {

  @ViewChild(Content) contentMessages: Content;

  parent: any;            //noi goi no
  
  room: any;          //room thong tin cua room

  unreadMessages: any = {};    //doi tuong chung 
  roomsMessages: any = {};    //doi tuong chung 

  contacts: any = {};
  mySocket: any;

  socket: any;

  chatManager: any;

  isSearch: boolean = false;
  searchString: string = '';
  shouldShowCancel: boolean = false;

  message:string = '';
  messages = [];

  constructor(private navParams: NavParams, 
              private navCtrl: NavController,
              private modalCtrl: ModalController,
              private apiAuth: ApiAuthService,
              private events: Events,
              private apiStorage: ApiStorageService) {}

  ngOnInit() {
     
    this.room = this.navParams.get('room'); //lay room dang chat

     this.parent = this.navParams.get('parent'); //lay phien rieng
     this.unreadMessages = this.navParams.get('unread_messages'); //lay phien rieng
     this.roomsMessages = this.navParams.get('rooms_messages'); //lay phien rieng

     this.mySocket = this.navParams.get('my_socket'); //lay phien rieng
     //cai nay nhu la rooms moi room chua messages
     this.contacts = this.navParams.get('contacts');  //lay avatar, name
     this.socket = this.navParams.get('socket');      //doi tuong lien lac
     
     //let ip = this.mySocket.users[this.socketId]?this.mySocket.users[this.socketId].ip:this.socketId;
     
     console.log('go in room:',this.room)

     this.chatManager = {
      title: this.room.name
      //+ (this.mySocket&&this.mySocket.user?this.mySocket.user.nickname:this.mySocket.user)
      , search_bar: {hint: "Tìm trong nội dung trong nhóm"}
      , buttons: [
          {color:"primary", icon:"person-add", next:"ADD"}
        ]
      , items: []
    }
  
    setTimeout(()=>{
      try{
        this.contentMessages.scrollToBottom();
      }catch(e){}
     },200);

    this.events.subscribe("event-trigger-new-message-active",()=>{
      setTimeout(()=>{
        try{
          this.contentMessages.scrollToBottom();
        }catch(e){}
       },200);
    })


  }

  //sau khi load xong
  ionViewDidLoad() {
    let messages = [];
    if (this.unreadMessages[this.room.id]){
      messages = this.apiAuth.cloneObject(this.unreadMessages[this.room.id]);
      this.apiAuth.deleteObjectKey(this.unreadMessages,this.room.id)
    }

    if (!this.roomsMessages[this.room.id]){
      this.apiAuth.createObjectKey(
        this.roomsMessages,
        this.room.id,messages);
    }else{
      messages.forEach(el=>{
        this.roomsMessages[this.room.id].push(el);
      })
    }

    this.roomsMessages[this.room.id].isActive = true;
    this.messages = this.roomsMessages[this.room.id];
    
    //chuyen doi du lieu sang doc
    //console.log('doc message',this.messages);
    
  }
  
  ionViewDidLeave(){
    this.roomsMessages[this.room.id].isActive = false;
    //console.log('roi trang nay',this.socketId, this.roomsMessages[this.socketId]);

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

  
  onClickItem(room){
    
  }

  //onclick....
  onClickHeader(btn){
    //console.log(btn);
    if (btn.next==='ADD'){
    }
  }


  onKeydown(event){
    if (event.key === "Enter") {
        this.sendMessage()
    }
    /* else{
      this.message = event.target.value;
    } */
  }
  onKeyup(event){
    if (event.key === "Enter") {
      this.message = '';
    }
  }
  
  //emit.... socket_id
  sendMessage() {

    if (this.message.length>0){
      this.socket.emit('client-send-message', 
        { room: this.room, //receiver_room
          text: this.message,
          created: Date.now()
       });

       //ghi lai message[] va roomsMessages
       //neu room.id ko phai private

       /* 
       this.messages.push({
         sender_id: this.mySocket.user.username,
         text: this.message,
         created: Date.now()
       }) 
       */

       setTimeout(()=>{
          try{   
            this.contentMessages.scrollToBottom();
          }catch(e){}
        },200);

    }
    
    this.message = '';
  }
 

  //socket.on...

  openModal(form,data?:any) {
    this.modalCtrl.create(form, data).present();
  }


}