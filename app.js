var express = require('express');
var server = express.createServer();

var players = {};
var games = {};

function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function board() {
    var data = [];
    for (var row = 0 ; row < 10 ; row ++ ) {
        var r = []
        for (var col = 0 ; col < 10 ; col ++ ) {
            r.push({
                type:Math.floor(Math.random() * 6),
                round:0
            })
        }
        data.push(r);
    }

    return data;
}

function future(n) {
    var data = [];
    for (var i = 0 ; i < n ; i ++ ) {
        data.push(Math.floor(Math.random() * 6));
    }

    return data;
}

function game() {
    return {
        board:board(),
        players:[],
        spectators:[],
        future:future(10000),
    }
}

function broadcastGame(gid) {
    var game = games[gid];
    var player1Socket = game.players[0].socket;
    var player2Socket = game.players[1].socket;

    player1Socket.emit('playersReady',{
        board:game.board,
        future:game.future,
        self:game.players[0].data,
        opp:game.players[1].data
    });

    player2Socket.emit('playersReady',{
        board:game.board,
        future:game.future,
        self:game.players[1].data,
        opp:game.players[0].data
    })
}

server
    .use( server.router )
    .use( express.static(__dirname + '/public'))
    .get('/game', function(req, res) {
        var gid = randomString(8);
        games[gid] = new game();
        res.redirect('/game/' + gid);
    })
    .get('/game/*', function(req, res) {
        var gid = req.params[0];

        if (gid == '') {
            res.redirect('/game/');
        }

        if (games[gid]) {
            res.sendfile(__dirname + '/public/index.html');
        } else {
            games[gid] = new game();
            res.sendfile(__dirname + '/public/index.html');
        }
    });


server=server.listen(3000);

var io = require('socket.io');
var sockets = io.listen(server, {log : false});

sockets.on('connection', function (socket) {
    players[socket.id] = {
        socket:socket,
        opponent:null,
    }

    socket.emit('game', socket.id);

    socket
        .on('game', function(data) {
            var game = games[data.game];

            if (game.players.length <= 1) {
                player = {
                    data: {
                        name:data.name,
                        class:data.class,
                        maxHp:20,
                        hp:15,
                        selectors:5,
                        resources:[0,0,0,0,0,0],
                        death:0.75,
                        forceTimer:5000,
                        forcePenality:1
                    },
                    socket:players[data.player].socket,
                    socketid:data.player
                }

                game.players.push(player);

                if (game.players.length == 2) {
                    players[game.players[0].socketid].opponent = players[game.players[1].socketid];
                    players[game.players[1].socketid].opponent = players[game.players[0].socketid];
                    broadcastGame(data.game);
                }
            } else {
                //spectators
            }
        })
        .on('mouseover', function(data) {
            var opp = players[data.id].opponent;
            opp.socket.emit('oppover',{row:data.content.row,col:data.content.col})
        })
});