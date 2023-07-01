import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const csvUrl =
    "water_quality_dataset.csv";

function rowFormatter(d) {
    d.electrical_conductivity = +d.electrical_conductivity;
    d.ph = +d.ph;
    d.phosphates_p = +d.phosphates_p;
    d.turbidity = +d.turbidity;
    d.color_apparent = +d.color_apparent;
    d.total_dissolved_salts = +d.total_dissolved_salts;
    d.total_alkalinity = +d.total_alkalinity;
    d.bi_carbonates = +d.bi_carbonates;
    d.total_hardness = +d.total_hardness;
    d.calcium_hardness = +d.calcium_hardness;
    d.magnesium_hardness = +d.magnesium_hardness;
    d.flouride = +d.flouride;
    d.chloride = +d.chloride;
    d.sulphate = +d.sulphate;
    d.nitrites = +d.nitrites;
    d.nitrates_n = +d.nitrates_n;
    d.ammonium_n = +d.ammonium_n;
    d.phosphates_p = +d.phosphates_p;
    return d;
}
d3.csv(csvUrl, rowFormatter).then((data) => {
    // Create an array of districts
    let districts = data.map(function (d) {
        return d.district;
    });
    // Remove duplicates and sort the districts
    districts = Array.from(new Set(districts)).sort();

    // Create an array of regions
    let regions = data.map(function (d) {
        return d.region;
    });
    // Remove duplicates and sort the regions
    regions = Array.from(new Set(regions)).sort();

    // Initialize selected filters
    let selectedDistrict = null;
    let selectedRegion = null;

    // Render the filters

    let regionSelect = d3
        .select("#region-select")
        .append("select")
        .on("change", function () {
            selectedRegion = this.value;
            // Update the district filter options based on the selected region
            updateDistrictOptions(selectedRegion);
            filterData(selectedRegion, selectedDistrict);
        });

    regionSelect.append("option").text("All Regions").attr("value", "");

    regionSelect
        .selectAll("option.region-option")
        .data(regions)
        .enter()
        .append("option")
        .classed("region-option", true)
        .text(function (d) {
            return d;
        })
        .attr("value", function (d) {
            return d;
        });

    // Render the district filter
    let districtSelect = d3
        .select("#district-select")
        .append("select")
        .on("change", function () {
            selectedDistrict = this.value;
            filterData(selectedRegion, selectedDistrict);
        });

    // Function to update the district filter options based on the selected region
    function updateDistrictOptions(selectedRegion) {
        var filteredDistricts = data
            .filter(function (d) {
                return d.region === selectedRegion;
            })
            .map(function (d) {
                return d.district;
            });
        // Remove duplicates and sort the districts
        filteredDistricts = Array.from(new Set(filteredDistricts)).sort();

        districtSelect.selectAll("option").remove();

        districtSelect.append("option").text("All Districts").attr("value", "");

        districtSelect
            .selectAll("option.district-option")
            .data(filteredDistricts)
            .enter()
            .append("option")
            .classed("district-option", true)
            .text(function (d) {
                return d;
            })
            .attr("value", function (d) {
                return d;
            });
    }


    const dataGroupedByDistrict = d3.rollups(
        data,
        (v) => d3.mean(v, (d) => d.turbidity),
        (d) => d.district
    );

    const dataGroupedByRegions = d3.rollups(
        data,
        (v) => d3.mean(v, (d) => d.ph),
        (d) => d.region
    );

    const barChartUpdateFunction = barchart(dataGroupedByDistrict, "#barchart");
    const scatterPlotUpdateFunction = scatterPlot(data, "#Scatterplot");
    const donutChartUpdateFunction = donughtChart(dataGroupedByDistrict, "#donughtchart")
    const bubbleChartUpdateFunction = BubbleChart(dataGroupedByDistrict, "#BubbleChart")
    const groupedBarChartUpdateFunction = groupedbarchart(data, "#groupedbarchart")

    // Function to filter the data based on selected filters
    function filterData(selectedRegion, selectedDistrict) {
        let filteredData = data;
        if (
            selectedRegion &&
            (selectedDistrict == null || selectedDistrict == "All Districts")
        ) {
            filteredData = filteredData.filter(function (d) {
                return d.region === selectedRegion;
            });
        }

        if (selectedDistrict) {
            filteredData = filteredData.filter(function (d) {
                return d.district === selectedDistrict;
            });
        }

        if (selectedRegion) {
            filteredData = filteredData.filter(function (d) {
                return d.region === selectedRegion;
            });
        }

        if (selectedDistrict && selectedDistrict !== "All Districts") {
            filteredData = filteredData.filter(function (d) {
                return d.district === selectedDistrict;
            });
        }

        const filteredDataGroupedByDistrict = d3.rollups(
            filteredData,
            (v) => d3.mean(v, (d) => d.electrical_conductivity),
            (d) => d.district
        );

        barChartUpdateFunction(filteredDataGroupedByDistrict);
        scatterPlotUpdateFunction(filteredData);
        donutChartUpdateFunction(filteredDataGroupedByDistrict);
        bubbleChartUpdateFunction(filteredDataGroupedByDistrict);
        groupedBarChartUpdateFunction(filteredData);
    }
});
function barchart(data, selector) {
    // Chart dimensions
    const width = 450;
    const height = 300;
    const marginTop = 30;
    const marginRight = 20;
    const marginBottom = 70;
    const marginLeft = 40;

    const svg = d3
        .select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    let xScale, yScale, bars;

    function update(filteredData) {
        // Update scales with filtered data
        xScale.domain(filteredData.map((d) => d[0]));
        yScale.domain([0, d3.max(filteredData, (d) => d[1])]);

        // Select existing bars and join with filtered data
        bars = svg.selectAll("rect").data(filteredData, (d) => d[0]);

        // Update existing bars
        bars
            .attr("x", (d) => xScale(d[0]))
            .attr("y", (d) => yScale(d[1]))
            .attr("height", (d) => yScale(0) - yScale(d[1]))
            .attr("width", xScale.bandwidth());

        // Enter new bars
        bars
            .enter()
            .append("rect")
            .attr("x", (d) => xScale(d[0]))
            .attr("y", (d) => yScale(d[1]))
            .attr("height", (d) => yScale(0) - yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("fill", "steelblue");

        // Remove bars that are no longer in filtered data
        bars.exit().remove();

        // Update x-axis
        svg
            .select(".x-axis")
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .selectAll("text")
            .attr("x", 0)
            .attr("y", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(-45)")
            .attr("text-anchor", "end")
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -marginLeft)
                    .attr("y", 30)
                    .attr("text-anchor", "middle")
                    .text("Districts")
            );

        // Update y-axis
        svg
            .select(".y-axis")
            .call(d3.axisLeft(yScale))
            .call((g) => g.select(".domain").remove())
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -marginLeft)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text("↑ Electrical Conductivity (µs/cm)")
            );
    }

    // Initialize scales
    xScale = d3
        .scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    yScale = d3.scaleLinear().range([height - marginBottom, marginTop]);

    // Add x-axis container
    svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - marginBottom})`);

    // Add y-axis container
    svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginLeft},0)`);

    // Initial update with full data
    update(data);

    // Return the update function
    return update;
}

