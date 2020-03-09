const express = require('express');
const app = express();
const fs = require('fs');
const os = require('os');
const cron = require('cron')
const smsHandler = require('./handlers/crm-hieu-nga/sms-handler').Handler

const job = new cron.CronJob({
  cronTime: `01 * * * * *`,
  onTick: function() {
    // thuc hien sms
    smsHandler.sendSmsJob()
    console.log('Cron job runing...', new Date().toLocaleTimeString());
  },
  start: false,
  timeZone: 'Asia/Ho_Chi_Minh'
});

function main(isHttp, isHttps) {
  //web tinh
  // app.use(express.static(__dirname + '/www'));
  app.use('/crm',express.static(__dirname + '/platforms/browser/www'));
  app.use('/crm/hieu-nga', express.static(__dirname + '/www/hieu-nga'));

  //CHONG TAN CONG DDDOS
  //ngan chan truy cap ddos tra ket qua cho user neu truy cap tan suat lon
  app.use(require('./ddos/ddos-config').express('ip', 'path'));

  //CORS handle
  app.use(require('./handlers/cors-handler').cors);

  //su dung auth user
  app.use('/crm/auth',  require('./routes/auth'));
  app.use('/crm/api', require('./routes/crm'));
  app.use('/crm/hieu-nga/auth',  require('./routes/crm-hieu-nga-auth'));
  app.use('/crm/hieu-nga/api', require('./routes/crm-hieu-nga-route'));

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

  if (isHttp) {
    // For http
    const httpServer = require('http').createServer(app);
    const portHttp = process.env.PORT || isHttp;

    httpServer.listen(portHttp, () => {
      console.log("Server HTTP (" + os.platform() + "; " + os.arch() + ") is started with PORT: "
        + portHttp
        + "\n tempdir: " + os.tmpdir()
        + "\n " + new Date().toLocaleString()
      );
    });
  }

  if (isHttps) {
    // For https
    const privateKey = fs.readFileSync('cert/api-private-key.pem', 'utf8');
    const certificate = fs.readFileSync('cert/my-certificate.pem', 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        honorCipherOrder: true,
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-ECDSA-AES256-GCM-SHA384',
          'DHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES128-SHA256',
          'DHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384',
          'DHE-RSA-AES256-SHA384',
          'ECDHE-RSA-AES256-SHA256',
          'DHE-RSA-AES256-SHA256',
          'HIGH',
          '!aNULL',
          '!eNULL',
          '!EXPORT',
          '!DES',
          '!RC4',
          '!MD5',
          '!PSK',
          '!SRP',
          '!CAMELLIA'
       ].join(':')
    };
    const portHttps = process.env.PORT || isHttps;
    const httpsServer = require('https').createServer(credentials, app);

    httpsServer.listen(portHttps, () => {
      console.log("Server HTTPS (" + os.platform() + "; " + os.arch() + ") is started with PORT: "
        + portHttps
        + "\n tempdir: " + os.tmpdir()
        + "\n " + new Date().toLocaleString()
      );
    });
  }

  // job.start()
}

const isHttps = false
main(!isHttps && 9237, isHttps && 9237);

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  process.exit(1);
});

process.on('SIGINT', ()=> {
  console.log('SIGINT');
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.log('Uncaught exception');
  console.error(err);
  process.exit(1);
});