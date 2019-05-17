const secretUtil = require("./utils/secret-util");

let keyPair = secretUtil.generatorKeyPair();

console.log(keyPair);

//test sign, verify
let obj={a:1,b:2}
//sign
let signature = secretUtil.signObject(obj,keyPair.key);

console.log(   {
                info:obj,
                id:keypair.id,
                signature:signature});
//verify
console.log(secretUtil.verifyObject(obj,signature,keyPair.id));

//encrypt private
let encrypted = secretUtil.encryptObjectRSA(obj,keyPair.key);
console.log(encrypted);

//decrypt public
let decrypted = secretUtil.decryptObjectRSA(encrypted,null,keyPair.id);
console.log(decrypted);


//encrypt public
let encryptedPublic = secretUtil.encryptObjectRSA(obj,null,keyPair.id);
console.log(encryptedPublic);

//decrypt private
let decryptedPrivate = secretUtil.decryptObjectRSA(encryptedPublic, keyPair.key);
console.log(decryptedPrivate);


//test thu ma hoa va giai ma bang mat khau nay
/* let en = secretUtil.encryptObjectCypto(obj,'cuongdq');
console.log(en);

let dec = secretUtil.decryptObjectCrypto(en,'cuongdq');
console.log(dec); */

