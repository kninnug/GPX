const fs = require('fs'),
	util = require('util'),
	xml2js = require('xml2js'),
	parser = new xml2js.Parser({
		trim: true,
		normalize: true,
		async: true
	}),
	GPX = require('./gpx.js'),
	TrackPoint = GPX.TrackPoint,
	TrackSegment = GPX.TrackSegment,
	Track = GPX.Track,
	show = {
		rescale: (val, scales, pres) => {
			const scale = scales.find((s) => val > s.val);
			if(!scale){
				return val.toPrecision(pres);
			}
			return (val / (scale.val || 1)).toPrecision(pres) + scale.suffix;
		},
		time: (t) => {
			/*const scales = [
				{val: 60 * 60 * 24, suffix: 'days'},
				{val: 60 * 60, suffix: 'hours'},
				{val: 60, suffix: 'min'},
				{val: 0, suffix: 'sec'}
			];
			return show.rescale(t, scales, 3);*/
			const d = new Date(null);
			d.setSeconds(t);
			return d.toISOString().substr(11, 8);
		},
		distance: (d) => {
			const scales = [
				{val: 1000, suffix: 'km'},
				{val: 0, suffix: 'm'}
			];
			return show.rescale(d, scales, 3);
		},
		speed: (s) => {
			return (s * 3.6).toPrecision(3) + 'km/h';
		}
	};

var fileName = 'test.gpx';

if(process.argv.length > 2){
	fileName = process.argv[2];
}

function trackInfo(trk){
	const timeInfo = trk.timeInfo(),
		totalTime = (timeInfo.end - timeInfo.start) / 1000,
		totalDist = trk.totalDistance(),
		speedInfo = trk.speedInfo();
	console.log('Points:   ', trk.totalPoints());
	console.log('Distance: ', show.distance(totalDist));
	console.log('Start:    ', timeInfo.start);
	console.log('End:      ', timeInfo.end);
	console.log('Time:     ', show.time(totalTime));
	console.log('Total avg:', show.speed(totalDist / totalTime));
	console.log('Moving:   ', speedInfo.moving);
	console.log('Still:    ', speedInfo.still);
	console.log('Min speed:', show.speed(speedInfo.min));
	console.log('Max speed:', show.speed(speedInfo.max));
	console.log('Avg speed:', show.speed(speedInfo.avg));
	console.log('Min avg:  ', show.speed(speedInfo.avgMin));
	console.log('Max avg:  ', show.speed(speedInfo.avgMax));
	console.log('Avg avg:  ', show.speed(speedInfo.avgAvg));
	
	console.log('First', util.inspect(trk.firstPoint(), false, null, true));
	console.log('Last', util.inspect(trk.lastPoint(), false, null, true));
}

fs.readFile(fileName, (err, data) => {
	if(err){
		console.error(err);
		process.exit(2);
	}
	
	parser.parseString(data, (err, xml) => {
		if(err){
			console.error(err);
			process.exit(3);
		}
		
		if(!xml || !xml.gpx || !xml.gpx.trk){
			console.error("No xml -> gpx -> trk");
			process.exit(4);
		}
		var trks = xml.gpx.trk;
		
		trks = trks.map(Track.fromXML);
		trks.forEach((t) => t.computeAverages());
		trks.forEach(trackInfo);
	});
});
