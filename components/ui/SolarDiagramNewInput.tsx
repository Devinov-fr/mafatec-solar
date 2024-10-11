import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

interface Point {
  azimuth: number;
  height: number;
}

interface Obstacle {
  points: Point[];
}

const SolarDiagramNew: React.FC = () => {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [obstacleInputs, setObstacleInputs] = useState<{
    azimuth: string;
    height: string;
  }[][]>([]); // To store azimuth & height for each obstacle
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 900;
  const height = 600;
  const padding = 50;

  const xScale = d3
    .scaleLinear()
    .domain([0, 330])
    .range([padding, width - padding]);

  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - padding, padding]);

  const addObstacle = () => {
    setObstacleInputs((prev) => [...prev, [{ azimuth: "", height: "" }]]);
  };

  const addPointToObstacle = (index: number) => {
    setObstacleInputs((prev) => {
      const updated = [...prev];
      updated[index] = [...updated[index], { azimuth: "", height: "" }];
      return updated;
    });
  };

  const handleInputChange = (
    obstacleIndex: number,
    pointIndex: number,
    field: "azimuth" | "height",
    value: string
  ) => {
    setObstacleInputs((prev) => {
      const updated = [...prev];
      updated[obstacleIndex][pointIndex][field] = value;
      return updated;
    });
  };

// Function to handle sorting the points by height
const sortPoints = (points: Point[]) => {
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



const saveObstacles = () => {
  const newObstacles: Obstacle[] = obstacleInputs.map((inputSet) => {
    let points = inputSet.map((input) => ({
      azimuth: parseFloat(input.azimuth),
      height: parseFloat(input.height),
    }));

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

    // Apply sorting logic
    points = sortPoints(points);

    return { points };
  });

  setObstacles(newObstacles); // Update obstacles state
};



  const drawObstacles = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  ) => {
    svg.selectAll("*").remove(); // Clear previous drawing

    // Draw the grid
    const xAxisGrid = d3.axisBottom(xScale).ticks(10);
    const yAxisGrid = d3.axisLeft(yScale).ticks(10);

    // Append the X axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - padding})`)
      .call(xAxisGrid);

    // Append the Y axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${padding},0)`)
      .call(yAxisGrid);

    // Draw the grid lines
    svg
      .selectAll(".x-grid")
      .data(xScale.ticks(10))
      .enter()
      .append("line")
      .attr("class", "x-grid")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", padding)
      .attr("y2", height - padding)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    svg
      .selectAll(".y-grid")
      .data(yScale.ticks(10))
      .enter()
      .append("line")
      .attr("class", "y-grid")
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("x1", padding)
      .attr("x2", width - padding)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    obstacles.forEach((obstacle) => {
      const points = obstacle.points;

      // Draw the points and lines between them
      for (let i = 0; i < points.length - 1; i++) {
        svg
          .append("line")
          .attr("x1", xScale(points[i].azimuth))
          .attr("y1", yScale(points[i].height))
          .attr("x2", xScale(points[i + 1].azimuth))
          .attr("y2", yScale(points[i + 1].height))
          .attr("stroke", "black")
          .attr("stroke-width", 2);
      }

      // Draw individual points
      points.forEach((point) => {
        svg
          .append("circle")
          .attr("cx", xScale(point.azimuth))
          .attr("cy", yScale(point.height))
          .attr("r", 5)
          .attr("fill", "red");
      });

      // Fill the surface area
      const areaPoints = points.map(
        (p) => [xScale(p.azimuth), yScale(p.height)] as [number, number]
      );
      svg
        .append("polygon")
        .attr("points", areaPoints.map((p) => p.join(",")).join(" "))
        .attr("fill", "lightgray")
        .attr("opacity", 0.5);
    });
  };

  // Use effect to trigger drawing once the obstacles are updated
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    drawObstacles(svg); // Redraw the obstacles when they change
  }, [obstacles]);

  const handleValidate = () => {
    saveObstacles(); // Call saveObstacles when validating
  };

  return (
    <div>
      <h3>Obstacles</h3>
      <button onClick={addObstacle}>+ Add Obstacle</button>
      <div id="obstacles-container">
        {obstacleInputs.map((obstacle, obstacleIndex) => (
          <div key={obstacleIndex} className="obstacle-entry">
            <h4>Obstacle {obstacleIndex + 1}</h4>
            {obstacle.map((point, pointIndex) => (
              <div key={pointIndex}>
                <label>
                  Azimuth:
                  <input
                    type="number"
                    className="obstacle-azimuth bg-white"
                    value={point.azimuth}
                    onChange={(e) =>
                      handleInputChange(
                        obstacleIndex,
                        pointIndex,
                        "azimuth",
                        e.target.value
                      )
                    }
                  />
                </label>
                <label>
                  Height:
                  <input
                    type="number"
                    className="obstacle-height bg-white"
                    value={point.height}
                    onChange={(e) =>
                      handleInputChange(
                        obstacleIndex,
                        pointIndex,
                        "height",
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>
            ))}
            <button onClick={() => addPointToObstacle(obstacleIndex)}>
              + Add Point
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleValidate}>Validate</button>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: "1px solid black", display: "block" }}
      />
    </div>
  );
};

export default SolarDiagramNew;
