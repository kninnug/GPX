"use strict";

const elControls = document.getElementById('controls'),
	elFile = document.getElementById('file'),
	elCntMain = document.getElementById('cnt-main'),
	elInfTrack = document.getElementById('inf-track'),
	elInfPoint = document.getElementById('inf-point'),
	elTracks = document.getElementById('tracks'),
	elPoints = document.getElementById('points'),
	elFlip = document.getElementById('btn-flip'),
	elFit = document.getElementById('btn-fit'),
	
	elPntMin = document.getElementById('pnt-min'),
	elPntMax = document.getElementById('pnt-max'),
	elPntAvgMin = document.getElementById('pnt-avgMin'),
	elPntAvgMax = document.getElementById('pnt-avgMax'),
	
	formatters = {
		duration: (t) => {
			const d = new Date(null);
			d.setSeconds(t);
			return d.toISOString().substr(11, 8);
		},
		time: (d) => d.toISOString().substr(11, 8),
		sec: (t) => t + 'sec',
		date: (d) => {
			const iso = d.toISOString();
			return iso.substr(0, 10) + ' ' + iso.substr(11, 8);
		},
		speed: (s) => (s * 3.6).toPrecision(3) + 'km/h',
		dist: (d) => {
			if(d > 1000){
				return (d / 1000).toPrecision(3) + 'km';
			}
			return d.toPrecision(3) + 'm';
		},
		latLng: (l) => l.toPrecision(5)
	},
	
	tplTrack = new PicoTemplate({root: elInfTrack, fmts: formatters}),
	tplPoint = new PicoTemplate({root: elInfPoint, fmts: formatters}),
	inpControls = new PicoInput({root: elControls}),
	map = L.map('map').setView([53.209528110259136, 6.552314758300782], 11);

var tracks = [], polyLine = [], polyBounds = null, pointPoint = null,
	timeInfo = null, speedInfo = null, colorOpts = {revert: false, invert: false,
			map: Colour.maps.rainbow, bands: false};

function clamp(value, min, max){
	return Math.max(min, Math.min(max, value));
}

function rainbow(value){
	const ret = {r: 0, g: 0, b: 0},
		dx = 0.8;
	
	value = clamp(value, 0.0, 1.0);
	value = (6.0 - 2.0 * dx) * value + dx;
	
	ret.r = Math.max(0.0, (3.0-Math.abs(value-4.0) - Math.abs(value-5.0))/2.0) * 255;
	ret.g = Math.max(0.0, (4.0-Math.abs(value-2.0) - Math.abs(value-4.0))/2.0) * 255;
	ret.b = Math.max(0.0, (3.0-Math.abs(value-1.0) - Math.abs(value-2.0))/2.0) * 255;
	
	return ret;
}

cmrdbu.red = function(x) {
	if (x < 0.09771832105856419) {
		return 7.60263247863246E+02 * x + 1.02931623931624E+02;
	} else if (x < 0.3017162107441106) {
		return (-2.54380938558548E+02 * x + 4.29911571188803E+02) * x + 1.37642085716717E+02;
	} else if (x < 0.4014205790737471) {
		return 8.67103448276151E+01 * x + 2.18034482758611E+02;
	} else if (x < 0.5019932233215039) {
		return -6.15461538461498E+01 * x + 2.77547692307680E+02;
	} else if (x < 0.5969483882550937) {
		return -3.77588522588624E+02 * x + 4.36198819698878E+02;
	} else if (x < 0.8046060096654594) {
		return (-6.51345897546620E+02 * x + 2.09780968434337E+02) * x + 3.17674951640855E+02;
	} else {
		return -3.08431855203590E+02 * x + 3.12956742081421E+02;
	}
};

cmrdbu.green = function(x) {
	if (x < 0.09881640500975222) {
		return 2.41408547008547E+02 * x + 3.50427350427364E-01;
	} else if (x < 0.5000816285610199) {
		return ((((1.98531871433258E+04 * x - 2.64108262469187E+04) * x + 1.10991785969817E+04) * x - 1.92958444776211E+03) * x + 8.39569642882186E+02) * x - 4.82944517518776E+01;
	} else if (x < 0.8922355473041534) {
		return (((6.16712686949223E+03 * x - 1.59084026055125E+04) * x + 1.45172137257997E+04) * x - 5.80944127411621E+03) * x + 1.12477959061948E+03;
	} else {
		return -5.28313797313699E+02 * x + 5.78459299959206E+02;
	}
};

