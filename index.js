// Setup request
var request = require('request');
var appWebhookUrl = 'http://requestb.in/1b6ffx81';
var appWebhookSecret = process.env.APP_WEBHOOK_SECRET;

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

// Setup Coinbase
var Promise = require("bluebird");

var Client = require('coinbase').Client;
var coinbase = Promise.promisifyAll(new Client({
    'apiKey': process.env.COINBASE_API_KEY,
    'apiSecret': process.env.COINBASE_API_SECRET
}));

// move bitcoin from Coinbase account to given address
var transferCoinbaseBitcoinTo = function transferCoinbaseBitcoinTo(address, cb) {
    console.log('transfering from Coinbase to ' + address);
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

            console.log('transfering ' + amount + ' BTC');

            if (amount > 0) {
                account.sendMoney({
                    'to': address,
                    'amount': amount,
                    'currency': currency
                }, function(err, tx) {
                    console.log(tx.details.title + " " + tx.details.subtitle);
                    cb({
                        'success': true,
                        'message': 'Done!'
                    });
                });
            } else {
                console.log('No bitcoins to transfer');
                cb({
                    'success': true,
                    'message': 'No funds to transfer'
                });
            }
        })
        .catch(function(err) {
            console.log(err);
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
            console.log(heartbeat.Latency);
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
            console.log(logged);
        })
        // request a deposit, and transfer bitcoin to it
        .then(function() {
            blinktrade.requestDeposit().on('DEPOSIT_REFRESH', function(deposit) {
                transferCoinbaseBitcoinTo(deposit.Data.InputAddress, cb);
            });
        })
        .catch(function(err) {
            console.log(err);
            cb({
                'success': false,
                'message': 'An unknown error occurred'
            });
        });
};

app.get('/', function(req, res) {
    if (req.query.secret === secret) {
        depositCoinbasetoUrdubit(function(response) {

            // send a webhook to the app about a block being found
            request({
                url: appWebhookUrl,
                method: 'POST',
                qs: {
                  secret: appWebhookSecret
                },
                form: {
                  message: 'New block!'
                }
            }, function(error, response, body) {
                if (error) console.log(error);
                console.log(response.statusCode);
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

app.listen(port, function() {
    console.log('Listening on port ' + port);
});
