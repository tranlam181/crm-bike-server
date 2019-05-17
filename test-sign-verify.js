const NodeRSA = require('node-rsa');

/**
 * BUOC 1; chay 1 lan
 */
const key = new NodeRSA({b: 512}, { signingScheme: 'pkcs1-sha256' });

const publicKey = key.exportKey("public").replace('-----BEGIN PUBLIC KEY-----\n','').replace('-----END PUBLIC KEY-----','').replace(/[\n\r]/g, '');
const privateKey = key.exportKey("private").replace('-----BEGIN RSA PRIVATE KEY-----\n','').replace('-----END RSA PRIVATE KEY-----','').replace(/[\n\r]/g, '');
//luu lai tren client
const keySave = {id: publicKey, key: privateKey}
//dang ky id cho server hoac noi chung thuc id cua minh (theo token user)
//luu cai nay lai lam cap key cua client
console.log(keySave);

/**
 * BUOC 2: khi cac lan sau: doc duoi bo nho co keySave thi lay len va xai
 * neu chua co thi tao va dang ky nhu buoc 1
 */

const clientKey = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
clientKey.importKey('-----BEGIN RSA PRIVATE KEY-----\n'+keySave.key+'\n-----END RSA PRIVATE KEY-----');

 /**
  * BUOC 3: thuc hien ky noi dung cua minh
  * tao noi dung, bam nut sign de tao chu ky noi dung cua minh
  */

var content = {a:"444", time:new Date().getTime()}

var block = {
                    id: keySave.id,
                    data: content,
                    signature: clientKey.sign(content,'base64')
                };

//block.data.a="445";

//BUOC 4: Chung thuc noi dung cua Id nay la toan ven
const idKey = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
//gui public key de verify
idKey.importKey('-----BEGIN PUBLIC KEY-----\n'+block.id+'\n-----END PUBLIC KEY-----');
var verify = idKey.verify(block.data, block.signature,'ascii','base64');

console.log(block, verify?"VALID":"INVALID");