cmrdbu.blue = function(x) {
	if (x < 0.1033699568661857) {
		return 1.30256410256410E+02 * x + 3.08518518518519E+01;
	} else if (x < 0.2037526071071625) {
		return 3.38458128078815E+02 * x + 9.33004926108412E+00;
	} else if (x < 0.2973267734050751) {
		return (-1.06345054944861E+02 * x + 5.93327252747168E+02) * x - 3.81852747252658E+01;
	} else if (x < 0.4029109179973602) {
		return 6.68959706959723E+02 * x - 7.00740740740798E+01;
	} else if (x < 0.5006715489526758) {
		return 4.87348695652202E+02 * x + 3.09898550724286E+00;
	} else if (x < 0.6004396902588283) {
		return -6.85799999999829E+01 * x + 2.81436666666663E+02;
	} else if (x < 0.702576607465744) {
		return -1.81331701891043E+02 * x + 3.49137263626287E+02;
	} else if (x < 0.9010407030582428) {
		return (2.06124143164576E+02 * x - 5.78166906665595E+02) * x + 5.26198653917172E+02;
	} else {
		return -7.36990769230737E+02 * x + 8.36652307692262E+02;
	}
};

function cmrdbu(x) {
	x = 1 - x;
	var r = clamp(cmrdbu.red(x), 0.0, 255);
	var g = clamp(cmrdbu.green(x), 0.0, 255);
	var b = clamp(cmrdbu.blue(x), 0.0, 255);
	return {r: r, g: g, b: b};
}

seismic.f = function(x) {
    return ((-2010.0 * x + 2502.5950459) * x - 481.763180924) / 255.0;
};

seismic.red = function(x) {
    if (x < 0.0) {
        return 3.0 / 255.0;
    } else if (x < 0.238) {
        return ((-1810.0 * x + 414.49) * x + 3.87702) / 255.0;
    } else if (x < 51611.0 / 108060.0) {
        return (344441250.0 / 323659.0 * x - 23422005.0 / 92474.0) / 255.0;
    } else if (x < 25851.0 / 34402.0) {
        return 1.0;
    } else if (x <= 1.0) {
        return (-688.04 * x + 772.02) / 255.0;
    } else {
        return 83.0 / 255.0;
    }
};

seismic.green = function(x) {
    if (x < 0.0) {
        return 0.0;
    } else if (x < 0.238) {
        return 0.0;
    } else if (x < 51611.0 / 108060.0) {
        return seismic.f(x);
    } else if (x < 0.739376978894039) {
        var xx = x - 51611.0 / 108060.0;
        return ((-914.74 * xx - 734.72) * xx + 255.) / 255.0;
    } else {
        return 0.0;
    }
};

seismic.blue = function(x) {
    if (x < 0.0) {
        return 19.0 / 255.0;
    } else if (x < 0.238) {
        var xx = x - 0.238;
        return (((1624.6 * xx + 1191.4) * xx + 1180.2) * xx + 255.0) / 255.0;
    } else if (x < 51611.0 / 108060.0) {
        return 1.0;
    } else if (x < 174.5 / 256.0) {
        return (-951.67322673866 * x + 709.532730938451) / 255.0;
    } else if (x < 0.745745353439206) {
        return (-705.250074130877 * x + 559.620050530617) / 255.0;
    } else if (x <= 1.0) {
        return ((-399.29 * x + 655.71) * x - 233.25) / 255.0;
    } else {
        return 23.0 / 255.0;
    }
};

function seismic(x) {
    return {r: seismic.red(x) * 255, 
			g: seismic.green(x) * 255, 
			b: seismic.blue(x) * 255};
}

function clrToString(clr){
	return clr ? 'rgb('+(clr.r | 0)+','+(clr.g | 0)+','+(clr.b | 0)+')' : 'transparent';
}

function fade(elm){
	const time = 100,
		orig = elm.style.backgroundColor;
	var rat = 5;
	
	setTimeout(function doFade(){
		const clr = ((rat / 10) * 255) | 0;
		elm.style.backgroundColor = 'rgb('+clr+','+clr+','+clr+')';
		rat--;
		
		if(rat){
			setTimeout(doFade, time);
		}else{
			elm.style.backgroundColor = orig;
		}
	}, time);
}

function scrollToPnt(id){
	const elm = document.getElementById(id);
	elm.scrollIntoView();
	fade(elm);
}

function handleTrackClick(evt){
	console.log(evt);
	scrollToPnt(evt.target.tgtId);
}

