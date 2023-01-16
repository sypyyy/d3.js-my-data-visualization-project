	/*
	*    main.js
	*    Mastering Data Visualization with D3.js
	*    Project 2 - Gapminder Clone
	*/

function main1() {
	const MARGIN = { LEFT: 100, RIGHT: 10, TOP: 10, BOTTOM: 130 }
	const WIDTH = 600 - MARGIN.LEFT - MARGIN.RIGHT
	const HEIGHT = 400 - MARGIN.TOP - MARGIN.BOTTOM

	const svg = d3.select("#chart-area").append("svg")
	.attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
	.attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
	.attr("transform", "scale(1)")
	const g = svg.append("g")
	.attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)
		//X label
  g.append("text")
  .attr("class", "x axis-label")
  .attr("x", WIDTH / 2)
  .attr("y", HEIGHT + 50)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("GDP Per Capita ($)")
//Y label
  g.append("text")
  .attr("class", "y axis-label")
  .attr("x", - (HEIGHT / 2))
  .attr("y", -60)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .text("Life Expectancy (Years)")

  //X axis scale
  const xTicks = [400, 4000, 40000]
  let xDomain = [100, 200000]
  const x = d3.scaleLog()
        .domain(xDomain)
        .range([0, WIDTH])
		  
	//Y axis scale
	const y = d3.scaleLinear()
	.domain([0, 90])
	.range([HEIGHT, 0])

	//XLabel 
	//remember to add tickFormat to show labels
	const xAxisCall = d3.axisBottom(x).tickValues(xTicks).tickFormat((d, i) => d);
	g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${HEIGHT})`)
        .call(xAxisCall)
        .selectAll("text")
          .attr("y", "10")
          .attr("text-anchor", "middle")

	const yAxisCall = d3.axisLeft(y).ticks(10).tickFormat(d => d)
	g.append("g")
        .attr("class", "y axis")
        .call(yAxisCall)
	
	//population -> radius
	const p2r = d3.scaleLinear()
	.domain([2000, 1390110388])
	.range([25, 1500])	
	
	//Continent Color
	const continentColor = d3.scaleOrdinal(d3.schemePastel1)


	//continents legend
	const continents = ["europe", "asia", "americas", "africa"]
	const legend = g.append("g").attr('transform', `translate(${WIDTH - 10}, ${HEIGHT - 150})`)
	continents.forEach((continent, i) => {
		const legendRow = legend.append("g").attr('transform', `translate(0, ${i * 20})`)
		legendRow.append("rect").attr("width", 10).attr("height", 10).attr("fill", continentColor(continent))
		legendRow.append("text")
		.attr("x", -10)
		.attr("y", 10)
		.attr("text-anchor", "end")
		.style("text-transform", "capitalize")
		
		.text(continent)
	})
	let year = 1800;
	let i = -1;
	let blackList = new Set();
	let yearTag = null;
	//Flag for pause
	let play = true;
	let updateRange = true;
	let data = {};
	//year range tag
	const yearRangeTag = $("#GDPChart .year")[0];

	const rangeInput = $("#GDPChart .yearRangeInput");
	rangeInput.on("input",(e)=> {
		i = e.target.value - 1;
		step();
	})

	//Buttons

	axios.get("/data/data.json").then(response => {
		data = response.data
		$("#GDPChart .pause").on("click", (e) => {
			let action = e.target.innerText
			if(action === "Play") {
				e.target.innerText="Pause"
				play = true
			} else {
				e.target.innerText="Play"
				play = false
			}
			//e.target.innerText="Play"
		})

		$("#GDPChart .reset").on("click", (e) => {
			i = -1;
			step();
			//e.target.innerText="Play"
		})
		d3.interval(() => {
			if(!play) {
				return
			}
			step();
		},100)
	})

	//Hover ToolTip
	const tip = d3.tip()
		.attr('class', 'd3-tip')
		.html(d => {
			let text = `<strong>Country: </strong><span>${d.country}</span><br/>`
			text += `<strong>Continent: </strong><span>${d.continent}</span><br/>`
			text += `<strong>LifeExpectancy: </strong><span>${d.life_exp}</span><br/>`
			text += `<strong>GDP Per Capita: </strong><span>${d.income}</span><br/>`
			text += `<strong>Population: </strong><span>${d.population}</span><br/>`
			return text;
		})
		
		
	g.call(tip)

	//Update Func
	function step() {
		i += 1;
		
		if(!data[i]) {
			i = -1
			return
		}
		if(updateRange) {
			rangeInput[0].value = i + 1;
		}
		year = data[i].year;
		if(yearTag) {
			yearTag.remove()
		}
		yearTag = g.append("text")
			.text(year)
			.attr("x",WIDTH)
			.attr("y",HEIGHT - 10)
			.attr("text-anchor","end")

		yearRangeTag.innerText=`Year: ${year}`
		//bubbles update

		const circles = g.selectAll("circle")
			.data(data[i].countries, (d) => {return d.country})

		
		circles.exit().remove()
		
		circles
		.transition(d3.transition().duration(80))
		.attr("cx",(d) => x(d.income ? d.income : 1))
		.attr("cy", (d)=> y(d.life_exp ? d.life_exp : 0))
		.attr("r", (d)=> {
			if(blackList.has(d.country)) {
				return 0;
			}
			if(! (d.income && d.life_exp && d.population)) {
				blackList.add(d.country)
				return 0;
			}
			return Math.sqrt(p2r(d.population));
		})
		.attr("class",(d) => d.country)

		circles.enter().append("circle")
			.attr("cx",(d) => x(d.income ? d.income : 1))
			.attr("cy", (d)=> y(d.life_exp ? d.life_exp : 0))
			.attr("r", (d)=> {
				if(blackList.has(d.country)) {
					return 0;
				}
				if(! (d.income && d.life_exp && d.population)) {
					blackList.add(d.country)
					return 0;
				}
				return Math.sqrt(p2r(d.population));
			})
			.attr("fill", (d) => continentColor(d.continent))
			.on("mouseover",tip.show)
			.on("mouseout",tip.hide)
}
}

main1();
	