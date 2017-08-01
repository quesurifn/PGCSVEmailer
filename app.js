'use strict'

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


const fs = require('fs')
const pg = require('pg');
const co     = require('co')
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const json2csv = require('json2csv');
const zcta = require("us-zcta-counties");


require('dotenv').config()

const index = require('./routes/index');


const app = express();

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



  console.log('Time for tea!');


    
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.KYLE_GMAIL,
        pass: process.env.KYLE_PASS
      }
  });

  let Client = require('pg').Client
  let client = new Client (
      'postgres://u90suan22q65d7:pe0422c664129c21c598ddd35b251a8bba3943a0e38c36f150ec1634ecefd9caa@ec2-54-173-29-18.compute-1.amazonaws.com:5432/d9cq3smcgpcqok?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory'
  )
  
  let fields = ['email']
 
// connect to our database 
client.connect(function (err) {
  if (err) throw err;
 
  // execute a query on our database 
  client.query(`SELECT  "spree_orders".* FROM "spree_orders" WHERE 'completed_at' != 'null'  `, function (err, result) {
    console.log(result)

    if (err) throw err;
 
    // just print the result to the console 
    //console.log(result); // outputs: { name: 'brianc' } 
 
    


    let mergedObjects = result.rows.map(function(e) {
          console.log(e.email)
          return {
            email: e.email
          }
      }).filter(function(e){
          return e.email != null
      }) ;

    try {
    
      let csv = json2csv({ data: mergedObjects, fields: fields });

      let mailOptions = {
        from: '"Kyle Fahey" <kyle.c.r.fahey@gmail.com>', // sender address
        to: 'kyle.c.r.fahey@gmail.com', // list of receivers
        subject: 'Ecommerce Orders Last 24 Hours (CSV) ', // Subject line
        text: 'Hello Team, here are the orders for the last 24 hours. Thanks. Kyle Fahey', // plain text body
        attachments: [
          {
            'filename': 'orders.csv',
            'content': csv,
          }
        ]
    };

    // 

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
    });

    } catch (err) {
    // Errors are thrown for bad options, or if the data is empty and no fields are provided. 
    // Be sure to provide fields if it is possible that your data array will be empty. 
    console.error(err);
  } 
    // disconnect the client 
    client.end(function (err) {
          if (err) throw err;
        });
      });
    });




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