function scatterPlot(data, selector) {
    // Chart dimensions
    const width = 300;
    const height = 300;

    const margin = { top: 25, right: 20, bottom: 35, left: 40 };

    const svg = d3
        .select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "max-w-full max-h-full");
    // Declare the x (horizontal position) scale.
    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.ph))
        .nice()
        .range([margin.left, width - margin.right]);

    // Declare the y (vertical position) scale.
    const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.phosphates_p))
        .nice()
        .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal(
        data.map((d) => d.category),
        d3.schemeCategory10
    );

    const shapeScale = d3.scaleOrdinal(
        data.map((d) => d.category),
        d3.symbols.map((s) => d3.symbol().type(s)())
    );

    const xAxis = (g) =>
        g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale).ticks(width / 80))
            .call((g) => g.select(".domain").remove())
            .call((g) =>
                g
                    .append("text")
                    .attr("x", width)
                    .attr("y", margin.bottom - 4)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .text("ph")
            );

    const yAxis = (g) =>
        g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale))
            .call((g) => g.select(".domain").remove())
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -margin.left)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text("phosphates_p")
            );

    const grid = (g) =>
        g
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .call((g) =>
                g
                    .append("g")
                    .selectAll("line")
                    .data(xScale.ticks())
                    .join("line")
                    .attr("x1", (d) => 0.5 + xScale(d))
                    .attr("x2", (d) => 0.5 + xScale(d))
                    .attr("y1", margin.top)
                    .attr("y2", height - margin.bottom)
            )
            .call((g) =>
                g
                    .append("g")
                    .selectAll("line")
                    .data(yScale.ticks())
                    .join("line")
                    .attr("y1", (d) => 0.5 + yScale(d))
                    .attr("y2", (d) => 0.5 + yScale(d))
                    .attr("x1", margin.left)
                    .attr("x2", width - margin.right)
            );

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);
    svg.append("g").call(grid);

    const points = svg
        .append("g")
        .attr("stroke-width", 1.5)
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("path")
        .data(data)
        .join("path")
        .attr(
            "transform",
            (d) => `translate(${xScale(d.ph)},${yScale(d.phosphates_p)})`
        )
        .attr("fill", (d) => colorScale(d.region))
        .attr("d", (d) => shapeScale(d.source_type));

    // Update function
    function update(newData) {
        // Update the scales with the new data
        xScale.domain(d3.extent(newData, (d) => d.ph)).nice();
        yScale.domain(d3.extent(newData, (d) => d.phosphates_p)).nice();

        // Update the axes
        svg.select(".x-axis").call(xAxis);
        svg.select(".y-axis").call(yAxis);

        // Update the grid
        svg.select(".grid").call(grid);

        // Update the data points
        points
            .data(newData)
            .join("path")
            .attr(
                "transform",
                (d) => `translate(${xScale(d.ph)},${yScale(d.phosphates_p)})`
            )
            .attr("fill", (d) => colorScale(d.region))
            .attr("d", (d) => shapeScale(d.source_type));
    }

    update(data);

    return update;
}

