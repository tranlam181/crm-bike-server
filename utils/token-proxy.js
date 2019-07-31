"use strict"

/**
 * ver 1.0
 * cuongdq create 17/05/2019
 * 
 * Các máy chủ kế thừa máy chủ API chỉ sử dụng utils này để xác minh token
 * không cần đưa thành phần utils/token-handler.js vào 
 * và cũng không chần sử dụng handler/proxy-handler.js nữa
 * 
 */

//khai báo máy chủ xác minh ở đâu? như của facebook, google, ....
const authServer = 'https://c3.mobifone.vn/api';
const jwt = require('jsonwebtoken');
const url = require('url');
const proxy = require('request'); //doi tuong yeu cau proxy truy van POST/GET

var tokenSession = []; //luu lai session lam viec

/**
 * input: token
 * output: user_info
 * @param {*} token 
 */
var getInfoFromToken = (token)=>{
  let userInfo;
  try{
    userInfo = jwt.decode(token);
  }catch(e){}
  return userInfo; 
}

/**
 * input:  GET/POST
 * return: req.token
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
var getToken = (req, res, next)=> {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
   if (!token) token = url.parse(req.url, true, false).query.token;
   if (!token) token = req.json_data?req.json_data.token:''; //lay them tu json_data post
   req.token = req.token?req.token:token; // uu tien token truyen trong json gan truoc do
   if (req.token) {
     req.token = req.token.startsWith('Bearer ')?req.token.slice(7):req.token;      
     next();
   } else {
     res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
     res.end(JSON.stringify({code:403, message:'token-handler: getToken: Auth token is not supplied or you are unauthorized!'}));
   }
 }

var getTokenNext = (req, res, next)=> {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
   if (!token) token = url.parse(req.url, true, false).query.token;
   if (!token) token = req.json_data?req.json_data.token:''; //lay them tu json_data post
   req.token = req.token?req.token:token; // uu tien token truyen trong json gan truoc do
   if (req.token) {
     req.token = req.token.startsWith('Bearer ')?req.token.slice(7):req.token;      
     next();
   } else {
     next();
   }
 }
//chi verify --> auth 1 lan --> co thoi gian hieu luc va het hieu luc
//khi do chi can verify expires la duoc
const verifyExpire = (req)=>{
    let userInfo = getInfoFromToken(req.token);
    if (userInfo){
        if (userInfo.exp>(new Date().getTime()/1000)) return true;
    }
    return false;
}

/**
 * ham nay se gan kiem tra verify proxy, neu thanh cong cho next, neu khong se tra loi
 * du lieu dau vao phai req.token --> next()
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const verifyProxyToken = (req, res, next)=>{
    if (req.token){
        new Promise((resolve, reject) => {

            let aliveToken = tokenSession.find(x=>x.token===req.token)

            if (aliveToken && verifyExpire(req)){
                //console.log('user_info verifyExpire true: ',req.user_info);
                aliveToken.last_time = new Date().getTime();
                aliveToken.status = true;

                resolve({
                    status: true,
                    user_info:aliveToken.user_info
                });

            }else{
                //neu chua xac thuc server
                proxy.post(authServer + '/ext-auth/authorize-token', { json: {token: req.token} } //du lieu parse tu postProcess
                    , (error, res, body) => {
                        if (error) {
                            reject(error);
                        }
                        if (res.statusCode == 200&&body.status&&body.user_info) {

                            tokenSession.push({
                                create_time: new Date().getTime(),
                                token: req.token,
                                user_info: body.user_info
                            })
                            resolve(body);
                        } else {
                            reject(body);
                        }
                    })
            }

        }).then(tokenData => {
            
            if (tokenData.status){
                req.user = tokenData.user_info;  
                next();              
            }else{
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: 'proxy-handler: verifyProxyToken: server status false!', data: data}));
            }
        })
        .catch(err => {
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify({ message: 'proxy-handler: verifyProxyToken:  request to authentication server error!', error: err }));
        })
    }else{
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: 'proxy-handler: verifyProxyToken: no req.json_data'}));
    }
  }


  /**
   * ham nay tuong tu verify nhung se khong bao loi khi khong co token
   * phuc vu de kiem tra lay thong tin public
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * tra ve req.user neu thanh cong, con req.user khong co la khong thanh cong
   */
  
const verifyProxyTokenNext = (req, res, next)=>{
    if (req.token){
        new Promise((resolve, reject) => {

            let aliveToken = tokenSession.find(x=>x.token===req.token)

            if (aliveToken && verifyExpire(req)){
                aliveToken.last_time = new Date().getTime();
                aliveToken.status = true;

                resolve({
                    status: true,
                    user_info:aliveToken.user_info
                });

            }else{
                proxy.post(authServer + '/ext-auth/authorize-token', { json: {token: req.token} } //du lieu parse tu postProcess
                    , (error, res, body) => {
                        if (error) {
                            reject(error);
                        }
                        if (res.statusCode == 200&&body.status&&body.user_info) {
                            tokenSession.push({
                                create_time: new Date().getTime(),
                                token: req.token,
                                user_info: body.user_info
                            })
                            resolve(body);
                        } else {
                            reject(body);
                        }
                    })
            }

        }).then(tokenData => {
            if (tokenData.status){
                req.user = tokenData.user_info;  
                next();              
            }else{
                next();
            }
        })
        .catch(err => {
            next();
        })
    }else{
        next();
    }
  }

const getVerifiedToken = (req, res, next) => {
    if (req.user){
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({status:true,message:'token valid',user_info: req.user, token: req.token}));
    }else{
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({status:false,message:'token INVALID'}));
    }
}


module.exports = {
  //Chuyển đổi thông tin token ra tường minh
  getInfoFromToken: getInfoFromToken,

  //Lấy token ở các loại dữ liệu truyền lên
  getToken: getToken,         //tra ve err page neu khong co token  
  getTokenNext: getTokenNext, //tra ve req.token next() neu khong co
  
  //Xác minh token có hợp lệ hay không
  verifyProxyToken: verifyProxyToken, //tra ve err page neu xac thuc khong thanh cong
  verifyProxyTokenNext: verifyProxyTokenNext, //tra ve next() neu khong co

  //Trả thông tin token đã được xác minh ở trên
  getVerifiedToken: getVerifiedToken
};