(function(root, factory){
	if(typeof define !== 'undefined' && define.amd){
		define(factory);
	}else if(typeof module !== 'undefined' && module.exports){
		module.exports = factory();
	}else{
		root.Colour = factory();
	}
})(this, function(){
	"use strict";
	
	redBlue.red = function(x) {
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

	redBlue.green = function(x) {
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

	redBlue.blue = function(x) {
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

	function redBlue(x) {
		return [clamp(redBlue.red(x), 0.0, 255),
				clamp(redBlue.green(x), 0.0, 255),
				clamp(redBlue.blue(x), 0.0, 255)];
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
			const xx = x - 51611.0 / 108060.0;
			return ((-914.74 * xx - 734.72) * xx + 255.) / 255.0;
		} else {
			return 0.0;
		}
	};

	seismic.blue = function(x) {
		if (x < 0.0) {
			return 19.0 / 255.0;
		} else if (x < 0.238) {
			const xx = x - 0.238;
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
		return [seismic.red(x) * 255, 
				seismic.green(x) * 255, 
				seismic.blue(x) * 255];
	}
	
	const maps = {
		rainbow: function(x){
			const dx = 0.8;
			
			x = (6.0 - 2.0 * dx) * x + dx;
			
			return [Math.max(0.0, (3.0-Math.abs(x-4.0) - Math.abs(x-5.0))/2.0) * 255,
					Math.max(0.0, (4.0-Math.abs(x-2.0) - Math.abs(x-4.0))/2.0) * 255,
					Math.max(0.0, (3.0-Math.abs(x-1.0) - Math.abs(x-2.0))/2.0) * 255];
		},
		redBlue: redBlue,
		seismic: seismic
	};
	
	return {
		colourize: function(x, opt){
			opt = opt || {};
			
			const map = opt.map || maps.rainbow,
				invert = opt.inverse || opt.invert || false,
				revert = opt.reverse || opt.revert || false,
				bands = opt.bands || false;
			
			if(revert){
				x = 1 - x;
			}
			if(bands){
				x = Math.floor(x * bands) / bands;
			}
			const clr = map(x);
			
			clr[0] |= 0;
			clr[1] |= 0;
			clr[2] |= 0;
			
			if(invert){
				clr[0] = 255 - clr[0];
				clr[1] = 255 - clr[1];
				clr[2] = 255 - clr[2];
			}
			
			return clr;
		},
		maps: maps,
		toRGBString: function(clr){
			return 'rgb('+clr[0]+','+clr[1]+','+clr[2]+')';
		}
	};
});
