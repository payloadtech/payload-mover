// require BlinkTrade
var BlinkTrade = require('blinktrade');
var BlinkTradeWS = BlinkTrade.BlinkTradeWS;


// WebSocket Transport
var blinktrade = new BlinkTradeWS({
    prod: true
});

// Connect
blinktrade
    .connect()
    // run a heartbeat
    .then(function() {
        return blinktrade.heartbeat();
    })
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
    }).then(function(logged) {
        console.log(logged);
    });
