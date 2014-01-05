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
    _b.db[depthResultName].ensureIndex({ timestamp: 1});

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

    var obCursor = _b.db[_b.ORDER_BOOK].find().sort({timestamp: 1});

    previous = undefined;
    current = undefined;
    counter = 0;
    while(obCursor.hasNext()) {
        current = obCursor.next();
        if(typeof(previous) !== 'undefined') {
            transactions = findTransactionsInInterval(parseInt(previous.timestamp), parseInt(current.timestamp));
            var com = compare(decomposeOrderBook(previous), decomposeOrderBook(current), decomposeTransactions(transactions));
            if(com) {
                for(i = 0; i < com.length; i++) {
                    _b.db[depthResultName].insert(com[i]);
                    counter++;
                }
            }
        }
        previous = current;
    }

    print(counter + ' oreder book operations');
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


// ORDER BOOK COMPARISON ALGORITHM
function compare(before, after, ts) {
    if(before.timestamp == after.timestamp) {
        return undefined;
    }

    var price;
    var aux;
    var j;

    var bidComp = compareOne(before.bids, after.bids, ts.sell);
    var askComp = compareOne(before.asks, after.asks, ts.buy);
    // add transactions

    for(i = 0; i < ts.sell.length; i++) {
        processTransaction(ts.sell[i], false);
    }
    for(i = 0; i < ts.buy.length; i++) {
        processTransaction(ts.buy[i], true);
    }

    var ret = [];

    for(j = 0; j < bidComp.placed.length; j++) {
        ret.push({
            "timestamp": after.timestamp,
            "operation": _b.PLACE_BID,
            "price": bidComp.placed[j].price,
            "amount": bidComp.placed[j].amount

        });
    }

    for(j = 0; j < bidComp.withdrawals.length; j++) {
        ret.push({
            "timestamp": after.timestamp,
            "operation": _b.WITHDRAW_BID,
            "price": bidComp.withdrawals[j].price,
            "amount": bidComp.withdrawals[j].amount

        });
    }

    for(j = 0; j < bidComp.transactions.length; j++) {
        ret.push({
            "timestamp": after.timestamp,
            "operation": _b.SELL_TRANSACTION,
            "price": bidComp.transactions[j].price,
            "amount": bidComp.transactions[j].amount

        });
    }

    for(j = 0; j < askComp.placed.length; j++) {
        ret.push({
            "timestamp": after.timestamp,
            "operation": _b.PLACE_ASK,
            "price": askComp.placed[j].price,
            "amount": askComp.placed[j].amount

        });
    }

    for(j = 0; j < askComp.withdrawals.length; j++) {
        ret.push({
            "timestamp": after.timestamp,
            "operation": _b.WITHDRAW_ASK,
            "price": askComp.withdrawals[j].price,
            "amount": askComp.withdrawals[j].amount

        });
    }

    for(j = 0; j < askComp.transactions.length; j++) {
        ret.push({
            "timestamp": after.timestamp,
            "operation": _b.BUY_TRANSACTION,
            "price": askComp.transactions[j].price,
            "amount": askComp.transactions[j].amount
        });
    }

    return ret;

    function processTransaction(transaction, buy) {
        price = transaction.price;
        var j;
        var aux;
        // check if the transaction is in before or after, if not add placement
        if (!findPrice(price, before.bids) && !findPrice(price, before.asks) &&
            !findPrice(price, after.bids) && findPrice(price, after.asks)) {
            // there must have been placement for transaction we don't see
            for (j = 0; j < transaction.realamount.length; j++) {
                aux = {
                    "price": price,
                    "amount": transaction.realamount[j]
                };
                if (buy) {
                    askComp.placed.push(aux);
                } else {
                    bidComp.placed.push(aux);
                }
            }
        }

        for (j = 0; j < transaction.realamount.length; j++) {
            aux = {
                "price": price,
                "amount": transaction.realamount[j]
            };
            if (buy) {
                askComp.transactions.push(aux);
            } else {
                bidComp.transactions.push(aux);
            }
        }
    }

    function findPrice(price, array) {
        for(var i = 0; i < array.length; i++) {
            if(array[i].price == price) {
                return true;
            }
        }
        return false;
    }

    function compareOne(befores, afters, ts) {
        var b = 0, a = 0, i, j, k;
        var price;
        var before;
        var after;
        var transaction;
        var maxAmount;
        var toCover;
        var reminder;
        var found;

        var ret = {
            "placed": [],
            "transactions": [],
            "withdrawals": []
        };


        // now withdrawals and place
        while(b < befores.length || a < afters.length) {
            if(b < befores.length) {
                before = befores[b];
            } else {
                before = {
                    "price": 0,
                    "amount": []
                }
            }
            if(a < afters.length) {
                after = afters[a];
            } else {
                after = {
                    "price": 0,
                    "amount": []
                }

            }

            if(before.price > after.price) {
                // something disapeared from before (transaction and/or withdrawal)
                price = before.price;
                transaction = tOnPrice(price);
                // can be transaction applied ? (is the amount less than disapeared?)
                maxAmount = maxTAmount(transaction);

                if(maxAmount > 0) {
                    // there was a transaction (here comes heuristic)
                    // we assume that the oldest bids are used first
                    // 1. apply the transaction
                    toCover = maxAmount;
                    for(i = before.amount.length-1; i >= 0; i--) { // we go in reverese order as the oldes are at the end
                        var amt = before.amount[i];
                        if(amt <= toCover) {
                            toCover -= amt;
                        } else {
                            ret.withdrawals.push({
                                "price": price,
                                "amount": amt - toCover
                            });
                            toCover = 0;
                        }
                    }
                    if(toCover > 0) {
                        // there is still something to cover, there must have been placement
                        ret.placed.push({
                            "price": price,
                            "amount": toCover
                        });
                        toCover = 0;
                    }
                } else {
                    // all was withdrawal there was not any transaction
                    for(i = 0; i < before.amount.length; i++) {
                        ret.withdrawals.push({
                            "price": price,
                            "amount": before.amount[i]
                        });
                    }
                }
                b++;
            } else if(before.price < after.price) {
                // something appeared
                price = after.price;
                transaction = tOnPrice(price);
                maxAmount = maxTAmount(transaction);
                // everything was placed
                for(i = 0; i < after.amount.length; i++) {
                    ret.placed.push({
                            "price": price,
                            "amount": after.amount[i]
                        }
                    );
                }
                if(maxAmount > 0) {
                    // there was placed something more to cover transaction
                    ret.placed.push({               // may be there was more, but we know that there was at least one
                            "price": price,
                            "amount": maxAmount
                        }
                    );
                }
                a++;
            } else {
                // the most difficult
                price = after.price;
                i = before.amount.length - 1;
                j = after.amount.length - 1;

                transaction = tOnPrice(price);
                maxAmount = maxTAmount(transaction);

                toCover = maxAmount;
                reminder = 0;

                if(toCover > 0) {
                    while(i >= 0 && toCover > 0) {
                        if(toCover < before.amount[i]) {
                            reminder = before.amount[i] - toCover;
                            toCover = 0;
                        } else {
                            toCover -= before.amount[i];
                            i--;
                            if(toCover == 0 && i > 0) {
                                reminder = before.amount[i];
                            }
                        }
                    }
                } else {
                    reminder = before.amount[i];
                }
                if(toCover > 0) {
                    // there had to be put
                    ret.placed.push({
                        "price": price,
                        "amount": toCover
                    });
                    toCover = 0;
                    while(j >= 0) {
                        ret.placed.push({
                            "price": price,
                            "amount": after.amount[j]
                        });
                    }

                } else {
                    // find where is reminder on right side
                    while(reminder > 0) {
                        k = j;
                        found = false;
                        while(k >= 0) {
                            if(after.amount[k] == reminder) {
                                found = true;
                                for(; j > k; j--) {
                                    ret.placed.push({
                                        "price": price,
                                        "amount": after.amount[j]
                                    });
                                }
                                // we found match let move on
                                j--;
                                i--;
                                break;

                            }
                            k--;
                        }
                        if(!found) {
                            ret.withdrawals.push({
                                "price": price,
                                "amount": reminder
                            });
                            i--;
                        }

                        if(i >= 0) {
                            reminder = before.amount[i];
                            if(j < 0) {
                                for(;i>=0; i--) {
                                    ret.withdrawals.push({
                                        "price": price,
                                        "amount": before.amount[i]
                                    });
                                }
                                reminder = 0;
                            }
                        } else {
                            // all remining after are placed
                            for(;j>=0; j--) {
                                ret.placed.push({
                                    "price": price,
                                    "amount": after.amount[j]
                                });
                            }
                            reminder = 0;
                        }
                    }

                }
                a++;b++;
            }
        }

        return ret;

        function maxTAmount(t) {
            var ret = 0;
            if(typeof(t) !== 'undefined') {
                for(var i = 0; i < t.amount.length; i++) {
                    ret = (ret < t.amount[i]) ? t.amount[i] : ret;
                }
            }
            return ret;
        }

        function tOnPrice(price) {
            for(var i = 0; i < ts.length; i++) {
                var t = ts[i];
                if(t.price == price) {
                    return t;
                }
            }
            return undefined;
        }

    }
}


