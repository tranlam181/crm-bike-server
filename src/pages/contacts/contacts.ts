import { Component } from '@angular/core';
import { LoadingController, ToastController, ItemSliding, AlertController, ModalController } from 'ionic-angular';

import { Contacts, Contact } from '@ionic-native/contacts';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { DynamicFormWebPage } from '../dynamic-form-web/dynamic-form-web';
import { ApiLocationService } from '../../services/apiLocationService';

@Component({
  selector: 'page-contacts',
  templateUrl: 'contacts.html'
})
export class ContactsPage {


  dynamicContacts: any = {};
  options: any = [];

  orginContacts: string = "STORAGE";
  changeFixType: number = 0;

  isLoaded: boolean = false;

  count_delete: any = 0;

  //tham so chi cho phep hien thi 20 bang ghi thoi
  contactViews: any = [];
  currentMax: number = 0;
  maxCount1Page: number = 20;

  //maxCountContact:number = 0;
  //currentPage: number = 0;
  //maxPage: number = 0;


  phoneContacts: any = [];
  /** of fullname:
   * [
   * {
   *  fullname:
   * , nickname:
   * , image:
   * , phones: [{value:, type:}] 
   * , emails: [{value:, type:}]
   * , relationship: [friend, closefriend, schoolmate, family, co-worker, partner, work, neigbor]
   * }
   * ]
   */

  uniquePhones: any = {};
  /** of username: -- chuyen doi thanh +8490...
   * {"+84903500888": 
   * {
   *  fullname:
   * , nickname:
   * , image:
   * , relationship: [friend, closefriend, schoolmate, family, co-worker, partner, work, neigbor]
   * }
   */

  uniqueEmails: any = {};
  /** of email:
   * {"cuong.dq@mobifone.vn": 
   * {
   *  fullname:
   * , nickname:
   * , image:
   * , relationship: [friend, closefriend, schoolmate, family, co-worker, partner, work, neigbor]
   * }
   */

  //phoneContactsOrigin: any = [];

  isSearch: boolean = false;
  searchString: string = '';

  prefix_change: any;
  vn_prefix_code: any;

  userInfo: any;


  constructor(
    private apiAuth: ApiAuthService,
    private apiStorage: ApiStorageService,
    private apiLocation: ApiLocationService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private contacts: Contacts) { }


  ngOnInit() {

    this.userInfo = this.apiAuth.getUserInfo();

    if (this.userInfo) {
      this.refresh();
    } else {
      this.presentAlert("Please login first!");
    }

    setTimeout(() => {
      this.isLoaded = true;
    }, 5000);

  }


  setViewConctactsPage(next: 1 | -1) {
    let start = 0;
    let length = this.currentMax + this.maxCount1Page;

    if (next === 1) {
      if (length < this.phoneContacts.length) {
        this.currentMax = length;
      }

    } else {
      if (start > 0) {
        this.currentMax = start - this.maxCount1Page;
      }
    }
    //console.log(next,this.currentPage,start,length);
    this.contactViews = this.phoneContacts.slice(start, length);
  }



