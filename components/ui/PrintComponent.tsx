import React, { forwardRef, useRef, useState } from "react";
import { Button } from "./button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SolarDiagram from "./SolarDiagram";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";

// Define types for monthly data and inputs
interface MonthlyData {
  E_m: number;
  "H(i)_m": number;
  SD_m: number;
}

interface Data {
  inputs: {
    economic_data: {
      interest: number | null;
      lifetime: number | null;
      system_cost: number | null;
    };
    location: {
      elevation: number;
      latitude: number;
      longitude: number;
    };
    meteo_data: {
      horizon_db: string;
      meteo_db: string;
      radiation_db: string;
      use_horizon: boolean;
      year_max: number;
      year_min: number;
    };
    mounting_system: {
      fixed: {
        azimuth: {
          optimal: boolean;
          value: number;
        };
        slope: {
          optimal: boolean;
          value: number;
        };
        type: string;
      };
    };
    pv_module: {
      peak_power: number;
      system_loss: number;
      technology: string;
    };
  };
  meta: {
    inputs: {
      economic_data: {
        description: string;
        variables: {
          interest: {
            description: string;
            units: string;
          };
          lifetime: {
            description: string;
            units: string;
          };
          system_cost: {
            description: string;
            units: string;
          };
        };
      };
      location: {
        description: string;
        variables: {
          elevation: {
            description: string;
            units: string;
          };
          latitude: {
            description: string;
            units: string;
          };
          longitude: {
            description: string;
            units: string;
          };
        };
      };
      meteo_data: {
        description: string;
        variables: {
          horizon_db: {
            description: string;
          };
          meteo_db: {
            description: string;
          };
          radiation_db: {
            description: string;
          };
          use_horizon: {
            description: string;
          };
          year_max: {
            description: string;
          };
          year_min: {
            description: string;
          };
        };
      };
      mounting_system: {
        choices: string;
        description: string;
        fields: {
          azimuth: {
            description: string;
            units: string;
          };
          slope: {
            description: string;
            units: string;
          };
        };
      };
      pv_module: {
        description: string;
        variables: {
          peak_power: {
            description: string;
            units: string;
          };
          system_loss: {
            description: string;
            units: string;
          };
          technology: {
            description: string;
          };
        };
      };
    };
    outputs: {
      monthly: {
        timestamp: string;
        type: string;
        variables: {
          E_d: {
            description: string;
            units: string;
          };
          E_m: {
            description: string;
            units: string;
          };
          H_i_d: {
            description: string;
            units: string;
          };
          H_i_m: {
            description: string;
            units: string;
          };
          SD_m: {
            description: string;
            units: string;
          };
        };
      };
      totals: {
        type: string;
        variables: {
          E_d: {
            description: string;
            units: string;
          };
          E_m: {
            description: string;
            units: string;
          };
          E_y: {
            description: string;
            units: string;
          };
          H_i_d: {
            description: string;
            units: string;
          };
          H_i_m: {
            description: string;
            units: string;
          };
          "H(i)_y": {
            description: string;
            units: string;
          };
          SD_m: {
            description: string;
            units: string;
          };
          SD_y: {
            description: string;
            units: string;
          };
          l_aoi: {
            description: string;
            units: string;
          };
          l_spec: {
            description: string;
            units: string;
          };
          l_tg: {
            description: string;
            units: string;
          };
          l_total: {
            description: string;
            units: string;
          };
        };
      };
    };
  };
  outputs: {
    monthly: {
      fixed: Array<{
        E_d: number;
        E_m: number;
        "H(i)_d": number;
        "H(i)_m": number;
        SD_m: number;
        month: number;
      }>;
    };
    totals: {
      fixed: {
        E_d: number;
        E_m: number;
        E_y: number;
        H_i_d: number;
        H_i_m: number;
        "H(i)_y": number;
        SD_m: number;
        SD_y: number;
        l_aoi: number;
        l_spec: string;
        l_tg: number;
        l_total: number;
      };
    };
  };
}

interface Obstacle {
  azimuth: number; // Assuming azimuth is a number
  height: number; // Assuming height is a number
}