// number of ts is usually small need not be fast
function decomposeTransactions(ts) {
    var buy = [];
    var sell = [];
    var i;

    function applyNewTs(trans, array) {
        var i, j;
        var applied = false;
        for(j = 0; j < array.length; j++) {
            var element = array[j];
            if(element.price == t.price) {
                // add permutatin of amount
                var toAdd = [t.amount];
                for(i = 0; i < element.amount.length; i++) {
                    toAdd.push(element.amount[i] + trans.amount);
                }
                for(i = 0; i < toAdd.length; i++) {
                    element.amount.push(toAdd[i]);
                }
                element.realamount.push(t.amount);
                applied = true;
            }
        }
        if(!applied) {
            array.push({
                "price": t.price,
                "amount": [t.amount],
                "realamount": [t.amount]
            });
        }
    }

    for(i = 0; i < ts.length; i++) {
        var t = ts[i];
        if(t.buy) {
            applyNewTs(t, buy);
        } else {
            applyNewTs(t, sell);
        }
    }

    return {"buy": buy, "sell": sell};
}

/**
 * Does:
 *    * change strings to floats and ints
 *    * grouping by same price
 *    * reverse order of asks to be compatible with bids
 *
 * @param depth
 */
function decomposeOrderBook(depth) {
    depth.timestamp = parseInt(depth.timestamp);
    var bids = [];
    var asks = [];

    function applyNew(array, bora, reverse) {
        var newEntry = undefined;
        var lastPrice = undefined;
        for (var i = 0; i < bora.length; i++) {
            var bid = bora[i];
            var price = parseFloat(bid[0]);
            var amount = parseFloat(bid[1]);
            if (price === lastPrice) {
                // entry already exists
                if(reverse) {
                    newEntry.amount.unshift(amount);
                } else {
                    newEntry.amount.push(amount);
                }
            } else {
                newEntry = {
                    "price": price,
                    "amount": [amount]
                };
                if(reverse) {
                    array.unshift(newEntry);
                } else {
                    array.push(newEntry);
                }
            }
            lastPrice = price;
        }
    }

    applyNew(bids, depth.bids, false);
    applyNew(asks, depth.asks, true);

    depth.bids = bids;
    depth.asks = asks;

    return depth;
}
