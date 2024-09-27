"use client";
import { useState } from "react";
//import MapComponent from "@/components/ui/Map";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SolarDiagram from "@/components/ui/SolarDiagram";

// app/(etude)/page.tsx
import dynamic from "next/dynamic";
import SunPathDiagram from "@/components/ui/SunPathDiagram";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";

// Dynamically import the Map component without SSR
const DynamicMap = dynamic(() => import("@/components/ui/Map"), { ssr: false });

// Define interfaces for the data structure
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

export default function Home() {
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 0, lng: 0 });
  const [showObstacleInputs, setShowObstacleInputs] = useState(false);
  const [useTerrainShadows, setUseTerrainShadows] = useState("oui");
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { azimuth: 0, height: 0 },
  ]);

  const [puissancePv, setPuissancePv] = useState("");
  const [systemLosses, setSystemLosses] = useState("");
  const [inclinaison, setInclinaison] = useState("");
  const [azimut, setAzimut] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [selectedChart, setSelectedChart] = useState<
    "production" | "irradiation" | "variability"
  >("production");

  const handlePositionChange = (position: { lat: number; lng: number }) => {
    setClickedPosition(position);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value); // Parse the input as a floating-point number

    // Only update if the parsed value is a valid number
    if (!isNaN(numValue)) {
      if (name === "latitude") {
        setClickedPosition((prev) => ({
          ...prev,
          lat: numValue,
        }));
      } else if (name === "longitude") {
        setClickedPosition((prev) => ({
          ...prev,
          lng: numValue,
        }));
      }
    }
  };

  const handleTerrainShadowsChange = (value: string) => {
    setUseTerrainShadows(value);
    setShowObstacleInputs(value === "non");
  };

  const addObstacle = () => {
    setObstacles([...obstacles, { azimuth: 0, height: 0 }]);
  };

  const onObstacleChange = (newObstacles: Obstacle[]) => {
    setObstacles(newObstacles);
  };

  // This function now only takes one argument (the array of obstacles).
  const handleObstacleChange = (
    index: number,
    field: "azimuth" | "height",
    value: string
  ) => {
    const updatedObstacles = obstacles.map(
      (obstacle, i) =>
        i === index ? { ...obstacle, [field]: parseFloat(value) } : obstacle // Ensure value is a number if needed
    );

    // Update obstacles through the onObstacleChange callback.
    onObstacleChange(updatedObstacles);
  };

  const azimuthList = obstacles.map((obstacle) => obstacle.height).join(",");

  const handleVisualiserResultats = async () => {
    const requestData = {
      lat: clickedPosition?.lat,
      lon: clickedPosition?.lng,
      peakpower: parseFloat(puissancePv),
      loss: parseFloat(systemLosses),
      angle: parseFloat(inclinaison),
      aspect: parseFloat(azimut),
      outputformat: "json",
      usehorizon: useTerrainShadows === "oui" ? 0 : 1,
      ...(useTerrainShadows !== "oui" ? { userhorizon: azimuthList } : {}),
    };

    try {
      const response = await fetch("https://solaire.mafatec.com/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      console.log("Solar energy output result:", result);
    } catch (error) {
      console.error("Error while fetching results:", error);
    }
  };

  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  // Function to prepare chart data
  const prepareChartData = (
    type: "production" | "irradiation" | "variability"
  ) => {
    if (!data || !data.outputs?.monthly.fixed) return [];
    return data.outputs.monthly.fixed.map((monthData, index) => ({
      month: monthNames[monthData.month - 1],
      value:
        type === "production"
          ? monthData.E_m
          : type === "irradiation"
          ? monthData["H(i)_m"]
          : monthData.SD_m,
    }));
  };

  const chartData = prepareChartData(selectedChart);

  return (
    <>
      <Header />
      <div className="max-w-[1200px] mx-auto flex flex-col mb-2">
        <h1 className="text-center text-4xl font-bold lg:p-10 p-2">
          Étude de Production Photovoltaïque
        </h1>
        <main className="flex lg:flex-row flex-col gap-2   lg:p-10 p-2">
          {/* Left Side (Form) */}
          <div className="lg:w-[40%] w-full flex flex-col gap-6 lg:overflow-y-auto lg:p-10 p-2 no-scrollbar">
            <h2 className="font-semibold text-black text-2xl">ADRESSE</h2>
            <p className="italic font-medium text-[#0F427C]">
              Veuillez sélectionner votre position exacte sur la carte ou entrer
              les coordonnées exactes de latitude et longitude de votre adresse.
            </p>
            <div>
              <Label>
                Latitude <span className="text-red-500">*</span>
              </Label>
              <Input
                className="mt-2"
                name="latitude"
                placeholder="Enter latitude"
                value={clickedPosition.lat}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>
                Longitude <span className="text-red-500">*</span>
              </Label>
              <Input
                className="mt-2"
                name="longitude"
                placeholder="Enter longitude"
                value={clickedPosition.lng}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex justify-between">
              <h2 className="font-semibold text-black text-2xl">
                Utiliser les ombres du terrain
              </h2>
              {showObstacleInputs && (
                <Button
                  onClick={addObstacle}
                  className="bg-[#0F427C] text-white"
                >
                  Ajouter un obstacle
                </Button>
              )}
            </div>
            <div className="flex justify-between">
              <p className=" text-black">
                Calcul automatique de l'horizon{" "}
                <span className="text-red-500">*</span>
              </p>
              <RadioGroup
                onValueChange={(value) => handleTerrainShadowsChange(value)}
                className="flex gap-6"
                value={useTerrainShadows}
              >
                <div>
                  <RadioGroupItem value="oui" id="oui" />
                  <Label htmlFor="oui">Oui</Label>
                </div>
                <div>
                  <RadioGroupItem value="non" id="non" />
                  <Label htmlFor="non">Non</Label>
                </div>
              </RadioGroup>
            </div>
            {showObstacleInputs && (
              <div className="mt-4">
                {obstacles.map((obstacle, index) => (
                  <div key={index} className="flex flex-col gap-4 mb-4">
                    <div>
                      <Label>
                        Azimut <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className=" mt-2"
                        placeholder={`Azimut (°) - Obstacle ${index + 1}`}
                        value={obstacle.azimuth}
                        onChange={(e) =>
                          handleObstacleChange(index, "azimuth", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>
                        Hauteur <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className=" mt-2"
                        placeholder={`Hauteur (m) - Obstacle ${index + 1}`}
                        value={obstacle.height}
                        onChange={(e) =>
                          handleObstacleChange(index, "height", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-semibold text-black text-2xl">
              PERFORMANCE DU SYSTÈME PV
            </h2>
            <p className="italic font-medium text-[#0F427C]">
              Veuillez indiquer la puissance souhaitée pour l'installation.
            </p>
            <div>
              <Label>
                Puissance PV crête installée [kW]{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                className=" mt-2"
                value={puissancePv}
                onChange={(e) => setPuissancePv(e.target.value)}
                placeholder="Puissance PV"
              />
            </div>
            <div>
              <Label>
                Pertes du système [%] <span className="text-red-500">*</span>
              </Label>
              <Input
                className=" mt-2"
                value={systemLosses}
                onChange={(e) => setSystemLosses(e.target.value)}
                placeholder="Pertes du système"
              />
            </div>

            <h2 className="font-semibold text-black text-2xl">
              PARAMÈTRES INCLINAISON ET AZIMUT
            </h2>
            <div>
              <Label>
                Inclinaison [°] <span className="text-red-500">*</span>
              </Label>
              <Input
                className=" mt-2"
                value={inclinaison}
                onChange={(e) => setInclinaison(e.target.value)}
                placeholder="Inclinaison"
              />
            </div>
            <div>
              <Label>
                Azimut [°] <span className="text-red-500">*</span>
              </Label>
              <Input
                className=" mt-2"
                value={azimut}
                onChange={(e) => setAzimut(e.target.value)}
                placeholder="Azimut"
              />
            </div>

            <Button
              onClick={handleVisualiserResultats}
              className=" bg-black text-white mt-6"
            >
              Visualiser Résultats
            </Button>
          </div>

          {/* Right Side (Map) */}
          <div className="lg:w-[60%] w-full ">
            <DynamicMap onPositionChange={handlePositionChange} />
          </div>
        </main>
        {data && (
          <>
            <div className="h-full">
              <div className="lg:px-20 lg:py-5 px-0 py-0 flex lg:flex-row flex-col justify-between gap-4">
                <div className="lg:w-[30%] w-full p-6 bg-slate-50 rounded-xl">
                  <h2 className="text-xl font-bold text-[#0f459e] ">
                    Entrées fournies
                  </h2>
                  <ul>
                    <li>
                      <span>Latitude:</span> {data.inputs.location.latitude}
                    </li>
                    <li>
                      <span>Longitude:</span> {data.inputs.location.longitude}
                    </li>
                    <li>
                      <span>Horizon:</span> Calculé
                    </li>
                    <li>
                      <span>PV installée:</span>{" "}
                      {data.inputs.pv_module.peak_power} kWc
                    </li>
                    <li>
                      <span>Pertes du système:</span>{" "}
                      {data.inputs.pv_module.system_loss} %
                    </li>
                  </ul>
                </div>
                <div className="lg:w-[30%] w-full p-6 bg-slate-50 rounded-xl">
                  <h2 className="text-xl font-bold text-[#0f459e] ">
                    Résultats de la simulation
                  </h2>
                  <ul>
                    <li>
                      <span>Angle d’inclinaison:</span>{" "}
                      {Math.round(data.outputs.totals.fixed.E_d)}
                    </li>
                    <li>
                      <span>Angle d’azimut:</span> {azimut}
                    </li>
                    <li>
                      <span>Production annuelle PV:</span>{" "}
                      {data.outputs.totals.fixed.E_y}
                    </li>
                    <li>
                      <span>Irradiation annuelle:</span>{" "}
                      {data.outputs.totals.fixed["H(i)_y"]}
                    </li>
                    <li>
                      <span>Variabilité interannuelle:</span>{" "}
                      {data.outputs.totals.fixed.SD_y}
                    </li>
                  </ul>
                </div>
                <div className="lg:w-[30%] w-full p-6 bg-slate-50 rounded-xl">
                  <h2 className="text-xl font-bold text-[#0f459e] ">
                    Changements de la production à cause de
                  </h2>
                  <ul>
                    <li>
                      <span>Angle d’incidence:</span>{" "}
                      {data.outputs.totals.fixed.l_aoi}
                    </li>
                    <li>
                      <span>Effets spectraux:</span>{" "}
                      {data.outputs.totals.fixed.l_spec}
                    </li>
                    <li>
                      <span>Température et irradiance faible:</span>{" "}
                      {data.outputs.totals.fixed.l_tg}%
                    </li>
                    <li>
                      <span>Pertes totales:</span>{" "}
                      {data.outputs.totals.fixed.l_total}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="lg:px-20 lg:py-5 px-0 py-0 flex lg:flex-col flex-col justify-between">
                <h2 className="text-xl font-bold text-[#0f459e] mb-2">
                  Énergie PV et irradiation solaire mensuelle
                </h2>
                <div className="flex lg:flex-row flex-col justify-center gap-20">
                  <div className="overflow-x-auto lg:w-1/2 w-full">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b">Month</th>
                          <th className="py-2 px-4 border-b">
                            Production (kWh)
                          </th>
                          <th className="py-2 px-4 border-b">
                            Irradiation (kWh/m²)
                          </th>
                          <th className="py-2 px-4 border-b">
                            Variabilité (kWh)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.outputs.monthly.fixed.map(
                          (monthlyData, index) => (
                            <tr key={index} className="border-t">
                              <td className="py-2 px-4 border-b text-center bg-[#0f459e] text-white">
                                {monthNames[index]}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {monthlyData.E_m.toFixed(2)}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {monthlyData["H(i)_m"].toFixed(2)}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {monthlyData.SD_m.toFixed(2)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:w-1/2 w-full flex flex-col gap-6">
                    <div className="flex lg:flex-row flex-col justify-around mb-4 gap-2">
                      <Button
                        onClick={() => setSelectedChart("production")}
                        className={`lg:w-1/3 w-full ${
                          selectedChart === "production"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      >
                        Production (kWh)
                      </Button>
                      <Button
                        onClick={() => setSelectedChart("irradiation")}
                        className={`lg:w-1/3 w-full ${
                          selectedChart === "irradiation"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      >
                        Irradiation (kWh/m²)
                      </Button>
                      <Button
                        onClick={() => setSelectedChart("variability")}
                        className={`lg:w-1/3 w-full ${
                          selectedChart === "variability"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      >
                        Variabilité (kWh)
                      </Button>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#e00814" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <SolarDiagram
              latitude={clickedPosition?.lat ?? 0}
              obstacles={obstacles}
              onObstacleChange={onObstacleChange}
            />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
