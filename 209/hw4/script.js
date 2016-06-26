var weekDays = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
				'Thursday',	'Friday', 'Saturday'];

var selectedDays = new Set(weekDays);

function initialize(plt) {
	plt.contentWidth = getContentSize(plt.width, plt.padding);
	plt.contentHeight = getContentSize(plt.height, plt.padding);

	d3.csv(plt.datasource, function(d) { buildPlot(plt, d); });
};

function translate(x, y) {
	return "translate(" + x + "," + y + ")";
};

function getContentSize(size, padding) {
	return size - (padding * 2);	
}

function buildPlot(plt, data) {	
	addDayOfWeek(data);

	plt.xScale = buildXScale(plt);
	plt.xAxis = buildAxis(plt.xScale, "bottom");

	plt.yScale = buildYScale(plt);
	plt.yAxis = buildAxis(plt.yScale, "left");

	createDayPicker(plt, data);

	plt.graph = createGraphElement(plt);
	drawGraph(plt, data);
};

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
				function() { onDayCheckboxClick(plt, data, this);});
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
			"y": plt.padding / 2
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
			"r":  3
		});
}

function updateDataVisibility(plt, data) {
	plt.graph.selectAll("circle")
		.data(data)
		.transition()
		.style("opacity", selectOpacity);
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

function onDayCheckboxClick(plt, data, src) {
	if(src.checked) 
	{
		selectedDays.add(src.id);
	}
	else
	{
		selectedDays.delete(src.id);
	}

	updateDataVisibility(plt, data);
}