function showTrack(track, opt){
	polyLine.forEach((p) => map.removeLayer(p));
	/*
	const bounds = L.latLngBounds([]),
		lines = track.segments.map((seg) => {
			const ret = L.polyline(seg.points.map((p) => [p.lat, p.lon]));
			
			bounds.extend(ret.getBounds());
			return ret;
		});
	*/
	
	polyLine = [];
	polyBounds = L.latLngBounds([]);
	
	track.segments.forEach((seg, i) => {
		seg.points.slice(1).reduce((a, b, j) => {
			const spd = b.speed ? (b.speed / speedInfo.max) : (b.avgSpeed / speedInfo.avgMax),
				clr = Colour.toRGBString(Colour.colourize(spd, colorOpts)),
				lin = L.polyline([[a.lat, a.lon], [b.lat, b.lon]], {color: clr});
			
			lin.tgtId = 'pnt-'+i+'-'+j;
			lin.on('click', handleTrackClick);
			polyBounds.extend(lin.getBounds());
			polyLine.push(lin);
			map.addLayer(lin);
			
			return b;
		}, seg.points[0]);
	});
	
	fitTrack();
}

function showPoint(point){
	if(!pointPoint){
		pointPoint = L.circle([point.lat, point.lon], {color: 'red', radius: 5}).addTo(map);
	}
	pointPoint.setLatLng([point.lat, point.lon]);
	
	map.setView([point.lat, point.lon], 18);
	tplPoint.set(point);
}

function showPoints(track){
	elPoints.innerHTML = '';
	
	track.segments.forEach((seg, i) => seg.points.forEach((p, j) => {
		const el = document.createElement('tr'),
			spd = p.speed ? (p.speed / speedInfo.max) : (p.avgSpeed / speedInfo.avgMax),
			clr = Colour.toRGBString(Colour.colourize(spd, colorOpts));
		el.classList.add('li-point');
		el.id = 'pnt-'+i+'-'+j;
		
		el.innerHTML = '<td>' + formatters.latLng(p.lat) + 
				' ' + formatters.latLng(p.lon) + ' @ ' + formatters.time(p.time) + 
				' : ' + formatters.speed(p.speed || p.avgSpeed) +
				'</td><td style="background-color: ' + clr + '"></td>';
		el.addEventListener('click', showPoint.bind(null, p), false);
		
		elPoints.appendChild(el);
	}));
}

function selectTrack(idx){
	elTracks.value = idx;
	
	const track = tracks[idx];
	timeInfo = track.timeInfo();
	speedInfo = track.speedInfo();
	const dist = track.totalDistance(),
		time = (timeInfo.end - timeInfo.start) / 1000,
		totalAvg = dist / time,
		data = {
			points: track.totalPoints(),
			dist: dist,
			time: time,
			totalAvg: totalAvg
		};
	
	tplTrack.set(data).set(timeInfo).set(speedInfo);
	
	elPntMin.onclick = showPoint.bind(null, speedInfo.minAt);
	elPntMax.onclick = showPoint.bind(null, speedInfo.maxAt);
	elPntAvgMin.onclick = showPoint.bind(null, speedInfo.avgMinAt);
	elPntAvgMax.onclick = showPoint.bind(null, speedInfo.avgMaxAt);
	
	showTrack(track);
	showPoints(track);
}

function generateTrack(xml, name){
	const rootChildren = xml.documentElement.childNodes,
		next = tracks.length,
		nw = Array.from(rootChildren)
			.filter((n) => n.nodeName === 'trk')
			.map((n) => {
				const t = GPX.Track.fromDOM(n).computeAverages();
				t.name = name;
				return t;
			});
	
	tracks = tracks.concat(nw);
	
	elTracks.innerHTML = '';
	tracks.forEach((t, idx) => {
		const el = document.createElement('option');
		el.value = idx;
		el.innerHTML = 'Track ' + idx + '#' + t.name;
		elTracks.appendChild(el);
	});
	
	if(tracks.length){
		selectTrack(next);
	}
}

function parseXML(text, name){
	const parser = new DOMParser(),
		xml = parser.parseFromString(text, "text/xml");
	
	generateTrack(xml, name);
	//document.getElementById('debug').innerHTML = JSON.stringify(toGeoJSON.gpx(xml), null, '\t');
}

function handleFile(file){
	const reader = new FileReader();
	
	reader.onloadend = function(evt){
		parseXML(evt.target.result, file.name);
	};
	
	reader.readAsText(file);
}

function fitTrack(){
	if(!polyBounds){
		return;
	}
	map.fitBounds(polyBounds);
}

function flipVert(){
	elCntMain.classList.toggle('vert');
	map.invalidateSize();
	fitTrack();
}

elFile.addEventListener('change', function(){
	if(elFile.files.length > 0){
		//handleFile(elFile.files[0]);
		Array.from(elFile.files).forEach(handleFile);
	}
}, false);

elTracks.addEventListener('change', function(evt){
	selectTrack(evt.target.value);
}, false);

elFlip.addEventListener('click', flipVert, false);
elFit.addEventListener('click', fitTrack, false);

L.tileLayer.grayscale('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
	minZoom: 8
}).addTo(map);
