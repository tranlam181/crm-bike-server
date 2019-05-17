import { LoadingController, ToastController, Events, AlertController } from 'ionic-angular';
import { Injectable } from '@angular/core';

import { Socket, SocketIoConfig } from 'ng-socket-io';

import { ApiStorageService } from './apiStorageService';
import { ApiAuthService } from './apiAuthService';
import { Observable } from 'rxjs/Observable';
import { ApiLocationService } from './apiLocationService';
import { ApiMapService } from './apiMapService';

@Injectable()
export class ApiChatService {

  userInfo: any;
  token: any;
  socket: Socket;

  configSocketIo: SocketIoConfig;

  //chi luu room truyen qua lai voi nhau khong luu tru
  unreadMessages: any = {}; //{room_id/socketid:[{message}], length:count_room}
  privateMessags:any = {}; // {room_id/socketid:[{message}], length:count_room} 
  roomsMessags:any = {}; // {room_id/socketid:[{message}], length:count_room} 
  //luu lai lich su 
  //ban dau la khong co room, neu login roi thi moi co room
  //rooms = [];       //room online
  
  mySocket: any;  //{sockets:[]}
  chatFriends:any = []; //[{}]
  chatRooms:any = []; // [{room_id=$U/R#user#time:{username:true/false,length:2},name:,avatar:,created,time}]
  chatNewFriends:any = [];


  constructor(
    private apiAuth: ApiAuthService,
    private apiStorage: ApiStorageService,
    private events: Events,
    private apiLocation: ApiLocationService,
    private apiMap: ApiMapService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController

  ) { }


  getSocket(){
    return this.socket;
  }

  createUnreadMessages(msg,isGroup?:boolean){

    if (isGroup){
        if (this.unreadMessages[msg.receiver_id]){
          this.unreadMessages[msg.receiver_id].push(msg);
        }else{
          this.unreadMessages = this.apiAuth.createObjectKey( this.unreadMessages, msg.receiver_id, [msg]);
        }
    }else{
        if (this.unreadMessages[msg.sender_id]){
          this.unreadMessages[msg.sender_id].push(msg);
        }else{
          this.unreadMessages = this.apiAuth.createObjectKey( this.unreadMessages, msg.sender_id, [msg]);
        }
    }

    console.log('Tao message',this.unreadMessages);

  }
  /**
   * Phuc vu kiem tra da login chua?
   * co ban moi khong?
   * co ban khong?
   */
  getRoomsFriends(){
    return {
              my_socket: this.mySocket,        //chua private sockets
              unread_messages: this.unreadMessages,        
              private_messages: this.privateMessags, //chua private message ko luu
              rooms_messages: this.roomsMessags, //chua messages cua cac room // co luu
              rooms: this.chatRooms,
              friends: this.chatFriends, 
              new_friends: this.chatNewFriends
           };
  }

  chatInitSuccessfull(){
    //tu cac rooms da co, co danh sach ban be
    //neu co ban moi chua co room thi tra ve 
    //room, new friend (de co)
    this.events.publish('event-chat-init-room'
    , {
        my_socket: this.mySocket,
        rooms: this.chatRooms,
        friends: this.chatFriends, 
        unread_messages: this.unreadMessages, 
        private_messages: this.privateMessags,
        rooms_messages: this.roomsMessags, //chua messages cua cac room // co luu
        new_friends: this.chatNewFriends
      }
    );

    //4. chat - join rooms

    let requestJoinRooms = [];

    this.chatRooms.forEach(el=>{
      requestJoinRooms.push(el);
    })

    this.chatFriends.forEach(el=>{
      //chatRooms:any = []; // [{id:room_id, users:[username,...], name:,avatar:,created,time}]
      let index = this.chatRooms.findIndex(x=>
        (
        x.users
        &&x.type==='friend'
        &&x.users.length===2
        &&x.users.findIndex(y=>y===el.username)>=0
        )
        );

        //console.log(el);

      if (index<0){
        requestJoinRooms.push({
          id: "$U#"+this.userInfo.username+"-"+el.username, 
          reverse_id: "$U#"+el.username+"-"+this.userInfo.username, 
          //tren server no la duy nhat neu nhieu session cua cung user
          type: 'friend', //type='private','friend','group'
          //truong hop user cua doi tac thi se tu dong tim nguoc lai tren may chu de join hay khong
          admins: [this.userInfo.username],
          users: [this.userInfo.username, el.username],
          created: Date.now(),
          time: Date.now()
        })
      } //neu co roi thi room da co khong can them
    });

    


    //neu chua co room thi mat dinh co 1 room ca nhan
    //{roomid:{ai do}}
    this.socket.emit('client-join-rooms'
    , {
      rooms: requestJoinRooms //bao gom rooms cua friends va room tu tao
    });
  }

