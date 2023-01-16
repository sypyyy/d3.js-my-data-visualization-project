function main2() {
	const MARGIN = { LEFT: 100, RIGHT: 100, TOP: 20, BOTTOM: 60 }
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 380 - MARGIN.TOP - MARGIN.BOTTOM
const HEIGHT_BRUSH = 200 - MARGIN.TOP - MARGIN.BOTTOM
//ZOOM AREA
const svg = d3.select("#chart-area-coin").append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
//BRUSH AREA
const svg_brush = d3.select("#chart-area-coin-brush").append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT_BRUSH + MARGIN.TOP + MARGIN.BOTTOM)

const g = svg.append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

const g_brush = svg_brush.append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

// time parsers/formatters
const parseTime = d3.timeParse("%d/%m/%Y")
const formatTime = d3.timeFormat("%d/%m/%Y")
// for tooltip
const bisectDate = d3.bisector(d => d.date).left
//Date frame from brush
let dateFrame = []
let selection = [100,200]
let okToUpdate = false
// add the line for the first time
g.append("path")
	.attr("class", "line")
	.attr("fill", "none")
	.attr("stroke", "grey")
	.attr("stroke-width", "3px")

g_brush.append("path")
	.attr("class", "line_brush")
	.attr("fill", "none")
	.attr("stroke", "grey")
	.attr("stroke-width", "2px")
// axis labels
const xLabel = g.append("text")
	.attr("class", "x axisLabel")
	.attr("y", HEIGHT + 50)
	.attr("x", WIDTH / 2)
	.attr("font-size", "18px")
	.attr("text-anchor", "middle")
	.text("Time")
/** 
const xLabel_brush = g_brush.append("text")
	.attr("class", "x axisLabel_brush")
	.attr("y", HEIGHT_BRUSH + 50)
	.attr("x", WIDTH / 2)
	.attr("font-size", "18px")
	.attr("text-anchor", "middle")
	.text("Time")
	*/
const yLabel = g.append("text")
	.attr("class", "y axisLabel")
	.attr("transform", "rotate(-90)")
	.attr("y", -60)
	.attr("x", -170)
	.attr("font-size", "18px")
	.attr("text-anchor", "middle")
	.text("Price ($)")
/** 
const yLabel_brush = g_brush.append("text")
	.attr("class", "y axisLabel_brush")
	.attr("transform", "rotate(-90)")
	.attr("y", -60)
	.attr("x", -80)
	.attr("font-size", "18px")
	.attr("text-anchor", "middle")
	.text("Price ($)")
	*/
// scales
const x = d3.scaleTime().range([0, WIDTH])
const y = d3.scaleLinear().range([HEIGHT, 0])
const x_brush = d3.scaleTime().range([0, WIDTH])
const y_brush = d3.scaleLinear().range([HEIGHT_BRUSH, 0])
// axis generators
const xAxisCall = d3.axisBottom()
const yAxisCall = d3.axisLeft()
	.ticks(8)
	.tickFormat(d => `${parseInt(d / 1000)}k`)
const xAxisCallBrush = d3.axisBottom()
const yAxisCallBrush = d3.axisLeft()
	.ticks(8)
	.tickFormat(d => `${parseInt(d / 1000)}k`)
// axis groups
const xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT})`)
const yAxis = g.append("g")
	.attr("class", "y axis")

const xAxis_brush = g_brush.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT_BRUSH})`)
const yAxis_brush = g_brush.append("g")
	.attr("class", "y axis")	
// event listeners
$("#coin-select").on("change", update)
$("#var-select").on("change", update)

// add jQuery UI slider


//The brush which works as a slider
const brush = d3.brushX()
      .extent([[0, 0], [WIDTH, HEIGHT_BRUSH]])
		.on("start brush end", brushed);
	g_brush
	.call(brush)
	.call(brush.move, [100, 200])
	

function brushed() {
	
	try{
		selection = d3.event.selection
		update()
	} catch(e){}
	

}

function getDateFromXCoord(Coord) {

	const x0 = x_brush.invert(Coord)

	const coin = $("#coin-select").val()
	const i = bisectDate(filteredData[coin], x0)
	
	const d0 = filteredData[coin][i - 1]
	const d1 = filteredData[coin][i]
	if(i === 0) {
		return d1.date
	}
	const d = x0 - d0.date > d1.date - x0 ? d1 : d0
	return d.date
}



  function beforebrushstarted(event) {
    const dx = x(1) - x(0); // Use a fixed width when recentering.
    const [[cx]] = d3.pointers(event);
    const [x0, x1] = [cx - dx / 2, cx + dx / 2];
    const [X0, X1] = x.range();
    d3.select(this.parentNode)
        .call(brush.move, x1 > X1 ? [X1 - dx, X1] 
            : x0 < X0 ? [X0, X0 + dx] 
            : [x0, x1]);
  }


