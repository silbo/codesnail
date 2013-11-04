var express = require('express');
var app = express();

/* routes */
app.get('/hello.txt', function(req, res){
  res.send('Sum Ting Work');
});
/* error handling */
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Sum Ting Wong');
});
/* start listening */
app.listen(3000);
console.log('Listening on port 3000');
