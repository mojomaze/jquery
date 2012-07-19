# jquery.routemap.js

## jQuery Cloudmade Open Maps Plugin 

Route builder using Web Maps API by CoudeMade to access OpenStreetMap

### Demo
	
[http://www.routeripper.com/routemap](http://www.routeripper.com/routemap)

### Reference
[http://cloudmade.com/](http://cloudmade.com/)

[http://developers.cloudmade.com/projects/show/web-maps-api](http://developers.cloudmade.com/projects/show/web-maps-api)

[http://www.openstreetmap.org/](http://www.openstreetmap.org/)

[http://www.gmap-pedometer.com/](http://www.gmap-pedometer.com/)

### Example
	
	<body>
		<script type="text/javascript">
			$(document).ready(function() {
				$("#map").routemap({
					controller: 'routes',
					routeId: 15,
					apiKey: 'a5f...'
				});
			});
		</script>
		<div id="map"></div>
	</body>

## Settings

### controller

controller name for rest; defaults to '' which hides save form and route name

### routeId

rest id to load saved route; defaults to -3 for new record

#### GET

Expects something like:

	{"success":true,"id":21,"name":"test again","distance":"1404.0",
	"map_center":["41.92849541973741","-87.6978063583374"],
	"map_zoom":"15","meters":["702","702"],
	"markers":{"0":["41.93216704883793","-87.6974630355835"],"1":["41.93401874682136","-87.703857421875"]},
	"lines":{"0":{"0":["41.932091","-87.697456"],"1":["41.932079","-87.697594"],"2":["41.932079","-87.698822"],"3":["41.9333","-87.69886"],"4":["41.933418","-87.698952"],"5":["41.933899","-87.699677"],"6":["41.933899","-87.700127"],"7":["41.933891","-87.70134"],"8":["41.93388","-87.70256"],"9":["41.933868","-87.703789"],"10":["41.934021","-87.703796"]},"1":{"0":["41.934021","-87.703796"],"1":["41.933868","-87.703789"],"2":["41.93388","-87.70256"],"3":["41.933891","-87.70134"],"4":["41.933899","-87.700127"],"5":["41.933899","-87.699677"],"6":["41.933418","-87.698952"],"7":["41.9333","-87.69886"],"8":["41.932079","-87.698822"],"9":["41.932079","-87.697594"],"10":["41.932091","-87.697456"]}}}
	
#### PUT and POST

Sends parameters:

	id (int)
	name (string)
	map_center (array[i])
	map_zoom (int)
	meters (array[i])
	markers (array[i][i])
	lines (array[i][i][i])