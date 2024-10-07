import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartProps {
  data: Array<{ azimuth: string; height: number }>;
}

const BarChartComponent: React.FC<BarChartProps> = ({ data }) => {
  // Define custom ticks for the Y-axis
  const yTicks = Array.from({ length: 10 }, (_, index) => index * 10); 

  // Define the custom xTicks array as specified
  const xTicks = [
    30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
    195, 210, 225, 240, 255, 270, 285, 300, 315, 330
  ];

  return (
    <ResponsiveContainer width="100%" height={760}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        {/* CartesianGrid with custom tick values */}
        <CartesianGrid strokeDasharray="3 3" />

        {/* X-axis with custom ticks but without rendering the tick labels */}
        <XAxis
          dataKey="azimuth"
          type="number"
          domain={[30, 330]}
          ticks={xTicks}
          allowDecimals={false}
          tick={false}
        />

        {/* Y-axis with custom ticks and domain */}
        <YAxis domain={[0, 90]} ticks={yTicks} tick={false}/>

        <Tooltip />
        <Legend />

        {/* Bar representing height */}
        <Bar dataKey="height" fill="#808080" barSize={15} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
