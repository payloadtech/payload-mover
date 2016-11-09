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
var transferCoinbaseBitcoinTo = function transferCoinbaseBitcoinTo(address) {
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
        account.sendMoney({'to': address,
                           'amount': amount,
                           'currency': currency}, function(err, tx) {
          console.log(tx.title + " " + tx.subtitle);
        });
      })
      .catch(function(err) {
          console.log(err);
      });

};

// Connect
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
            transferCoinbaseBitcoinTo(deposit.Data.InputAddress);
        });
    })
    .catch(function(err) {
        console.log(err);
    });
