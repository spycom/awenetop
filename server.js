var fs = require('fs');
var static = require('node-static');
var http = require('http');
var https = require('https');

var privateKey = fs.readFileSync('../keys/ssl2.key').toString(),
    certificate = fs.readFileSync('../keys/ssl_concat.crt').toString();

var file = new(static.Server)();
var app = https.createServer({key: privateKey, cert: certificate}, function (req, res) {
  file.serve(req, res);
}).listen(2013);


//https.createServer({key: privateKey, cert: certificate}, app).listen(8000);

// var express = require('express');
// var app = express();
// console.log(express.static(__dirname + '/js'));
// app.use(express.static(__dirname + '/js'));
// app.all('*', function(req, res){
// 	res.sendfile("index.html");
// });

// app.listen(9000);


var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket){
	
	var keys = function( object ) {
	  if ( !(object && typeof object === 'object') ) {
	    return null;
	  }
	  var result = [];
	  for (var key in object) {
	    if (object.hasOwnProperty(key)) {
	      result.push(key)
	    }
	  }
	  return result;
	}

 	 var obiekt = io.sockets.manager.rooms;

  	
	
 	var clients = io.sockets.clients();
 	

	function log(){
		var array = [">>> "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('set latitude', function (location_x) {
	    socket.set('location_x', location_x, function () {
	  	log('Location_x=' + location_x);
    	});
	});
	 
	socket.on('set longitude', function (location_y) {
	    socket.set('location_y', location_y, function () {
	  	log('Location_y=' + location_y);
    	});
	});

  //socket.on('get location', function () {
	var rooms = [];
	var x = [];
	var y = [];

	io.sockets.clients().forEach(function(s) {
    if (s.id != socket.id) {
	    s.get('location_x', function (err, latitude) {
	    		//socket.emit('clients', latitude);
	    		if ( latitude != null ) {
	      		//log('Location_latitude=' + latitude);
	      		x.push(latitude);
	    		} else {
	    			x.push(0);
	    		}
	  	});
	  	s.get('location_y', function (err, longitude) {
	    		//socket.emit('clients', latitude);
	    		if ( longitude != null ) {
	    			//log('Location_longitude=' + longitude);
	    			y.push(longitude);
	    		} else {
	    			y.push(0);
	    		}
	  	});
	  	s.get('room', function (err, room_name ) {
	  		//if ( room_name != null ) {
	  			rooms.push(room_name);
	  		//}
	  	});
	  }
  	
	});

	socket.emit('clients', x);
	socket.emit('clients_y', y);
	socket.emit('start2', rooms);	
  	//});

  socket.emit('start', keys(obiekt));	

	socket.on('message', function (message) {
		log('Got message: ', message);
		socket.broadcast.emit('message', message); // should be room only
	});



	socket.on('create or join', function (room) {
		
		var numClients = io.sockets.clients(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);

		socket.set('room', room, function () {
	  	// ...
    });

		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
			
		} else if (numClients == 1) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

	});

});
