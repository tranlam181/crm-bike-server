/**
 * Dich vu nay thuc hien quan ly danh ba dien thoai
 * tu bo nho (da luu tru truoc),
 * tu may chu (da luu tru truoc),
 * tu smartphone (chua luu tru truoc)
 * tao ra danh muc friend ban be trong danh ba cua minh
 * co user tren he thong (lay duoc anh dai dien)
 */
import { LoadingController, ToastController } from 'ionic-angular';
import { Injectable } from '@angular/core';

import { Contacts } from '@ionic-native/contacts';

import { ApiStorageService } from './apiStorageService';
import { ApiAuthService } from './apiAuthService';
import { ApiImageService } from './apiImageService';

@Injectable()
export class ApiContactService {

    contactFriends: any = []; //danh sach ban be de lien ket
    publicUsers: any = []; //danh sach ban be de lien ket

    uniqueContacts: any = {} //danh muc duy nhat

    constructor(
        private apiAuth: ApiAuthService,
        private apiStorage: ApiStorageService,
        private apiImage: ApiImageService,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private contacts: Contacts
    ) {
    }

    getPhoneNumber(phoneNumber){
        return phoneNumber.indexOf('0')===0&&phoneNumber.indexOf('+')<0?phoneNumber:'0'+phoneNumber;
    }

    /**
     * lay unique Contact chua thong tin public, contactFriends
     */
    getUniqueContacts() {
        
        if (this.publicUsers) {
            this.publicUsers.forEach(el => {
                //console.log('public', el)
                //let relationship = [];
                //tu nguoi dung dinh nghia bang cach chon
                //: ['public', 'friend-of-friend' , 'friend', 'closefriend', 'schoolmate', 'family', 'co-worker', 'partner', 'work', 'neigbor', 'doctor', 'teacher', 'vip', 'blacklist']
                //neu chua co danh ba luu tru thi them vao
                if (!this.uniqueContacts[el.username]) {
                    Object.defineProperty(this.uniqueContacts, el.username, {
                        value: {
                            fullname: el.fullname,
                            nickname: el.nickname,
                            address: el.address,
                            phone: this.getPhoneNumber(el.phone),
                            image: el.image,
                            avatar: el.avatar,
                            relationship: el.relationship
                            //this.apiAuth.getBroadcastStatus(user.broadcast_status)
                            //this.apiAuth.getBroadcastStatus(el.relationship)
                            //[el.relationship === 1 ? 'public' : 'friend']
                        },
                        writable: true, enumerable: true, configurable: false
                    });
                } else {
                    if (el.image) this.uniqueContacts[el.username].image = el.image;
                    if (el.avatar) this.uniqueContacts[el.username].avatar = el.avatar;
                }
            })
        }

        if (this.contactFriends) {
            this.contactFriends.forEach(el => {
                //console.log('contactFriends', el.username, el.avatar)
                if (!this.uniqueContacts[el.username]) {
                    Object.defineProperty(this.uniqueContacts, el.username, {
                        value: {
                            fullname: el.fullname,
                            nickname: el.nickname,
                            address: el.address,
                            phone: this.getPhoneNumber(el.phone),
                            image: el.image,
                            avatar: el.avatar,
                            relationship: el.relationship
                            //this.apiAuth.getBroadcastStatus(el.relationship)//[el.relationship === 1 ? 'public' : 'friend']
                        },
                        writable: true, enumerable: true, configurable: false
                    });
                } else {
                    if (el.image) this.uniqueContacts[el.username].image = el.image;
                    if (el.avatar) this.uniqueContacts[el.username].avatar = el.avatar;
                }
            })
        }

        return this.uniqueContacts;
    }
    /**
     * public users phục vụ lấy tin tức 
     * hiển thị tin tức
     */
    getPublicUsers(isRenew?: boolean) {
        return new Promise<any>(async (resolve, reject) => {
            //lay danh sach user public de lay thong tin
            this.publicUsers = this.apiStorage.getPublicUsers();
            if (!this.publicUsers || isRenew) {
                let users = await this.listUserFromServer();
                this.publicUsers = [];
                if (users) {
                    users.forEach(el => {
                        //ban cua minh trang thai ban
                        el.relationship = el.relationship?el.relationship:this.apiAuth.getBroadcastStatus(el.broadcast_status);
                        let index = this.publicUsers.findIndex(x => x.username === el.username);
                        if (index >= 0) {
                            this.publicUsers.splice(index, 1, el);
                        } else {
                            this.publicUsers.push(el);
                        }
                    });
                    this.publicUsers = await this.prepareAvatars(this.publicUsers, isRenew);
                    this.apiStorage.savePublicUsers(this.publicUsers);
                }
            }
            resolve(this.publicUsers);
        })
    }

