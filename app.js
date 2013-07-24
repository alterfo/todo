
/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose = require('mongoose')
  , http = require('http')
  , bcrypt = require('bcrypt')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.cookieSession({secret:';jgfcß∂eiFvb'}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect("mongodb://localhost/todo");

var TodoSchema = new mongoose.Schema({
	username: String,
	password: String,
	ready: [],
	notReady: []
}),
	Todo = mongoose.model('Todo', TodoSchema);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}




app.get('/', function(req, res) {
		Todo.find({"username": "noname"}, "notReady ready", function(err, docs) {
			res.render('index', {list:docs});
		});
});

app.get('/init', function(req, res) {
	Todo.find({"username": "noname"}, "notReady ready", function(err, docs) {
		res.send(docs[0]);
	});
});



app.post('/', function(req, res) {
	Todo.update({ "username": "noname"}, req.body, {upsert: true}, function(err, numberAffected, raw) {
		if (err) console.log('got an error ' + err);
		console.log('The number of updated documents was %d', numberAffected);
		console.log(raw);
	});
	res.send(req.body);
});

app.get('/login', function (req, res) {
	res.send('Cool hacker, ya?');
});


app.post('/login', function (req, res) {
  var post = req.body;
  Todo.count({ "username": post.user}, function(err, count) {
  	if (count == 0) {
  		bcrypt.genSalt(10, function(err, salt) {
    		bcrypt.hash(post.password, salt, function(err, hash) {
          		Todo.update({ "username": post.user}, {'password': hash}, {upsert: true}, function(err, numberAffected, raw) {
					if (err) console.log('got an error ' + err);
					console.log('The number of updated documents was %d', numberAffected);
					console.log(raw);
				});
				req.session.user_id = post.user;
		    });
	});




  	} else {
  		Todo.find({ "username": post.user}, "password", function(err, docs) {
  			if (err) console.log(err);
			bcrypt.compare(post.password, docs[0].password, function(err, resp) {
				if (resp === true) {
					req.session.user_id = post.user;
	  				res.redirect("/" + post.user);
				} else {
  					setTimeout(function() {res.render('login', {username: post.user, message: "Bad user/pass"})}, 1000);
  				}
			});
  		
  		});

  	}
  });
});



app.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});  

app.get('/:username', function (req, res) {
	if (!req.session.user_id) {
		res.render('login', {username: req.params.username});
	} else {
		Todo.find({"username": req.session.user_id}, "notReady ready", function(err, docs) {
			res.render('index', {list:docs, logout: true});
		});
	}
  
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



