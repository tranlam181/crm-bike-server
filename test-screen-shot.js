const fs = require('fs');
const systempath = require('path');

const dirScreenShot = "./screen-shot";
const curdatetime = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '');
const curYear = curdatetime.slice(0,4);
const curMonth = curdatetime.slice(4,6);
const curDate = curdatetime.slice(6,8);
if (!fs.existsSync(dirScreenShot)) fs.mkdirSync(dirScreenShot);
if (!fs.existsSync(dirScreenShot+systempath.sep+curYear)) 
    fs.mkdirSync(dirScreenShot+systempath.sep+curYear);
if (!fs.existsSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth)) 
    fs.mkdirSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth);
if (!fs.existsSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth+systempath.sep+curDate)) 
    fs.mkdirSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth+systempath.sep+curDate);
let urlFileName = dirScreenShot + "/"
                            + curYear + "/"
                            + curMonth + "/"
                            + curDate + "/"
                            + "screen-shot-"
                            + new Date().getTime() 
                            + ".png"
                            ;

var screenShotHtml = require("node-server-screenshot");

screenShotHtml.
fromHTML(
  //chữ này được chèn vào selector, nếu nó không tìm thấy thì xem như không có màn hình
  'Shot by Cuongdq', 
  //file này được lưu trên đĩa đường dẫn mặt định
  urlFileName,
  //thong so tuy chon 
    {
      width:680, //default 1200
      height:480, //default 720
      waitAfterSelector:"html", //default html
      waitMilliseconds:500, //default 1000
      /* //cat anh crop ..
      clip:{
        x:0, //toa do topleft x default 0
        y:0, //toa do topleft y default 0
        width:300, //do rong anh default 1200
        height:200  //do cao anh default 720
      }, */
      inject: {
        url: "https://chuyenmang.mobifone.vn",
        //selector: {className: "mw-wiki-logo"} //noi ma text o tren duoc nhung vao
        selector: {tag:"title"} //noi ma text o tren duoc nhung vao

    }},
  function(err){
      //an image of the HTML has been saved at ./test.png
      //sau khi chup xong ket qua loi
      //ket qua thanh cong
      //tra ket qua ve
      if (err){
        console.log(" err: " + JSON.stringify(err));
      }else{
        //tra ket qua ve
      }
  }
); 