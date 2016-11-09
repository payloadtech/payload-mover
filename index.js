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
            "MsgType": "BE",
            "UserReqID": 9696784, // doesn't matter what this number is
            "BrokerID": 8, // Urdubit
            "Username": process.env.BLINKTRADE_API_KEY, // API key
            "Password": process.env.BLINKTRADE_API_PASSWORD, // API password
            "UserReqTyp": "1"
        });
    }).then(function(logged) {
        console.log(logged);
    });
