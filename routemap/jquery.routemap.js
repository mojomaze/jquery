// Ajax helper methods
function _ajax_request(url, data, callback, type, method) {
    if (jQuery.isFunction(data)) {
        callback = data;
        data = {};
    }
    return jQuery.ajax({
        type: method,
        url: url,
        data: data,
        success: callback,
        dataType: type
        });
}

jQuery.extend({
    put: function(url, data, callback, type) {
        return _ajax_request(url, data, callback, type, 'PUT');
    },
    delete_: function(url, data, callback, type) {
        return _ajax_request(url, data, callback, type, 'DELETE');
    }
});

/**
	* @author Mark H Winkler
	* JQuery Cloudmade Open Maps Plugin 
	* Uses Web Maps API by CoudeMade to access OpenStreetMap
	* http://cloudmade.com/
	* http://developers.cloudmade.com/projects/show/web-maps-api
	* http://www.openstreetmap.org/
	* Similar to:
	* http://www.gmap-pedometer.com/
	* Example:
	* <body>
	* <script type="text/javascript">
	* $(document).ready(function() {
	*   $("#map").routemap({
	*     apiKey: 'aea8c693cd45401aaa71775ddb886a3f'
	*   });
	* });
	* </script>
	* <div id="map"></div>
	* </body>
	* Demon:
	* http://www.routeripper.com/routemap
**/

