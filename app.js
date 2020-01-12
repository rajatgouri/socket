const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('./controller/mysql.js');

const multer  = require('multer')

const fs = require('fs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());


app.set('views','./views');
app.set('view engine','ejs');

app.use(express.static('public'));

var email;

require('socketio-auth')(io, {
    authenticate: function (socket, data, callback) {
      //get credentials sent by the client
      var username = data.username;
      var password = data.password;
        console.log('username is '+username)
        x = mysql.select("*","email='"+username+"'");
        x.then((value)=>{
            if(value[0].email == username){
                return callback(null, username == value[0].email);
            }
            else{
                return callback(new Error("User not found"));
            }
        })
        mysql.update("id = '"+ socket.id +"',status=1","email = '"+ email +"'");

            
    },
    disconnect: function (socket){
        console.log(socket.id + " disconnected")
    },
    timeout: 'none',
    
  });

app.get('/',(req,res)=>{
    

    if(req.cookies.email){
        res.redirect('/page');
    }
    else{
        res.render('login')
    }
})

app.post('/login',(req,res)=>{
    email = req.body.email;
    
    // select from clients
    var x = mysql.select("*","email = '"+ email +"'")
    x.then((value) => {
        if(value.length == 0){
            res.send('error')
        }
        else{
           
            if(req.body.email == value[0].email && req.body.password == value[0].password){
                res.cookie('email',email);
                res.cookie('name',value[0].name);
                res.send('ok');
            }
            else{
                res.send('invaid')
            }
        }
    });
})

app.get('/page',(req,res)=>{
        console.log(req.cookies.email)
        // update status 1
        email = req.cookies.email
    
        
        // // find friends

        let friends = mysql.select("*","email= '"+ req.cookies.email +"'" );

        friends.then((value)=>{
            console.log(value)
            list = value[0].friend.split(',');
            let syntax = "(";
            for( i in list){
                if(i < list.length - 1){
                    syntax += "'"+list[i]+"',"         
                }
                else{
                    syntax += "'"+list[i]+"')"
                }
            }
            
            // find online friends
            console.log(syntax)
            let onlineFriends =  mysql.select("name,email","email in "+ syntax +" and status = 1");
            onlineFriends.then((value)=>{
                console.log(value)
                res.render('page',{value: value });
            });
        });
});



app.post('/message',(req,res)=>{
    console.log(req.body);
    let chat = mysql.selectChatAgain(req.body.senderId,req.body.recieverId);
    chat.then((value)=>{
        // res.send(value);
        console.log('chats');
        console.log(value);
        res.send(value)

    })
});



app.post('/sendMessage',(req,res)=>{
    console.log(req.body);
    var d = new Date();
    var hour = d.getHours();
    var time;
    if(hour >= 12){
        if(hour>12){
            hour = hour-12;
            time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" PM"; 
        }
        else if(hour == 12) {
            time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" PM"; 
        }
    }
    else if( hour == 0){
        hour == 12
        time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" AM"; 

    }
    else{
        hour = hour
        time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" AM"; 
    }
    var month = d.getMonth()
    var months = ['Jan','Feb','Mar','April','May','June','July','Aug','Sept','Oct','Nov','Dec'];
    var date = months[month]+" "+d.getDate()+" "+d.getFullYear();
    date =  date+" "+time
    chat = mysql.selectChat(req.body.byId,req.body.toId);
    chat.then((value)=>{
        console.log(value)
        let msg = []
        msg.push(JSON.stringify({msg:req.body.msg,time:date,type: req.body.type}));
    
        
        if(value.length == 0){
            mysql.insert(req.body.by,req.body.byId,req.body.to,req.body.toId,msg);    
        }
        else{
            chat = mysql.selectChat(req.body.byId,req.body.toId);
            chat.then((value)=>{
                let x = value[0].message;
                x += ';'+msg;
                console.log(x)
                mysql.updateChat(req.body.byId,req.body.toId,x);
                
            })
        }
    })
    // mysql.insert(req.body.by,req.body.byId,req.body.to,req.body.toId,req.body.msg);
    res.send('ok')
});


app.get('/logout',(req,res)=>{
    res.clearCookie("email");
    res.clearCookie('name');
    res.send('ok')
});


app.post('/file',(req,res)=>{
    var fileDetails;
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, __dirname+"/public/uploads");
        },
        filename: function (req, file, cb) {
          cb(null, file.originalname );
          fileDetails = file
        }
      })
       
      var upload = multer({ storage: storage }).single('file')
    
      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          console.log('error ')
          return
        } 
        console.log('file is uploaded!');
        console.log(fileDetails)
        
            if(fileDetails.mimetype == 'image/jpeg' || fileDetails.mimetype == "image/png" || fileDetails.mimetype == "video/mp4" ){
                console.log('yes')
                res.send({filename:fileDetails.originalname, type: fileDetails.mimetype });
            }
            else{
                res.send('Invalid');
            }
        
      })
    

    
});   