  async initChatting(token, userInfo, friends) {

    //dich vu dinh vi lay toa do va dia chi khoi tao chat
    let location = await this.apiLocation.getCurrentLocation();
    let address = "unknow";
    if (location.error){
      alert("Bạn phải cho phép dịch vụ định vị để sử dụng hệ thống này!");
      //this.presentAlert("Bạn phải cho phép dịch vụ định vị để sử dụng hệ thống này!");
      //await this.apiLocation.delay(5000);
      location = await this.apiLocation.getCurrentLocation();
    }

    if (!location.error){
      address = await this.apiMap.getAddressFromLatlng(location.lat+","+location.lng)
    }
    
    this.token = token;
    this.userInfo = userInfo;

    this.configSocketIo = {
      url: ApiStorageService.chatServer 
      + '?token=' + this.token
      + (!location.error?('&latlng=' + location.lat+","+location.lng
      + '&accuracy=' + location.accuracy
      + '&timestamp=' + location.timestamp
      + '&address=' + address):"")
      , options: {
        path: '/media/socket.io'
        , pingInterval: 20000
        , timeout: 60000
        , reconnectionDelay: 30000
        , reconnectionDelayMax: 60000
      }
    };

    //-->1. chat - client -->open
    this.socket = new Socket(this.configSocketIo);
    //this.apiStorage.deleteUserRooms(this.userInfo)
    this.chatRooms = this.apiStorage.getUserRooms(this.userInfo);

    //danh sach duoc nguoi dung ket ban, tim kiem, chu dong, trong chuc nang friends
    this.chatFriends = this.apiStorage.getUserChatFriends(this.userInfo);

    //tao cac kenh lien lac default
    //va cac kenh lien lac theo ban be trong danh ba
    //console.log('contact friends:',friends);
    if (friends){
      //co ban be tim thay trong danh ba tu dong yeu cau ket ban
      friends.forEach(el => {
        let index = this.chatFriends?this.chatFriends.findIndex(x => x.username === el.username):-1;
        if (index>=0){
          //thay ten moi neu co, mat dinh tao room chat
          this.chatFriends.splice(index, 1, el);
        }else{
          //yeu cau ket ban truoc khi chat
          if (!this.chatNewFriends) this.chatNewFriends=[];
          if (this.userInfo.username !== el.username) this.chatNewFriends.push(el); 
          //them ban moi ket ban, minh phai xac nhan thi no moi ket ban
        }         
      });
    }else{
      //khong co danh sach ban be trong danh ba (ko chat friend default)
    }


    //thuc hien tao rooms de join
    //truong hop trong chatRooms co room cua user friend thi thoi
    //minh chu dong ket noi voi ban, ban chap nhan se joinroom
    //truong hop ban cung chu dong ket noi???
    
    //cac rooms khac thi duoc khoi tao chuc nang tao rooms tren home-chat nhe
    //chatRooms:any = []; // [{id:room_id, users:{username:true/false,length:2}, name:,avatar:,created,time}]


    //lang nghe vi tri thay doi de ghi nhan vi tri cua 
    //neu yeu cau tracking thi lang nghe su kien nay nhe
    /* 
    this.apiLocation.startTracking();
    this.events.subscribe("event-location-changed",(data)=>{
      //console.log('location change',data);
      //vi tri co thay doi, gui cho server biet vi tri thay doi nhe
    }) 
    */

   /* console.log('location:',{
                          lat: location.lat,
                          lng: location.lng,
                          accuracy: location.accuracy,
                          timestamp: location.timestamp,
                          address: address
                        }); */

    /* //gui vi tri thong bao cho sessions
    if (!location.error){
    this.socket.emit('client-send-location'
            , {
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              timestamp: location.timestamp,
              address: address
            });
    } */

    

    //-->1.chat - client received welcome
    this.getMessages()
      .subscribe(data => {
        let msg;
        msg = data;
        
        //** ****************** */
        //console.log('send, message', msg);
        
        if (msg.step == 'INIT') {
          //socketid,user,sockets
          this.mySocket = msg.your_socket;
          //send event INIT OK
          this.chatInitSuccessfull();
          
        }

        //danh sach user dang online
        //va socket cua no
        if (msg.step == 'USERS') {
          //msg.users = {username,{name:,nickname:,sockets:[socketid]},...}
          for (let username in msg.users) {
            /* if (!this.users.find(user => user.username === username)) {
              this.users.push({
                username: username,
                name: msg.users[username].name,
                nickname: msg.users[username].nickname
              })
            } */
          }
        }

        if (msg.step == 'JOINED') {
          //4.2 rooms joined first
          console.log('JOINED rooms',msg.rooms);
          //room cu truoc do, + rooms moi join duoc
          //vi kieu rôm
          if (msg.rooms){
            msg.rooms.forEach(el=>{
              //neu room la friend thi ghi ten, avatar cua user doi phuong lay tu contacts
              let index = this.chatRooms.findIndex(x=>x.id === el.id);
              if (index<0) {
                this.chatRooms.push(el);
              }else{
                this.chatRooms.splice(index,1,el);  //thay th luon doi tuong moi
              };
            })
          }
          //luu room de load lan sau
          this.apiStorage.saveUserRooms(this.userInfo, this.chatRooms);
         
        }

        if (msg.step == 'ACCEPTED') {
          //5.1 + 6.2 accepted room
          console.log('join rooms ACCEPTED', msg.room);

          let index = this.chatRooms.findIndex(x=>x.id === msg.room.id);
          if (index<0) {
            this.chatRooms.push(msg.room);
          }else{
            this.chatRooms.splice(index,1,msg.room);  //thay th luon doi tuong moi
          };

          this.apiStorage.saveUserRooms(this.userInfo, this.chatRooms);

        }

      });

    //2.chat - client received new/disconnect socket the same user
    this.getPrivateStartEnd()
      .subscribe(data => {
        let msg;
        msg = data;

        if (msg.step === 'START') {
          //3.2 private old socket in username inform new socket
          this.mySocket.sockets.unshift(msg.socket_id);
          //them user {}
          this.mySocket.users = this.apiAuth.createObjectKey(this.mySocket.users, msg.socket_id, msg.user);
        } else if (msg.step === 'END') {
          //x.2 chat
          let index = this.mySocket.sockets.findIndex(x=>x===msg.socket_id);
          if (index>=0){
            this.mySocket.users = this.apiAuth.deleteObjectKey(this.mySocket.users, msg.socket_id);
            this.mySocket.sockets.splice(index, 1);
            //xoa user

          }

        }
        //bao hieu cho toi co so luong socket dang thay doi
        //console.log('private, mysocket',msg, this.mySocket);
      });

    //3.1 chat - client received new user
    this.getNewUser()
      .subscribe(data => {
        let msg;
        msg = data;
        //console.log('new user receive', msg);
        /* //luu trong contact de tham chieu nhanh, khong load lai cua server
        if (!this.users.find(user => user.username === msg.username)) {
          this.users.push({
            username: msg.username,
            name: msg.data ? msg.data.fullname : "no name",
            nickname: msg.data ? msg.data.nickname : "no nickname"
          });
          this.events.publish('event-main-received-users', this.users);
        } */
      });

    //4.1 + 6.1 invite join this room
    this.getInvitedRoom()
      .subscribe(data => {
        //{roomId:{name:,messages[],users:[{username:[socketonline,...]}]}}
        //console.log('request new 1 room from other', data); //mot room thoi
        this.socket.emit('client-accept-room', data);
        //join-new-room //se gui room o cho ACCEPTED

      });


    //7. new private message
    this.getPrivateMessagesEmit()
    .subscribe(data => {
      let msg;
      msg = data;
      //msg.user.image = this.contacts[msg.user.username].image;
      if (this.privateMessags[msg.sender_id]&&this.privateMessags[msg.sender_id].isActive)
      {
        this.privateMessags[msg.sender_id].push(msg);
        //bao co tin moi
        this.events.publish("event-trigger-new-message-active");
      }else{
        this.createUnreadMessages(msg);
      }
    });
    
    //7.1 new message
    this.getMessagesEmit()
      .subscribe(data => {
        let msg;
        msg = data;
        //console.log('7.1 new message:', msg);
        
        if (this.roomsMessags[msg.receiver_id]&&this.roomsMessags[msg.receiver_id].isActive)
        {
          this.roomsMessags[msg.receiver_id].push(msg);
          //bao co tin moi
          this.events.publish("event-trigger-new-message-active");
        }else{
          this.createUnreadMessages(msg,true); //tao tin bang nhom
        }
      });

    //x.1 chat - client user disconnect
    this.getEndUser()
      .subscribe(data => {
        let msg;
        msg = data;
        /* this.users = this.users.splice(this.users.indexOf(msg.username), 1);
        this.events.publish('event-main-received-users', this.users); */
      });

  }