(function( $ ){
	var map =  '';
  	var markers = [];
	var polylines = [];
	var distance = [];
	var startPoint = '';
	var endPoint = '';
	var routeName = '';
	var totalDistance = 0;
	var activeMap = false;
	
	var settings = { // defaults can be overridden
		routeId: -3,
		mapCenter: [41.9285,-87.6978], // logan & california, chicago
		mapZoom: 15,
		height: 500,
		width: 850,
		controller: '', // controller for rest:
		apiKey: '',									// get '/controller/id/edit'
		apiVersion: '0.3',					// put '/controller/id.js'
		displayMiles: true					// post '/controller.js'
	};

	// private functions
	
	function toggle() {
		if (!activeMap) {
			if (map) {
				map.enableDoubleClickZoom();
			}
			if (settings.routeId === -3) {
				var msg = 'Zoom map and click start';
				displayMessage(msg);
			} 
			$(".active-control").hide();
			$(".inactive-control").show();
			$(".routemap-name").hide();
		} else {
			map.disableDoubleClickZoom();
			$(".routemap-name").show();
			$(".active-control").show();
			$(".inactive-control").hide();
			toggleButtons(true);
		}
	};
	
	function toggleButtons(enable) {
		if (enable) {
			$(".active-control").attr('disabled', false);
			toggleComplete();
		}else{
			$(".active-control").attr('disabled', true);
		}
	};
	
	function toggleComplete() {
		// when arrays are equal map is complete
		if (markers.length > 0 && markers.length == distance.length) {
			$(".complete-control").hide();
			$(".btn-reset").show();
			$(".btn-save").show();
			$(".btn-remove").show();
		} else {
			switch (markers.length) {
			case 0: // no markers - show only reset
				$(".btn-reset").show();
				$(".btn-save").show();
				$(".btn-remove").hide();
				$(".complete-control").hide();
				displayMessage('Click map at start point');
				break;
			case 1: // 1 marker - show reset & undo
				$(".btn-reset").show();
				$(".btn-save").show();
				$(".btn-remove").show();
				$(".complete-control").hide();
				displayMessage('Click next route point');
				break;
			default: // show them all
				$(".btn-reset").show();
				$(".btn-save").show();
				$(".btn-remove").show();
				$(".complete-control").show();
			}
		}
	};
   
	function displayMessage(msg) {
		$("#routemap_message").html(msg);
	};
	
	function displayNotice(msg) {
		$(".routemap-name .routemap-notice").html(msg).show().delay(1000).fadeOut(200);
	};
 
	function dropMarker(latlng) {
		if(markers.length > 0){
			var lastLatLng = markers[markers.length-1].getLatLng();
			if(lastLatLng.lat() == latlng.lat() && lastLatLng.lng() == latlng.lng()){
				return; // double click so don't add marker
			}
		}
		var myMarkerLatLng = new CM.LatLng(latlng.lat(),latlng.lng());
		var title = markers.length > 0 ? 'Marker '+ (markers.length) : 'Start';
		var myMarker = new CM.Marker(myMarkerLatLng, {
			title: title
		});
		map.addOverlay(myMarker);
		markers.push(myMarker);
		var markerCount = markers.length;
	  	if (markerCount > 1) {
		  	displayMessage('Calculating...');
	  	  	connectMarkers(markers[markerCount-2], markers[markerCount-1]);
	  	} else {
			toggleButtons(true); // enable buttons
			startPoint = latlng.lat()+','+latlng.lng();
		}
	};
	
	function setEndPoint() {
		if(markers.length > 0){
			if(markers.length ==  distance.length){ // markers should have one more element
				var marker = markers[0] // if equal then route is complete back to start
			}else{
				var marker = markers[markers.length-1]
			}
			var latlng = marker.getLatLng();
			endPoint = latlng.lat()+','+latlng.lng();
		}else{
			endPoint = '';
		}
	};
 
	function connectMarkers(start_marker,finish_marker) {
		var start = start_marker.getLatLng();
		var finish = finish_marker.getLatLng();
		var startPoint = start.lat()+','+start.lng();
		var endPoint = finish.lat()+','+finish.lng();
		var url = 'http://routes.cloudmade.com/'+settings.apiKey+'/api/'+settings.apiVersion+'/'+startPoint+','+endPoint+'/foot.js?callback=?';
		toggleButtons(false); // enable buttons
		
		$.getJSON(url, function(data) {
			if(data.status != 0){
				alert(data.status+': '+data.status_message);
				var myMarker = markers.pop();
				map.removeOverlay(myMarker);
				displayMessage('Total Distance: '+formatDistance(totalDistance)); // refresh last distance
				toggleButtons(true); // enable buttons
				return;
			}
			var latlngs = [];
			$.each(data.route_geometry, function(route) {
				latlngs.push(new CM.LatLng($(this)[0],$(this)[1]));
			});
			var polyline = new CM.Polyline(latlngs);
			polylines.push(polyline);
		    map.addOverlay(polyline);
			// calc miles, add marker title, update total
			var meters = data.route_summary.total_distance;
			distance.push(meters);
			totalDistance += meters
			displayMessage('Total Distance: '+formatDistance(totalDistance));
			setEndPoint();
			toggleButtons(true); // enable buttons
		});
	};
	
	function formatDistance(meters) {
		aggregate = settings.displayMiles ? meters * 0.000621371192237334 : meters / 1000;
		aggregate = Math.round(aggregate * 100)/100; // round to two places
		increment = settings.displayMiles ? 'mi' : 'km';
		return aggregate+' '+increment
	};
	
	function serializeMarkers() {
		var myMarkers = [];
		$.each(markers, function(marker) {
			var latlng = markers[marker].getLatLng();
		 	var m = [];
			m.push(latlng.lat());
			m.push(latlng.lng());
			myMarkers.push(m);
		});
		return myMarkers;
	};
	
	function serializePolylines() {
		var lines = [];
		$.each(polylines, function(line) {
			lines.push(serializePolyline($(this)));
		});
		return lines;
	};
	
	function serializePolyline(polyline) {
		var p = [];
		var total_lines = polyline[0].getVertexCount();
		for (var i=0;i<total_lines;i++) {
			var latlng = polyline[0].getVertex(i);
			l = [];
			l.push(latlng.lat());
			l.push(latlng.lng());
			p.push(l);
		}
		return p;
	};
	
	function parseMarkers(markers) {
		var myMarkers = [];
		$.each(markers, function(key, value) {
			var myMarkerLatLng = new CM.LatLng(value[0],value[1]);
			var title = markers.length > 0 ? 'Marker '+ (markers.length) : 'Start';
			var myMarker = new CM.Marker(myMarkerLatLng, {
				title: title
			});
			map.addOverlay(myMarker);
			myMarkers.push(myMarker);
		});
		return myMarkers;
	};
	
	function parsePolylines(lines) {
		var myLines = [];
		$.each(lines, function(key, value) {
			var latlngs = [];
			$.each(value, function(key, value) {
				latlngs.push(new CM.LatLng(value[0],value[1]));
			});
			var polyline = new CM.Polyline(latlngs);
		    map.addOverlay(polyline);
			myLines.push(polyline);
		});
		return myLines;
	};
	
	function parseMeters(meters) {
		var myMeters = [];
		$.each(meters, function(key, value) {
			myMeters.push(parseFloat(value));
		});
		return myMeters;
	};
	
	function removeMarker() {
		if (markers.length > 0 ) {
			toggleButtons(false); // disable buttons
			if(markers.length > distance.length){ // markers should have one more element
				var myMarker = markers.pop();               // if equal then route is complete back
				map.removeOverlay(myMarker);				   // start
			}
			if (markers.length > 0) {
				var m = distance.pop();
				totalDistance -= m
				var myPolyline = polylines.pop();
				map.removeOverlay(myPolyline);
				displayMessage('Total Distance: '+formatDistance(totalDistance));

			}
			setEndPoint();
			toggleButtons(true); // enable buttons
		}
	};
	
	function createControls() {
		// box contruct - 2 column with left nav
		var routemap = $('<div class="routemapbox"></div>');
		routemap.append($('<div class="routemap-content"></div>'));
		routemap.append($('<div class="routemap-leftnav"></div>'));
		
		// add name row and map to content div
		$('.routemap-content', routemap).append($('<div class="routemap-name"></div>'));
		$('.routemap-content', routemap).append($('<div id="routemap_map"></div>'));
		
		// save only added for settings.controller
		if (settings.controller != '') {
			// add name field and save link to name
			$('.routemap-name', routemap).append($('<span>Name</span>'));
			$('.routemap-name', routemap).append($('<input id="routemap_name" type="text" size="40" />'));
			$('.routemap-name', routemap).append($('<a class="routemap-btn active-control btn-save" href="">Save Route</a>'));
			$('.routemap-name', routemap).append($('<span class="routemap-notice"></span>'));
		}
		
		// add message area and links to left nav
		$('.routemap-leftnav', routemap).append($('<div id="routemap_message"></div>'));
		$('.routemap-leftnav', routemap).append($('<ul class="routemap-leftnav-controls"></ul>'));
		$('.routemap-leftnav-controls', routemap).append($('<li><a class="routemap-btn inactive-control btn-start" href="">Start Route</a></li>'));
		$('.routemap-leftnav-controls', routemap).append($('<li><a class="routemap-btn active-control btn-remove" href="">Undo Last Marker</a></li>'));
		$('.routemap-leftnav-controls', routemap).append($('<li><a class="routemap-btn active-control btn-reset" href="">Reset Map</a></li>'));
		$('.routemap-leftnav-controls', routemap).append($('<li class="active-control complete-control">Complete Route:</li>'));
		$('.routemap-leftnav-controls', routemap).append($('<li><a class="routemap-btn active-control complete-control btn-outback" href="">Out & Back</a></li>'));
		$('.routemap-leftnav-controls', routemap).append($('<li><a class="routemap-btn active-control complete-control btn-backstart" href="">Back to Start</a></li>'));
	
		return routemap;
	};
	
	function getMap() {
		if (settings.controller != '') {
			$('.routemap-leftnav-controls .inactive-control').hide();
			$('.routemap-leftnav-controls .btn-start').html('Edit Route');
			displayMessage('Loading Map...');
			var jqxhr = $.getJSON('/'+settings.controller+'/'+settings.routeId+'/edit', function(data) {
				if(data.success != true){
					alert('Error loading map');
					return;
				}
				var routeName = data.name;
				totalDistance = parseFloat(data.distance);
				settings.mapZoom = parseInt(data.map_zoom);
				settings.mapCenter[0] = parseFloat(data.map_center[0]);
				settings.mapCenter[1] = parseFloat(data.map_center[1]);
				markers = parseMarkers(data.markers);
				polylines = parsePolylines(data.lines);
				distance = parseMeters(data.meters);
				map.setCenter(new CM.LatLng(settings.mapCenter[0], settings.mapCenter[1]), settings.mapZoom);
			
				$('#routemap_name').attr("value", routeName);
				displayMessage('Total Distance: '+formatDistance(totalDistance));
				$('.routemap-leftnav-controls .inactive-control').show();
			});
		}
	};
	
	var methods = {
		init: function( options ) {

		    return this.each(function() {        
		      	// If options exist, lets merge them
		      	// with our default settings
		      	if ( options ) { 
		        	$.extend( settings, options );
		      	}
				
				// $(this) is jquery object // 'this' is dom object
				$(this).height(settings.height);
				$(this).width(settings.width);
				
				$(this).append(createControls);
				
				$("#routemap_map").height(settings.height);
				$("#routemap_map").width(settings.width-200);
				
				// set button listeners
				$('.routemap-name .routemap-btn').live('click', function () {
					return false;
				});
				
				$('.routemap-leftnav-controls .routemap-btn').live('click', function () {
					return false;
				});
				
				$('.routemap-name .btn-save').bind('click', methods.saveMap);
				$('.routemap-leftnav-controls .btn-remove').bind('click', removeMarker);
				$('.routemap-leftnav-controls .btn-reset').bind('click', methods.resetMap);
				$('.routemap-leftnav-controls .btn-start').bind('click', methods.start);
				$('.routemap-leftnav-controls .btn-outback').bind('click', methods.completeOutAndBack);
				$('.routemap-leftnav-controls .btn-backstart').bind('click', methods.completeBackToStart);
		
				toggle();
				var cloudmade = new CM.Tiles.CloudMade.Web({key: settings.apiKey });
				map = new CM.Map('routemap_map', cloudmade);

				map.setCenter(new CM.LatLng(settings.mapCenter[0], settings.mapCenter[1]), settings.mapZoom);

				map.addControl(new CM.LargeMapControl());
				 //map.addControl(new CM.ScaleControl());
				map.addControl(new CM.OverviewMapControl());

				if (settings.controller != '') {
					if (settings.routeId != -3) {
						getMap();
					} else {
						$('#routemap_name').attr("value", '');
					}
				}

				CM.Event.addListener(map, 'click', function(latlng) {
					if(!activeMap){
						return;
					}
				  	dropMarker(latlng);
				});
				
			});
		},
		
		start: function(){
			activeMap = true;
			toggle();
		},

		resetMap: function(){
			activeMap = false;
			$.each(markers, function(marker){
				removeMarker();
			});
			if(markers.length == 1){ // when map completed, remove skips one marker
				removeMarker();  // so start marker is left over
			}
			if (settings.routeId != -3) {
				getMap();
			}
			toggle();
		},

		completeOutAndBack: function() {
			// turn around and route back to start
			var numMarkers = markers.length
			if (numMarkers < 2) {
				return; // two points required for out & back
			}
			toggleButtons(false); // disable buttons
			displayMessage('Calculating...');
			var url = '';
			var start = markers[numMarkers-1].getLatLng();
			var finish = markers[0].getLatLng();
			var startPoint = start.lat()+','+start.lng();
			var endPoint = finish.lat()+','+finish.lng();

			if (numMarkers > 2) {
				// build transit points for return trip
				var transits = '[';
				for(i=numMarkers-2;i>0;i--){ 
					var latlng = markers[i].getLatLng();
					transits += latlng.lat()+','+latlng.lng();
					if(i > 1){
						transits += ','
					}
				}
				transits += ']'
	
				url = 'http://routes.cloudmade.com/'+settings.apiKey+'/api/'+settings.apiVersion+'/'+startPoint+","+transits+","+endPoint+'/foot.js?callback=?'
	
			} else {
		
				url = 'http://routes.cloudmade.com/'+settings.apiKey+'/api/'+settings.apiVersion+'/'+startPoint+","+endPoint+'/foot.js?callback=?'
		
			}
			
			$.getJSON(url, function(data) {
				if(data.status != 0){
					alert(data.status+': '+data.status_message);
					var myMarker = markers.pop();
					map.removeOverlay(myMarker);
					displayMessage('Total Distance: '+formatDistance(totalDistance)); // refresh last total
					toggleButtons(true); // enable buttons
					return;
				}
				var latlngs = [];
				$.each(data.route_geometry, function(route) {
					latlngs.push(new CM.LatLng($(this)[0],$(this)[1]));
				});
				var polyline = new CM.Polyline(latlngs);
				polylines.push(polyline);
			    map.addOverlay(polyline);
				
				var meters = data.route_summary.total_distance;
				distance.push(meters);
				totalDistance += meters
				displayMessage('Total Distance: '+formatDistance(totalDistance));
				setEndPoint();
				toggleButtons(true); // enable buttons
			});
		},

		completeBackToStart: function(){
			// head back to start via shortest route
			var numMarkers = markers.length;
			if(numMarkers < 2) {
				return; // two points required for out & back
			}
			toggleButtons(false); // disable buttons
			displayMessage('Calculating...');
			connectMarkers(markers[numMarkers-1],markers[0]);

		},

		saveMap: function() {
			if (settings.controller != '') {
				var myMarkers = serializeMarkers();
				var myLines = serializePolylines();
				var latlng = map.getCenter();
				settings.mapCenter[0] = latlng.lat();
				settings.mapCenter[1] = latlng.lng();
				settings.mapZoom = map.getZoom();
				name = $('#routemap_name').val();
				var params = {
					'route[markers]': myMarkers, 
					'route[lines]': myLines,
					'route[meters]': distance,
					'route[name]': name,
					'route[distance]': totalDistance,
					'route[start_point]': startPoint,
					'route[end_point]': endPoint,
					'route[map_center]': settings.mapCenter,
					'route[map_zoom]': settings.mapZoom
				};

				if (settings.routeId === -3) {
					var jqxhr = $.post('/'+settings.controller+'.js', params,function(data) {
					    if (data.success) {
							settings.routeId = data.id;
							$(".routemap-title").html(data.name);
							displayNotice('Route saved');
						} else {
							alert(data.errors);
						}
					}, "json");
				 } else {  // send PUT request for update
					var jqxhr = $.put('/'+settings.controller+'/'+settings.routeId+'.js', params,function(data) {
					    if (data.success) {
							$(".routemap-title").html(data.name);
							displayNotice('Route saved');
						} else {
							alert(data.errors);
						}
					}, "json");
				}
			}
		}	
	};
	
	$.fn.routemap = function( method ) {
		// Method calling logic
		if ( methods[method] ) {
	      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jQuery.routemap' );
	    }
	};	
	
})(jQuery);