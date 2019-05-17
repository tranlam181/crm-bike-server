import { LoadingController, ToastController, Events, AlertController } from 'ionic-angular';
import { Injectable } from '@angular/core';
import { ApiAuthService } from './apiAuthService';
import { ApiStorageService } from './apiStorageService';
import { ApiLocationService } from './apiLocationService';
import { ApiMapService } from './apiMapService';

@Injectable()
export class ApiChatService {

    curSiteList: any = [];

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

    getMyParams() {
        return {
            my_site: this.curSiteList
        };
    }

    siteChangeSuccessfull() {
        this.events.publish('event-change-site-room'
            , {
                my_site: this.curSiteList
            }
        );
    }

    getListMaintenance(){
       this.apiAuth.getDynamicUrl('',true)
        .then(data=>{
            this.curSiteList = data;
        })
    }


}