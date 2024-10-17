import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

interface Point {
  azimuth: number | null;
  height: number | null;
}

interface Obstacle {
  points: Point[];
}

interface SolarDiagramNewProps {
  obstacles: Obstacle[]; // Add props type definition
}


// Sorting function that orders points by height for all obstacles
const sortPoints = (obstacles: Obstacle[]) => {
  console.log("all of the obstacles", obstacles);
  return obstacles.map((obstacle, index) => {
    const points = [...obstacle.points]; // Make a copy of the points
    console.log(`These are the points for Obstacle ${index + 1}:`, points);

    // Si c'est le premier obstacle et qu'il ne commence pas par une hauteur de 0
    if (index === 0 && points.length > 0 && points[0].height !== 0) {
      points.unshift({ azimuth: points[0].azimuth, height: 0 }); // Add a point with height 0 and same azimuth
    }

    // Ensure the first point starts with height 0 (general rule)
    /*if (points[0].height !== 0) {
      points.unshift({ azimuth: 0, height: 0 });
    }*/

    // Ensure the last point ends with height 0 (only if index !== 0)
    if (index !== 0 && points[points.length - 1].height !== 0) {
      points.push({ azimuth: points[points.length - 1].azimuth ?? 0, height: 0 });
    }

    // Si le dernier obstacle n'a pas un point de hauteur 0, l'ajouter
    if (index === obstacles.length - 1 && points[points.length - 1].height !== 0) {
      points.push({ azimuth: points[points.length - 1].azimuth, height: 0 });
    }

    // Add extra point if the number of points is odd
    if (points.length % 2 !== 0) {
      const lastAzimuth = points[points.length - 1].azimuth ?? 0;
      points.push({ azimuth: lastAzimuth, height: 0 });
    }

    // Clamp azimuth values to a minimum of 30
    points.forEach((point) => {
      if (point.azimuth !== null && point.azimuth < 30) {
        point.azimuth = 30;
      }
    });

    let sortedPoints: Point[] = [];

    if (points.length % 2 === 0) {
      const midpoint = points.length / 2;
      const firstHalf = points.slice(0, midpoint);
      const secondHalf = points.slice(midpoint);

      // Sort halves by height
      const sortedFirstHalf = firstHalf.sort((a, b) => (a.height ?? 0) - (b.height ?? 0));
      const sortedSecondHalf = secondHalf.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

      sortedPoints = [...sortedFirstHalf, ...sortedSecondHalf];
    } else {
      sortedPoints = points.sort((a, b) => (a.height ?? 0) - (b.height ?? 0));
    }

    return {
      obstacleIndex: index + 1,
      sortedPoints,
    };
  });
};



const SolarDiagramNew: React.FC<SolarDiagramNewProps> = ({
  obstacles: initialObstacles,
}) => {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]); // Initialize obstacles from props
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 920;
  const height = 640;
  const padding = 55;

  const xScale = d3
    .scaleLinear()
    .domain([30, 330])
    .range([padding, width - padding]);
  const yScale = d3
    .scaleLinear()
    .domain([0, 90])
    .range([height - 70, 70]);

    useEffect(() => {
      // Set obstacles from props when component mounts
      setObstacles(initialObstacles);
    }, [initialObstacles]);

    const drawObstacles = (
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
    ) => {
      svg.selectAll("*").remove(); // Clear previous drawing
    
      const sortedObstacles = sortPoints(obstacles); // Get all sorted points for each obstacle
    
      sortedObstacles.forEach(({ obstacleIndex, sortedPoints }, index) => {
        console.log(`Drawing obstacle ${obstacleIndex} with points`, sortedPoints);
    
        // Draw lines between points of the current obstacle
        for (let i = 0; i < sortedPoints.length - 1; i++) {
          svg
            .append("line")
            .attr("x1", xScale(sortedPoints[i].azimuth ?? 0))
            .attr("y1", yScale(sortedPoints[i].height ?? 0))
            .attr("x2", xScale(sortedPoints[i + 1].azimuth ?? 0))
            .attr("y2", yScale(sortedPoints[i + 1].height ?? 0))
            .attr("stroke", "lightgray")
            .attr("stroke-width", 2);
        }
    
        // Draw points of the current obstacle
        sortedPoints.forEach((point) => {
          svg
            .append("circle")
            .attr("cx", xScale(point.azimuth ?? 0))
            .attr("cy", yScale(point.height ?? 0))
            .attr("r", 5)
            .attr("fill", "transparent");
        });
    
        // Fill area for the current obstacle
        const areaPoints = sortedPoints.map(
          (p) => [xScale(p.azimuth ?? 0), yScale(p.height ?? 0)] as [number, number]
        );
        svg
          .append("polygon")
          .attr("points", areaPoints.map((p) => p.join(",")).join(" "))
          .attr("fill", "lightgray")
          .attr("opacity", 0.5);
    
        // Connect the last point of the previous obstacle to the first point of the current one
        if (index > 0) {
          const previousObstacle = sortedObstacles[index - 1].sortedPoints;
          const lastPointOfPrevious = previousObstacle[previousObstacle.length - 1];
          const firstPointOfCurrent = sortedPoints[0];
    
          svg
            .append("line")
            .attr("x1", xScale(lastPointOfPrevious.azimuth ?? 0))
            .attr("y1", yScale(lastPointOfPrevious.height ?? 0))
            .attr("x2", xScale(firstPointOfCurrent.azimuth ?? 0))
            .attr("y2", yScale(firstPointOfCurrent.height ?? 0))
            .attr("stroke", "lightgray")
            .attr("stroke-width", 2);
        }
      });
    };
    
    
  

  // Redraw obstacles when they change
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    drawObstacles(svg);
  }, [obstacles]);

  return (
    <div className="mt-[4px] ml-[0px]">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block" }}
      />
    </div>
  );
};

export default SolarDiagramNew;