io.on('connection',(socket)=>{
    console.log("socket id "+socket.id)
    
    socket.on('online',(data)=>{
        console.log('Online call')
        for( i in data.online){
            var x = mysql.select("id","email ='"+data.online[i].email+"'");
            x.then((value)=>{
                console.log(value)
                
                socket.broadcast.to(value[0].id).emit('refresh',{detail : data.by});
            })
        }
    })


    socket.on('sendMessage',(data)=>{
            console.log(data);
            id = mysql.select("id","email='"+ data.toId +"'");
            id.then((value)=>{
                console.log(value);
                socket.broadcast.to(value[0].id).emit('new message',{from : data.by,id: data.byId , to : data.toId, msg: data.msg});
                
            })
    })

    
    socket.on('sendImage',(data)=>{
        console.log(data);
        id = mysql.select("id","email='"+ data.toId +"'");
        id.then((value)=>{
            console.log(value);
            if(data.type == 'image/jpeg' || "image/png"){
                socket.broadcast.to(value[0].id).emit('image',{from : data.by,id: data.byId , to : data.toId, image: data.msg ,type : data.type  });    
            }
            // socket.broadcast.to(value[0].id).emit('image',{from : data.by,id: data.byId , to : data.toId, image: image.toString('base64')  });    
        })
        var d = new Date();
        var hour = d.getHours();
        var time;
        if(hour >= 12){
            if(hour>12){
                hour = hour-12;
                time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" PM"; 
            }
            else if(hour == 12) {
                time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" PM"; 
            }
        }
        else if( hour == 0){
            hour == 12
            time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" AM"; 

        }
        else{
            hour = hour
            time = hour+":"+d.getMinutes()+":"+d.getSeconds()+" AM"; 
        }
        var month = d.getMonth()
        var months = ['Jan','Feb','Mar','April','May','June','July','Aug','Sept','Oct','Nov','Dec'];
        var date = months[month]+" "+d.getDate()+" "+d.getFullYear();
        date =  date+" "+time
        chat = mysql.selectChat(data.byId,data.toId);
        chat.then((value)=>{
            console.log(value)
            let msg = []
            msg.push(JSON.stringify({msg:data.msg,time:date,type: data.type}));
            console.log(msg)
            if(value.length == 0){
                mysql.insert(data.by,data.byId,data.to,data.toId,msg);    
            }
            else{
                chat = mysql.selectChat(data.byId,data.toId);
                chat.then((value)=>{
                    let x = value[0].message;
                    x += ';'+msg;
                    console.log(x)
                    mysql.updateChat(data.byId,data.toId,x);
                    
                })
            }
        })
    })

    socket.on('disconnect',()=>{
        console.log(socket.id);
        console.log('disconnect');
         
        let friends = mysql.select("name,email,friend","id='"+ socket.id +"'");
        friends.then((value)=>{
            console.log(value)
            var myname = value[0].name;
            var myemail = value[0].email
            list = value[0].friend.split(',');
            console.log(list)
            for( i in list){
                let id = mysql.select("id","email = '"+ list[i] +"'");
                id.then((value)=>{
                    console.log(value)
                    socket.broadcast.to(value[0].id).emit('offline',{name: myname, email : myemail})
                })
            }
        })
        mysql.update("id=0,status=0","id='"+socket.id+"'");
    })
})

http.listen(3000)