
let data = 
{ id: 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALcbENYP3qDm5VVFtlCaN6N72SJmXcmgI9zN8bD944IzMbHCz4FqwDn9THgJowio6CxsYdbhOWuVaZq6RintnFcCAwEAAQ==',
  ip: '10.151.50.36',
  device: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
  time: 1556010946476,
  signature: 'VWXTvf3e/6TsaVuB+Q3k8tJ8hNkqJ6IyzvmWoqjasm66tUtT98ElnxxqAquUnY0OGiKQAuQOpR35AxTEPFbiuQ==' }

const NodeRSA = require('node-rsa');

const keyVerifyPublic = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
keyVerifyPublic.importKey('-----BEGIN PUBLIC KEY-----\n'+data.id+'\n-----END PUBLIC KEY-----');


let verify = keyVerifyPublic.verify(JSON.stringify({
    time : data.time,
    device: data.device,
    ip: data.ip
}), data.signature, 'utf8', 'base64');

console.log(verify);