  async refresh() {

    let loading = this.loadingCtrl.create({
      content: 'Đang đọc danh bạ đã xử lý...'
    });
    loading.present();

    this.dynamicContacts = {
      title: "DANH BẠ CỦA BẠN"
      , search_bar: { hint: "Tìm tên hoặc số" }
      , buttons: [
        { color: "primary", icon: "person-add", next: "ADD" }    //doc danh ba, pickup 1 so addfriend
        /* , {color:"primary", icon:"contacts", next:"FRIENDS" //doc danh ba chinh thuc
              , alerts:[
              "903500888"
              ]
        } */
        , { color: "primary", icon: "sync", next: "SYNC", alerts: [] }          //doc danh ba tu may, day len may chu
        //, {color:"primary", icon:"cog", next:"SETTINGS"}        //Thiet lap thong so
      ]
    }

    this.options = [
      { color: "secondary", icon: "edit", name: "Sửa", next: "EDIT" }
      , { color: "danger", icon: "trash", name: "Xóa", next: "DELETE" }
    ];

    try {
      this.prefix_change = await this.apiAuth.getDynamicUrl(ApiStorageService.authenticationServer + "/ext-public/vn-prefix-change");
      this.vn_prefix_code = await this.apiAuth.getDynamicUrl(ApiStorageService.authenticationServer + "/ext-public/vn-net-code");
    } catch (e) { }

    //doc tu dia len, neu co thi liet ke ra luon
    let phoneContacts = this.apiStorage.getPhoneContacts(this.userInfo);

    if (phoneContacts && phoneContacts.length > 0) {
      this.phoneContacts = this.processServerContacts(phoneContacts);
    } else {

      try {
        //truong hop chua co thi doc tu may chu
        phoneContacts = await this.listContactsFromServer();

        if (phoneContacts && phoneContacts.length > 0) {
          this.phoneContacts = this.processServerContacts(phoneContacts);
        } else {
          //kiem tra neu la core 
          this.phoneContacts = await this.listContacts();
        }

      } catch (e) {
        //doc tu may len
        //neu khong co tu may chu thi doc tu dien thoai ra
        this.phoneContacts = await this.listContacts();
      }
    }

    //hien thi chi 20 bang ghi thoi
    this.currentMax = 0;
    this.setViewConctactsPage(1);

    loading.dismiss();

  }

  closeSwipeOptions(slidingItem: ItemSliding) {
    slidingItem.close();
    slidingItem.setElementClass("active-sliding", false);
    slidingItem.setElementClass("active-slide", false);
    slidingItem.setElementClass("active-options-right", false);
  }

  onClickDetails(slidingItem: ItemSliding, btn: any, idx: any) {
    this.closeSwipeOptions(slidingItem);
    if (btn.next === "DELETE") {

      let remove = this.contactViews.splice(idx, 1);
      this.phoneContacts.splice(idx, 1);

      let btnHeader = this.dynamicContacts.buttons.find(x => x.next === "SYNC");
      if (btnHeader && btnHeader.alerts) btnHeader.alerts.push(remove);

    }

  }

  async onClickHeader(btn) {
    if (btn.next === "ADD") {
      this.pickContacts()
        .then(data => {
          if (data) {
            this.presentAlert("Ban chon danh ba" + JSON.stringify(data));
          } else {
            this.presentAlert("khong co danh ba nao duoc chon");
          }
        });
    }

    if (btn.next === "SYNC") {
      let form = {
        title: "ĐỒNG BỘ"
        , buttons: [
          { color: "danger", icon: "close", next: "CLOSE" }
        ]
        , items: [
          { type: "title", name: "Chọn nguồn đồng bộ" }
          , { type: "select", key: "origin", name: "Nguồn đồng bộ:", value: this.orginContacts, options: [{ name: "Lưu lại", value: "SAVE" }, { name: "Đọc từ Bộ nhớ", value: "STORAGE" }, { name: "Đọc từ Máy chủ", value: "SERVER" }, { name: "Đọc từ Danh bạ", value: "PHONE" }] }
          , { type: "select", key: "change_prefix", name: "Đổi đầu số:", value: 0, options: [{ name: "Không đổi số", value: 0 }, { name: "Đối số cố định", value: 1 }, { name: "Đổi số di động", value: 2 }, { name: "Đổi số tất cả", value: 3 }] }
          ,
          {
            type: "button"
            , options: [
              { name: "Đồng bộ", next: "CALLBACK" }
            ]
          }
        ]


      }
      //cho popup cửa sổ chọn các tham số
      this.openModal(DynamicFormWebPage, {
        parent: this,
        callback: this.callbackSettings,
        form: form
      })
    }

    if (btn.next === "FRIENDS") {
      //ket ban va luu them vao danh ba

    }

  }

