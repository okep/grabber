/*
    Purpose of this file is to crate normalized collections for further R analysis

    input parameters:
        * start - start time in seconds from start of measurement, if undefined whole interval is used
        * end - the end time, similar to start time
        * prefix - prefix used for normalized collections created, if not specified, current time is used
*/

// the global variable

var _b = {
    // constants
    TICKER: 'bitstamp_ticker',           // source bitstamp ticker collection
    TRANSACTION: 'bitstamp_transaction', // source bitstamp transaction collection
    ORDER_BOOK: 'bitstamp_orderBook',    // source bitstamp depth collection
    DB_NAME: 'grabber',
    TICKER_RESULT: 'tickerResult',
    TRANSACTION_RESULT: 'transactionResult',
    DEPTH_RESULT: 'depthResult',

    // types of changes in order book
    BUY_TRANSACTION:'BUY_TRANSACTION',
    SELL_TRANSACTION: 'SELL_TRANSACTION',
    PLACE_BID: 'PLACE_BID',
    WITHDRAW_BID: 'WITHDRAW_BID',
    PLACE_ASK: 'PLACE_ASK',
    WITHDRAW_ASK: 'WITHDRAW_ASK'
};

initConnection();
ensureIndexes();
initParamters();

processTicker();
processTransactionAndDepth();

closeConnection();

function processTransactionAndDepth() {
    var transactionResultName = createCollection(_b.TRANSACTION_RESULT);
    _b.db[transactionResultName].ensureIndex({ timestamp: 1});
    _b.db[transactionResultName].ensureIndex({ tid: 1}, {unique: true});

    var depthResultName = createCollection(_b.DEPTH_RESULT);

    var depth = undefined;          // current depth

    // 1. create flat transaction structure
    var transactionCursor = _b.db[_b.TRANSACTION].find();
    var counter = 0;
    while(transactionCursor.hasNext()) {
        var row = transactionCursor.next().transactions;
        for(var i = 0; i < row.length; i++) {
            counter++;
            var normRow = normalizeTransaction(row[i]);
            if(normRow.timestamp >= _b.start && normRow.timestamp <= _b.end) {
                _b.db[transactionResultName].insert(normRow);
            }
        }
    }
    print('Added ' + counter + ' transactions to ' + transactionResultName);

    // 2. checking if transaction is buy or sell
    var tickerCursor = _b.db[getCollectionName(_b.TICKER_RESULT)].find().sort({timestamp: 1});

    var previous = undefined;
    var current = undefined;
    counter = 0;
    while(tickerCursor.hasNext()) {
        current = tickerCursor.next();

        if(typeof(previous) !== 'undefined') {
            var last = previous.last;
            var transactions = findTransactionsInInterval(previous.timestamp, current.timestamp);
            for(i = 0; i < transactions.length; i++) {
                var tr = transactions[i];
                tr.buy = tr.price > last;
                last = tr.price;
                saveTransaction(tr);
                counter++;
            }
        }
        previous = current;
    }
    print(counter + ' transactions updated for buy/sell');

    // 3. process bids and asks
    // go through order book between pairs and find transactions between
    var obCursor = _b.db[_b.ORDER_BOOK].find().sort({timestamp: 1});

    previous = undefined;
    current = undefined;
    counter = 0;
    while(obCursor.hasNext()) {
        current = normalizeOrderBook(obCursor.next());
        if(typeof(previous) !== 'undefined') {

        }
        previous = current;
    }



}

function compareBooks(before, after) {
    var ret = {
        bids_added: [],
        bids_removed: [],
        asks_added: [],
        asks_removed: []
    };


}

function compareArrays(before, after){
    var bi = 0;
    var ai = 0;

    var ret = {
        added: [],
        removed: []
    };

    var b = undefined;
    var a = undefined;

    while(bi < before.length || ai < after.length) {
        b = before[bi];
        a = after[ai];

        if(b.price < a.price) {

        } else if(b.price > a.price) {

        } else {

        }


    }

}


