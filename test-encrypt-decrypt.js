
// ma hoa va giai ma kieu cryto

var crypto = require('crypto'),
  algorithm = 'aes-256-gcm',
  key = 'cuongdq@3500888$cryptotestkey032',
  // do not use a global password for production, 
  // generate a new one for each encryption
  pw = '$nguoi dung tu dat'

function encrypt(obj,password) {
  var cipher = crypto.createCipheriv(algorithm, key, password)
  var encrypted = cipher.update(JSON.stringify(obj), 'utf8', 'hex')
  encrypted += cipher.final('hex');
  var tag = cipher.getAuthTag();
  return {
    content: encrypted,
    tag: tag
  };
}

function decrypt(encrypted,password) {
  var decipher = crypto.createDecipheriv(algorithm, key, password)
  decipher.setAuthTag(encrypted.tag);
  var dec = decipher.update(encrypted.content, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}

var hw = encrypt(
  {iggd:9887777,
  keffy:"cuongg dsgdjasg dsljgdslgdsljgas"},
  pw)

console.log('chuoi ma hoa',JSON.stringify(hw)); //luu cai nay xuong dia

console.log('giai ma',decrypt(hw,pw)); 
//yeu cau nguoi dung nhap mat khau de xac thuc giai ma lay private key de sign

//khi nguoi dung dang ky chu ky
//yeu cau tao mat khau

//dong thoi tao cap id, key 
//ma hoa mat khau gui len server luu lai cung id va signature 

//dong thoi luu xuong may nay id,key, duoc ma hoa bang pass nguoi dung
//khi nguoi dung muon ky chu ky nao, thi chi can nhap mat khau
//giai ma lay cap id,key, roi ky gui len server la duoc


//kieu RSA???



