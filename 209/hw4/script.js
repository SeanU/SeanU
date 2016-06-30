// In my defense: 
// I realize the way this code works is not terribly idiomatic, and 
// isn't even all that consistent in the idioms it uses. In some 
// spots (especially around event handlers) I'm fighting with
// JavaScript rather than working with it.
//
// I've learned quite a lot about JavaScript over the past few weeks, 
// so suffice it to say that I would organize this diffierently if I 
// were working from a fresh start. For now, though, I figure the point
// of this assignment is to build/demonstrate familiarity with D3, so
// I didn't want to wander off in the weeds by worrying about refactoring. 
// -su


// Array for mapping between day numbers and day names.
// Ordinals in this array correspond to dayOfWeek for dates.
var weekDays = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
				'Thursday',	'Friday', 'Saturday'];

var c10 = d3.scale.category10();

// Data for days in this set will be displayed in the graph.
var selectedDays = new Set(weekDays);

var showColors = false;

function initialize(plt) {
	plt.contentWidth = getContentSize(plt.width, plt.padding);
	plt.contentHeight = getContentSize(plt.height, plt.padding);

	d3.csv(plt.datasource, function(d) { buildPlot(plt, d); });
};

// Helper for generating translate style strings
function translate(x, y) {
	return "translate(" + x + "," + y + ")";
};

// Gets the amount of space for graph content, 
// equal to total length/width minus padding on each end.
function getContentSize(size, padding) {
	return size - (padding * 2);	
}

// Entry point for drawing everything that D3 is in charge of.
function buildPlot(plt, data) {	
	addDayOfWeek(data);

	plt.xScale = buildXScale(plt);
	plt.xAxis = buildAxis(plt.xScale, "bottom");

	plt.yScale = buildYScale(plt);
	plt.yAxis = buildAxis(plt.yScale, "left");

	createDayPicker(plt, data);
	attachColorToggle(plt, data);

	plt.tooltip = createTooltipElement(plt);

	plt.graph = createGraphElement(plt);
	drawGraph(plt, data);
};

// Augments the elements in the data array with DayOfWeek values
// so that they don't need to keep getting recalculated.
function addDayOfWeek(data) {
	data.forEach(function (d) {
		date = new Date(d.date);
		d.dayOfWeek = weekDays[date.getDay()];
	})
}

function buildXScale(plt) {
	return d3.scale.linear()
			.domain(plt.xDomain)
			.range([0, plt.contentWidth])
			.nice();
};

function buildYScale(plt) {
	return d3.scale.linear()
			.domain(plt.yDomain)
			.range([plt.contentHeight, 0])
			.nice();
};

function buildAxis(scale, orientation) {
	return d3.svg.axis()
				.scale(scale)
				.orient(orientation);
};

function createDayPicker(plt, data) {
	var labels = d3.select(plt.daysForm)
			.selectAll("label")
			.data(weekDays)
			.enter()
			.append("label");

	labels.append("span")
			.text(function(d) {return d;});

	labels.insert("input", ":first-child")
			.attr({
				"type": "checkbox",
				"id": function(d) {return d;},
				"checked": "checked"
			})
			.on("change", 
				function() { onDayCheckboxClick(plt, data, this); });

	updateDayPickerColors(plt);
}

function updateDayPickerColors(plt) {
	d3.select(plt.daysForm)
		.selectAll("label")
		.data(weekDays)
		.transition()
		.style("color", selectColorForDayName)	
}

function attachColorToggle(plt, data) {
	d3.select("#colorToggle")
		.on("click", function() { onColorToggleClick(plt, data); });
}

function createTooltipElement(plt) {
	return d3.select("body")
				.append("div")
				.attr("class", "tooltip");
}

function createGraphElement(plt) {
	return d3.select(plt.plotDiv)
			.append("svg")
			.attr({
				"width": plt.width,
				"height": plt.height
			})
			.append("g")
			.attr({
				"width": plt.contentWidth,
				"height": plt.contentHeight,
				"transform": translate(plt.padding, plt.padding)
			});
};

function drawGraph(plt, data) {
	drawAxes(plt, data);
	drawData(plt, data);
};

function drawAxes(plt, data) {
	plt.graph.append("g")
		.attr( {
			"class": "axis",
			"transform": translate(0, plt.contentHeight)
		})
		.call(plt.xAxis)
		.append("text")
		.attr({
			"x": plt.contentWidth,
			"y": -4
		})
		.style("text-anchor", "end")
		.text("Steps");

	plt.graph.append("g")
		.attr("class", "axis")
		.call(plt.yAxis)
		.append("text")
		.attr({
			"x": 4,
			"y": 10
		})
		.text("Sleep (h)");
};

function drawData(plt, data) {
	plt.graph.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")
		.attr({
			"cx": function(d) { return plt.xScale(d['steps']) },
			"cy": function(d) { return plt.yScale(d['sleep']) },
			"r":  5
		})
		.on("mouseover", function(d) { onMouseOver(plt, d, this) })
		.on("mouseout", function(d) { onMouseOut(plt, this) });

	updateDataStyling(plt, data);
}

function updateDataStyling(plt, data) {
	plt.graph.selectAll("circle")
		.data(data)
		.transition()
		.style({
			"opacity": selectOpacity,
			"fill": selectColorForDataPoint 
		});
}

function selectOpacity(d) {
	if (dayIsSelected(d)) {
		return 0.75;
	} else {
		return 0.0;
	}
}

function dayIsSelected(d) {
	return selectedDays.has(d.dayOfWeek);
}

function selectColorForDataPoint(d) {
	return selectColorForDayName(d.dayOfWeek);
}

function selectColorForDayName(day) {
	return selectColor(weekDays.indexOf(day));
}

function selectColor(d) {
	if(showColors) {
		return c10(d);
	} else {
		return "rgb(0,0,0)";
	}
}

function onDayCheckboxClick(plt, data, src) {
	if(src.checked) 
	{
		selectedDays.add(src.id);
	}
	else
	{
		selectedDays.delete(src.id);
	}

	updateDataStyling(plt, data);
}

function onColorToggleClick(plt, d) {
	debugger;
	showColors = !showColors;
	updateDayPickerColors(plt);
	updateDataStyling(plt, d);
}

function onMouseOver(plt, d, target) {
	d3.select(target)
		.transition()
		.duration(100)
		.attr("fill", "orange");

	plt.tooltip.html("");
	plt.tooltip.append("p").html("Date: " + d.date);
	plt.tooltip.append("p").html("Steps: " + d.steps);
	plt.tooltip.append("p").html("Sleep: " + Number(d.sleep).toFixed(1));
	plt.tooltip.style({
		left: (d3.event.pageX + 10) + "px",
		top: (d3.event.pageY - 20) + "px"
	});
	plt.tooltip
		.transition()
		.duration(500)
		.style("opacity", 1);
}

function onMouseOut(plt, target) {
	d3.select(target)
		.transition()
		.duration(100)
		.attr("fill", "black");
}