  //emit....
  jointRooms() {
    this.socket.emit('client-joint-room'
      , {
        rooms: this.chatRooms
      });
  }

  //socket.on...
  getMessages() {
    return new Observable(observer => {
      this.socket.on("message", (data) => {
        observer.next(data);
      });
    })
  }

  getPrivateStartEnd() {
    return new Observable(observer => {
      this.socket.on("server-private-emit", (data) => {
        observer.next(data);
      });
    })
  }

  /**
   * new user connected
   */
  getNewUser() {
    return new Observable(observer => {
      this.socket.on("server-broadcast-new-user", (data) => {
        observer.next(data); //user
      });
    })
  }

  /**
   * 4.1 room other socket or user new invite
   */
  getInvitedRoom() {
    return new Observable(observer => {
      this.socket.on("server-private-join-room-invite", (data) => {
        observer.next(data); //user
      });
    })
  }

  /**
   * end user coonected
   */
  getEndUser() {
    return new Observable(observer => {
      this.socket.on("server-broadcast-end-user", (data) => {
        observer.next(data); //user
      });
    })
  }

  getPrivateMessagesEmit() {
    return new Observable(observer => {
      this.socket.on("server-emit-priate-message", (data) => {
        observer.next(data);
      });
    })
  }

  getMessagesEmit() {
    return new Observable(observer => {
      this.socket.on("server-emit-message", (data) => {
        observer.next(data);
      });
    })
  }

  presentAlert(message) {
    this.alertCtrl.create({
      title: 'Alert',
      subTitle: 'For Administrator',
      message: message,
      buttons: ['OK']
    }).present();
  }

}