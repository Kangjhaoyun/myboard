


const express= require('express');
const mongodb= require('mongodb').MongoClient;
const objid= require('mongodb').ObjectId;
const bodyparser= require('body-parser');
const cookieParser= require('cookie-parser');
const session= require('express-session');
const sha= require('sha256');
const multer= require('multer');
const storage= multer.diskStorage({
    destination: function(req, file, done){
        done(null, './public/image')
    },
    filename: function(req, file, done){
        done(null, file.originalname)
    }
});
const upload= multer({storage: storage});
const app= express()
const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
const dotenv= require('dotenv').config();

let imagepath= '';

const url= process.env.DB_URL;

mongodb.connect(url) 
    .then(client => {
        mydb = client.db('myboard');
        mydb.collection('post').find().toArray()
            .then(result => {
                console.log(result)
            });
        app.listen(process.env.PORT, function(){
            console.log('MGDB send to server8080')
        });
    })
    .catch((err) => {
        console.log(err);
});


app.set('view engine', 'ejs');


app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser('loveisthecure'));
app.use(session({
    secret: 'lalala',
    resave: false,
    saveUninitialized: true
}));
app.use('/', require('./routes/post.js'))


app.get("/", function (req, res) {
    res.render("index.ejs", { user: req.session.user || null });
});
app.get('/list', function(req,res){
    mydb.collection('post').find().toArray().then(result => {
        console.log(result);
        res.render('list.ejs', {data : result});
    });
});
app.get('/enter', function(req, res){
    res.render('enter.ejs');
    });
app.get('/content/:id', function(req,res){
    console.log(req.params.id);
    req.params.id = new objid(req.params.id);
    mydb
    .collection("post")
    .findOne({ _id : req.params.id })
    .then((result) => {
        console.log(result);
        res.render('content.ejs', {data : result });

    })
});
app.get('/content/:id', function(req,res){
    console.log(req.params.id);
    req.params.id = new objid(req.params.id);
    mydb
    .collection("post")
    .findOne({ _id : req.params.id })
    .then((result) => {
        console.log(result);
        res.render('content.ejs', {data : result });

    })
});
app.get("/edit/:id", function (req, res) {
    req.params.id = new objid(req.params.id);
    mydb
    .collection("post")
    .findOne({ _id: req.params.id})
    .then((result) => {
        console.log(result);
        res.render("edit.ejs", {data : result});
    })
});
app.get('/cookie', function(req,res){
    let milk = parseInt(req.signedCookies.milk) + 1000;
    if(isNaN(milk))
    {
        milk = 0;
    }
    res.cookie('milk', milk, {signed : true});
    res.send('product : ' + milk + '원');

})  
app.get('/session', function(req,res){
    if(isNaN(req.session.milk)){
        req.session.milk= 0;
    }
    req.session.milk= req.session.milk + 1000;
    res.send("session: " + req.session.milk + "원");
});
app.get('/login', function(req, res){
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        res.render('index.ejs', {user: req.session.user});
    }else{
        res.render('login.ejs');
    }
});  
app.get('/logout', function(req,res){
    console.log('로그아웃');
    req.session.destroy();
    res.render('index.ejs', {user : null});
});
app.get('/signup', function(req,res){
    res.render('signup.ejs');
});
app.get('/search', function(req,res){
    console.log(req.query);
    mydb.collection('post').find({title:req.query.value}).toArray()
    .then((result)=>{
        console.log(result);
        res.render('sresult.ejs',{data: result});
    })
})


app.post('/save', function(req,res){
    console.log(req.body.title);
    console.log(req.body.content);
    console.log(req.body.someDate);
    mydb.collection('post').insertOne(
        {title : req.body.title, content : req.body.content, date : req.body.someDate, path: imagepath }
    ).then(result => {
        console.log(result);
        console.log("Well saved!")
    })
    res.redirect("list");
});
app.post("/edit", function (req, res) {
    console.log(req.body);
    req.body.id = new objid(req.body.id);
    mydb
    .collection('post')
    .updateOne({_id : req.body.id}, 
        {$set : {title : req.body.title, content :
    req.body.content, date : req.body.someDate}})
    .then((result) => {
        console.log('Edit completed');
        res.redirect('/list');
    })
    .catch((err) => {
        console.log(err);
    })
});
app.post("/delete", function (req,res){
    console.log(req.body._id);
    req.body._id = new objid(req.body._id);
    mydb.collection('post').deleteOne(req.body)
    .then(result=>{
        console.log('Delete completed')
        res.status(200).send();
    })
    .catch(err => {
        console.log(err);
        res.status(500).send();
    })
});
app.post('/login', function(req, res){
    console.log('아이디: ' + req.body.userid);
    console.log('비밀번호: ' + req.body.userpw);

    mydb.collection('account').findOne({ userid: req.body.userid })
    .then((result) => {
        if(result && result.userpw == sha(req.body.userpw)){
            req.session.user = { userid: result.userid };
            console.log('새로운 로그인');
            res.render('index.ejs', { user: req.session.user });
        } else {
            res.render('login.ejs', { error: 'Invalid credentials' });
        }
    })
    .catch((err) => {
        console.log(err);
        res.render('login.ejs', { error: 'Server error' });
    });
});
app.post('/signup', function(req,res){
    console.log(sha(req.body.userid));
    console.log(req.body.userpw);
    console.log(req.body.usergroup);
    console.log(req.body.useremail);
    
    mydb.collection('account').insertOne({userid:req.body.userid,userpw:sha(req.body.userpw),usergroup:req.body.usergroup,useremail:req.body.useremail
    }).then((result) => {
        console.log('회원가입 성공');
    });
    res.redirect('/');
});
app.post('/photo', upload.single('picture'), function(req,res){
    console.log(req.file.path);
    imagepath='₩₩' + req.file.path;
})







