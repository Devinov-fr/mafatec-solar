import React, { useEffect } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Define props interface
interface Obstacle {
  azimuth: number;
  height: number;
}

interface SunPathDiagramProps {
  latitude: number;
  obstacles: Obstacle[];
  onObstacleChange: (obstacles: Obstacle[]) => void;
}

interface SunPathData {
  azimuth: number;
  altitude: number;
  month?: number; // Optional for coloring based on month
  color?: string; // Optional for coloring
  isObstacle?: boolean; // Optional for obstacle identification
}

const SunPathDiagram: React.FC<SunPathDiagramProps> = ({
  latitude,
  obstacles,
  onObstacleChange,
}) => {
  const height = 600;

  useEffect(() => {
    generateSunPathData();
  }, [latitude, obstacles]);

  const generateSunPathData = (): SunPathData[] => {
    const sunPathData: SunPathData[] = []; // Explicitly typing the array
    const monthsColors = [
      "#EE82EE", "#FF8C69", "#8B4513", "#008000",
      "#87CEEB", "#FF0000", "#4B0082", "#0000FF"
    ];

    for (let monthIndex = 0; monthIndex < 8; monthIndex++) {
      const sunData: SunPathData[] = calculateSunPathData(monthIndex);
      sunData.forEach((point) => {
        sunPathData.push({
          ...point,
          month: monthIndex,
          color: monthsColors[monthIndex],
        });
      });
    }

    return sunPathData;
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
        180) / Math.PI
    );
  };

  const drawStaticObstacles = () => {
    return obstacles.map((obstacle) => ({
      azimuth: obstacle.azimuth,
      altitude: obstacle.height,
      color: "grey",
      isObstacle: true,
    }));
  };

  const sunPathData = generateSunPathData();
  const obstacleData = drawStaticObstacles();

  const combinedData = [...sunPathData, ...obstacleData];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="azimuth" />
        <YAxis domain={[0, 90]} />
        <Tooltip />
        <Legend />
        {combinedData.map((data, index) => (
          !data.isObstacle ? (
            <Line
              key={`line-${index}`}
              type="monotone"
              dataKey="altitude"
              stroke={data.color}
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          ) : (
            <Line
              key={`obstacle-${index}`}
              type="monotone"
              dataKey="altitude"
              stroke="grey"
              strokeWidth={5}
            />
          )
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SunPathDiagram;
