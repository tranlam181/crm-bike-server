"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require('../db/sqlite3/crm-dao')

class Handler {

    /**
     * Thiết lập chức năng dựa trên đường dẫn của get/post
     * Đường dẫn cuối sẽ là duy nhất của từng chức năng
     * ví dụ: /db/edit-customer thì edit-customer là chức năng
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    setFunctionFromPath(req,res,next){
        //lay duong dan phia sau
        req.functionCode = req.pathName.substring(req.pathName.lastIndexOf("/")+1);
        next();
    }

    //lay quyen de thuc hien menu va active function cua user
    getRoles(req,res,next){

        console.log('get roles',req.user);

        if (req.user){
            db.getRst("select roles from admin_roles\
                        where username='"+req.user.username+"'"
            )
            .then(row=>{
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(row?row.roles:""); //obj="{menu:[],functions:[]}"
            })
            .catch(err=>{
                console.log('error:',err);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end("");//obj.functions==false
            });

        }else{
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({}));//obj.roles==false
        }
    }

    /**
     * req.functionCode = "active" //chuc nang toi thieu la active
     *
     * req.functionCode = "edit-customer" //yeu cau kiem tra quyen
     * //neu khong co functionCode thi xem nhu khong can kiem tra quyen
     *
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    async checkFunctionRole(req,res,next){


        if (req.functionCode){ //can kiem tra quyen cua user co khong
            if (req.user&&req.user.data){
                //console.log('userData:',req.user.data);
                if (req.user.data.role===99) {
                    next() //quyen root
                }else{
                    try{
                        let row = await db.getRst("select roles\
                                                     from admin_roles\
                                                     where username='"+req.user.username+"'");
                        let row2 = await db.getRst("select id\
                                                         from admin_functions\
                                                         where function_code ='"+req.functionCode+"'");
                        let roles = row&&row.roles?JSON.parse(row.roles):undefined; //tra ve object
                        let functionId = row2?row2.id:undefined; //tra ve id
                        //console.log('rolesFunction', functionId, roles);
                        let index =  roles&&functionId&&roles.functions?roles.functions.findIndex(x=>x===functionId):-1;

                        if (index>=0){
                            next()
                        }else{
                            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({message:'Bạn KHÔNG ĐƯỢC PHÂN QUYỀN thực hiện chức năng này'}));
                        }

                    }catch(e){
                        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({message:'Lỗi trong lúc kiểm tra quyền', error: e}));
                    }
                }
            } else {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({message:'Bạn không có quyền thực hiện chức năng này'}));
            }
        }else{
            next(); //xem nhu khong can kiem tra quyen
        }

    }

    getUserMenu(req,res,next){
        db.getRsts('select *\
                    from admin_menu\
                     where status = 1\
                     order by order_1')
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }

}

module.exports = {
    Handler: new Handler()
};