  callbackSettings = function (res) {

    this.changeFixType = res.data.change_prefix;
    this.orginContacts = res.data.origin;
    return new Promise(async (resolve, reject) => {

      if (this.orginContacts === 'SAVE') {

        let loading = this.loadingCtrl.create({
          content: 'Đồng bộ danh bạ đã tinh chỉnh...'
        });
        loading.present();

        if (this.phoneContacts.length > 0 && this.userInfo) {
          try {
            await this.apiStorage.savePhoneContacts(this.userInfo, this.phoneContacts);
            await this.saveContacts2Server(this.phoneContacts);
            let btnHeader = this.dynamicContacts.buttons.find(x => x.next === "SYNC");
            if (btnHeader && btnHeader.alerts) btnHeader.alerts = []; //reset ve 0
          } catch (e) { }
        } else {
          this.presentAlert('Không có danh bạ nào được được lưu lại')
        }

        loading.dismiss();
        //hoi xem co dong bo lai danh ba vao may khong?
        //neu co thi luu lai danh ba (xoa het danh ba va luu lai danh ba moi)

      }

      else {

        //console.log(res.data);
        let tmpPhoneContacts;
        if (this.orginContacts === 'STORAGE') {
          //doc tu dia len, neu co thi liet ke ra luon
          tmpPhoneContacts = this.processServerContacts(this.apiStorage.getPhoneContacts(this.userInfo));
          //console.log(tmpPhoneContacts);
        }

        if (this.orginContacts === 'SERVER') {
          tmpPhoneContacts = this.processServerContacts(await this.listContactsFromServer());
          //console.log(tmpPhoneContacts);
        }

        if (this.orginContacts === 'PHONE') {
          tmpPhoneContacts = await this.listContacts();  //da chuyen doi contact
          //console.log(tmpPhoneContacts);
          if (tmpPhoneContacts && tmpPhoneContacts.length > 0) {
            this.saveContacts2Server(tmpPhoneContacts);
            this.apiStorage.savePhoneContacts(this.userInfo, tmpPhoneContacts);
          }
        }

        if (tmpPhoneContacts && tmpPhoneContacts.length > 0) {
          this.phoneContacts = tmpPhoneContacts;
          //chuyen doi de hien thi
          //hien thi chi 20 bang ghi thoi
          this.currentMax = 0;
          this.setViewConctactsPage(1);
        } else {
          this.presentAlert('Không có danh bạ nào được đọc')
        }
      }
      resolve({ next: "CLOSE" })
    })
  }.bind(this);

  //chuyen doi phone duy nhat
  //neu so dau tien la + thi giu nguyen
  //neu so dau tien la 00 thi thay bang +
  //neu so dau tien la 0 thi thay bang +84 (ma quoc gia nuoc user)
  //doi so: +84121-->+8471...

  vnChangePrefix(phoneReturn, nation_callingcode, prefix, type) {

    //if (phoneReturn.indexOf('051135015977')>=0) console.log(phoneReturn);

    if (prefix) {
      let found = prefix.find(x => ("+" + nation_callingcode + x.old_code) === phoneReturn.substring(0, ("+" + nation_callingcode + x.old_code).length))
      if (found) {
        phoneReturn = "+" + nation_callingcode + found.new_code + phoneReturn.substring(("+" + nation_callingcode + found.old_code).length)
      } else {

        found = prefix.find(x => ("0" + x.old_code) === phoneReturn.substring(0, ("0" + x.old_code).length))

        //if (phoneReturn.indexOf('0511')===0) console.log('found',found);

        if (found) {
          phoneReturn = "0" + found.new_code + phoneReturn.substring(("0" + found.old_code).length)
        }
      }
    }
    return phoneReturn;
  }


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


