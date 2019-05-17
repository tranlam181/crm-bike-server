const express = require('express');
const app = express();
const fs = require('fs');
const os = require('os');

function main(isHttps) {
  //CHONG TAN CONG DDDOS
  //ngan chan truy cap ddos tra ket qua cho user neu truy cap tan suat lon 
  app.use(require('./ddos/ddos-config').express('ip', 'path'));
  
  //web tinh
  app.use(express.static(__dirname + '/www'));
  app.use('/crm/',express.static(__dirname + '/platforms/browser/www'));

  //CORS handle
  app.use(require('./handlers/cors-handler').cors);

  //su dung auth user -- xac thuc bang server proxy
  app.use('/crm/auth',  require('./routes/auth-proxy')); 

  app.use('/crm/db', require('./routes/resource-sqlite')); 

  //ham tra loi cac dia chi khong co
  //The 404 Route (ALWAYS Keep this as the last route)
  app.all('*',(req, res) => {
    //gui trang thai bao noi dung tra ve
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Xin lỗi trang bạn muốn tìm không tồn tại!</h1>Địa chỉ ip của bạn là : ' + req.clientIp);
  });

  //cac route truoc chi can throw, thi error nay se tra loi cho nguoi sdung
  //Error handle ALLWAYS keep last route even all
  app.use(require('./handlers/error-handler').errors);

  if (isHttps) {
    // For https
    const privateKey = fs.readFileSync('cert/api-private-key.pem', 'utf8');
    const certificate = fs.readFileSync('cert/api-certificate.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    const portHttps = process.env.PORT || isHttps;
    
    const httpsServer = require('https').createServer(credentials, app);

    httpsServer.listen(portHttps, () => {
      console.log("Server HTTPS (" + os.platform() + "; " + os.arch() + ") is started with PORT: "
        + portHttps
        + "\n tempdir: " + os.tmpdir()
        + "\n " + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      );
    });

  }

}

//=false or port number >1000
const isHttps = 9237; //crm

main(isHttps);