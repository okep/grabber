db.bitstamp_ticker.aggregate( {
        $group: {
            _id : "$timestamp",
            high: { $last : "$high"},
            last: { $last : "$last"},
            bid: { $last : "$bid"},
            volume: { $last : "$volume"},
            low: { $last : "$low"},
            ask: { $last : "$ask"}

        }

    }
);