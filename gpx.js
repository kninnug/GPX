(function(root, factory){
	if(typeof module !== 'undefined'){
		module.exports = factory();
	}else{
		root.GPX = factory();
	}
})(this, function(){
	"use strict";

	const falsy = (o) => !o,
		truthy = (o) => !!o;

	function TrackPoint(opt){
		this.lat = opt.lat || null;
		this.lon = opt.lon || null;
		this.time = opt.time || null;
		this.speed = opt.speed || null;
		
		this.dist = opt.dist || null;
		this.dtime = opt.dtime || null;
		this.avgSpeed = opt.avgSpeed || null;
	}

	TrackPoint.fromXML = function(xml){
		xml = xml.trkpt ? xml.trkpt : xml;
		
		if(!xml.$ || !xml.$.lat || !xml.$.lon){
			return null;
		}
		
		return new TrackPoint({
			lat: +xml.$.lat,
			lon: +xml.$.lon,
			time: xml.time && new Date(xml.time[0]),
			speed: xml.extensions && xml.extensions.find((e) => !!e.speed).speed[0]
		});
	};

	TrackPoint.fromDOM = function(dom){
		if(dom.nodeName !== 'trkpt'){
			return null;
		}
		
		const lat = +dom.getAttributeNS(null, 'lat'),
			lon = +dom.getAttributeNS(null, 'lon'),
			timeEl = dom.getElementsByTagName('time'),
			time = timeEl && timeEl[0] && new Date(timeEl[0].textContent),
			extEl = dom.getElementsByTagName('extensions'),
			speedEl = extEl && extEl[0] && extEl[0].getElementsByTagName('speed'),
			speed = speedEl && speedEl[0] && +speedEl[0].textContent;
		
		return new TrackPoint({
			lat: lat,
			lon: lon,
			time: time,
			speed: speed
		});
	};

	// Source: http://www.movable-type.co.uk/scripts/latlong.html
	TrackPoint.prototype.distanceTo = function(to, radius){
		radius = (radius === null || radius === undefined) ? 6371e3 : +radius;
		
		function toRadians(n){
			return n * Math.PI / 180;
		}
		
		var R = radius;
		var φ1 = toRadians(this.lat), λ1 = toRadians(this.lon);
		var φ2 = toRadians(to.lat), λ2 = toRadians(to.lon);
		var Δφ = φ2 - φ1;
		var Δλ = λ2 - λ1;

		var a = Math.sin(Δφ/2) * Math.sin(Δφ/2)
				+ Math.cos(φ1) * Math.cos(φ2)
				* Math.sin(Δλ/2) * Math.sin(Δλ/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;

		return d;
	};

	function TrackSegment(opt){
		this.points = (Array.isArray(opt) ? opt : opt.points) || [];
	}

	TrackSegment.fromXML = function(xml){
		xml = xml.trkseg ? xml.trkseg : xml;
		var pt = xml.trkpt;
		
		if(!pt){
			return null;
		}
		
		return new TrackSegment(pt.map(TrackPoint.fromXML).filter(truthy));
	};

	TrackSegment.fromDOM = function(dom){
		if(dom.nodeName !== 'trkseg'){
			return null;
		}
		
		const children = Array.from(dom.childNodes)
				.map(TrackPoint.fromDOM)
				.filter(truthy);
		if(!children.length){
			return null;
		}
		
		return new TrackSegment(children);
	};

	TrackSegment.prototype.computeAverages = function(){
		if(!this.points.length){
			return null;
		}
		
		var prev = this.points[0];
		
		prev.dist = 0;
		prev.dtime = 0;
		prev.avgSpeed = 0.0;
		
		for(var i = 1; i < this.points.length; i++){
			var cur = this.points[i];
			
			const dist = prev.distanceTo(cur), // in meters
				time = (cur.time - prev.time) / 1000; // in sec
			
			cur.dist = dist;
			cur.dtime = time;
			cur.avgSpeed = dist / time;
			
			prev = cur;
		};
		
		return this;
	};

	TrackSegment.prototype.firstPoint = function(){
		if(!this.points.length){
			return null;
		}
		
		return this.points[0];
	};

	TrackSegment.prototype.lastPoint = function(){
		if(!this.points.length){
			return null;
		}
		
		return this.points[this.points.length - 1];
	};

	TrackSegment.prototype.totalDistance = function(radius){
		if(!this.points.length){
			return 0.0;
		}
		
		var prev = this.points[0];
		return this.points.reduce((acc, cur) => {
			const ret = acc + prev.distanceTo(cur, radius);
			prev = cur;
			return ret;
		}, 0.0);
	};
	
	TrackSegment.prototype.bbox = function(){
		const ret = {
			latMin: Infinity,
			latMax: -Infinity,
			lonMin: Infinity,
			lonMax: -Infinity
		};
		
		return this.points.reduce((acc, cur) => {
			return {
				latMin: Math.min(acc.latMin, cur.lat),
				latMax: Math.max(acc.latMax, cur.lat),
				lonMin: Math.min(acc.lonMin, cur.lon),
				lonMax: Math.max(acc.lonMax, cur.lon)
			}
		}, ret);
	};

	TrackSegment.prototype.timeInfo = function(){
		const ret = {
			start: Infinity,
			end: -Infinity
		};
		
		this.points.filter((p) => !!p.time).forEach((p) => {
			ret.start = ret.start > p.time ? p.time : ret.start;
			ret.end = ret.end < p.time ? p.time : ret.end;
		});
		
		return ret;
	};

	TrackSegment.prototype.speedInfo = function(){
		const ret = {
				moving: 0,
				still: 0,
				total: 0,
				min: Infinity,
				minAt: null,
				max: -Infinity,
				maxAt: null,
				sum: 0,
				avg: 0,
				avgMin: Infinity,
				avgMinAt: null,
				avgMax: -Infinity,
				avgMaxAt: null,
				avgSum: 0,
				avgAvg: 0
			};
		
		this.points.forEach((p) => {
			if(!p.speed){
				ret.still++;
				return;
			}
			
			ret.moving++;
			if(p.speed < ret.min){
				ret.min = p.speed;
				ret.minAt = p;
			}
			//ret.min = Math.min(ret.min, p.speed);
			if(p.speed > ret.max){
				ret.max = p.speed;
				ret.maxAt = p;
			}
			//ret.max = Math.max(ret.max, p.speed);
			ret.sum += +p.speed;
			if(p.avgSpeed < ret.avgMin){
				ret.avgMin = p.avgSpeed;
				ret.avgMinAt = p;
			}
			//ret.avgMin = Math.min(ret.avgMin, p.avgSpeed);
			if(p.avgSpeed > ret.avgMax){
				ret.avgMax = p.avgSpeed;
				ret.avgMaxAt = p;
			}
			//ret.avgMax = Math.max(ret.avgMax, p.avgSpeed);
			ret.avgSum += +p.avgSpeed;
		});
		
		ret.total = this.points.length;
		ret.avg = ret.sum / ret.moving;
		ret.avgAvg = ret.avgSum / ret.total;
		
		return ret;
	};

	function Track(opt){
		this.segments = (Array.isArray(opt) ? opt : opt.segments) || [];
	}

	Track.fromXML = function(xml){
		xml = xml.trk ? xml.trk : xml;
		var seg = xml.trkseg;
		
		if(!seg){
			return null;
		}
		
		return new Track(seg.map(TrackSegment.fromXML).filter(truthy));
	};

	Track.fromDOM = function(dom){
		if(dom.nodeName !== 'trk'){
			return null;
		}
		
		const children = Array.from(dom.childNodes)
				.map(TrackSegment.fromDOM)
				.filter(truthy);
		
		if(!children.length){
			return null;
		}
		
		return new Track(children);
	};

	Track.prototype.computeAverages = function(){
		this.segments.forEach((s) => s.computeAverages());
		return this;
	};

	Track.prototype.firstPoint = function(){
		if(!this.segments.length){
			return null;
		}
		
		return this.segments[0].firstPoint();
	};

	Track.prototype.lastPoint = function(){
		if(!this.segments.length){
			return null;
		}
		
		return this.segments[this.segments.length - 1].lastPoint();
	}

	Track.prototype.totalDistance = function(radius){
		return this.segments.reduce((a, b) => 
			a + b.totalDistance(radius)
		, 0.0);
	};

	Track.prototype.totalPoints = function(){
		return this.segments.reduce((a, b) => a + b.points.length, 0);
	};
	
	Track.prototype.bbox = function(){
		const ret = {
			latMin: Infinity,
			latMax: -Infinity,
			lonMin: Infinity,
			lonMax: -Infinity
		};
		
		return this.segments.reduce((acc, cur) => {
			const bbox = cur.bbox();
			return {
				latMin: Math.min(acc.latMin, bbox.latMin),
				latMax: Math.max(acc.latMax, bbox.latMax),
				lonMin: Math.min(acc.lonMin, bbox.lonMin),
				lonMax: Math.max(acc.lonMax, bbox.lonMax)
			}
		}, ret);
	};

	Track.prototype.timeInfo = function(){
		const ret = {
			start: Infinity,
			end: -Infinity
		};
		
		this.segments.forEach((p) => {
			const ti = p.timeInfo();
			ret.start = ret.start > ti.start ? ti.start : ret.start;
			ret.end = ret.end < ti.end ? ti.end : ret.end;
		});
		
		return ret;
	};

	Track.prototype.speedInfo = function(){
		return this.segments.reduce((a, b) => {
			const ti = b.speedInfo();
			var min = a.min, max = a.max, minAt = a.minAt, maxAt = a.maxAt,
				avgMin = a.avgMin, avgMax = a.avgMax, avgMinAt = a.avgMinAt,
				avgMaxAt = a.avgMaxAt;
			
			if(ti.min < a.min){
				min = ti.min;
				minAt = ti.minAt;
			}
			if(ti.max > a.max){
				max = ti.max;
				maxAt = ti.maxAt;
			}
			if(ti.avgMin < a.avgMin){
				avgMin = ti.avgMin;
				avgMinAt = ti.avgMinAt;
			}
			if(ti.avgMax > a.avgMax){
				avgMax = ti.avgMax;
				avgMaxAt = ti.avgMaxAt;
			}
			
			return {
				moving: a.moving + ti.moving,
				still: a.still + ti.still,
				total: a.total + ti.total,
				min: min,
				minAt: minAt,
				max: max,
				maxAt: maxAt,
				sum: a.sum + ti.sum,
				avg: (a.sum + ti.sum) / (a.moving + ti.moving),
				avgMin: avgMin,
				avgMinAt: avgMinAt,
				avgMax: avgMax,
				avgMaxAt: avgMaxAt,
				avgSum: a.avgSum + ti.avgSum,
				avgAvg: (a.avgSum + ti.avgSum) / (a.total + ti.total)
			};
		}, {
			moving: 0,
			still: 0,
			total: 0,
			min: Infinity,
			minAt: null,
			max: -Infinity,
			maxAt: null,
			sum: 0,
			avg: 0,
			avgMin: Infinity,
			avgMinAt: null,
			avgMax: -Infinity,
			avgMaxAt: null,
			avgSum: 0,
			avgAvg: 0
		});
	};
	
	return {
		TrackPoint: TrackPoint,
		TrackSegment: TrackSegment,
		Track: Track
	};
});