    /**
     * private contactFriends phục vụ lấy tin tức, 
     * chat, danh bạ liên hệ
     * 
       * thu tuc nay goi khi login thanh cong, co day du thong tin user
       * thuc hien doc tren local cac thong tin
       * contactFriends, id, pass 
       * neu chua co 
       * 
       * Lay trong danh ba 
       */
    prepareFriends(userInfo: any, isAddFriend?: boolean) {
        return new Promise<any>(async (resolve, reject) => {
            if (userInfo) {
                this.contactFriends = this.apiStorage.getUserContactFriends(userInfo);
                //neu da co danh ba roi thi lay ra khong tao them nua
                //console.log('ban be',this.contactFriends);
                //viec ket ban se su dung chuc nang khac khong cho tu dong
                if (!this.contactFriends || isAddFriend) {
                    //doc danh ba,
                    let vn_prefix_code;
                    let contactsProcessed;

                    try {
                        vn_prefix_code = await this.apiAuth.getDynamicUrl(ApiStorageService.authServer + "/ext-public/vn-net-code");
                    } catch (e) { }

                    //doc tu dia len, neu co thi liet ke ra luon
                    let phoneContacts = this.apiStorage.getPhoneContacts(userInfo);

                    if (phoneContacts.length>0) {
                        contactsProcessed = this.processContactsFromServer(phoneContacts, vn_prefix_code);
                        //console.log('uniquePhones storage', contactsProcessed.uniquePhones);
                    } else {

                        try {
                            //truong hop chua co thi doc tu may chu
                            phoneContacts = await this.listContactsFromServer();

                            if (phoneContacts.length>0) {
                                contactsProcessed = this.processContactsFromServer(phoneContacts, vn_prefix_code);
                                //console.log('uniquePhones server', contactsProcessed.uniquePhones);
                            } else {
                                //doc danh ba tu dien thoai
                                phoneContacts = await this.listContactsFromSmartPhone();
                                if (phoneContacts.length>0) {
                                    contactsProcessed = this.processContactsFromSmartPhone(phoneContacts, vn_prefix_code);
                                    //console.log('uniquePhones smartphone', contactsProcessed.uniquePhones);
                                }
                            }

                        } catch (e) {
                            //doc tu may len
                            //neu khong co tu may chu thi doc tu dien thoai ra
                            phoneContacts = await this.listContactsFromSmartPhone();
                            if (phoneContacts.length>0) {
                                contactsProcessed = this.processContactsFromSmartPhone(phoneContacts, vn_prefix_code);
                                //console.log('uniquePhones smartphone', contactsProcessed.uniquePhones);
                            }
                        }
                    }
                    //doc ds tren server tu danh ba
                    //neu co thi tu dong ket ban
                    //chuyen doi contactsProcessed sang friend
                    if (contactsProcessed && contactsProcessed.uniquePhones) {
                        //da tim thay danh ba
                        //loc lay du lieu tu server cac user da dang ky
                        // dang username '90'
                        //neu danh ba co luu thi tao thanh contactFriends
                        let contactFriends;
                        let count = 0;
                        for (let key in contactsProcessed.uniquePhones) {
                            //dang so dien thoai luu lai la +8490
                            //nen cat di +84 de lay danh ba tu may chu
                            //console.log(key.indexOf("+84"),contactsProcessed.uniquePhones[key].type);
                            //la dien thoai di dong thi moi xem xet
                            if (key.indexOf("+84") === 0
                                && contactsProcessed.uniquePhones[key].type === "M"
                            ) {


                                contactFriends = (contactFriends ? contactFriends + "," : "") + "'" + key.slice(3) + "'"
                                if (++count >= 500) {
                                    let users = await this.listUserFromServer(contactFriends);

                                    if (users) {
                                        //console.log('lay user nay', users);
                                        //lay danh sach user ket hop voi danh ba se ra duoc
                                        //danh sach ban be ket noi nhau
                                        //ghi nhan so dien thoai quoc te nhe
                                        users.forEach(el => {
                                            //ban cua minh trang thai ban
                                            el.relationship = el.relationship?el.relationship:this.apiAuth.getBroadcastStatus(2);
                                            if (!this.contactFriends) this.contactFriends = [];
                                            let index = this.contactFriends ? this.contactFriends.findIndex(x => x.username === el.username) : null;
                                            if (index >= 0) {
                                                this.contactFriends.splice(index, 1, el);
                                            } else {
                                                this.contactFriends.push(el);
                                            }
                                        });
                                    }
                                    //delay 1s de lay tiep, ko se bao loi tan cong server
                                    await this.delay(1000);

                                    count = 0;
                                    contactFriends = null;
                                }
                            }
                        }

                        if (count > 0 && contactFriends) {
                            let users = await this.listUserFromServer(contactFriends);
                            if (users) {
                                users.forEach(el => {
                                    //ban cua minh trang thai ban
                                    el.relationship = el.relationship?el.relationship:this.apiAuth.getBroadcastStatus(2);

                                    if (!this.contactFriends) this.contactFriends = [];
                                    let index = this.contactFriends ? this.contactFriends.findIndex(x => x.username === el.username) : null;
                                    if (index >= 0) {
                                        this.contactFriends.splice(index, 1, el);
                                    } else {
                                        this.contactFriends.push(el);
                                    }
                                });
                            }
                        }

                        //gan danh muc contacts
                        //console.log('hd',this.uniqueContacts);

                    }
                    this.contactFriends = await this.prepareAvatars(this.contactFriends, isAddFriend);
                    this.apiStorage.saveUserContactFriends(userInfo, this.contactFriends);
                }
                resolve(this.contactFriends);
            } else {
                resolve(); //tra ve ban be public
            }
        })
    }

