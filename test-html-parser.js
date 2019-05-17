const request = require('request');
const HTMLParser = require('node-html-parser');
const cheerio = require('cheerio');

//var link = 'http://dantri.com.vn';
//var link = 'https://dantri.com.vn/xa-hoi/chu-tich-uong-bi-phu-nhan-thong-tin-nhieu-quan-chuc-dau-tu-chua-ba-vang-20190326100557574.htm';
var link = 'https://vnexpress.net/phap-luat/ong-dang-le-nguyen-vu-duoc-quyen-dieu-hanh-trung-nguyen-3900712.html';

//var url = 'https://c3.mobifone.vn';

var url = require("url");
var result = url.parse(link);

console.log('hostname:',result.hostname);

request( link, 
 (error, response, body) => {
  if (!error && response.statusCode == 200) {

    const $ = cheerio.load(body);
    
    console.log('title',$( "title" ).text());

    $( "p" ).each( (i, el ) => {
      console.log('p',i,$(el).text());
    });

    $( "img" ).each( (i, el ) => {
      let src = $(el).attr('src');
      let alt = $(el).attr('alt');
      if (alt) alt = alt.trim();
      let ext = src.replace(/^.*\./, '');
      if (ext&&ext.toLowerCase()==='jpg'){
           console.log('img',i,src,alt);
      }
    });

    
    
    /* $( "a" ).each( (i, el ) => {
      let $href = $(el).attr('href');
      let $title = $(el).attr('title');
      
      console.log('href',i, $href, $title); //  
    });

    console.log('title',$( "title" ).text());

    $( "p" ).each( (i, el ) => {
      let $text = $(el).text();
      console.log('p',i, $text); //  
    });

    $( "strong" ).each( (i, el ) => {
      let $text = $(el).text();
      console.log('strong',i, $text); //  
    });

    $( "h1" ).each( (i, el ) => {
      let $text = $(el).text();
      console.log('h1', i, $text); //  
    });

    $( "h2" ).each( (i, el ) => {
      let $text = $(el).text();
      console.log('h2', i, $text); //  
    }); */

    
    /* // lay theo kieu angular
    const root = HTMLParser.parse(body);
    const title = (root.querySelector('title') ? root.querySelector('title').text : '');
    console.log('title', title); // */


    //console.log(root);

    //const imgHtml = (root.querySelector('img') ? root.querySelector('img').toString() : '');
    
    //const $ = cheerio.load(imgHtml);
    
    /* const url_img = $('img').attr('src');
    
    const title = (root.querySelector('title') ? root.querySelector('title').text : '');
    
    const h1 = (root.querySelector('h1') ? root.querySelector('h1').text : '');
    
    const h2 = (root.querySelector('h2') ? root.querySelector('h2').text : '');
    
    const p = (root.querySelector('p') ? root.querySelector('p').text : ''); */
    
    // console.log('url_img', url_img);
    // console.log('title',title);
    // console.log('h1', h1);
    // console.log('h2', h2);
    // console.log('p', p);

  } else {
    console.log(error);
  }
}); 