  processContacts(data) {

    let _phoneContacts = [];
    let _uniquePhones = {};
    let _uniqueEmails = {};


    if (data) {

      data.forEach(contact => {

        //console.log(contact);

        let nickname = contact._objectInstance && contact._objectInstance.name && contact._objectInstance.name.formatted ? contact._objectInstance.name.formatted : contact._objectInstance.name.givenName;
        let fullname = contact._objectInstance.displayName ? contact._objectInstance.displayName : nickname;
        let phones = [];
        let emails = [];
        let relationship = [];
        //tu nguoi dung dinh nghia bang cach chon
        //: ['public', 'friend-of-friend' , 'friend', 'closefriend', 'schoolmate', 'family', 'co-worker', 'partner', 'work', 'neigbor', 'doctor', 'teacher', 'vip', 'blacklist']

        //console.log(fullname);


        if (contact._objectInstance.phoneNumbers) {
          contact._objectInstance.phoneNumbers.forEach(phone => {

            let phonenumber = phone.value.replace(/[^0-9+]+/g, "");

            if (phonenumber && phonenumber !== "") {

              let netCode = this.checkPhoneType(phonenumber, '84', this.vn_prefix_code);
              //console.log(netCode);

              if (this.changeFixType) {
                phonenumber = this.vnChangePrefix(phonenumber, '84', this.prefix_change, this.changeFixType);
              }

              let intPhonenumber = this.internationalFormat(phonenumber, '84');

              if (!_uniquePhones[intPhonenumber]) {
                Object.defineProperty(_uniquePhones, intPhonenumber, {
                  value: {
                    fullname: fullname
                    , nickname: nickname
                    , relationship: relationship
                  }, writable: false, enumerable: true, configurable: false
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

        //console.log(fullname);

        if (contact._objectInstance.emails) {

          contact._objectInstance.emails.forEach(email => {

            //console.log(_uniqueEmails[email.value]); 

            if (!_uniqueEmails[email.value]) {

              Object.defineProperty(_uniqueEmails, email.value, {
                value: {
                  fullname: fullname
                  , nickname: nickname
                  , relationship: relationship
                }, writable: false, enumerable: true, configurable: false
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
          //console.log(fullname,_phoneContacts);
        }

      });

    }

    this.uniquePhones = _uniquePhones;
    this.uniqueEmails = _uniqueEmails;
    return _phoneContacts;

  }

  processServerContacts(data) {

    let _phoneContacts = [];
    let _uniquePhones = {};
    let _uniqueEmails = {};

    //console.log('data',data);

    if (data) {

      //console.log('duyet so lieu');

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

              let netCode = this.checkPhoneType(phonenumber, '84', this.vn_prefix_code);
              //console.log(netCode);

              if (this.changeFixType) {
                phonenumber = this.vnChangePrefix(phonenumber, '84', this.prefix_change, this.changeFixType);
              }

              let intPhonenumber = this.internationalFormat(phonenumber, '84');


              if (!_uniquePhones[intPhonenumber]) {
                Object.defineProperty(_uniquePhones, intPhonenumber, {
                  value: {
                    fullname: fullname
                    , nickname: nickname
                    , relationship: relationship
                  }, writable: false, enumerable: true, configurable: false
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
                }, writable: false, enumerable: true, configurable: false
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

          //console.log(fullname);      

        }

      });
    }

    //console.log('result',_phoneContacts);
    this.uniquePhones = _uniquePhones;
    this.uniqueEmails = _uniqueEmails;
    return _phoneContacts;

  }


  listContactsFromServer() {

    return new Promise((resolve, reject) => {

      //console.log('doc tu may chu day');
      let loading = this.loadingCtrl.create({
        content: 'Đọc danh bạ từ máy chủ...'
      });
      loading.present();

      this.apiAuth.getDynamicUrl(ApiStorageService.authenticationServer + "/ext-auth/get-your-contacts", true)
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

  saveContacts2Server(contacts) {
    //luu danh ba len may chu
    this.apiAuth.postDynamicForm(ApiStorageService.authenticationServer + "/ext-auth/save-your-contacts", contacts, true)
      .then(res => {

        this.toastCtrl.create({
          message: "Đã lưu lại thành công!",
          duration: 3000,
          position: 'middle'
        }).present();

      })
      .catch(err_ => {

        this.toastCtrl.create({
          message: "res" + JSON.stringify(err_),
          duration: 10000,
          position: 'bottom'
        }).present();

      })
  }

  /**
   * vao contact thi doc danh ba va load len ds sau khi tinh chinh
   * luu ds len may chu ngay sau khi doc (chi luu ds so goc duy nhat)
   * 1/mot nut luu lai danh ba sau khi da chinh sua
   * 2/truong hop web khong co danh ba cordova..
   * doc du lieu tu may chu (dong bo tu app)
   * truong hop chua dong bo thi danh ba trong
   * truong hop da dong bo thi doc ra ds va hien thi ra
   * cho phep chinh sua, xoa
   * luu lai len may chu va luu xuong session
   * tren mobile
   */
  listContacts() {

    return new Promise((resolve, reject) => {

      //kiem tra co phai la ung dung cordova khong?
      if (this.apiLocation.getPlatform().is_cordova) {

        let loading = this.loadingCtrl.create({
          content: 'Đợi lọc dữ liệu từ danh bạ'
        });
        loading.present();

        this.contacts
          //.find(['displayName', 'name', 'phoneNumbers', 'emails', 'photos', 'urls', 'organizations', 'addresses', 'birthday', 'ims']
          .find(['displayName', 'name', 'phoneNumbers', 'emails',]
            , { filter: "", multiple: true })
          .then(data => {

            loading.dismiss()

            this.toastCtrl.create({
              message: 'Đã đọc xong danh bạ ' + data.length + ' số',
              duration: 5000,
              position: 'middle'
            }).present();

            resolve(this.processContacts(data));
            //this.phoneContacts = ;
            //this.saveContacts2Server(this.phoneContacts);
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

      } else {
        this.presentAlert("Bạn phải cài đặt ứng dụng mới sử dụng được chức năng này");
        resolve([]);
      }
    })
  }

  /** Goi menu he thong de mo danh ba ra
   * ket qua sau khi chon mot danh ba nao do thi se in ra
   */
  pickContacts() {
    return new Promise((resolve, reject) => {
      if (this.apiLocation.getPlatform().is_cordova) {


        let loading = this.loadingCtrl.create({
          content: 'Đợi load danh bạ từ máy để bạn chọn...'
        });
        loading.present();

        //Goi menu he thong
        this.contacts.pickContact()
          .then((oneContact: Contact) => {
            //ket qua chon duoc 1 danh ba trong danh sach

            this.showToast(loading, 'Bạn đã chọn được 1 danh bạ ' + (oneContact.displayName ? oneContact.displayName : oneContact.name.formatted ? oneContact.name.formatted : oneContact.name.familyName ? oneContact.name.familyName : 'Không biết tên'), 0, 1);

            if (oneContact.phoneNumbers) {
              oneContact.phoneNumbers.forEach((value, index) => {
                let obj;
                obj = value;
                //so dien thoai lien quan
                //console.log('PhoneNumber : ', obj.id, obj.type, obj.value);
              })
            }
            if (oneContact.photos) {
              oneContact.photos.forEach((value, index) => {
                let obj;
                obj = value;
                //anh dai dien
                //console.log('Photo: ', obj.id, obj.type, obj.value)
              });
            }

            if (oneContact.urls) {
              oneContact.urls.forEach((value, index) => {
                let obj;
                obj = value;
                //link nick google plus or facebook...
                //console.log('Url: ', obj.id, obj.type, obj.value)
              });
            }

            //tra ve 1 array chua 1 danh ba cua nguoi dung da chon
            resolve(this.processContacts([oneContact]));

          })
          .catch(err => {
            this.presentAlert('Lỗi đọc danh bạ: ' + JSON.stringify(err));
            resolve();
          });
      } else {
        this.presentAlert("Bạn phải cài đặt ứng dụng mới sử dụng được chức năng này");
        resolve();
      }
    })
  }

  showToast(ld: any, msg: string, dur?: 0 | 1 | 2, pos?: 0 | 1 | 2) {
    if (ld) ld.dismiss();
    this.toastCtrl.create({
      message: msg,
      duration: dur == 0 ? 2000 : dur == 1 ? 3000 : 5000,
      position: pos == 0 ? 'top' : pos == 1 ? 'middle' : 'bottom'
    }).present();
  }


  presentAlert(message) {
    this.alertCtrl.create({
      title: 'Alert',
      subTitle: 'For Administrator',
      message: message,
      buttons: ['OK']
    }).present();
  }

  doInfinite(infiniteScroll, direction) {

    this.isLoaded = false;

    if (direction === 'UP') {
      //console.log('UP');
      //this.setViewConctactsPage(-1);
    } else {
      //console.log('DOWN');
      this.setViewConctactsPage(1);

    }

    setTimeout(() => {
      this.isLoaded = true;
      infiniteScroll.complete();
    }, 1000);

  }

  goSearch() {
    this.isSearch = true;
  }

  onInput(e) {
    console.log(this.searchString);
  }

  searchEnter() {
    this.isSearch = false;
  }

  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }

}




