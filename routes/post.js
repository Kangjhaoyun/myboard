var router= require('express').Router();

router.get('/list', function(req,res){
    mydb.collection('post').find().toArray().then(result => {
        console.log(result);
        res.render('list.ejs', {data : result});
    });
});

const mongodb= require('mongodb').MongoClient;
const objid= require('mongodb').ObjectId;
const url= process.env.DB_URL;


mongodb.connect(url) 
    .then((client) => {
        mydb = client.db('myboard');
    })  
    .catch((err) => {
        console.log(err);
});


module.exports=router;