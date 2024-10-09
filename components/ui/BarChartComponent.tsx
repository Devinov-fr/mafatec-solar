import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: Array<{ azimuth: string; height: number }>;
}

const BarChartComponent: React.FC<BarChartProps> = ({ data }) => {
  // Define custom ticks for the Y-axis
  const yTicks = Array.from({ length: 10 }, (_, index) => index * 10);

  // Define the custom xTicks array as specified
  const xTicks = [
    30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255,
    270, 285, 300, 315, 330,
  ];

    // Custom Tooltip content
    const CustomTooltip = ({ payload, label }: any) => {
      if (payload && payload.length > 0) {
        const height = payload[0].value;  // Height value
        const azimuth = label;           // Azimuth from X-axis
  
        return (
          <div className="custom-tooltip bg-white p-2">
            <p className="label">Hauteur: {height}</p>
            <p className="label">Azimuth: {azimuth}</p>
          </div>
        );
      }
      return null;
    };

  return (
    <ResponsiveContainer width={878} height={610}>
      <BarChart
        data={data}
        margin={{
          top: 70,
          right: 0,
          left: 4,
          bottom: 7,
        }}
      >
        {/* CartesianGrid with custom tick values */}
        <CartesianGrid strokeDasharray="3 3" />

        {/* X-axis with custom ticks */}
        <XAxis
          dataKey="azimuth"
          type="number"
          domain={[30, 330]}
          ticks={xTicks}
          interval={0}
          allowDecimals={false}
          tick={false}
          includeHidden
        />

        {/* Y-axis with custom ticks and domain */}
        <YAxis domain={[0, 90]} ticks={yTicks} tick={false} />

        {/* Custom Tooltip */}
        <Tooltip content={<CustomTooltip />} />

        {/* Bar representing height */}
        <Bar dataKey="height" fill="#808080" barSize={15} name="Hauteur" isAnimationActive={false}/>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