function donughtChart(data, selector) {
    // Chart dimensions
    const width = 290;
    const height = 300;
    const radius = Math.min(width, height) / 2; // 300/2 = 150

    const margin = { top: 200, right: 50, bottom: 35, left: 200 };

    const arc = d3
        .arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    const pie = d3
        .pie()
        .padAngle(1 / radius)
        .sort(null)
        .value((d) => d[1]);

    const color = d3
        .scaleOrdinal()
        .domain(data.map((d) => d[0]))
        .range(
            d3
                .quantize((t) => d3.interpolateSpectral(t * 0.8 + 0.1), data.length)
                .reverse()
        );

    const svg = d3
        .select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "max-w-full max-h-full");

    function drawChart(data) {
        const arcs = svg
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)
            .selectAll()
            .data(pie(data))
            .join("path")
            .attr("fill", (d) => color(d.data[0]))
            .attr("d", arc)
            .append("title")
            .text((d) => `${d.data[1]}: ${d.data[1].toLocaleString()}`);

        const labels = svg
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)
            .attr("font-family", "sans-serif")
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .selectAll()
            .data(pie(data))
            .join("text")
            .attr("transform", (d) => `translate(${arc.centroid(d)})`)
            .call((text) =>
                text
                    .append("tspan")
                    .attr("y", "-0.4em")
                    .attr("font-weight", "bold")
                    .text((d) => d.data[0])
            )
            .call((text) =>
                text
                    .filter((d) => d.endAngle - d.startAngle > 0.25)
                    .append("tspan")
                    .attr("x", 0)
                    .attr("y", "0.7em")
                    .attr("fill-opacity", 0.7)
                    .text((d) => d.data[1].toLocaleString("en-US"))
            );

        return { arcs, labels };
    }

    const chart = drawChart(data);

    // Update function
    function update(newData) {
        // Remove existing chart elements
        chart.arcs.remove();
        chart.labels.remove();

        // Redraw the chart with the updated data
        chart.arcs = drawChart(newData).arcs;
        chart.labels = drawChart(newData).labels;
    }

    update(data);

    return update;
}

function BubbleChart(data, selector) {
    const format = d3.format(".0f");
    let tree = [];

    // Extract the number of water sources for each district
    data.forEach((row) => {
        tree.push({ district: row[0], value: row[1] });
    });

    // Chart dimensions
    const width = 250;
    const height = 300;

    const margin = 5;

    const svg = d3
        .select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "max-w-full max-h-full");

    // Create a categorical color scale.
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Create the pack layout.
    const pack = d3
        .pack()
        .size([width - margin * 1, height - margin * 1])
        .padding(3);

    // Compute the hierarchy from the (flat) data; expose the values
    // for each node; lastly apply the pack layout.
    const root = pack(d3.hierarchy({ children: tree }).sum((d) => d.value));

    // Place each (leaf) node according to the layout’s x and y values.
    const node = svg
        .selectAll("g.node")
        .data(root.leaves())
        .join("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Add a title.
    node.append("title").text((d) => `${d.data.district}\n${format(d.value)}`);

    // Add a filled circle.
    node
        .append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", (d) => color(d.data.district))
        .attr("r", (d) => d.r);

    // Add a label.
    const text = node.append("text").attr("clip-path", (d) => `circle(${d.r})`);

    // Add text within the bubbles
    text
        .append("tspan")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "8px")
        .text((d) => `${d.data.district}`);

    text
        .append("tspan")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "8px")
        .attr("style", "font-weight: bolder;")
        .attr("x", 0)
        .attr("dy", "1em")
        .text((d) => format(d.data.value));

    // Update function
    function update(newData) {
        // Remove existing chart elements
        svg.selectAll("g.node").remove();

        // Extract the number of water sources for each district
        const updatedTree = newData.map((row) => ({
            district: row[0],
            value: row[1],
        }));

        // Compute the hierarchy from the (flat) data; expose the values
        // for each node; lastly apply the pack layout.
        const updatedRoot = pack(
            d3.hierarchy({ children: updatedTree }).sum((d) => d.value)
        );

        // Place each (leaf) node according to the layout’s x and y values.
        const updatedNode = svg
            .selectAll("g.node")
            .data(updatedRoot.leaves())
            .join("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);

        // Add a title.
        updatedNode
            .append("title")
            .text((d) => `${d.data.district}\n${format(d.value)}`);

        // Add a filled circle.
        updatedNode
            .append("circle")
            .attr("fill-opacity", 0.7)
            .attr("fill", (d) => color(d.data.district))
            .attr("r", (d) => d.r);

        // Add a label.
        const updatedText = updatedNode
            .append("text")
            .attr("clip-path", (d) => `circle(${d.r})`);

        // Add text within the bubbles
        updatedText
            .append("tspan")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "8px")
            .text((d) => `${d.data.district}`);

        updatedText
            .append("tspan")
            .attr("style", "font-weight: bolder;")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "8px")
            .attr("x", 0)
            .attr("dy", "1em")
            .text((d) => `${format(d.data.value)}`);
    }

    update(data);

    return update;
}

