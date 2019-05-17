"use strict"

/**
 * version 1.0
 * cuongdq
 * create 01/05/2019
 * 
 * Các thuật toán mã hóa, giải mã, ký và chứng thực
 * 
 */

const NodeRSA = require('node-rsa');
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const key = 'cuongdq@3500888$cryptotestkey032';

class RsaHandler {
    /**
     * RSA
     */
    generatorKeyPair() {
        const key = new NodeRSA({ b: 512 }, { signingScheme: 'pkcs1-sha256' });
        const publicKey = key.exportKey("public").replace('-----BEGIN PUBLIC KEY-----\n', '').replace('-----END PUBLIC KEY-----', '').replace(/[\n\r]/g, '');
        const privateKey = key.exportKey("private").replace('-----BEGIN RSA PRIVATE KEY-----\n', '').replace('-----END RSA PRIVATE KEY-----', '').replace(/[\n\r]/g, '');
        return { id: publicKey, key: privateKey }
    }

    importKey(keySave, keyType) {
        const rsaKey = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
        try {
            if (keyType === 'private') {
                rsaKey.importKey('-----BEGIN RSA PRIVATE KEY-----\n' + keySave.key + '\n-----END RSA PRIVATE KEY-----');
            } else {
                rsaKey.importKey('-----BEGIN PUBLIC KEY-----\n' + keySave.id + '\n-----END PUBLIC KEY-----');
            }
            return rsaKey;
        } catch (e) { }
        return null;
    }

    signObject(obj, privateKey) {
        try {
            let rsaKey = this.importKey({ key: privateKey }, 'private')
            if (rsaKey) {
                return rsaKey.sign(JSON.stringify(obj), 'base64', 'utf8');
            }
        } catch (e) { }
        return null;
    }

    verifyObject(obj, signature, publicKey) {
        try {
            let rsaKey = this.importKey({ id: publicKey }, 'public')
            if (rsaKey) {
                return rsaKey.verify(JSON.stringify(obj), signature, 'utf8', 'base64');
            }
        } catch (e) { }
        return false;
    }

    encryptObjectRSA(obj, privateKey, publicKey) {
        try {
            let rsaKey = this.importKey({ id: publicKey, key: privateKey }, (privateKey ? 'private' : 'public'))
            if (rsaKey) {
                if (privateKey) {
                    return rsaKey.encryptPrivate(JSON.stringify(obj), 'base64', 'utf8');
                } else {
                    return rsaKey.encrypt(JSON.stringify(obj), 'base64', 'utf8');
                }
            }
        } catch (e) { }
        return null;
    }

    decryptObjectRSA(text64, privateKey, publicKey) {
        try {
            let rsaKey = this.importKey({ id: publicKey, key: privateKey }, (privateKey ? 'private' : 'public'))
            if (rsaKey) {
                if (privateKey) {
                    return JSON.parse(rsaKey.decrypt(text64, 'utf8'));
                } else {
                    return JSON.parse(rsaKey.decryptPublic(text64, 'utf8'));
                }
            }
        } catch (e) { }
        return null;
    }

    /**
     * crypto chua thuc hien duoc
     * @param {*} obj 
     * @param {*} password 
     */
    encryptObjectCypto(obj, password) {
        try {
            var cipher = crypto.createCipheriv(algorithm, key, password)
            var encrypted = cipher.update(JSON.stringify(obj), 'utf8', 'hex')
            encrypted += cipher.final('hex');
            let tag = cipher.getAuthTag();
            return JSON.stringify({
                        content: encrypted,
                        tag: tag
                    });
        } catch (e) { }
        return null;
    }

    decryptObjectCrypto(strEncrypted, password) {
        try {
            let encrypted = JSON.parse(strEncrypted);
            console.log(encrypted);
            let decipher = crypto.createDecipheriv(algorithm, key, password)
            decipher.setAuthTag(encrypted.tag);
            let dec = decipher.update(encrypted.content, 'hex', 'utf8')
            dec += decipher.final('utf8');
            return JSON.parse(dec);
        } catch (e) { }
        return null;
    }


}

module.exports = new RsaHandler()



