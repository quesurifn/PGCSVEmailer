'use strict'

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


const fs = require('fs')
const pg = require('pg');
const parse = require('pg-connection-string').parse;
const co     = require('co')
const schedule = require('node-schedule');
const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN })
const nodemailer = require('nodemailer');
const xoauth2 = require ('xoauth2')
const json2csv = require('json2csv');


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


//const j = schedule.scheduleJob('0 09 * *', function(){
    
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
  
  let fields = ['id','number','item_total','total','state','adjustment_total', 'user_id', 'completed_at',
  'bill_address_id', 'ship_address_id', 'payment_total', 'shipment_state', 'payment_state', 'email',
  'special_instructions', 'created_at', 'updated_at', 'currency', 'last_ip_adress', 'created_by_id', 
  'shipment_total', 'aditional_tax_total', 'promo_total', 'channel', 'included_tax_total', 'item_count', 
  'item_count', 'approver_id', 'approved_at', 'confimred_delivered', 'confirmed_risky', 'guest_token', 'canceled_at',
  'canceler_id', 'store_id', 'state_lock_version', 'taxable_adjustment_total', 'non_taxable_adjustment', 'address1',
  'address2', 'city', 'zipcode'
  ]
 
// connect to our database 
client.connect(function (err) {
  if (err) throw err;
 
  // execute a query on our database 
  client.query(`SELECT  "spree_orders".* FROM "spree_orders" WHERE  "spree_orders"."completed_at" > current_timestamp - interval '1 day'`, function (err, result) {
    if (err) throw err;
 
    // just print the result to the console 
    //console.log(result); // outputs: { name: 'brianc' } 
    client.query(`SELECT  "spree_addresses".* FROM "spree_addresses"`, function (err2, result2) {
    

    console.log(result2)
    let mergedObjects = result.rows.map(function(e) {
				let	merge = result2.rows.filter(function(e2) {
							return e2.id == e.ship_address_id;
						})[0];
						return Object.assign(e, { address1: merge.address1, address2: merge.address2, city: merge.city, zipcode: e.zipcode});
					});
    console.log(JSON.stringify(mergedObjects))


    try {
    
      let csv = json2csv({ data: mergedObjects, fields: fields });
    
      let mailOptions = {
        from: '"Kyle Fahey" <kyle.c.r.fahey@gmail.com>', // sender address
        to: 'kyle.c.fahey@gmail.com', // list of receivers
        subject: 'Ecommerce Orders Last 24 Hours (CSV) ', // Subject line
        text: 'Hello Team, here are the orders for the last 24 hours.', // plain text body
        attachments: [
          {
            'filename': 'orders.csv',
            'content': csv,
          }
        ]
    };

    

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
});

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