interface PrintComponentProps {
  data: Data;
  monthNames: string[];
  azimut: string;
  inclinaison: string;
  error?: string;
  obstacles?: Obstacle[];
}

const PrintComponent = forwardRef<HTMLDivElement, PrintComponentProps>(
  ({ data, monthNames, azimut, inclinaison, error, obstacles }, ref) => {
    const [selectedChart, setSelectedChart] = useState<
      "production" | "irradiation" | "variability"
    >("production");

    console.log(
      "tobstable:",
      obstacles?.map(obstacle => `Azimuth: ${obstacle.azimuth}, Height: ${obstacle.height}`)
    );

    const obstacles2 = obstacles?.map(obstacle => {
      
      return {
        azimuth: obstacle.azimuth,
        height: obstacle.height
      };
    });
    

    const chartData = data.outputs.monthly.fixed.map((monthlyData, index) => ({
      month: monthNames[index],
      value:
        selectedChart === "production"
          ? monthlyData.E_m
          : selectedChart === "irradiation"
          ? monthlyData["H(i)_m"]
          : monthlyData.SD_m,
    }));

    const chartDataProduction = data.outputs.monthly.fixed.map(
      (monthlyData, index) => ({
        month: monthNames[index],
        value: monthlyData.E_m,
      })
    );

    const chartDataIrradiation = data.outputs.monthly.fixed.map(
      (monthlyData, index) => ({
        month: monthNames[index],
        value: monthlyData["H(i)_m"],
      })
    );

    const chartDataVariability = data.outputs.monthly.fixed.map(
      (monthlyData, index) => ({
        month: monthNames[index],
        value: monthlyData.SD_m,
      })
    );

    // Function to generate PDF
    const generatePDF = async () => {
      const element = ref as React.RefObject<HTMLDivElement>; // Use type assertion here
      const currentElement = element.current; // Get the current element

      if (!currentElement) return; // Check if currentElement is null

      const canvas = await html2canvas(currentElement);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 190; // Define image width
      const pageHeight = pdf.internal.pageSize.height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Handle multiple pages if the content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("report.pdf"); // Save PDF with the name 'report.pdf'
    };

    return (
      <div className="">
        <div className="py-4 lg:px-0 px-4 "></div>
        <div className="flex justify-end z-1000 max-w-[1200px] mx-auto px-10">
          <Button onClick={generatePDF} className="mt-4 bg-[#0F427C] text-white !rounded-['10px']">
            <Download className="h-6 w-6 text-white mr-2"/> Télécharger
          </Button>
        </div>
        <div ref={ref} style={{ position: "relative" }}>
        <div className="flex justify-center mb-6">
          <img src='/mafatec-logo-rge.png' alt="rge logo" className="w-[20%] h-auto mt-4 " />
        </div>
          {data && (
            <div>
              <div className="h-full z-10 border-t-gray-500 lg:px-0 px-10">
                <div className="lg:px-20 lg:py-2 px-0 py-0 flex lg:flex-row flex-col justify-between gap-4">
                  {/* Inputs section */}
                  <div className="lg:w-[33%] w-full p-6 bg-slate-50 rounded-xl border boder-[#cfcfcf]">
                    <h2 className="text-xl font-bold text-[#0f459e] mb-[10px] ">
                      Entrées fournies
                    </h2>
                    <ul>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Latitude:</span> {data.inputs.location.latitude}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Longitude:</span> {data.inputs.location.longitude}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Horizon:</span> Calculé
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">PV installée:</span>{" "}
                        {data.inputs.pv_module.peak_power} kWc
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Pertes du système:</span>{" "}
                        {data.inputs.pv_module.system_loss} %
                      </li>
                    </ul>
                  </div>

                  {/* Results section */}
                  <div className="lg:w-[33%] w-full p-6 bg-slate-50 rounded-xl border boder-[#cfcfcf]">
                    <h2 className="text-xl font-bold text-[#0f459e] mb-[10px]">
                      Résultats de la simulation
                    </h2>
                    <ul>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Angle d’inclinaison:</span>{" "}
                        {inclinaison}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Angle d’azimut:</span> {azimut}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Production annuelle PV:</span>{" "}
                        {data.outputs.totals.fixed.E_y}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Irradiation annuelle:</span>{" "}
                        {data.outputs.totals.fixed["H(i)_y"]}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Variabilité interannuelle:</span>{" "}
                        {data.outputs.totals.fixed.SD_y}
                      </li>
                    </ul>
                  </div>

                  {/* Loss section */}
                  <div className="lg:w-[33%] w-full p-6 bg-slate-50 rounded-xl border boder-[#cfcfcf]">
                    <h2 className="text-xl font-bold text-[#0f459e] mb-[10px]">
                      Changements de la production à cause de
                    </h2>
                    <ul>
                      <li className="mb-[5px] text-[#1e3a8a]">
                        <span className="font-[700] text-[14px] text-black">Angle d’incidence:</span>{" "}
                        {data.outputs.totals.fixed.l_aoi}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Effets spectraux:</span>{" "}
                        {data.outputs.totals.fixed.l_spec}
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Température et irradiance faible:</span>{" "}
                        {data.outputs.totals.fixed.l_tg}%
                      </li>
                      <li className="mb-[5px] text-[#1e3a8a]">
                      <span className="font-[700] text-[14px] text-black">Pertes totales:</span>{" "}
                        {data.outputs.totals.fixed.l_total}
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Monthly data section */}
                <div className="lg:px-20 lg:py-5 px-0 py-0 flex lg:flex-col flex-col justify-between">
                  <h2 className="text-xl font-bold text-[#0f459e] mb-[10px]">
                    Énergie PV et irradiation solaire mensuelle
                  </h2>
                  <div className="flex lg:flex-col flex-col justify-center gap-20">
                    {/* Monthly data table */}
                    <div className="overflow-x-auto lg:w-full w-full">
                      <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                          <tr>
                            <th className="p-1 border-b">Month</th>
                            <th className="p-1 border-b">Production (kWh)</th>
                            <th className="p-1 border-b">
                              Irradiation (kWh/m²)
                            </th>
                            <th className="p-1 border-b">Variabilité (kWh)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.outputs.monthly.fixed.map(
                            (monthlyData: MonthlyData, index: number) => (
                              <tr key={index} className="border-t">
                                <td className="capitalize p-1 border-b text-center bg-[#0f459e] text-white items-center">
                                  {monthNames[index]}
                                </td>
                                <td className=" capitalize p-1 border-b text-center items-center">
                                  {monthlyData.E_m.toFixed(2)}
                                </td>
                                <td className="capitalize p-1 border-b text-center items-center">
                                  {monthlyData["H(i)_m"].toFixed(2)}
                                </td>
                                <td className="capitalize p-1 border-b text-center items-center">
                                  {monthlyData.SD_m.toFixed(2)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Chart selection and display */}
                    <div className="lg:w-full w-full flex flex-row justify-between gap-2 mb-2">
                      <div className="w-full lg:w-[40%]">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartDataProduction}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend
                              payload={[
                                {
                                  value: "Production (kWh)",
                                  type: "circle",
                                  color: "#ff8b01ff",
                                },
                              ]}
                            />
                            <Bar dataKey="value" fill="#ff8b01ff" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full lg:w-[40%]">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartDataIrradiation}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend
                              payload={[
                                {
                                  value: "Irradiation (kWh/m²)",
                                  type: "circle",
                                  color: "#ffc700ff",
                                },
                              ]}
                            />
                            <Bar dataKey="value" fill="#ffc700ff" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full lg:w-[40%]">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartDataVariability}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend
                              payload={[
                                {
                                  value: "Variabilité (kWh)",
                                  type: "circle",
                                  color: "#0faa58ff",
                                },
                              ]}
                            />
                            <Bar dataKey="value" fill="#0faa58ff" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SolarDiagram
                latitude={data.inputs.location.latitude}
                obstacles={obstacles2 || []}  // Adjust based on your implementation
                onObstacleChange={() => {}} // Adjust based on your implementation
              />
            </div>
          )}
        </div>

      </div>
    );
  }
);

export default PrintComponent;
