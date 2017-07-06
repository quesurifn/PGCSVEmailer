var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


const pg = require('pg');
const parse = require('pg-connection-string').parse;
const co     = require('co')
const schedule = require('node-schedule');
const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN })

require('dotenv').config()

var index = require('./routes/index');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);


//const j = schedule.scheduleJob('0 09 * *', function(){
let Client = require('pg').Client

  let client = new Client (
    'postgres://u90suan22q65d7:pe0422c664129c21c598ddd35b251a8bba3943a0e38c36f150ec1634ecefd9caa@ec2-54-173-29-18.compute-1.amazonaws.com:5432/d9cq3smcgpcqok?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory'
   /* {

    dbname: 'd9cq3smcgpcqok',
    host: 'ec2-54-173-29-18.compute-1.amazonaws.com',
    port: 5432,
    user:'u90suan22q65d7',
    password:'pe0422c664129c21c598ddd35b251a8bba3943a0e38c36f150ec1634ecefd9caa',
    sslmode:'require',
    ssl: true
  }
  */
  
  )


 
// instantiate a new client 
// the client will read connection information from 
// the same environment variables used by postgres cli tools 
//var client = new pg.Client();
 
// connect to our database 
client.connect(function (err) {
  if (err) throw err;
 
  // execute a query on our database 
  client.query(`SELECT  "spree_orders".* FROM "spree_orders" WHERE  "spree_orders"."completed_at" > current_timestamp - interval '1 day'  `, function (err, result) {
    if (err) throw err;
 
    // just print the result to the console 
    console.log(result); // outputs: { name: 'brianc' } 
 
    // disconnect the client 
    client.end(function (err) {
      if (err) throw err;
    });
  });
});
 


 

 /* console.log(process.env.HEROKU_API_KEY)

  heroku.get('/apps/fast-anchorage-76501/config-vars').then(data => {
    console.log(data)
  })
  .catch(err => {
    console.log(err)
  })
*/





//});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
