import { Inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE, StorageService, isStorageAvailable } from 'angular-webstorage-service';
 
const STORAGE_KEY = 'Cng@3500888';
const sessionStorageAvailable = isStorageAvailable(sessionStorage); 

@Injectable()
export class ApiStorageService {
 
    public static token;
    //public static mapServer = 'https://c3.mobifone.vn/api/location'; 
    //public static chatServer = 'http://localhost:8080'; 
    //public static resourceServer = 'http://localhost:9236/qld'; 
    public static chatServer = 'https://c3.mobifone.vn'; 
    public static mediaServer = 'https://c3.mobifone.vn/media'; 
    public static resourceServer = 'https://c3.mobifone.vn/crm'; 
    public static authenticationServer = 'https://c3.mobifone.vn/api';

    constructor(@Inject(LOCAL_STORAGE) private storage: StorageService) {
    }
 
    public doSomethingAwesome(): number {
        const awesomenessLevel: number = this.storage.get(STORAGE_KEY) || 1337;
        this.storage.set(STORAGE_KEY, awesomenessLevel + 1);
        return awesomenessLevel;
    }

    private save(key,value){
        this.storage.set(key, value);
    }
    private read(key){
        return this.storage.get(key);
    }

    private delete(key){
        this.storage.remove(key);
    }

    getStatus(){
        return `Session storage available: ${sessionStorageAvailable}`;
    }

    saveResults(results){
        this.save('results',JSON.stringify(results));
    }

    getResults(){
        try{
            let results = JSON.parse(this.read('results'));
            return results?results:[];
        }catch(e){
            return [];
        }
    }

    saveHome(results){
        this.save('home',JSON.stringify(results));
    }

    getHome(){
        try{
            let results = JSON.parse(this.read('home'));
            return results?results:{
                                        title: "HOME"
                                        , items: []
                                    };
        }catch(e){
            return {
                    title: "HOME"
                    , items: []
                    };
        }
    }
    

    deleteResults(){
        this.delete('results');
    }

    saveToken(value){
        this.save('token',value);
    }

    getToken(){
       ApiStorageService.token = this.read('token');
       return ApiStorageService.token;
    }

    deleteToken(){
        ApiStorageService.token = null;
        this.delete('token');
    }

    
    saveServerKey(key){
        this.save('#key#server#',JSON.stringify(key));
    }

    /**
     * lay cap key cua thiet bi nay duy nhat khi khoi dong
     */
    getServerKey(){
        try{
            let results = JSON.parse(this.read('#key#server#'));
            return results?results:{};
        }catch(e){
            return {};
        }
    }

    /**
     * Luu tru cap key cua thiet bi nay
     * @param key 
     */
    saveDeviceKey(key){
        this.save('#key#device#',JSON.stringify(key));
    }

    /**
     * lay cap key cua thiet bi nay duy nhat khi khoi dong
     */
    getDeviceKey(){
        try{
            let results = JSON.parse(this.read('#key#device#'));
            return results?results:null;
        }catch(e){
            return null;
        }
    }

    /**
     * luu tru cap key duy nhat cua user tren thiet bi nay
     * khoa rieng phai duoc ma hoa bang mat khau
     * de su dung phai nhap mat khau moi lay duoc khoa rieng
     * @param user 
     * @param key 
     */
    saveUserKey(user,key){
        this.save('#key#'+user.username,JSON.stringify(key));
    }

    getUserKey(user){
        try{
            let results = JSON.parse(this.read('#key#'+user.username));
            return results?results:null;
        }catch(e){
            return null;
        }
    }

    savePublicUsers(friends){
        this.save('#users#public',JSON.stringify(friends));
    }

    getPublicUsers(){
        try{
            let results = JSON.parse(this.read('#users#public'));
            return results?results:null;
        }catch(e){
            return null;
        }
    }

    /**
     * luu tru ban be theo danh ba, su dung cho news
     * @param user 
     * @param contactFriends 
     */
    saveUserContactFriends(user,contactFriends){
        this.save('#contact-friends#'+user.username,JSON.stringify(contactFriends));
    }

    getUserContactFriends(user){
        try{
            let results = JSON.parse(this.read('#contact-friends#'+user.username));
            return results?results:null;
        }catch(e){
            return null;
        }
    }

