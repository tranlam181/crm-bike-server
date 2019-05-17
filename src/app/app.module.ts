import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Geolocation } from '@ionic-native/geolocation';
import { StorageServiceModule } from 'angular-webstorage-service';
import { SQLite } from '@ionic-native/sqlite';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { MyApp } from './app.component';
import { HomeSpeedtestPage } from '../pages/home-speedtest/home-speedtest';
import { HomeMenuPage } from '../pages/home-menu/home-menu';
import { TimeAgoPipe} from 'time-ago-pipe';

import { AutoCompleteModule } from 'ionic2-auto-complete';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { NgxBarcodeModule } from 'ngx-barcode';
import { ChartsModule } from 'ng2-charts-x';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';


import {Device} from '@ionic-native/device';
import {Sim} from '@ionic-native/sim';
import {Network} from '@ionic-native/network';

import { Contacts } from '@ionic-native/contacts';

import { ApiSpeedTestService } from '../services/apiSpeedTestService';
import { ApiAuthService } from '../services/apiAuthService';
import { ApiImageService } from '../services/apiImageService';
import { ApiGraphService } from '../services/apiMeterGraphService';
import { ApiStorageService } from '../services/apiStorageService';
import { ApiLocationService } from '../services/apiLocationService'
import { LoginPage } from '../pages/login/login';
import { TabsPage } from '../pages/tabs/tabs';
import { DynamicFormWebPage } from '../pages/dynamic-form-web/dynamic-form-web';
import { DynamicListPage } from '../pages/dynamic-list/dynamic-list';
import { DynamicFormMobilePage } from '../pages/dynamic-form-mobile/dynamic-form-mobile';
import { DynamicCardSocialPage } from '../pages/dynamic-card-social/dynamic-card-social';
import { DynamicMediasPage } from '../pages/dynamic-medias/dynamic-medias';
import { DynamicListOrderPage } from '../pages/dynamic-list-order/dynamic-list-order';
import { HandDrawPage } from '../pages/hand-draw/hand-draw';
import { ApiHttpPublicService } from '../services/apiHttpPublicServices';
import { ApiResourceService } from '../services/apiResourceServices';
import { RequestInterceptor } from '../interceptors/requestInterceptor';
import { ResponseInterceptor } from '../interceptors/responseInterceptor';
import { SpeedTestPage } from '../pages/speed-test/speed-test';
import { ApiSqliteService } from '../services/apiSqliteService';
import { ResultsPage } from '../pages/results/results';
import { GoogleMapPage } from '../pages/google-map/google-map';
import { ApiMapService } from '../services/apiMapService';
import { DynamicRangePage } from '../pages/dynamic-range/dynamic-range';
import { TreeView } from '../components/tree-view/tree-view';
import { DynamicTreePage } from '../pages/dynamic-tree/dynamic-tree';
import { ApiMediaService } from '../services/apiMediaService';
import { OwnerImagesPage } from '../pages/owner-images/owner-images';
import { HomeChatPage } from '../pages/home-chat/home-chat';
import { Autosize } from '../components/autosize';
import { LinkPage } from '../pages/link/link';
import { SafePipe } from '../pipes/safe-pipe';
import { QrBarScannerPage } from '../pages/qr-bar-scanner/qr-bar-scanner';
import { QrBarCodePage } from '../pages/qr-bar-code/qr-bar-code';
import { ContactsPage } from '../pages/contacts/contacts';
import { CordovaPage } from '../pages/cordova-info/cordova-info';
import { ApiContactService } from '../services/apiContactService';
import { ApiChatService } from '../services/apiChatService';
import { FriendsPage } from '../pages/friends/friends';
import { ReversePipe } from '../pipes/reverse-pipe';
import { ChattingPrivatePage } from '../pages/chatting-private/chatting-private';
import { ChattingRoomPage } from '../pages/chatting-room/chatting-room';
import { ReportPage } from '../pages/report/report';
import { ApiAutoCompleteService } from '../services/apiAutoCompleteService';
import { DynamicChartPage } from '../pages/dynamic-chart/dynamic-chart';
import { NewlinePipe } from '../pipes/new-line';
import { LinkifyPipe } from '../pipes/linkify';

@NgModule({
  declarations: [
    MyApp,
    TreeView,
    LoginPage,
    QrBarCodePage,
    QrBarScannerPage,
    ContactsPage,
    LinkPage,
    CordovaPage,
    HomeSpeedtestPage,
    ResultsPage,
    TabsPage,
    SpeedTestPage,
    OwnerImagesPage,
    DynamicFormWebPage,
    DynamicFormMobilePage,
    DynamicRangePage,
    HomeMenuPage,
    DynamicTreePage,
    DynamicListPage,
    DynamicCardSocialPage,
    DynamicMediasPage,
    DynamicListOrderPage,
    DynamicChartPage,
    GoogleMapPage,
    HomeChatPage,
    HandDrawPage,
    TimeAgoPipe,
    SafePipe,
    ReversePipe,
    NewlinePipe,
    LinkifyPipe,
    Autosize,
    FriendsPage,
    ChattingPrivatePage,
    ChattingRoomPage,
    ReportPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    StorageServiceModule,
    NgxBarcodeModule,
    NgxQRCodeModule,
    ChartsModule,
    AutoCompleteModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TreeView,
    LoginPage,
    QrBarCodePage,
    QrBarScannerPage,
    ContactsPage,
    LinkPage,
    CordovaPage,
    HomeSpeedtestPage,
    ResultsPage,
    TabsPage,
    SpeedTestPage,
    OwnerImagesPage,
    DynamicFormWebPage,
    DynamicFormMobilePage,
    DynamicRangePage,
    HomeMenuPage,
    DynamicTreePage,
    DynamicListPage,
    DynamicCardSocialPage,
    DynamicMediasPage,
    DynamicListOrderPage,
    DynamicChartPage,
    GoogleMapPage,
    HomeChatPage,
    HandDrawPage,
    FriendsPage,
    ChattingPrivatePage,
    ChattingRoomPage,
    ReportPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Geolocation,
    BarcodeScanner,
    Contacts,
    Device,
    Sim,
    Network,
    SQLite,
    InAppBrowser,
    ApiGraphService,
    ApiImageService,
    ApiAuthService,
    ApiStorageService,
    ApiSqliteService,
    ApiSpeedTestService,
    ApiHttpPublicService,
    ApiMediaService,
    ApiResourceService,
    ApiLocationService,
    ApiMapService,
    ApiContactService,
    ApiChatService,
    RequestInterceptor,
    ApiAutoCompleteService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ResponseInterceptor,
      multi: true
    },
    {provide: ErrorHandler,
       useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
