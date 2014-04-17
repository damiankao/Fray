(function() {
	tileStyle = function(i) {
			if (i == 0) return '#A64949';
			else if (i == 1) return '#969696';
			else if (i == 2) return '#4D62A3';
			else if (i == 3) return '#468A6A';
			else if (i == 4) return '#F2CE00';
			else if (i == 5) return '#8A5796';
		};

	board = function(e, w, h, x, y) {
		var base = {};

		var _node = e;
		var _game;
		var _data;

		var _ui = {
			tiles:null,
			cursor:e.append('div'),
			oppCursor:null
		}

		//environmental
		var _direction = 0;
		var _delay;
		var _width = w;
		var _height = h;
		var _x = x;
		var _y = y;
		var _rows;
		var _cols;
		var _tileLength;
		var _tileSpacing = 3;
		var _forceHarvest = false;

		base.init = function(data, game) {
			//_data.tiles = [{row:0,col:0,type:0,round:0,conditions:[]},{},{}...]
			//_data.grid = 
			//[[{row:0,col:0,type:0,round:0,conditions:[]},{},{}],
			// [{},{},{}],
			// [{},{},{}]]

			e
				.style('position','absolute')
				.style('width',_width)
				.style('height',_height)
				.style('top',_y)
				.style('left',_x);

			_data = data;
			_game = game;

			_rows = _data.board.grid.length;
			_cols = _data.board.grid[0].length;
			_tileLength = w / _cols;

			_ui.tiles =_node
				.selectAll('div.tile')
				.data(_data.board.tiles);
			
			_ui.tiles.enter().append('div.tile');
			_ui.tiles.exit().remove();

			_ui.tiles
				.style('position','absolute')
				.style('font-size','14pt')
				.style('font-weight','bold')
				.style('line-height',_tileLength - _tileSpacing * 2 + 'px')
				.style('text-align','center')
				.style('font-family','Arial')
				.style('color','white')
				.style('width', _tileLength - _tileSpacing * 2)
				.style('height', _tileLength - _tileSpacing * 2)
				.style('opacity',0)
				.style('background', function(d, i) {
					return tileStyle(d.type);
				})
				.style('top',-50)
				.style('left', function(d, i) {
					return _tileSpacing + d.col * _tileLength;
				})
				.style('border-radius',5)
				.on('mouseover', function(d, i) {
					document.body.style.cursor = 'pointer';
					_ui.cursor
						.style('top',d.row * _tileLength - _tileSpacing) 
						.style('left',d.col * _tileLength - _tileSpacing)
						.style('opacity',1);
				})
				.on('mouseout', function() {
					document.body.style.cursor = 'default';
					_ui.cursor
						.style('opacity',0);
				})
				.on('click', function(d, i) {
					if (d.selected) {
						d.selected = 0;
						_data.self.selectorsUsed--;
					} else {
						if (_data.self.selectorsUsed < _data.self.selectors) {
							_data.self.selectorsUsed++;
							d.selected = 'O';
						}
					}
					base.render();
				});

			_delay = 500 / _data.board.tiles.length;

			_ui.cursor
				.style('position','absolute')
				.style('width', _tileLength)
				.style('height', _tileLength)
				.style('opacity',0)
				.style('background', '#3B3B3B')
				.style('border-radius',7);

			return base;
		};

		base.render = function(cb, wait) {
			function endall(transition, callback) { 
			    var n = 0; 
			    transition 
			        .each(function() { ++n; }) 
			        .each("end", function() {
			        	if (!--n) {
			        		callback.apply(this, arguments); 
			        	}
			        }); 
			} 

			var inc = 0;
			_ui.tiles
				.style('top', function(d, i) {
					if (d.remove) {
						if (_direction == 0) {
							return -_rows * _tileLength;
						}
					}

					return d3.select(this).style('top');
				})
				.style('left', function(d, i) {
					return d3.select(this).style('left');
				})
				.style('opacity', function(d, i) {
					if (d.remove) {
						return 0;
					}

					return 1;
				})
				.style('background', function(d, i) {
					return tileStyle(d.type);
				})
				.text(function(d, i) {
					if (d.selected) {
						return d.selected;
					}
				})
				.transition()
				.duration(200)
				.delay(function(d, i) {
					if (d.remove) inc += _delay;
					
					return inc;
				})
				.style('top', function(d, i) {
					return d.row * _tileLength;
				})
				.style('left', function(d, i) {
					return d.col * _tileLength;
				})
				.style('opacity',1)
				.each(function(d, i) {
					d.remove = false;
				})
				.transition()
				.call(endall, function() { 
					if (cb) {
						window.setTimeout(cb, wait);
					};
				});
		}

		base.action = {
			break: function() {
				for (var i = 0 ; i < _data.board.tiles.length ; i ++ ) {
					var tile = _data.board.tiles[i];
					if (tile.selected) {
						tile.remove = true;
						tile.selected = 0;
					}
				}
				_data.self.selectorsUsed = 0;
				_forceHarvest = true;
				base.harvest();
			},
		};

		base.match = function() {
			var coords = [];

			var _currentStreak = [];
			var _currentMatch = -1;
			for ( var row = 0 ; row < _rows ; row++ ) {
				_currentStreak = [];
				_currentMatch = -1;
				for ( var col = 0 ; col < _cols ; col++ ) {
					var data = _data.board.grid[row][col].type;
					if (_currentMatch != data) {
						if (_currentStreak.length >= 3) {
							coords = coords.concat(_currentStreak);
						} 

						_currentStreak = [];
						_currentStreak.push([row, col]);
						_currentMatch = data;
					} else {
						_currentStreak.push([row, col]);
					}
				}
				if (_currentStreak.length >= 3) {
					coords = coords.concat(_currentStreak);
				} 
			}

			for ( var col = 0 ; col < _cols ; col++ ) {
				_currentStreak = [];
				_currentMatch = -1;
				for ( var row = 0 ; row < _rows ; row++ ) {
					var data = _data.board.grid[row][col].type;
					if (_currentMatch != data) {
						if (_currentStreak.length >= 3) {
							coords = coords.concat(_currentStreak);
						} 

						_currentStreak = [];
						_currentStreak.push([row, col]);
						_currentMatch = data;
					} else {
						_currentStreak.push([row, col]);
					}
				}
				if (_currentStreak.length >= 3) {
					coords = coords.concat(_currentStreak);
				}
			}

			base.set(coords, 'remove', true);

			return coords;
		};

		base.set = function(coords, prop, val) {
			for (var i = 0 ; i < coords.length ; i ++ ) {
				_data.board.grid[coords[i][0]][coords[i][1]][prop] = val;
			}

			return base;
		}

		base.round = function(val) {
			for (var i = 0 ; i < _data.board.tiles.length ; i ++ ) {
				_data.board.tiles[i].round += val;
			}

			return base;
		}

		base.setRound = function(r) {
			for (var i = 0 ; i < _data.board.tiles.length ; i ++ ) {
				_data.board.tiles[i].round = r[i];
			}

			return base;
		}

		base.swap = function(rowA, colA, rowB, colB) {
			var tempData = _data.board.grid[rowA][colA];
			tempData.row = rowB;
			tempData.col = colB;

			_data.board.grid[rowB][colB].row = rowA;
			_data.board.grid[rowB][colB].col = colA;

			_data.board.grid[rowA][colA] = _data.board.grid[rowB][colB];
			_data.board.grid[rowB][colB] = tempData;
		};

		base.resolve = function(record) {
			if (_direction == 0) {
				for (var col = 0 ; col < _cols ; col ++ ) {
					var step = 0;
					for (var row = _rows - 1 ; row >= 0 ; row -- ) {
						var data = _data.board.grid[row][col];

						if (data.remove) {
							step += 1;
							_data.self.resources[data.type] += 1;
							var newStyle = _data.board.future.pop();
							record.push(['type', row, col, data.type, newStyle])
							data.type = newStyle;
							_game.dashRender();
						} else {
							if (step > 0) {
								record.push(['swap', row, col, row + step, col]);
								base.swap(row, col, row + step, col);
							}
						}
					}
				}
			}
		}

		base.harvest = function(cb) {
			var matchCount = 0;
			var match;
			var record = [];
			var rounds = [];
			for (var i = 0 ; i < _data.board.tiles.length ; i ++ ) {
				rounds.push(_data.board.tiles[i].round);
			}

			function run() {
				match = base.match();
				if (match.length > 0 || _forceHarvest) {
					_forceHarvest = false;
					matchCount += match.length;
					base.resolve(record);
					base.render(run, 100);
					base.round(1);
				} else {
					_data.board.history.push(['harvest', rounds, record]);
					if (cb) cb();
				}
			}
			
			run();
			return base;
		};

		base.unharvest = function() {
			var lastHarvest = _data.board.history[_data.board.history.length - 1][2];
			var rounds = _data.board.history[_data.board.history.length - 1][1];
			var future = [];

			for (var i = lastHarvest.length - 1 ; i >= 0; i -- ) {
				var action = lastHarvest[i];
				if (action[0] == 'swap') {
					base.swap(action[3],action[4],action[1],action[2]);
				} else if (action[0] == 'type') {
					var data = _data.board.grid[action[1]][action[2]];
					future.push(action[4]);
					data.type = action[3];
					data.round += action[4];
				}
			}

			for ( var i = 0 ; i < future.length ; i ++ ) {
				_data.board.future.push(future[i]);	
			}

			base.setRound(rounds);
			base.render();
			return base;
		};

		return base;
	}

	dash = function(e, w, h, x, y) {
		var base = {};

		var _node = e;
		var _game;
		var _data;
		var _player;

		var _width = w;
		var _height = h;
		var _x = x;
		var _y = y;

		var _ui = {
			title : {
				label:e.append('div'),
				value:e.append('div')
			},
			hp : {
				bar:e.append('div'),
				fill:e.append('div'),
				value:e.append('div')
			},
			selectors : {},
			forceTimer : {},
			forcePenalty : {},
			death : {},
			conditions : {},
			resources : null,
			resourcesValues: null,
			advance: e.append('div')
		};

		base.init = function(data, game, player) {
			_data = data;
			_player = player;

			_node
				.style('position','absolute')
				.style('width', _width)
				.style('height', _height)
				.style('top', _y)
				.style('left', _x);

			_ui.advance
				.style('position','absolute')
				.style('width',150)
				.style('height',30)
				.style('top',_height - 40)
				.style('left',_width / 2 - 75)
				.style('background','#3D3D3D')
				.style('color','white')
				.style('font-family','Arial')
				.style('text-align','center')
				.style('line-height','30px')
				.style('font-size','16pt')
				.style('border-radius',5)
				.html('R E A D Y')
				.on('click', function() {
					game.action('break');
				});

			_ui.resources = _node
				.selectAll('div.resources')
				.data(_data.self.resources)
				.enter()
				.append('div.resources')
				.style('width',20)
				.style('height',20)
				.style('position','absolute')
				.style('border-radius',5)
				.style('left', function(d, i) {
					if (i > 2 == 0) {
						return 20;
					} else {
						return 150;
					}
				})
				.style('top',function(d, i) {
					return (_height - 150) + (i % 3) * 30;
				})
				.style('background', function(d, i) {
					return tileStyle(i);
				});

			_ui.resourcesValues = _node
				.selectAll('div.resourcesValue')
				.data(_data[_player].resources)
				.enter()
				.append('div.resourcesValue')
				.style('width',20)
				.style('height',20)
				.style('position','absolute')
				.style('left',47)
				.style('font-family','Arial')
				.style('font-size','14pt')
				.style('left', function(d, i) {
					if (i > 2 == 0) {
						return 50;
					} else {
						return 180;
					}
				})
				.style('top',function(d, i) {
					return (_height - 150) + (i % 3) * 30;
				})
				.text(function(d,i) {
					return d;
				});
				
			if (_player == 'opp') base.opp();

			return base;
		};

		base.opp = function() {
			_ui.advance
				.style('display','none');

			return base;
		}

		base.render = function() {
			_ui.resourcesValues
				.data(_data[_player].resources)
				.text(function(d, i) {
					return d;
				})

		};

		return base;
	}

	game = function(e) {
		var base = {};

		var _node = e;
		var _socket;
		var _gid;
		var _sid;

		var _self;
		var _opp;
		var _board;
		var _data = {
			board:null,
			self:null,
			opp:null,
			future:null
		}

		var _ui = {
			board:null,
			selfDash:null,
			oppDash:null,
		};

		base.init = function(d, socket, gameID) {
			var w = window.innerWidth;
			var h = window.innerHeight;

			var boardLength = Math.min(w - 650, h - 100);
			var boardX = w / 2 - (boardLength / 2);

			/*
			_socket = socket;
			_gid = gameID;
			socket.emit('initialize', {});
			socket
				.on('initialize', function(data) {
					//server creates game, player
					_sid = data.sid;
					_data.self = data.self;
				})
				.on('gameReady', function(data) {
					//server creates opponent, readies game
					_data.opp = data.opp;
					_data.board = data.board;

					_ui.board = board(e.append('div'), boardLength, boardLength, boardX, 50)
						.init(_data, base);

					_ui.selfDash = dash(e.append('div'), 300, h - 100, boardX - 300, 50)
						.init(_data, base);

					_ui.oppDash = dash(e.append('div'), 300, h - 100, boardX + boardLength, 50)
						.init(_data, base);
				})
				.on('roundReady', function(data) {
					//server receives round ready from player
					//responds with harvest stats
					var matched = _ui.board.match;

				})
				.on('force', function(data) {
					//opponent forced player
				})
				.on('instant', function(data){ 
					//opponent or player used an instant skill
					//data is player and opponent data

				});

			//base.give('activate',{skill:'name'})
			//base.give('ready','')
			//base.give('force','')
			*/

			_data = d;
			_ui.board = new board(_node.append('div'), boardLength, boardLength, boardX, 50)
				.init(_data, base);

			_ui.selfDash = new dash(_node.append('div'), 300, h - 100, boardX - 330, 50)
				.init(_data, base, 'self');

			_ui.oppDash = new dash(_node.append('div'), 300, h - 100, boardX + boardLength, 50)
				.init(_data, base, 'opp');

			_ui.board.render(_ui.board.harvest, 100);
			_ui.board.round(1);
			return base;
		};

		base.render = function() {
			_ui.board.render();
			_ui.selfDash.render();

			return base;
		};

		base.dashRender = function() {
			_ui.selfDash.render();

			return base;
		}

		base.action = function(act) {
			_ui.board.action[act]();

			return base;
		}

		base.history = function() {
			return _data.board.history;
		}

		base.give = function(evt, data) {
			_socket.emit(evt, {content:data, sid:_sid, gid:_gid});

			return base;
		};

		return base;
	}
})();