d3.json("data/coins.json").then(data => {
	
	// prepare and clean data
	filteredData = {}
	Object.keys(data).forEach(coin => {
		filteredData[coin] = data[coin]
			.filter(d => {
				return !(d["price_usd"] == null)
			}).map(d => {
				d["price_usd"] = Number(d["price_usd"])
				d["24h_vol"] = Number(d["24h_vol"])
				d["market_cap"] = Number(d["market_cap"])
				d["date"] = parseTime(d["date"])
				return d
			})
	})
	okToUpdate = true
	// run the visualization for the first time
	update()
})



function update() {
	if(!okToUpdate) {
		return
	}

	//update brush scales
	// filter data based on selections
	const coin = $("#coin-select").val()
	const yValue = $("#var-select").val()

	x_brush.domain(d3.extent(filteredData[coin], d => d.date))
	y_brush.domain([
		d3.min(filteredData[coin], d => d[yValue]) / 1.005, 
		d3.max(filteredData[coin], d => d[yValue]) * 1.005
	])
	

	const t = d3.transition().duration(1000)
	
	
	
	const sliderValues = selection.map(getDateFromXCoord)
	$("#dateLabel1").text(formatTime(new Date(sliderValues[0])))
	$("#dateLabel2").text(formatTime(new Date(sliderValues[1])))
	const dataTimeFiltered = filteredData[coin].filter(d => {
		
		return ((d.date >= sliderValues[0]) && (d.date <= sliderValues[1]))
	})
	

	// update scales
	x.domain(d3.extent(dataTimeFiltered, d => d.date))
	y.domain([
		d3.min(dataTimeFiltered, d => d[yValue]) / 1.005, 
		d3.max(dataTimeFiltered, d => d[yValue]) * 1.005
	])
	// fix for format values
	const formatSi = d3.format(".2s")
	function formatAbbreviation(x) {
		const s = formatSi(x)
		switch (s[s.length - 1]) {
			case "G": return s.slice(0, -1) + "B" // billions
			case "k": return s.slice(0, -1) + "K" // thousands
		}
		return s
	}

	// update axes
	xAxisCall.scale(x)
	xAxis.transition(t).call(xAxisCall)
	yAxisCall.scale(y)
	yAxis.transition(t).call(yAxisCall.tickFormat(formatAbbreviation))

	xAxisCallBrush.scale(x_brush)
	xAxis_brush.transition(t).call(xAxisCallBrush)
	yAxisCallBrush.scale(y_brush)
	yAxis_brush.transition(t).call(yAxisCallBrush.tickFormat(formatAbbreviation))
	// clear old tooltips
	d3.select(".focus").remove()
	d3.select(".overlay").remove()

	/******************************** Tooltip Code ********************************/

	const focus = g.append("g")
		.attr("class", "focus")
		.style("display", "none")

	focus.append("line")
		.attr("class", "x-hover-line hover-line")
		.attr("y1", 0)
		.attr("y2", HEIGHT)

	focus.append("line")
		.attr("class", "y-hover-line hover-line")
		.attr("x1", 0)
		.attr("x2", WIDTH)

	focus.append("circle")
		.attr("r", 7.5)

	focus.append("text")
		.attr("x", 15)
		.attr("dy", ".31em")

	g.append("rect")
		.attr("class", "overlay")
		.attr("width", WIDTH)
		.attr("height", HEIGHT)
		.on("mouseover", () => focus.style("display", null))
		.on("mouseout", () => focus.style("display", "none"))
		.on("mousemove", mousemove)


	
	function mousemove() {
		try{
			const x0 = x.invert(d3.mouse(this)[0])
			const i = bisectDate(dataTimeFiltered, x0)
			const d0 = dataTimeFiltered[i - 1]
			const d1 = dataTimeFiltered[i]
			const d = x0 - d0.date > d1.date - x0 ? d1 : d0
			focus.attr("transform", `translate(${x(d.date)}, ${y(d[yValue])})`)
			focus.select("text").text(d[yValue])
			focus.select(".x-hover-line").attr("y2", HEIGHT - y(d[yValue]))
			focus.select(".y-hover-line").attr("x2", -x(d.date))
		} catch(e){}
	}
	
	/******************************** Tooltip Code ********************************/

	// Path generator
	line = d3.line()
		.x(d => x(d.date))
		.y(d => y(d[yValue]))
	line_brush = d3.line()
		.x(d => x_brush(d.date))
		.y(d => y_brush(d[yValue]))

	// Update our line path
	g.select(".line")
		.transition(t)
		.attr("d", line(dataTimeFiltered))

	g_brush.select(".line_brush")
		.transition(t)
		.attr("d", line_brush(filteredData[coin]))
	// Update y-axis label
	const newText = (yValue === "price_usd") ? "Price ($)" 
		: (yValue === "market_cap") ? "Market Capitalization ($)" 
			: "24 Hour Trading Volume ($)"
	yLabel.text(newText)
}
}
main2()