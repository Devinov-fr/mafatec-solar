import React, { useEffect } from "react";
import * as d3 from "d3";

// Define props interface
interface Obstacle {
  azimuth: number;
  height: number;
}

interface SolarDiagramProps {
  latitude: number;
  obstacles: Obstacle[];
  onObstacleChange: (obstacles: Obstacle[]) => void;
}

interface SunPathData {
  azimuth: number;
  altitude: number;
}

const SolarDiagram: React.FC<SolarDiagramProps> = ({
  latitude,
  obstacles,
  onObstacleChange,
}) => {
  const width = 1000;
  const height = 620;
  const padding = 100;

  useEffect(() => {
    drawSolarDiagram();
  }, [latitude, obstacles]);

  const drawObstacles = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    obstacles: { azimuth: number; height: number }[]
  ) => {

    console.log("obstaclesobstaclesobstacles", obstacles)
    // Loop through each obstacle and draw it
    obstacles.forEach((obstacle) => {
      const azimuth = obstacle.azimuth;
      const height = obstacle.height;
  
      svg
        .append("rect")
        .attr("x", xScale(azimuth) - 5) // Adjust x based on azimuth
        .attr("y", yScale(height)) // Use the height for the y position
        .attr("width", 10) // Set a constant width
        .attr("height", yScale(0) - yScale(height)) // Height of the obstacle
        .attr("fill", "gray"); // Color of the obstacle
    });
  };
  

  const drawSolarDiagram = () => {
    const svg = d3.select<SVGSVGElement, unknown>("#solarSvg");

    // Log the number of elements before clearing
    const elementsBeforeClear = svg.selectAll("*").size();
    console.log(`Elements before clear: ${elementsBeforeClear}`);

    svg.selectAll("*").remove(); // Clear previous drawings

    // Log the number of elements after clearing
    const elementsAfterClear = svg.selectAll("*").size();
    console.log(`Elements after clear: ${elementsAfterClear}`);

    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const xScale = d3
      .scaleLinear()
      .domain([30, 330])
      .range([padding, width - padding]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 90])
      .range([height - padding, padding]);

    // Draw axes
    drawAxes(svg, xScale, yScale, graphWidth, graphHeight, height, padding);

    // Adjusted to include all months
    const monthsColors = [
      "#EE82EE",
      "#FF8C69",
      "#8B4513",
      "#008000",
      "#87CEEB",
      "#FF0000",
      "#4B0082",
      "#0000FF",
    ];
    const monthsLabels = [
      "21/12", // December Solstice
      "20/01", // January
      "18/02", // February
      "21/03", // March Equinox
      "17/04", // April
      "21/05", // May
      "21/06", // June Solstice
    ];

    const drawnMonthIndices = new Set(); // Keep track of drawn month labels
    monthsColors.forEach((color, monthIndex) => {
      if (monthsLabels[monthIndex]) {
        // Calculate the sun path data for the current month index
        const sunPathData: SunPathData[] = calculateSunPathData(monthIndex);
        console.log(`Data for month ${monthIndex}:`, sunPathData);
    
        // Draw the sun curve
        drawSunCurve(svg, sunPathData, xScale, yScale, color, monthIndex);
    
        // Draw the month label only if it hasn't been drawn yet
        if (!drawnMonthIndices.has(monthIndex)) {
          drawMonthLabel(
            svg,
            monthsLabels[monthIndex],
            color,
            xScale,
            monthIndex,
            height,
            padding
          );
          drawnMonthIndices.add(monthIndex); 
        }
      }
    });
    

    console.log("test drawStaticObstacles")
    console.log("test drawStaticObstacles svg", svg)
    console.log("test drawStaticObstacles xScale", xScale)
    console.log("test drawStaticObstacles yScale", yScale)
    console.log("test drawStaticObstacles graphHeight", graphHeight)
    // Draw static obstacles
    drawStaticObstacles(svg, xScale, yScale, graphHeight);
    drawObstacles(svg, xScale, yScale, obstacles);
  };

  const drawMonthLabel = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    label: string,
    color: string,
    xScale: d3.ScaleLinear<number, number>,
    monthIndex: number,
    height: number,
    padding: number
  ) => {
    const azimuth = 30 + monthIndex * 45;
    const x = xScale(azimuth);
    const y = height - padding + 50;
  
    // Generate unique IDs for the line and text based on monthIndex
    const lineId = `month-line-${monthIndex}`;
    const textId = `month-label-${monthIndex}`;
  
    // Clear previous lines and text with the same IDs
    svg.select(`#${lineId}`).remove();
    svg.select(`#${textId}`).remove();
  

  
    // Clear existing label divs with the same ID before appending new ones
    const legendContainer = document.getElementById("legend-container");
    if (legendContainer) {
      const existingLabelDiv = legendContainer.querySelector(`#${textId}`);
      if (existingLabelDiv) {
        legendContainer.removeChild(existingLabelDiv);
      }
  
      // Create a container div for each label with a line
      const labelDiv = document.createElement("div");
      labelDiv.style.display = "flex"; // Use flexbox for alignment
      labelDiv.style.alignItems = "center"; // Center vertically
      labelDiv.style.marginBottom = "10px"; // Increase the gap between labels
  
      // Create a line span element
      const lineSpan = document.createElement("span");
      lineSpan.style.width = "20px"; // Width of the line
      lineSpan.style.height = "3px"; // Height of the line
      lineSpan.style.backgroundColor = color; // Color of the line
      lineSpan.style.marginRight = "10px"; // Space between line and label
  
      // Set the text and color for the label
      labelDiv.appendChild(lineSpan); // Append the line span to the labelDiv
  
      // Create a text node with the specific color
      const textNode = document.createTextNode(label);
  
      // Create a span to apply color to the text
      const colorTextSpan = document.createElement("span");
      colorTextSpan.style.color = color; // Set the text color
      colorTextSpan.appendChild(textNode); // Append the text node to the span
  
      // Append the colored text span to the labelDiv
      labelDiv.appendChild(colorTextSpan);
  
      labelDiv.id = textId; // Use the same ID for easy access
      legendContainer.appendChild(labelDiv);
    }
  };
  

  const drawAxes = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    graphWidth: number,
    graphHeight: number,
    height: number,
    padding: number
  ) => {
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-graphWidth)
          .tickFormat(() => "")
      )
      .attr("transform", `translate(${padding},0)`)
      .selectAll("line")
      .style("opacity", 0.2);

    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-graphHeight)
          .tickFormat(() => "")
      )
      .attr("transform", `translate(0,${height - padding})`)
      .selectAll("line")
      .style("opacity", 0.2);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - padding})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(d3.range(30, 331, 15).concat([30, 330]))
          .tickFormat((domainValue: d3.NumberValue, index: number) => {
            const numValue = +domainValue;
            if (numValue === 90) return "EST";
            else if (numValue === 180) return "SUD";
            else if (numValue === 285) return "OUEST";
            return numValue.toString();
          })
      );

    svg
      .append("g")
      .attr("transform", `translate(${padding},0)`)
      .call(d3.axisLeft(yScale).tickValues(d3.range(0, 101, 10)));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 40)
      .attr("text-anchor", "middle")
      .text("Axe des azimuts (en degrés)");

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", 40)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Axe des hauteurs (en degrés)");
  };

  // List of days of the year corresponding to key points in the solar cycle
  const joursDeLAnnee = [355, 20, 50, 80, 110, 140, 170];

  const calculateSunPathData = (monthIndex: number): SunPathData[] => {
    // Use the day of the year instead of the month index
    const jourDeLAnnee = joursDeLAnnee[monthIndex];
    const declination = declinaisonSolaire(jourDeLAnnee);
    const sunPathData: SunPathData[] = [];

    for (let heureSolaire = 4; heureSolaire <= 22; heureSolaire += 2) {
      const altitude = altitudeSoleil(latitude, declination, heureSolaire);
      const azimuth = angleHoraire(heureSolaire) + 180;

      if (azimuth >= 30 && azimuth <= 330) {
        sunPathData.push({ azimuth, altitude });
      }
    }

    return sunPathData;
  };

  const declinaisonSolaire = (jourDeLAnnee: number): number => {
    return (
      23.45 * Math.sin((((360 * (jourDeLAnnee - 81)) / 365) * Math.PI) / 180)
    );
  };

  const angleHoraire = (heureSolaire: number): number => {
    return 15 * (heureSolaire - 12);
  };

  const altitudeSoleil = (
    latitude: number,
    declinaison: number,
    heureSolaire: number
  ): number => {
    return (
      (Math.asin(
        Math.sin((latitude * Math.PI) / 180) *
          Math.sin((declinaison * Math.PI) / 180) +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((declinaison * Math.PI) / 180) *
            Math.cos((angleHoraire(heureSolaire) * Math.PI) / 180)
      ) *
        180) /
      Math.PI
    );
  };

  const drawSunCurve = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    sunPathData: SunPathData[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    color: string,
    monthIndex: number
  ) => {
    const lineGenerator = d3
      .line<SunPathData>()
      .x((d) => xScale(d.azimuth))
      .y((d) => yScale(d.altitude))
      .curve(d3.curveBasis);
  
    // Filter out data points where altitude is less than 0
    const validSunPathData = sunPathData.map((d) => ({
      azimuth: d.azimuth,
      altitude: Math.max(d.altitude, 0) // Set altitude to 0 if it's less than 0
    }));
  
    svg
      .append("path")
      .datum(validSunPathData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", lineGenerator);
  
    if (monthIndex === 6) {
      validSunPathData.forEach((data, index) => {
        const heureSolaire = 4 + index * 2;
  
        if (data.azimuth >= 30 && data.azimuth <= 330) {
          svg
            .append("text")
            .attr("x", xScale(data.azimuth))
            .attr("y", yScale(data.altitude) - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text(`${heureSolaire}h`);
        }
      });
    }
  };

  const drawStaticObstacles = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    graphHeight: number
  ) => {
    console.log("testing test")
    obstacles.forEach((obstacle) => {
      console.log("testing test2")
      const baseHeight = 0;
      const obstacleHeight = baseHeight + obstacle.height;
      console.log("bstacle.height", obstacle.height)
      console.log("obstacleHeight", obstacleHeight)
      console.log("entered drawStaticObstacles")
      svg
        .append("rect")
        .attr("x", xScale(obstacle.azimuth) - 5) 
        .attr("y", yScale(obstacleHeight))
        .attr("width", 10)
        .attr("height", graphHeight - yScale(obstacleHeight))
        .attr("fill", "grey");
    });
  };



  return (
    <div className="flex justify-center flex-col  items-center px-10 ">
      <svg
        id="solarSvg"
        width={width}
        height={height}
        className="border border-black "
      />
      <div
        className="flex justify-center items-center my-2 w-[75%] "
        id="legend-container"
      ></div>
      <div className="flex justify-center items-center  w-[75%]">
        <div className="obstacle-color w-5 h-2 bg-gray-500 mr-2 "></div>
        <span className="text-sm text-center pb-2">
          L'ombrage de l'obstacle renseigné
        </span>
      </div>
    </div>
  );
};

export default SolarDiagram;
