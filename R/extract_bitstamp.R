library("RMongo")

args <- commandArgs(trailingOnly=T)

print(args)

db <- mongoDbConnect("grabber")

# output <- dbAggregate(db, collection="bitstamp_ticker", '{"$group" : { "_id" : "$timestamp", "high": { "$last" : "$high"}, "last": { "$last" : "$last"},  "bid": { "$last" : "$bid"}, "volume": { "$last" : "$volume"}, "low": { "$last" : "$low"}, "ask": { "$last" : "$ask"} }}')

output <- dbGetQuery(db, collection='bitstamp_ticker', '{}')

output <- output[, !(names(output) %in% c('X_id', 'machineTime'))]
output <- unique(output)

dbDisconnect(db)