    /**
     * luu tru ban be theo cha, dong y ket ban
     * @param user 
     * @param chatFriends 
     */
    saveUserChatFriends(user,chatFriends){
        this.save('#chat-friends#'+user.username,JSON.stringify(chatFriends));
    }

    getUserChatFriends(user){
        try{
            let results = JSON.parse(this.read('#chat-friends#'+user.username));
            return results?results:[];
        }catch(e){
            return [];
        }
    }

    saveUserRemoveFriends(user,chatFriends){
        this.save('#remove-friends#'+user.username,JSON.stringify(chatFriends));
    }

    getUserRemoveFriends(user){
        try{
            let results = JSON.parse(this.read('#remove-friends#'+user.username));
            return results?results:[];
        }catch(e){
            return [];
        }
    }

    saveUserContacts(user,contacts){
        this.save('#contacts#'+user.username,JSON.stringify(contacts));
    }

    getUserContacts(user){
        try{
            let results = JSON.parse(this.read('#contacts#'+user.username));
            return results?results:{};
        }catch(e){
            return {};
        }
    }

    savePhoneContacts(user,contacts){
        this.save('#phone-contacts#'+user.username,JSON.stringify(contacts));
    }

    getPhoneContacts(user){
        try{
            let results = JSON.parse(this.read('#phone-contacts#'+user.username));
            return results?results:[];
        }catch(e){
            return [];
        }
    }

    saveUserRooms(user,rooms){
        this.save('#rooms#'+user.username,JSON.stringify(rooms));
    }

    deleteUserRooms(user){
        this.delete('#rooms#'+user.username);
    }

    getUserRooms(user){
        try{
            let rooms = JSON.parse(this.read('#rooms#'+user.username));
            return [];//rooms?rooms:[];
        }catch(e){
            return [];
        }
    }

    saveUserLastTime(user,time:number){
        this.save('#last_time#'+user.username,time.toString());
    }

    deleteUserLastTime(user){
        this.delete('#last_time#'+user.username);
    }

    getUserLastTime(user){
        try{
            let time = parseInt(this.read('#last_time#'+user.username));
            return time;
        }catch(e){
            return 0;
        }
    }

    saveUserRoomMessages(user,room){
        this.save('#message'+room.name+'#'+user.username,JSON.stringify(room.messages));
        this.saveUserLastTime(user,new Date().getTime());
    }

    getUserRoomMessages(user,room){
        try{
            let messages = JSON.parse(this.read('#message'+room.name+'#'+user.username));
            return messages?messages:[];
        }catch(e){
            return [];
        }
    }



    /**
     * Chuyển đổi một mảng có cấu trúc thành cấu trúc cây (như oracle)
     * Phục vụ quản lý theo tiêu chí hình cây
     * @param arrIn 
     * @param option 
     * @param level 
     */
    createTree(arrIn,option?:{id:string,parentId:string,startWith:any},level?:number){
        var myLevl = level?level:0;
        var myOption = option?option:{id:'id',parentId:'parentId',startWith:null}

        var roots = arrIn.filter(x=>x[option.parentId]!=x[option.id]&&x[option.parentId]==option.startWith);
        //console.log('roots',roots);
        if (roots.length>0){
            myLevl++;
            roots.forEach(el => {
                //console.log('myId',el[option.id], myLevl);
                el.$level= myLevl;
                el.$children= arrIn.filter(x=>x[option.parentId]!=x[option.id]&&x[option.parentId]==el[option.id]);
                if (el.$children.length>0){
                    el.$children.forEach(ch=>{
                        ch.$level = myLevl + 1;
                        //console.log('myId child',ch[option.id], ch.$level);
                        myOption.startWith = ch[option.id];
                        ch.$children=this.createTree(arrIn,myOption,ch.$level)
                    })
                }else{
                    el.$isleaf=1;
                    el.$children=undefined;
                }
            });
            return roots;
        }else {
            arrIn.forEach(el => {
                el.$level= myLevl;
                el.$isleaf=1;
            });
            return arrIn //khong tao duoc cay vi khong tim thay
        }
    }

}