function normalizeOrderBook(row) {
    row.timestamp = parseInt(row.timestamp);
    var bids = [];
    for(var i = 0; i < row.bids; i++) {
        var bid = bids[i];
        bids.push({
            "price": parseFloat(bid[0]),
            "amount": parseFloat(bid[1])
        });
    }
    for(i = 0; i < row.asks; i++) {
        var ask = asks[i];
        bids.push({
            "price": parseFloat(ask[0]),
            "amount": parseFloat(ask[1])
        });
    }
}

function normalizeTransaction(row) {
    row.timestamp = parseInt(row.date);
    delete row.date;
    row.price = parseFloat(row.price);
    row.amount = parseFloat(row.amount);
    row.buy = false;        // default is sell (just to not have NA's and be pesimistic about it)
    return row;
}


function nomalizeTicker(row) {
    row.timestamp = parseInt(row.timestamp);
    row.high = parseFloat(row.high);
    row.low = parseFloat(row.low);
    row.last = parseFloat(row.last);
    row.bid = parseFloat(row.ask);
    row.ask = parseFloat(row.ask);
    row.volume = parseFloat(row.volume);
    return row;
}

function processTicker() {
    var resultCollectionName = createCollection(_b.TICKER_RESULT);
    _b.db[resultCollectionName].ensureIndex({timestamp: 1}, {unique: 1});

    var cursor = _b.db[_b.TICKER].find(_b.FIND_BEGIN_END);
    var counter = 0;
    while(cursor.hasNext()) {
        counter++;
        var row = cursor.next();
        row = nomalizeTicker(row);
        _b.db[resultCollectionName].insert(row);
    }

    print("Added " + counter + " rows to " + resultCollectionName);
}


function initConnection() {
    _b.conn = new Mongo();
    _b.db = _b.conn.getDB(_b.DB_NAME);
    print('Conection to db initialized');
}

function ensureIndexes() {
    print('Ensuring indexes');
    _b.db[_b.TICKER].ensureIndex({'timestamp': 1});
    _b.db[_b.ORDER_BOOK].ensureIndex({'timestamp': 1});
}

function initParamters() {

    // get min and max time
    var minmax = _b.db[_b.TICKER].aggregate([
        {
            $group: {
                _id: 0,
                min: { $min: "$timestamp"},
                max: { $max: "$timestamp"}
            }
        }
    ]).result[0];

    minmax.min = parseInt(minmax.min);
    minmax.max = parseInt(minmax.max);

    var span = minmax.max - minmax.min;

    start = (typeof(start) === 'undefined') ? 0 : parseInt(start);
    end = (typeof(end) === 'undefined') ? span : parseInt(end);

    function getBoundary(boundary) {
        if (boundary < 0) {
            return minmax.min;
        } else if (boundary > span) {
            return minmax.max;
        } else {
            return minmax.min + boundary
        }
    }

    _b.start = getBoundary(start).toString();
    _b.end = getBoundary(end).toString();

    if(typeof(prefix) === 'undefined') {
        _b.prefix = new Date().getTime().toString();
    } else {
        _b.prefix = prefix;
    }

    _b.FIND_BEGIN_END = {
        $and: [
            {timestamp: {$gte: _b.start}},
            {timestamp: {$lte: _b.end}}
        ]
    };


    print("Start time: " + _b.start);
    print("End time: " + _b.end);
    print("prefix: " + _b.prefix);
}

function closeConnection() {
    // i don't know how to close it
    print('Connection to db closed.')
}

function createCollection(name) {
    var resultCollectionName = _b.prefix + '_' + name;
    print('Creating collection: ' + resultCollectionName);
    // drop collection if exists
    _b.db[resultCollectionName].drop();
    _b.db.createCollection(resultCollectionName);

    return resultCollectionName;
}

// t1 inclusive, t2 exclusive
function findTransactionsInInterval(t1, t2) {
    var cursor = _b.db[getCollectionName(_b.TRANSACTION_RESULT)].find({
        $and: [
            {timestamp: {$gte: t1}},
            {timestamp: {$lt : t2}}
        ]
    }).sort({tid: 1});
    var ret = [];

    while(cursor.hasNext()) {
        ret.push(cursor.next());
    }
    return ret;
}

function saveTransaction(transaction) {
    _b.db[getCollectionName(_b.TRANSACTION_RESULT)].save(transaction);
}

function getCollectionName(name) {
    return _b.prefix + '_' + name;
}