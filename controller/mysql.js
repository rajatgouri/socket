const mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rajat@123",
    database: 'socket'
});

con.connect(function(err) {
    if (err) throw err;
    console.log('connected!')
})


module.exports.select = (sel,condition)=>{
           
    return new Promise((resolve,reject)=>{
        let select = "select "+ sel + " from clients where "+condition;
        
        con.query(select,(err,result,fields)=>{
            if(err) throw err
            resolve(result)
        })
    })    
}

module.exports.update = (value,condition)=>{
    
        let update = "update clients set "+ value + " where "+condition;
        con.query(update,(err)=>{
            if(err) throw err
            
        })
    
}



module.exports.selectChat = (senderId,recieverId)=>{
    return new Promise ((resolve,reject)=>{
        let select = "select * from chats2 where senderId in ('"+senderId+"') and recieverId in ('"+recieverId+"')";
        console.log(select);
        con.query(select,(err,result,fields)=>{
            if(err) throw err
            resolve(result);
        })
    })
}

module.exports.selectChatAgain = (senderId,recieverId)=>{
    return new Promise ((resolve,reject)=>{
        let select = "select * from chats2 where senderId in ('"+senderId+"','"+recieverId+"') and recieverId in ('"+recieverId+"','"+senderId+"')";
        console.log(select);
        con.query(select,(err,result,fields)=>{
            if(err) throw err
            resolve(result);
        })
    })
}

module.exports.insert = (sender,senderId,reciever,recieverId,message)=>{
    let insert = "insert into chats2 values('"+sender+"','"+senderId+"','"+reciever+"','"+recieverId+"','"+message+"')"
    con.query(insert,(err)=>{
        if(err) throw err
        console.log('inserted')
    })
}

module.exports.updateChat = (senderId,recieverId,message)=>{
    let update = "update chats2 set message = '"+message+"' where senderId = '"+senderId+"' and recieverId = '"+recieverId+"' ";
    con.query(update,(err)=>{
        if(err) throw err
    })
}