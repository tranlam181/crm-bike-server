import { Component } from '@angular/core';
import { NavController, ItemSliding, Platform, NavParams, ViewController, LoadingController, AlertController } from 'ionic-angular';
import { ApiAuthService } from '../../services/apiAuthService';
import * as Chart from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'page-dynamic-chart',
  templateUrl: 'dynamic-chart.html'
})
export class DynamicChartPage {

  dynamicList: any = {};
  dynamicListOrigin: any = {
    title: "Biểu đồ, đồ thị"
    , search_bar: { hint: "Tìm cái gì đó" }
    , buttons: [{
        color: "primary", icon: "notifications", next: "NOTIFY"
        , alerts: [
          "cuong.dq"
        ]
      }
    ]
    , items: [
      {
        image: "assets/imgs/img_forest.jpg"
        , title: "Là tiêu đề của đề mục"
        , content: "Sau khi đánh cồng khai trương phiên giao dịch đầu xuân Kỷ Hợi 2019 tại Sở Giao dịch chứng khoán Hà Nội vào sáng 12-2, Thủ tướng Chính phủ Nguyễn Xuân Phúc khẳng định tầm quan trọng của thị trường chứng khoán Việt Nam."
        , note: Date.now()
      }
      , {
        icon: "contact"
        , title: "Là tiêu đề nội dung 2"
        , content: "Trong những ngày đánh bắt đầu năm, 3 ngư dân Quảng Trị đã thu hoạch được mẻ cá bè gần 140 tấn; trong đó một ngư dân trúng mẻ cá siêu khủng nặng hơn 100 tấn."
        , note: Date.now()
      }
    ]
  };

  callback: any;
  step: any;
  parent: any;
  offset: number; //dich chuyen option command

  isSearch: boolean = false;

