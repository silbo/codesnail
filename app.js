var express = require('express');
var redis = require('redis');
var app = express();
var db = redis.createClient();

/* user count */
app.use(function(req, res, next){
  var min = 60 * 1000;
  var ago = Date.now() - min;
  db.zrevrangebyscore('online', '+inf', ago, function(err, users){
    if (err) return next(err);
    req.online = users;
    next();
  });
});
/* routes */
app.get('/', function(req, res){
  res.send('Sum Ting Work, ' + req.online.length + ' users are online');
});
/* error handling */
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Sum Ting Wong');
});
/* start listening */
app.listen(3000);
console.log('Listening on port 3000');
