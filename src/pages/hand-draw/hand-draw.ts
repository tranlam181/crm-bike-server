import { Component, ViewChild } from '@angular/core';
import { Platform, Content } from 'ionic-angular';

@Component({
  selector: 'page-hand-draw',
  templateUrl: 'hand-draw.html'
})
export class HandDrawPage {
  @ViewChild('imageCanvas') canvas: any;
  
  @ViewChild(Content) content: Content;

  @ViewChild('fixedContainer') fixedContainer: any;

  signatureForm:any = {
    title:"Hand draw",
    colors: [
      {name:'dr-dark',    color:"#0f0f0f"}
      ,{name:'dr-green',  color:"#1abc9c"}
      ,{name:'dr-blue',   color:"#3498db"}
      ,{name:'dr-vilolet',color:"#9b59b6"}
      ,{name:'dr-orange', color:"#e67e22"}
      ,{name:'dr-red',    color:"#e74c3c"}          
    ]
    ,buttons:[
      {color:"danger", icon:"trash", next:"DEL"}
    , {color:"primary", icon:"camera", next:"SAVE"}
  ]
  ,brushes:[
            {size:2.5, color:"dr-dark", style:"0.25em", icon:"radio-button-on"}
            ,{size:5, color:"dr-dark", style:"0.5em", icon:"radio-button-on"}
            ,{size:10, color:"dr-dark", style:"1em", icon:"radio-button-on"}
            ,{size:20, color:"dr-dark", style:"2em", icon:"radio-button-on"}
  ]
}

  canvasElement: any;
  lastX: number;
  lastY: number;

  brush = {
    size:2.5,
    color:"dark",
    style: "0.25em"
  }

  currentColor: string;
  brushSize: number;

  isSelect: boolean = false;

  storedImages = [];

  constructor(private platform: Platform) {  }

  ngOnInit(){
    this.currentColor = this.signatureForm.colors[0];
    this.brushSize = this.signatureForm.brushes[0];
    
  }

  changeColor(cl) {
    this.currentColor = cl.color;
    this.signatureForm.brushes.forEach(el => {
      el.color = cl.name;
    });
    this.brush.color = cl.name;

    this.onClickSelect()
  }

  changeSize(sz) {
    this.brushSize = sz.size;
    
    this.brush.size = sz.size;
    this.brush.style = sz.style;

    this.onClickSelect()
  }
  
  onClickSelect(){
    this.isSelect = !this.isSelect;
  }

  onClickHeader(btn){
    if (btn.next==="DEL"){
      this.clearCanvas();
    }
    if (btn.next==="SAVE"){
      //luu thanh file
      this.clearCanvas();
    }
    
  }

  ionViewDidEnter(){
    let itemHeight = this.fixedContainer.nativeElement.offsetHeight;
    let scroll = this.content.getScrollElement();
    itemHeight = Number.parseFloat(scroll.style.marginTop.replace("px",""))+itemHeight;
    scroll.style.marginTop = itemHeight + "px";
  }

  ionViewDidLoad(){
    this.canvasElement = this.canvas.nativeElement;
    this.canvasElement.width = this.platform.width() + '';
    this.canvasElement.height = this.platform.height() + '';//"200";
  }

  handleStart(ev) {
    let canvasPosition = this.canvasElement.getBoundingClientRect();
    this.lastX = ev.touches[0].pageX - canvasPosition.x;
    this.lastY = ev.touches[0].pageY - canvasPosition.y;
  }
  
  handleMove(ev) {
    
    let canvasPosition = this.canvasElement.getBoundingClientRect();
    let currentX = ev.touches[0].pageX - canvasPosition.x;
    let currentY = ev.touches[0].pageY - canvasPosition.y;
    
    let ctx = this.canvasElement.getContext('2d');
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.currentColor;
    ctx.lineWidth = this.brushSize;
    
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(currentX, currentY);
    ctx.closePath();
    ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
  }

  clearCanvas() {
    let ctx = this.canvasElement.getContext('2d');
    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  saveCanvasImage() {
  var dataUrl = this.canvasElement.toDataURL();
  let saveObj = { img: dataUrl };
  this.storedImages.push(saveObj);
 
  let ctx = this.canvasElement.getContext('2d');
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
 
  let name = new Date().getTime() + '.png';
  // let path = this.file.dataDirectory;
  // let options: IWriteOptions = { replace: true };
 
  var data = dataUrl.split(',')[1];
  let blob = this.b64toBlob(data, 'image/png');
 
  // this.file.writeFile(path, name, blob, options).then(res => {
  //   this.storeImage(name);
  // }, err => {
  //   console.log('error: ', err);
  // });

}

storeImage(imageName) {
  let saveObj = { img: imageName };
  this.storedImages.push(saveObj);
  // this.storage.set(STORAGE_KEY, this.storedImages).then(() => {
  //   setTimeout(() =>  {
  //     this.content.scrollToBottom();
  //   }, 500);
  // });
}
 
removeImageAtIndex(index) {
  let removed = this.storedImages.splice(index, 1);
  // this.file.removeFile(this.file.dataDirectory, removed[0].img).then(res => {
  // }, err => {
  //   console.log('remove err; ' ,err);
  // });
  // this.storage.set(STORAGE_KEY, this.storedImages);
}
 
getImagePath(imageName) {
  // let path = this.file.dataDirectory + imageName;
  // // https://ionicframework.com/docs/wkwebview/#my-local-resources-do-not-load
  // path = normalizeURL(path);
  // return path;
}

b64toBlob(b64Data, contentType) {
  contentType = contentType || '';
  var sliceSize = 512;
  var byteCharacters = atob(b64Data);
  var byteArrays = [];
 
  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);
 
    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
 
    var byteArray = new Uint8Array(byteNumbers);
 
    byteArrays.push(byteArray);
  }
 
  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}


}