    /** lay anh avatar ve luu trong mang
     * Anh chi lay kich co avata 32x de hien thi thoi
     */
    prepareAvatars(users, isRenew?: boolean) {
        return new Promise((resolve, reject) => {
            if (users&&this.apiStorage.getToken()) {
                let count = 0;
                users.forEach(async el => {
                    if (!el.avatar || isRenew) { //chua co avatar (da tung luu hoac luu moi)
                        if (!el.image) {
                            el.image = ApiStorageService.mediaServer + "/db/get-private?func=avatar&user=" + el.username + "&token=" + this.apiStorage.getToken();
                            el.avatar = await this.apiImage.createBase64Image(el.image, 32);
                        } else {
                            el.avatar = await this.apiImage.createBase64Image(el.image + "?token=" + this.apiStorage.getToken(), 32);
                        }
                        //await this.delay(100);
                    }
                    //console.log('prepare',users.length,count, el.username, el.avatar);

                    if (++count >= users.length) {
                        resolve(users);
                    }
                })
            } else {
                resolve(users);
            }

        });
    }

    /**
       * Cac ham xu ly danh ba dien thoai:
       * - tu bo nho
       * - tu may chu
       * - tu smartphone
       * 
       */
    processContactsFromServer(data, vn_prefix_code) {

        let _phoneContacts = [];
        let _uniquePhones = {};
        let _uniqueEmails = {};

        if (data) {

            data.forEach(contact => {

                let nickname = contact.nickname;
                let fullname = contact.fullname ? contact.fullname : nickname;
                let phones = [];
                let emails = [];
                let relationship = [];
                //tu nguoi dung dinh nghia bang cach chon
                //: ['friend', 'closefriend', 'schoolmate', 'family', 'co-worker', 'partner', 'work', 'neigbor', 'doctor', 'teacher', 'vip', 'blacklist']
                //if (fullname.indexOf('Loan comisa')>=0) console.log(fullname, contact);

                if (contact.phones) {
                    contact.phones.forEach(phone => {

                        let phonenumber = phone.value.replace(/[^0-9+]+/g, "");

                        if (phonenumber && phonenumber !== "") {

                            let netCode = this.checkPhoneType(phonenumber, '84', vn_prefix_code);

                            let intPhonenumber = this.internationalFormat(phonenumber, '84');

                            if (!_uniquePhones[intPhonenumber]) {
                                Object.defineProperty(_uniquePhones, intPhonenumber, {
                                    value: {
                                        fullname: fullname
                                        , nickname: nickname
                                        , type: netCode && netCode.f_or_m ? netCode.f_or_m : '#'
                                        , relationship: relationship
                                    }, writable: true, enumerable: true, configurable: false
                                });

                                if (fullname) {
                                    _uniquePhones[intPhonenumber].name = {};
                                    Object.defineProperty(_uniquePhones[intPhonenumber].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                                }

                                phones.push({ value: phonenumber, type: netCode && netCode.f_or_m ? netCode.f_or_m : '#', int: intPhonenumber, net: netCode && netCode.network ? netCode.network : '#' })
                            } else {

                                if (fullname) {
                                    if (_uniquePhones[intPhonenumber].name[fullname]) {
                                        _uniquePhones[intPhonenumber].name[fullname] += 1;
                                    } else {
                                        Object.defineProperty(_uniquePhones[intPhonenumber].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                                    }
                                }

                            }

                        }
                    })
                }

                if (contact.emails) {
                    contact.emails.forEach(email => {
                        if (!_uniqueEmails[email.value]) {
                            Object.defineProperty(_uniqueEmails, email.value, {
                                value: {
                                    fullname: fullname
                                    , nickname: nickname
                                    , relationship: relationship
                                }, writable: true, enumerable: true, configurable: false
                            });

                            emails.push({ value: email.value, type: 'E' });

                            if (fullname) {
                                _uniqueEmails[email.value].name = {};
                                Object.defineProperty(_uniqueEmails[email.value].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                            }

                        } else {

                            if (fullname) {
                                if (_uniqueEmails[email.value].name[fullname]) {
                                    _uniqueEmails[email.value].name[fullname] += 1;
                                } else {
                                    Object.defineProperty(_uniqueEmails[email.value].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                                }
                            }

                        }
                    })
                }

                if (fullname && (phones.length > 0 || emails.length > 0)) {

                    //let countPhone = 0;
                    for (let phone in _uniquePhones) {
                        //countPhone++;
                        let countInContact = 0;
                        for (let name in _uniquePhones[phone].name) {
                            countInContact += _uniquePhones[phone].name[name]
                        }
                        _uniquePhones[phone].count = countInContact;
                    }

                    //let emailCount = 0;
                    for (let email in _uniqueEmails) {
                        //emailCount++;
                        let countInContact = 0;
                        for (let name in _uniqueEmails[email].name) {
                            countInContact += _uniqueEmails[email].name[name]
                        }
                        _uniqueEmails[email].count = countInContact;
                    }

                    _phoneContacts.push({
                        fullname: fullname
                        , nickname: nickname
                        , phones: phones
                        , emails: emails
                        , relationship: relationship
                    });

                }

            });
        }
        return {
            contacts: _phoneContacts,
            uniquePhones: _uniquePhones,
            uniqueEmails: _uniqueEmails
        };

    }

    processContactsFromSmartPhone(data, vn_prefix_code) {

        let _phoneContacts = [];
        let _uniquePhones = {};
        let _uniqueEmails = {};


        if (data) {

            data.forEach(contact => {

                let nickname = contact._objectInstance && contact._objectInstance.name && contact._objectInstance.name.formatted ? contact._objectInstance.name.formatted : contact._objectInstance.name.givenName;
                let fullname = contact._objectInstance.displayName ? contact._objectInstance.displayName : nickname;
                let phones = [];
                let emails = [];
                let relationship = [];
                //tu nguoi dung dinh nghia bang cach chon
                //: ['friend', 'closefriend', 'schoolmate', 'family', 'co-worker', 'partner', 'work', 'neigbor', 'doctor', 'teacher', 'vip', 'blacklist']

                //console.log(fullname);


                if (contact._objectInstance.phoneNumbers) {
                    contact._objectInstance.phoneNumbers.forEach(phone => {

                        let phonenumber = phone.value.replace(/[^0-9+]+/g, "");

                        if (phonenumber && phonenumber !== "") {

                            let netCode = this.checkPhoneType(phonenumber, '84', vn_prefix_code);

                            let intPhonenumber = this.internationalFormat(phonenumber, '84');



                            if (!_uniquePhones[intPhonenumber]) {
                                Object.defineProperty(_uniquePhones, intPhonenumber, {
                                    value: {
                                        fullname: fullname
                                        , nickname: nickname
                                        , type: netCode && netCode.f_or_m ? netCode.f_or_m : '#'
                                        , relationship: relationship
                                    }, writable: true, enumerable: true, configurable: false
                                });


                                phones.push({ value: phonenumber, type: netCode && netCode.f_or_m ? netCode.f_or_m : '#', int: intPhonenumber, net: netCode && netCode.network ? netCode.network : '#' })

                                _uniquePhones[intPhonenumber].name = {};
                                if (fullname) {
                                    Object.defineProperty(_uniquePhones[intPhonenumber].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                                }
                            } else {

                                if (fullname) {
                                    if (_uniquePhones[intPhonenumber].name[fullname]) {
                                        _uniquePhones[intPhonenumber].name[fullname] += 1;
                                    } else {
                                        Object.defineProperty(_uniquePhones[intPhonenumber].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                                    }
                                }

                            }

                        }
                    })
                }

                if (contact._objectInstance.emails) {

                    contact._objectInstance.emails.forEach(email => {

                        if (!_uniqueEmails[email.value]) {

                            Object.defineProperty(_uniqueEmails, email.value, {
                                value: {
                                    fullname: fullname
                                    , nickname: nickname
                                    , relationship: relationship
                                }, writable: true, enumerable: true, configurable: false
                            });
                            emails.push({ value: email.value, type: 'E' });
                            _uniqueEmails[email.value].name = {};

                            if (fullname) {
                                Object.defineProperty(_uniqueEmails[email.value].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                            }

                        } else {

                            if (fullname) {
                                if (_uniqueEmails[email.value].name[fullname]) {
                                    _uniqueEmails[email.value].name[fullname] += 1;
                                } else {
                                    Object.defineProperty(_uniqueEmails[email.value].name, fullname, { value: 1, writable: true, enumerable: true, configurable: false });
                                }
                            }

                        }
                    })
                }

                if (fullname && (phones.length > 0 || emails.length > 0)) {

                    //let countPhone = 0;
                    for (let phone in _uniquePhones) {
                        //countPhone++;
                        let countInContact = 0;
                        for (let name in _uniquePhones[phone].name) {
                            countInContact += _uniquePhones[phone].name[name]
                        }
                        _uniquePhones[phone].count = countInContact;
                    }

                    //let emailCount = 0;
                    for (let email in _uniqueEmails) {
                        //emailCount++;
                        let countInContact = 0;
                        for (let name in _uniqueEmails[email].name) {
                            countInContact += _uniqueEmails[email].name[name]
                        }
                        _uniqueEmails[email].count = countInContact;
                    }


                    _phoneContacts.push({
                        fullname: fullname
                        , nickname: nickname
                        , phones: phones
                        , emails: emails
                        , relationship: relationship
                    });

                }

            });

        }

        return {
            contacts: _phoneContacts,
            uniquePhones: _uniquePhones,
            uniqueEmails: _uniqueEmails
        };

    }

    /**
     * Chuyen doi so dien thoai sang kieu quoc te de luu tru duy nhat
     * @param phone 
     * @param nation_callingcode 
     */
    internationalFormat(phone, nation_callingcode) {
        let phoneReturn = phone;

        if (phone.indexOf('+') === 0) {
            phoneReturn = phone;
        }

        if (phone.indexOf('00') === 0) {
            phoneReturn = '+' + phone.substring(2);
        } else if (phone.indexOf('0') === 0) {
            phoneReturn = '+' + nation_callingcode + phone.substring(1);
        }

        return phoneReturn;
    }

    /**
     * lay ma mang dien thoai (co dinh, di dong)
     * Cac dau so luu trong danh ba kieu + hoac 0
     */
    checkPhoneType(phone, nation_callingcode, net_code) {
        if (net_code) {
            let found = net_code.find(x => ("+" + nation_callingcode + x.code) === phone.substring(0, ("+" + nation_callingcode + x.code).length))
            if (found) {
                return found
            } else {
                found = net_code.find(x => ("0" + x.code) === phone.substring(0, ("0" + x.code).length))
                if (found) {
                    return found
                }
            }
        }
        return null;
    }

    /**
     * Doc danh ba tu may chu
     */
    listContactsFromServer() {

        return new Promise((resolve, reject) => {
            let loading = this.loadingCtrl.create({
                content: 'Đọc danh bạ từ máy chủ...'
            });
            loading.present();

            this.apiAuth.getDynamicUrl(ApiStorageService.authServer + "/ext-auth/get-your-contacts", true)
                .then(res => {
                    //console.log('ket qua res', res);
                    if (res.status === 1 && res.result && res.result.length > 0) {
                        resolve(res.result);
                    } else {
                        resolve([]);
                    }
                    loading.dismiss();
                })
                .catch(err => {
                    console.log('loi may chu', err);
                    loading.dismiss();
                    resolve([])
                })

        })

    }

    listContactsFromSmartPhone() {

        return new Promise((resolve, reject) => {
            let loading = this.loadingCtrl.create({
                content: 'Đợi lọc dữ liệu từ danh bạ'
            });
            loading.present();

            this.contacts
                .find(['displayName', 'name', 'phoneNumbers', 'emails',]
                    , { filter: "", multiple: true })
                .then(data => {

                    loading.dismiss()

                    this.toastCtrl.create({
                        message: 'Đã đọc xong danh bạ ' + data.length + ' số',
                        duration: 5000,
                        position: 'middle'
                    }).present();

                    resolve(data);

                })
                .catch(err => {
                    loading.dismiss()

                    this.toastCtrl.create({
                        message: 'Lỗi đọc danh bạ: ' + JSON.stringify(err),
                        duration: 5000,
                        position: 'bottom'
                    }).present();

                    resolve([]);

                });
        })

    }


    listUserFromServer(contactFriends?: string) {

        return new Promise<any>((resolve, reject) => {

            let loading = this.loadingCtrl.create({
                content: 'Tìm bạn bè từ máy chủ...'
            });
            loading.present();

            this.apiAuth.getDynamicUrl(ApiStorageService.authServer + "/ext-auth/get-users-info" + (contactFriends ? "?users=" + contactFriends : ""), true)
                .then(res => {
                    if (res.status === 1 && res.users && res.users.length > 0) {
                        resolve(res.users);
                    } else {
                        resolve();
                    }
                    loading.dismiss();
                })
                .catch(err => {
                    loading.dismiss();
                    resolve()
                })

        })

    }

    delay(milisecond) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, milisecond);
        })
    }

}