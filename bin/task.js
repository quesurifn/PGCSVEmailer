#!/usr/bin/env node

'use strict'

const fs = require('fs')
const pg = require('pg');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const json2csv = require('json2csv');
const zcta = require("us-zcta-counties");


require('dotenv').config()

 
    
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
  'canceler_id', 'store_id', 'state_lock_version', 'taxable_adjustment_total', 'non_taxable_adjustment', 'ship_address1',
  'ship_address2', 'ship_city', 'ship_zipcode', 'ship_state', 'bill_address1', 'bill_address2', 'bill_city', 'bill_zipcode', 'bill_state', 'phone'
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
            let state = zcta.find({zip: merge.zipcode})
            console.log(state.state)
						return Object.assign(e, { ship_address1: merge.address1, ship_address2: merge.address2, ship_city: merge.city, ship_zipcode: merge.zipcode, ship_state: state.state, phone: merge.phone });
					});

      let finalMerged = mergedObjects.map(function(e) {
        let merge = result2.rows.filter(function(e2) {
          return e2.id == e.bill_address_id;
        })[0];
        let state = zcta.find({zip: merge.zipcode})
        return Object.assign(e, { bill_address1: merge.address1, bill_address2: merge.address2, bill_city: merge.city, bill_zipcode: merge.zipcode, bill_state: state.state});
      })

     
    try {
    
      let csv = json2csv({ data: mergedObjects, fields: fields });
      console.log(csv)
      let mailOptions = {
        from: '"Kyle Fahey" <kyle.c.r.fahey@gmail.com>', // sender address
        to: 'kyle.c.fahey@gmail.com', // list of receivers
        subject: 'Ecommerce Orders Last 24 Hours (CSV) ', // Subject line
        text: 'Hello Team, here are the orders for the last 24 hours. Thanks. Kyle Fahey', // plain text body
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
