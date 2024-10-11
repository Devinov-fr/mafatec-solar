import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

interface Point {
  azimuth: number;
  height: number;
}

interface Obstacle {
  points: Point[];
}

interface SolarDiagramNewProps {
  obstacles: Obstacle[]; // Add props type definition
}

// Sorting function that orders points by height
const sortPoints = (points: Point[]) => {
  // Ensure the first point starts with height 0
  if (points[0].height !== 0) {
    points.unshift({ azimuth: points[0].azimuth, height: 0 });
  }

  // Ensure the last point ends with height 0
  if (points[points.length - 1].height !== 0) {
    points.push({ azimuth: points[points.length - 1].azimuth, height: 0 });
  }

  // Check if the number of points is odd
  if (points.length % 2 !== 0) {
    // Add a new point with the last azimuth and height of 0
    const lastAzimuth = points[points.length - 1].azimuth;
    points.push({ azimuth: lastAzimuth, height: 0 });
  }

  // Split points into two groups if the number of points is even
  let sortedPoints: Point[] = [];
  if (points.length % 2 === 0) {
    const midpoint = points.length / 2;
    const firstHalf = points.slice(0, midpoint);
    const secondHalf = points.slice(midpoint);

    // Sort the first half in ascending order by height
    const sortedFirstHalf = firstHalf.sort((a, b) => a.height - b.height);
    // Sort the second half in descending order by height
    const sortedSecondHalf = secondHalf.sort((a, b) => b.height - a.height);

    // Concatenate the two sorted halves
    sortedPoints = [...sortedFirstHalf, ...sortedSecondHalf];

    // Log the sorted points for debugging
    console.log("First Half (Ascending by Height):", sortedFirstHalf);
    console.log("Second Half (Descending by Height):", sortedSecondHalf);
  } else {
    // If the number of points is odd, return the points sorted by height in ascending order
    sortedPoints = points.sort((a, b) => a.height - b.height);
  }

  return sortedPoints;
};

const SolarDiagramNew: React.FC<SolarDiagramNewProps> = ({ obstacles: initialObstacles }) => {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]); // Initialize obstacles from props
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 920;
  const height = 640;
  const padding = 55;

  const xScale = d3.scaleLinear().domain([30, 330]).range([padding, width - padding]);
  const yScale = d3.scaleLinear().domain([0, 90]).range([height - 70, 70]);

  useEffect(() => {
    // Set obstacles from props when component mounts
    setObstacles(initialObstacles);
  }, [initialObstacles]);

  const drawObstacles = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  ) => {
    svg.selectAll("*").remove(); // Clear previous drawing

    // Draw the grid
    const xAxisGrid = d3.axisBottom(xScale).ticks(5);
    const yAxisGrid = d3.axisLeft(yScale).ticks(10);

// Append x-axis and hide gridlines
svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height - padding})`)
  .call(xAxisGrid)
  .selectAll("line")   // Apply to gridlines if present
  .style("display", "none");  // Completely hide gridlines

// Append y-axis and hide gridlines
svg.append("g")
  .attr("class", "y-axis")
  .attr("transform", `translate(${padding},0)`)
  .call(yAxisGrid)
  .selectAll("line")   // Apply to gridlines if present
  .style("display", "none");  // Completely hide gridlines



    // Draw grid lines
    svg.selectAll(".x-grid").data(xScale.ticks(10)).enter().append("line")
      .attr("class", "x-grid")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", padding)
      .attr("y2", height - padding)
      .attr("stroke", "transparent")
      .attr("stroke-width", 1);

    svg.selectAll(".y-grid").data(yScale.ticks(10)).enter().append("line")
      .attr("class", "y-grid")
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("x1", padding)
      .attr("x2", width - padding)
      .attr("stroke", "transparent")
      .attr("stroke-width", 1);

    // Draw obstacles
    obstacles.forEach((obstacle) => {
      const points = sortPoints(obstacle.points); // Sort the points for each obstacle
      console.log("test test 1")
      console.log("sortedPoints", points)
      // Draw lines between points
      for (let i = 0; i < points.length - 1; i++) {
        svg.append("line")
          .attr("x1", xScale(points[i].azimuth))
          .attr("y1", yScale(points[i].height))
          .attr("x2", xScale(points[i + 1].azimuth))
          .attr("y2", yScale(points[i + 1].height))
          .attr("stroke", "transparent")
          .attr("stroke-width", 2);
      }

      // Draw points
      points.forEach((point) => {
        svg.append("circle")
          .attr("cx", xScale(point.azimuth))
          .attr("cy", yScale(point.height))
          .attr("r", 5)
          .attr("fill", "transparent");
      });

      // Fill area
      const areaPoints = points.map(p => [xScale(p.azimuth), yScale(p.height)] as [number, number]);
      svg.append("polygon")
        .attr("points", areaPoints.map(p => p.join(",")).join(" "))
        .attr("fill", "lightgray")
        .attr("opacity", 0.5);
    });
  };

  // Redraw obstacles when they change
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    drawObstacles(svg);
  }, [obstacles]);

  return (
    <div className="mt-[-0px] ml-[5px]">

      <svg ref={svgRef} width={width} height={height} style={{ display: "block" }} />
    </div>
  );
};

export default SolarDiagramNew;
