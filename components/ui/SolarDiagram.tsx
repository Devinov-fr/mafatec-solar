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
  const width = 900;
  const height = 600;
  const padding = 50;

  useEffect(() => {
    drawSolarDiagram();
  }, [latitude, obstacles]);

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
      "#EE82EE", "#FF8C69", "#8B4513", "#008000",
      "#87CEEB", "#FF0000", "#4B0082", "#0000FF" 
    ];
    const monthsLabels = [
      "21/12",  // December Solstice
      "20/01",  // January
      "18/02",  // February
      "21/03",  // March Equinox
      "17/04",  // April
      "21/05",  // May
      "21/06"   // June Solstice
    ];
  
    monthsColors.forEach((color, monthIndex) => {
      if (monthsLabels[monthIndex]) {
        const sunPathData: SunPathData[] = calculateSunPathData(monthIndex);
        console.log(`Data for month ${monthIndex}:`, sunPathData);
        drawSunCurve(svg, sunPathData, xScale, yScale, color, monthIndex);
        drawMonthLabel(svg, monthsLabels[monthIndex], color, xScale, monthIndex);
      }
    });
    
  
    // Draw static obstacles
    drawStaticObstacles(svg, xScale, yScale, graphHeight);
  };
  

  const drawMonthLabel = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    label: string,
    color: string,
    xScale: d3.ScaleLinear<number, number>,
    monthIndex: number
  ) => {
    const azimuth = 30 + monthIndex * 45;
    const x = xScale(azimuth);
    const y = height - padding + 30; // Increase the y position to spread labels further down

    svg
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("fill", color)
      .text(label);
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
      .call(d3.axisLeft(yScale).tickSize(-graphWidth).tickFormat(() => ""))
      .attr("transform", `translate(${padding},0)`);

    svg
      .append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(xScale).tickSize(-graphHeight).tickFormat(() => ""))
      .attr("transform", `translate(0,${height - padding})`);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - padding})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(d3.range(30, 331, 15).concat([30, 330]))
          .tickFormat((domainValue: d3.NumberValue, index: number) => {
            const numValue = +domainValue;
            if (numValue === 30) return "EST";
            else if (numValue === 330) return "SUD";
            else if (numValue === 300) return "OUEST";
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
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Axe des azimuts (en degrés)");

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Axe des hauteurs (en degrés)");
  };

  const calculateSunPathData = (monthIndex: number): SunPathData[] => {
    const declination = declinaisonSolaire(monthIndex);
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

    svg
      .append("path")
      .datum(sunPathData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", lineGenerator);

    if (monthIndex === 6) {
      sunPathData.forEach((data, index) => {
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
    obstacles.forEach((obstacle) => {
      const baseHeight = 0;
      const obstacleHeight = baseHeight + obstacle.height;

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
    <div>
      <svg id="solarSvg" width={width} height={height} />
    </div>
  );
};

export default SolarDiagram;
