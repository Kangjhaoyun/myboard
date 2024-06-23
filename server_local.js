const express= require('express');
const mongodb= require('mongodb').MongoClient;
const objid= require('mongodb').ObjectId;
const bodyparser= require('body-parser');
const cookieParser= require('cookie-parser');
const session= require('express-session');
const sha= require('sha256');
const passport= require('passport');
const LocalStrategy= require('passport-local').Strategy;
const FacebookStrategy= require('passport-facebook').Strategy;

const app= express()


mongodb.connect('mongodb+srv://admin:1234@cluster0.87qpxb1.mongodb.net/?retryWrites=true&w=majority&appName=cluster0') 
    .then(client => {
        mydb = client.db('myboard');
        mydb.collection('post').find().toArray()
            .then(result => {
                console.log(result)
            });
        app.listen(8080, function(){
            console.log('MGDB send to server8080')
        });
    })
    .catch((err) => {
        console.log(err);
});
passport.serializeUser(function(user,done){
    console.log('serializeUser');
    console.log(user.userid);
    done(null,user.userid);
});
passport.deserializeUser(function (puserid, done) {
    console.log('deserializeUser');
    console.log(puserid);

    mydb.collection('account').findOne({userid:puserid})
    .then((result) => {
        console.log(result);
        done(null, result);
    })
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
app.use(passport.initialize());
app.use(passport.session());


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


app.post('/save', function(req,res){
    console.log(req.body.title);
    console.log(req.body.content);
    console.log(req.body.someDate);
    mydb.collection('post').insertOne(
        {title : req.body.title, content : req.body.content, date : req.body.someDate }
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
app.post(
    '/login',
    passport.authenticate('local', {
        failureRedirect: "/fail",
    }),
     function(req, res){
        console.log(req.session);
        console.log(req.session.passport);
        res.render('index.ejs', {user:req.session.passport});
     }
        );

    passport.use(
        new LocalStrategy(
            {
                usernameField:'userid',
                passwordField:'userpw',
                session: true,
                passReqToCallback: false,
            },
            function (inputid, inputpw, done) {
                mydb.collection('account').findeOne({userid:inputid})
                .then((result)=>{
                    if(result.userpw == sha(inputpw)) {
                        console.log('새로운 로그인');
                        done(null, result);
                    } else {
                        done(null, false, {message:'비밀번호 틀렸어요'});
                    }
                });
            }
        )
    );
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







