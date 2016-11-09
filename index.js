// require BlinkTrade
var BlinkTrade = require('blinktrade');
var BlinkTradeWS = BlinkTrade.BlinkTradeWS;


// WebSocket Transport
var blinktrade = new BlinkTradeWS({
    prod: true
});

// Connect
// blinktrade
//     .connect()
//     // run a heartbeat
//     .then(function() {
//         return blinktrade.heartbeat();
//     })
//     // log the heartbeat
//     .then(function(heartbeat) {
//         console.log(heartbeat.Latency);
//     })
//     // authenticate
//     .then(function() {
//         return blinktrade.login({
//             "BrokerID": 8, // Urdubit
//             "username": process.env.BLINKTRADE_API_KEY, // API key
//             "password": process.env.BLINKTRADE_API_PASSWORD, // API password
//         });
//     })
//     // log the authentication
//     .then(function(logged) {
//         console.log(logged);
//     })
//     // request a deposit
//     .then(function() {
//         return blinktrade.requestDeposit().on('DEPOSIT_REFRESH', function(deposit) {
//             return deposit;
//         });
//     })
//     // log the deposit and return the deposit address
//     .then(function(deposit) {
//         console.log('Logging Deposit Information')
//         console.log(deposit);
//         return deposit.Data.InputAddress;
//     })
//     .then(function(depositAddress){
//       console.log("This is the deposit address");
//       console.log(depositAddress);
//     })    .catch(function(err) {
    //     console.log(err);
    // });


// Coinbase
var Promise = require("bluebird");

var Client = require('coinbase').Client;
var client = Promise.promisifyAll(new Client({
    'apiKey': process.env.COINBASE_API_KEY,
    'apiSecret': process.env.COINBASE_API_SECRET
}));

client
    // grab the accounts
    .getAccountsAsync({})
    // return the first account
    .then(function(accounts) {
        return accounts[0];
    })
    // send the account balance to an address
    .then(function(account) {
      address = '13kcVthUJti7KEb4cQp1mH2X3aBu6DSTBz';
      amount = account.balance.amount;
      currency = account.balance.currency;

      account.sendMoney({'to': address,
                         'amount': amount,
                         'currency': currency}, function(err, tx) {
        console.log(tx);
      });

      console.log(account);
    })
    .catch(function(err) {
        console.log(err);
    });