function groupedbarchart(data, selector) {
    // Chart dimensions
    const width = 450;
    const height = 300;
    const marginTop = 10;
    const marginRight = 10;
    const marginBottom = 80;
    const marginLeft = 40;

    const svg = d3
        .select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "max-w-full max-h-full");

    // Prepare the scales for positional and color encodings.
    // Fx encodes the state.
    const fx = d3
        .scaleBand()
        .domain(new Set(data.map((d) => d.district)))
        .rangeRound([marginLeft, width - marginRight])
        .paddingInner(0.1);

    // Both x and color encode the age class.
    const sourceType = new Set(data.map((d) => d.source_type));

    const x = d3
        .scaleBand()
        .domain(sourceType)
        .rangeRound([0, fx.bandwidth()])
        .padding(0.05);

    const color = d3
        .scaleOrdinal()
        .domain(sourceType)
        .range(d3.schemeSpectral[sourceType.size])
        .unknown("#ccc");

    // Y encodes the height of the bar.
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.electrical_conductivity)])
        .nice()
        .rangeRound([height - marginBottom, marginTop]);

    // A function to format the value in the tooltip.
    const formatValue = (x) => (isNaN(x) ? "N/A" : x.toLocaleString("en"));

    // Append a group for each state, and a rect for each age.
    svg
        .append("g")
        .selectAll()
        .data(d3.group(data, (d) => d.district))
        .join("g")
        .attr("transform", ([district]) => `translate(${fx(district)},0)`)
        .selectAll()
        .data(([, d]) => d)
        .join("rect")
        .attr("x", (d) => x(d.source_type))
        .attr("y", (d) => y(d.electrical_conductivity))
        .attr("width", x.bandwidth())
        .attr("height", (d) => y(0) - y(d.electrical_conductivity))
        .attr("fill", (d) => color(d.source_type));

    // Append the horizontal axis.
    svg
        .append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(fx).tickSizeOuter(0))
        .call((g) => g.selectAll(".domain").remove())
        .selectAll("text")
        .attr("x", 0)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .call((g) =>
            g
                .append("text")
                .attr("x", -marginLeft)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .text("Districts")
        );

    // Append the vertical axis.
    svg
        .append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call((g) => g.selectAll(".domain").remove());

    // Update function
    function update(newData) {
        // Remove existing chart elements
        svg.selectAll("g").remove();

        // Update scales with the new data
        fx.domain(new Set(newData.map((d) => d.district)));
        x.domain(new Set(newData.map((d) => d.source_type)));
        y.domain([0, d3.max(newData, (d) => d.electrical_conductivity)]);

        // Append a group for each state, and a rect for each age.
        svg
            .append("g")
            .selectAll()
            .data(d3.group(newData, (d) => d.district))
            .join("g")
            .attr("transform", ([district]) => `translate(${fx(district)},0)`)
            .selectAll()
            .data(([, d]) => d)
            .join("rect")
            .attr("x", (d) => x(d.source_type))
            .attr("y", (d) => y(d.electrical_conductivity))
            .attr("width", x.bandwidth())
            .attr("height", (d) => y(0) - y(d.electrical_conductivity))
            .attr("fill", (d) => color(d.source_type));

        // Append the horizontal axis.
        svg
            .append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(fx).tickSizeOuter(0))
            .call((g) => g.selectAll(".domain").remove())
            .selectAll("text")
            .attr("x", 0)
            .attr("y", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(-45)")
            .attr("text-anchor", "end")
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -marginLeft)
                    .attr("y", 30)
                    .attr("text-anchor", "middle")
                    .text("Districts")
            );

        // Append the vertical axis.
        svg
            .append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).ticks(null, "s"))
            .call((g) => g.selectAll(".domain").remove());
    }

    update(data);

    return update;
}