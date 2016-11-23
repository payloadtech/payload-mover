// Setup request
var request = require('request');
var appWebhookUrl = 'https://app.payload.pk/notifications/mover';
var appWebhookSecret = process.env.WEBHOOK_SECRET;

// Secret
var secret = process.env.SECRET;

// Setup express
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

// Setup BlinkTrade
var BlinkTrade = require('blinktrade');
var BlinkTradeWS = BlinkTrade.BlinkTradeWS;
var blinktrade = new BlinkTradeWS({
    prod: true
});

// Setup the logger

var winston = require('winston');

//
// Requiring `winston-papertrail` will expose
// `winston.transports.Papertrail`
//
require('winston-papertrail').Papertrail;

var winstonPapertrail = new winston.transports.Papertrail({
  host: process.env.PAPERTRAIL_HOST,
  port: process.env.PAPERTRAIL_PORT,
  program: 'payload-mover'
});

winstonPapertrail.on('error', function(err) {
  console.error(err);
});

if (process.env.NODE_ENV === 'production') {

var logger = new winston.Logger({
  transports: [winstonPapertrail]
});

} else {
  var logger = new winston.Logger({
    level: 'info',
    transports: [new (winston.transports.Console)()]
  });

}

// Setup Coinbase
var Promise = require("bluebird");

var Client = require('coinbase').Client;
var coinbase = Promise.promisifyAll(new Client({
    'apiKey': process.env.COINBASE_API_KEY,
    'apiSecret': process.env.COINBASE_API_SECRET
}));

// move bitcoin from Coinbase account to given address
var transferCoinbaseBitcoinTo = function transferCoinbaseBitcoinTo(address, cb) {
    logger.info('transfering from Coinbase to ' + address);
    coinbase
    // grab the accounts
        .getAccountsAsync({})
        // return the first account
        .then(function(accounts) {
            return accounts[0];
        })
        // send the account balance to the address
        .then(function(account) {
            amount = account.balance.amount;
            currency = account.balance.currency;

            logger.info('transfering ' + amount + ' BTC');

            if (amount > 0) {
                account.sendMoney({
                    'to': address,
                    'amount': amount,
                    'currency': currency
                }, function(err, tx) {
                    logger.info(tx.details.title + " " + tx.details.subtitle);
                    cb({
                        'success': true,
                        'message': 'Done!'
                    });
                });
            } else {
                logger.info('No bitcoins to transfer');
                cb({
                    'success': true,
                    'message': 'No funds to transfer'
                });
            }
        })
        .catch(function(err) {
            logger.info(err);
            cb({
                'success': false,
                'message': 'An unknown error occurred'
            });
        });

};

// Fetch a deposit address for Urdubit and transfer bitcoin to it
var depositCoinbasetoUrdubit = function depositCoinbasetoUrdubit(cb) {
    blinktrade
        .connect()
        // run a heartbeat
        .then(function() {
            return blinktrade.heartbeat();
        })
        // log the heartbeat
        .then(function(heartbeat) {
            logger.info(heartbeat.Latency);
        })
        // authenticate
        .then(function() {
            return blinktrade.login({
                "BrokerID": 8, // Urdubit
                "username": process.env.BLINKTRADE_API_KEY, // API key
                "password": process.env.BLINKTRADE_API_PASSWORD, // API password
            });
        })
        // log the authentication
        .then(function(logged) {
            logger.info(logged);
        })
        // request a deposit, and transfer bitcoin to it
        .then(function() {
            blinktrade.requestDeposit().on('DEPOSIT_REFRESH', function(deposit) {
                transferCoinbaseBitcoinTo(deposit.Data.InputAddress, cb);
            });
        })
        .catch(function(err) {
            logger.info(err);
            cb({
                'success': false,
                'message': 'An unknown error occurred'
            });
        });
};

var checkCoinbaseToSweep = function(cb) {
  coinbase
  // grab the accounts
      .getAccountsAsync({})
      // return the first account
      .then(function(accounts) {
          return accounts[0];
      })
      // send the account balance to the address
      .then(function(account) {
          amount = account.balance.amount;
          currency = account.balance.currency;
          if (amount > 0) {
            depositCoinbasetoUrdubit(cb);
          } else {
            cb({
                'success': true,
                'message': 'No new funds to sweep'
            });
          }

        });
};

app.post('/', function(req, res) {
    if (req.query.secret === secret) {
        checkCoinbaseToSweep(function(response) {

            // send a webhook to the app about a block being found
            request({
                url: appWebhookUrl,
                method: 'POST',
                qs: {
                  secret: appWebhookSecret
                },
                json: {
                  message: 'New block!'
                }
            }, function(error, postResponse, body) {
                if (error) logger.info(error);
                logger.info(postResponse, 'Successfully contacted the app');
            });

            // send back the response to the webpage
            res.json(response);
        });
    } else {
        res.json({
            'success': false,
            'message': 'Invalid secret'
        });
    }
});

// just having some fun
app.get('/', function(req, res){
  res.json({
    message: 'Wtf? Are you high?',
    status: '420'
  });
});

app.listen(port, function() {
    logger.info('Listening on port ' + port);
});
