// Secret
var secret = process.env.SECRET;

// Setup express
var express = require('express');
var app = express();

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
            account.sendMoney({
                'to': address,
                'amount': amount,
                'currency': currency
            }, function(err, tx) {
                console.log(tx.details.title + " " + tx.details.subtitle);
                cb();
            });
        })
        .catch(function(err) {
            console.log(err);
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
        });
};

app.get('/', function(req, res) {
    if (req.params.secret === secret) {
      depositCoinbasetoUrdubit(
        res.json({
            'success': true,
            'message': 'Done!'
        }));
    } else {
        res.json({
            'success': false,
            'message': 'Invalid secret'
        });
    }
});

app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
