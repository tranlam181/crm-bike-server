"use strict"


const fs = require('fs');
const mime = require('mime-types');
const systempath = require('path');

const SQLiteDAO = require('./db/sqlite3/sqlite-dao');
const dbFile = './db/admin-roles.db';
const db = new SQLiteDAO(dbFile);

//admin_menu
//admin_functions
//admin_roles

setTimeout(() => {
    db.update({name:'admin_roles',
              cols:[
                  {name:'username',value:'903500888'}
                  ,{name:'roles',value:JSON.stringify({
                       menu:[1,2,3,4,5,6,7,8,9,10]
                     ,functions:[1,2,3,4,5,6,7,8,9,10]
                  })}
                  ,{name:'status',value:1}
                ],
                wheres:[
                    {name:'username',value:'903500888'}
                ]
            })
    .then(data=>{
        console.log(data);
    });


    db.getRsts("select * from admin_roles")
    .then(data=>{
        console.log(data);
    });


}, 1000);