  //define color
  chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  };

  // Doughnut
  doughnutChartLabels: string[] = ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'];
  doughnutChartData: number[] = [350, 450, 100];
  doughnutChartType: string = 'doughnut';
  doughnutChartOptions: any = 
  {
    tooltips: {
        enabled: false //default true
    },
    plugins: {
        datalabels: {
            formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.map(data => {
                    sum += data;
                });
                let percentage = (value*100 / sum).toFixed(0)+"%";
                return percentage;
            },
            color: '#fff',
        } 
    }
};
  
  
  /* {

    plugins: {
            labels: {
                // render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
                render: 'label',
                fontColor: ['green', 'white', 'red'],
                precision: 2
              }
      }
  } */

  //bar
  barChartOptions:any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  barChartLabels:string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  barChartType:string = 'bar';
  barChartLegend:boolean = true;
  
  barChartData:any[] = [
    {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
    {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  ];


  //line
  lineChartData:Array<any> = [
    {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
    {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'},
    {data: [18, 48, 77, 9, 100, 27, 40], label: 'Series C'}
  ];
  lineChartLabels:Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  lineChartOptions:any = {
    responsive: true
  };
  lineChartColors:Array<any> = [
    { // blue
      borderColor: this.chartColors.blue,
      backgroundColor: 'rgba(148,159,177,0.2)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // green
      borderColor: this.chartColors.green,
      backgroundColor: 'rgba(77,83,96,0.2)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    { //red
      borderColor: this.chartColors.red,
      backgroundColor: this.chartColors.yellow,
      pointBackgroundColor: this.chartColors.green,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: this.chartColors.purple
    }
  ];
  lineChartLegend:boolean = true;
  lineChartType:string = 'line';

  chartLabels: any;

  constructor(private platform: Platform
    , private authService: ApiAuthService
    , private viewCtrl: ViewController
    , private alertCtrl: AlertController
    , private navCtrl: NavController
    , private loadingCtrl: LoadingController
    , private navParams: NavParams
  ) { 

    this.chartLabels = ChartDataLabels;

    //Chart.defaults.global.plugins.datalabels.display = false;

    /* Chart.defaults.global.plugins.datalabels = {
      labels: {
        render: 'percentage',
        fontColor: ['green', 'white', 'red'],
        precision: 2
      }
    } */



    /* 
    per dataset: dataset.datalabels.*
    per chart: options.plugins.datalabels.*
    or globally: Chart.defaults.global.plugins.datalabels.*
    
    
    {
      labels: {
        render: 'percentage',
        fontColor: ['green', 'white', 'red'],
        precision: 2
      }
    } */

  }

  ngOnInit() {
    this.dynamicListOrigin = this.navParams.get("list") ? this.navParams.get("list") : this.dynamicListOrigin;
    this.resetForm();

    this.offset = this.navParams.get("offset") ? this.navParams.get("offset") : 250;
    this.callback = this.navParams.get("callback");
    this.step = this.navParams.get("step");

    this.parent = this.navParams.get("parent");

    let call_waiting_data = this.navParams.get("call_waiting_data");

    if (call_waiting_data) {
      call_waiting_data(this.parent)
        .then(list => {
          this.resetForm();
        })
    }
  }

  resetForm(list?: any) {
    if (list && list.length > 0) {
      this.dynamicList.items = list;
    } else {
      this.dynamicList = this.dynamicListOrigin;
    }
  }

  // events chart
  chartClicked(e: any): void {
    console.log(e);
  }

  chartHovered(e: any): void {
    console.log(e);
  }
  
  randomize():void {
    // Only Change 3 values
    let data = [
      Math.round(Math.random() * 100),
      59,
      80,
      (Math.random() * 100),
      56,
      (Math.random() * 100),
      40];
    let clone = JSON.parse(JSON.stringify(this.barChartData));
    clone[0].data = data;
    this.barChartData = clone;
    /**
     * (My guess), for Angular to recognize the change in the dataset
     * it has to change the dataset variable directly,
     * so one way around it, is to clone the data, change it and then
     * assign it;
     */
  }


  randomizeLine():void {
    let _lineChartData:Array<any> = new Array(this.lineChartData.length);
    for (let i = 0; i < this.lineChartData.length; i++) {
      _lineChartData[i] = {data: new Array(this.lineChartData[i].data.length), label: this.lineChartData[i].label};
      for (let j = 0; j < this.lineChartData[i].data.length; j++) {
        _lineChartData[i].data[j] = Math.floor((Math.random() * 100) + 1);
      }
    }
    this.lineChartData = _lineChartData;
  }
  



  // Su dung slide Pages
  //--------------------------
  /**
   * Thay đổi cách bấm nút đóng lệnh bằng nút trên item sliding
   * @param slidingItem 
   */
  closeSwipeOptions(slidingItem: ItemSliding) {
    slidingItem.close();
    slidingItem.setElementClass("active-sliding", false);
    slidingItem.setElementClass("active-slide", false);
    slidingItem.setElementClass("active-options-right", false);
  }
  //----------- end of sliding


  //Su dung search
  //---------------------
  goSearch() {
    this.isSearch = true;
  }

  searchEnter() {
    this.isSearch = false;
  }

  searchSelect(ev) {
    console.log('select item', ev);
    //hoi xem dong y chon dua vao ko?
    this.alertCtrl.create({
      title: 'Xác nhận',
      message: 'Bạn muốn chọn ' + ev.name + ' này phải không?',
      buttons: [
        {
          text: 'Bỏ qua',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            this.isSearch = false;
          }
        },
        {
          text: 'Chọn',
          handler: () => {
            ev.image = ev.flag;
            ev.title = ev.nativeName;
            ev.content = ev.subregion;
            ev.note = Date.now();
            this.dynamicList.items.unshift(ev);
            this.isSearch = false;
          }
        }
      ]
    }).present();

  }

  onClickHeader(btn) {
    console.log(btn);
    this.processCommand(btn);
  }

  onClickDetails(item: ItemSliding, btn: any, func: any) {
    this.closeSwipeOptions(item);
    btn.func = func;
    console.log(btn);
    this.processCommand(btn);
  }

  processCommand(btn) {
    this.next(btn)
  }

  next(btn) {

    if (btn) {
      if (btn.next == 'EXIT') {
        this.platform.exitApp();
      } else if (btn.next == 'RESET') {
        this.resetForm();
      } else if (btn.next == 'CLOSE') {
        if (this.parent) this.viewCtrl.dismiss(btn.next_data)
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
      } else if (btn.next == 'NEXT' && btn.next_data && btn.next_data.data) {
        btn.next_data.callback = this.callback; //gan lai cac function object
        btn.next_data.parent = this.parent;     //gan lai cac function object
        btn.next_data.form = btn.next_data.data; //gan du lieu tra ve tu server
        this.navCtrl.push(DynamicChartPage, btn.next_data);
      }
    }

  }

}
