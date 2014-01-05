library("RMongo")
library("zoo")

args <- commandArgs(trailingOnly=T)

print(args)

readCollection <- function(collectionName, unique=FALSE) {
  db <- mongoDbConnect("grabber")
  ret <- dbGetQuery(db, collection=collectionName, '{}')
  ret <- ret[, !(names(ret) %in% c('X_id', 'machineTime'))]
  if(unique) {
    ret <- unique(ret)
  }
  ret.z <- zoo(ret, as.POSIXct(ret[,'timestamp'], origin="1970-01-01"))
  return(ret);
  dbDisconnect(db)
} 

ticker <- readCollection('devtest_tickerResult', T);
depth <- readCollection('devtest_depthResult');

# calculate start and end end of the series
start(dept)
