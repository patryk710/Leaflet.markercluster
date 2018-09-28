
L.DistanceGrid = function (cellSize) {
	this._cellSize = cellSize;
	this._sqCellSize = cellSize * cellSize;
	this._grid = {};
	this._objectPoint = { };
};

L.DistanceGrid.prototype = {

	addObject: function (obj, point) {
		var x = this._getCoord(point.x),
		    y = this._getCoord(point.y),
		    grid = this._grid,
		    row = grid[y] = grid[y] || {},
		    cell = row[x] = row[x] || [],
		    stamp = L.Util.stamp(obj);

		this._objectPoint[stamp] = point;

		cell.push(obj);
	},

	updateObject: function (obj, point) {
		this.removeObject(obj);
		this.addObject(obj, point);
	},

	//Returns true if the object was found
	removeObject: function (obj, point) {
		var x = this._getCoord(point.x),
		    y = this._getCoord(point.y),
		    grid = this._grid,
		    row = grid[y] = grid[y] || {},
		    cell = row[x] = row[x] || [],
		    i, len;

		delete this._objectPoint[L.Util.stamp(obj)];

		for (i = 0, len = cell.length; i < len; i++) {
			if (cell[i] === obj) {

				cell.splice(i, 1);

				if (len === 1) {
					delete row[x];
				}

				return true;
			}
		}

	},

	eachObject: function (fn, context) {
		var i, j, k, len, row, cell, removed,
		    grid = this._grid;

		for (i in grid) {
			row = grid[i];

			for (j in row) {
				cell = row[j];

				for (k = 0, len = cell.length; k < len; k++) {
					removed = fn.call(context, cell[k]);
					if (removed) {
						k--;
						len--;
					}
				}
			}
		}
	},

	getNearObject: function (point, voivodeship, county, zoom) {
		var x = this._getCoord(point.x),
		    y = this._getCoord(point.y),
		    i, j, k,
		    l = false,
		    row, cell, len, obj, dist,
		    objectPoint = this._objectPoint,
		    closestDistSq = this._sqCellSize,
		    closest = null,
		    filter;

		for (i = y - 1; i <= y + 1; i++) {
			row = this._grid[i];
			if (row) {

				for (j = x - 1; j <= x + 1; j++) {
					cell = row[j];
					if (cell) {

						for (k = 0, len = cell.length; k < len; k++) {
							obj = cell[k];
							dist = this._sqDist(objectPoint[L.Util.stamp(obj)], point);
							if (zoom < 5 && (dist < closestDistSq || 
									 dist <= closestDistSq && closest === null)) {
								closestDistSq = dist;
								closest = obj;
								continue;
							}
							if (zoom > 8) {
							    l = this._findAChildByCounty(obj);
							    filter = county;
							} else {
							    l = this._findAChildByVoivodeship(obj);
							    filter = voivodeship;
							}
							if (l === filter && dist < closestDistSq ||
							    		l === filter && dist <= closestDistSq && closest === null) {
								closestDistSq = dist;
								closest = obj;
								l = false;
							}
						}
					}
				}
			}
		}
		return closest;
	},

    _findAChildByVoivodeship: function (obj) {
        if (obj.options.voivodeship) {
            return obj.options.voivodeship;
        } else if (obj._markers.length > 0) {
            return this._findAChildByVoivodeship(obj._markers[0]);
        } else {
            return this._findAChildByVoivodeship(obj._childClusters[0]);
        }
    },

    _findAChildByCounty: function (obj) {
        if (obj.options.county) {
            return obj.options.county;
        } else if (obj._markers.length > 0) {
            return this._findAChildByCounty(obj._markers[0]);
        } else {
            return this._findAChildByCounty(obj._childClusters[0]);
        }
    },

	_getCoord: function (x) {
		var coord = Math.floor(x / this._cellSize);
		return isFinite(coord) ? coord : x;
	},

	_sqDist: function (p, p2) {
		var dx = p2.x - p.x,
		    dy = p2.y - p.y;
		return dx * dx + dy * dy;
	}
};
