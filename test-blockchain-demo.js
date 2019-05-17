//blockchain save useredit info

//blockchain save history mark in study

//blockchain save marks in medical history of doctors of one patient

//RSA

const NodeRSA = require('node-rsa');
 
const key = new NodeRSA({b: 512}, { signingScheme: 'pkcs1-sha256' });

const publicKey = key.exportKey("public").replace('-----BEGIN PUBLIC KEY-----\n','').replace('-----END PUBLIC KEY-----','').replace(/[\n\r]/g, '');
const privateKey = key.exportKey("private").replace('-----BEGIN RSA PRIVATE KEY-----\n','').replace('-----END RSA PRIVATE KEY-----','').replace(/[\n\r]/g, '');


let time = Date.now();
let device = "Đây là dữ liệu cần ký";


let signature = key.sign( JSON.stringify({
                                            time : time,
                                            device: device
                                        }
                                        )
                                        , 'base64','utf8');

//Return signature for buffer. All the arguments are the same as for encrypt method.
const keyVerifyPublic = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
keyVerifyPublic.importKey('-----BEGIN PUBLIC KEY-----\n'+publicKey+'\n-----END PUBLIC KEY-----');


let verify = keyVerifyPublic.verify(JSON.stringify({
                                        time : time,
                                        device: device
                                    }), signature, 'utf8', 'base64');

console.log(verify);








//ma hoa va giai ma bang publickey
let encrypted = keyVerifyPublic.encrypt(JSON.stringify({
    time : time,
    device: device
}
)
, 'base64','utf8');



const keyDecryptPrivate = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
keyDecryptPrivate.importKey('-----BEGIN RSA PRIVATE KEY-----\n'+privateKey+'\n-----END RSA PRIVATE KEY-----');

//giai ma bang key goc cua may chu
let data = JSON.parse(keyDecryptPrivate.decrypt(encrypted, 'utf8'));
console.log('giai ma',data);
