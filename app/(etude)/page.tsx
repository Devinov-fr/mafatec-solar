"use client";
import { useEffect, useRef, useState } from "react";
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
import ReactToPrint from "react-to-print";
// app/(etude)/page.tsx
import dynamic from "next/dynamic";
import SunPathDiagram from "@/components/ui/SunPathDiagram";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import PrintComponent from "@/components/ui/PrintComponent";
import { Plus, Trash, TrashIcon } from "lucide-react";
import Hero from "@/components/ui/Hero";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import PrintComponentTwo from "@/components/ui/PrintComponentTwo";

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

interface ObstacleError {
  azimuth: boolean;
  height: boolean;
}

interface Obstacle {
  azimuth: number | null;
  height: number | null;
  points: { azimuth: number | null; height: number | null }[];
}

interface AddressAutocompleteProps {
  onAddressSelect: (lat: number, lng: number) => void; // Ensure this prop is defined
}

const Home = () => {
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 0, lng: 0 });
  const [showObstacleInputs, setShowObstacleInputs] = useState(false);
  const [useTerrainShadows, setUseTerrainShadows] = useState("oui");
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { azimuth: 0, height: 0, points: [{ azimuth: 0, height: 0 }] },
  ]);
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [puissancePv, setPuissancePv] = useState("");
  const [systemLosses, setSystemLosses] = useState("14");
  const [inclinaison, setInclinaison] = useState("35");
  const [azimut, setAzimut] = useState("0");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [errorAzimuth, setErrorAzimuth] = useState("");
  const [formErrors, setFormErrors] = useState({
    puissancePv: false,
    systemLosses: false,
    azimut: false,
    obstacles: [{ azimuth: false, height: false }],
    inclinaison: false,
  });
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [selectedChart, setSelectedChart] = useState<
    "production" | "irradiation" | "variability"
  >("production");

  console.log("tobstable first", obstacles);

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

  /*const addObstacle = () => {
    setObstacles([...obstacles, { azimuth: 0, height: 0 }]);
  };*/

  const addObstacle = () => {
    setObstacles([
      ...obstacles,
      {
        azimuth: 0,
        height: 0,
        points: [
          {
            azimuth: 0, // Set to a default number
            height: 0, // Set to a default number
          },
        ],
      },
    ]);
  };

  const removeObstacle = (indexToRemove: number) => {
    setObstacles(obstacles.filter((_, index) => index !== indexToRemove));
  };

  // Function to add points to a specific obstacle
  const addPointToObstacle = (obstacleIndex: number) => {
    const updatedObstacles = obstacles.map((obstacle, index) =>
      index === obstacleIndex
        ? {
            ...obstacle,
            points: [...obstacle.points, { azimuth: 0, height: 0 }], // Add new point with default values
          }
        : obstacle
    );
    setObstacles(updatedObstacles);
  };

  const onObstacleChange = (newObstacles: Obstacle[]) => {
    setObstacles(newObstacles);
  };

  // This function now only takes one argument (the array of obstacles).
  /*const handleObstacleChange = (
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
  };*/

  // Function to handle changes in obstacle or point properties
  const handleObstacleChange = (
    index: number,
    field: "azimuth" | "height",
    value: string
  ) => {
    const updatedObstacles = obstacles.map((obstacle, i) =>
      i === index ? { ...obstacle, [field]: parseFloat(value) } : obstacle
    );
    setObstacles(updatedObstacles);
  };

  const handlePointChange = (
    obstacleIndex: number,
    pointIndex: number,
    field: "azimuth" | "height",
    value: string
  ) => {
    const updatedObstacles = [...obstacles];

    // Convert the input to a number or set it to null if the value is empty
    const numericValue = value === "" ? null : parseFloat(value);

    if (updatedObstacles[obstacleIndex].points[pointIndex]) {
      updatedObstacles[obstacleIndex].points[pointIndex][field] = numericValue;
    }

    setObstacles(updatedObstacles);
  };

  const azimuthList = obstacles.map((obstacle) => obstacle.height).join(",");

  const validateForm = () => {
    // Specify the type for obstacleErrors
    const obstacleErrors: ObstacleError[] = []; // Set to an empty array since we want to ignore obstacles

    const newFormErrors = {
      puissancePv: puissancePv.trim() === "",
      systemLosses: systemLosses.trim() === "",
      azimut: azimut.trim() === "",
      obstacles: obstacleErrors, // Set empty errors for obstacles
      inclinaison: inclinaison.trim() === "",
    };

    setFormErrors(newFormErrors);

    // Check for any errors
    return !Object.values(newFormErrors).some((error) =>
      typeof error === "boolean" ? error : error.some(Boolean)
    );
  };

  const handleVisualiserResultats = async () => {
    // Validate form before submission
    if (!validateForm()) {
      setError("Veuillez remplir les champs manquants.");
      return;
    }

    const requestData = {
      lat: clickedPosition.lat,
      lon: clickedPosition.lng,
      peakpower: parseFloat(puissancePv),
      loss: parseFloat(systemLosses),
      angle: parseFloat(inclinaison),
      aspect: parseFloat(azimut),
      outputformat: "json",
      usehorizon: useTerrainShadows === "oui" ? 0 : 1,
      userhorizon:
        useTerrainShadows !== "oui"
          ? obstacles.map((o) => o.height).join(",")
          : "0",
    };

    try {
      const response = await fetch(
        "/pvgis/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("result", result);
      {
        result.error &&
          setError(
            "Veuillez sélectionner votre adresse sur la carte ou entrer sa latitude et longitude exacte."
          );
      }

      setData(result);
      //setError(""); // Clear error if submission is successful
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

  const handleAddressSelect = (lat: number, lng: number) => {
    setClickedPosition({ lat, lng }); // Set clickedPosition here
    //onAddressSelect(lat, lng);
    console.log(`Latitudesss: ${lat}, Longitude: ${lng}`);
  };

  console.log("error", error);

  useEffect(() => {
    if (data && !error) {
      // Trigger the regeneration or any effect you need when data changes
      console.log("Data changed, regenerating component...");
    }
  }, [data, error]);

  // Function to remove a point from an obstacle
  const removePointFromObstacle = (
    obstacleIndex: number,
    pointIndex: number
  ) => {
    const updatedObstacles = obstacles.map((obstacle, oIndex) =>
      oIndex === obstacleIndex
        ? {
            ...obstacle,
            points: obstacle.points.filter(
              (_, pIndex) => pIndex !== pointIndex
            ),
          }
        : obstacle
    );
    setObstacles(updatedObstacles);
  };

  console.log("obstacles", obstacles);

  const handleAzimutChange = (e: any) => {
    const rawValue = e.target.value; // Get the raw string input
    setError(""); // Clear the error initially

    if (rawValue === "-" || rawValue === "") {
      // Allow user to type just '-' or clear input
      setAzimut(rawValue);
      return;
    }

    let value = Number(rawValue); // Convert to number for validation
    if (isNaN(value)) value = 0; // Handle invalid input

    if (value > 180 || value < -180) {
      // Set error if the value is out of range
      setErrorAzimuth("L'azimut doit être compris entre -180° et 180°.");
    }

    // Clamp values to the range [-180, 180]
    if (value > 180) value = 180;
    if (value < -180) value = -180;

    setAzimut(value.toString()); // Convert back to string before updating state
  };

  return (
    <div>
      <Header />
      <Hero />
      <div className="max-w-[1200px] mx-auto flex flex-col mb-2 ">
        <main className="flex lg:flex-row flex-col gap-[10px] lg:px-10 pb-4 lg:pt-10 p-2 mt-[40px]">
          {/* Right Side (Map) */}
          <div className="lg:w-[30%] w-full rounded-[20px] ">
            <DynamicMap onPositionChange={handlePositionChange} />
          </div>

          {/* Left Side (Form) */}
          <div className="bg-[#f8f9fa] rounded-[10px] lg:w-[30%] w-full flex flex-col gap-[ 0.8rem] lg:overflow-y-auto p-[30px] shadow-[0_4px_10px_rgba(0,0,0,0.2)] no-scrollbar">
            <h2 className="font-semibold text-[#0f427c] text-[1.1rem] underline">
              ADRESSE
            </h2>
            <p className="italic font-medium text-[#008f31] text-[13px] mb-[20px]">
              Veuillez sélectionner votre adresse sur la carte ou entrer sa
              latitude et longitude exacte.
            </p>
            <AddressAutocomplete onAddressSelect={handleAddressSelect} />
            <div className="flex justify-between gap-2">
              <div>
                <Label className="text-[13px] ">
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
                <Label className="text-[13px] ">
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
            </div>

            {error &&
              error ===
                "Veuillez sélectionner votre adresse sur la carte ou entrer sa latitude et longitude exacte." && (
                <p className="text-red-500 mt-2">{error}</p>
              )}

            <div className="h-[10px] border-b-[3px] border-[#d4d4d4] my-[10px]"></div>
            <div className="flex justify-between">
              <h2 className="font-semibold text-black text-[1.2rem]  mb-[10px] ">
                Utilisier les ombres du terrain
              </h2>
            </div>
            <div className="flex justify-between">
              <Label className="text-[13px] text-wrap">
                Calcul automatique de l'horizon{" "}
                <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                onValueChange={(value) => handleTerrainShadowsChange(value)}
                className="flex gap-2"
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
            {/*<div className="flex justify-between items-center font-semibold mt-[30px]">
              {showObstacleInputs && (
                <h2 className="font-semibold text-[#0f427c] text-[1.1rem] underline uppercase">
                  Obstacles
                </h2>
              )}
              {showObstacleInputs && (
                <Button
                  onClick={addObstacle}
                  className="bg-[#0F427C] text-white text-[40px] p-2"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              )}
            </div>
            {showObstacleInputs && (
              <div>
                {obstacles.map((obstacle, index) => (
                  <div key={index} className="flex flex-col gap-4 mb-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-green-600 italic mt-[10px] mb-[-15px]">
                        Obstacle {index + 1}
                      </h3>

                    </div>
                    <div className="flex justify-between items-center gap-2 mt-[-10px]">
                      <div>
                        <Label className="text-[13px]">
                          Azimut [°] <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          className={`mt-0 ${
                            formErrors.obstacles?.[index]?.azimuth
                              ? "border-red-500 border-2"
                              : ""
                          }`}
                          placeholder="Azimut °"
                          value={obstacle.azimuth}
                          onChange={(e) =>
                            handleObstacleChange(
                              index,
                              "azimuth",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[13px]">
                          Hauteur [°] <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          className={`mt-0 ${
                            formErrors.obstacles?.[index]?.height
                              ? "border-red-500 border-2"
                              : ""
                          }`}
                          placeholder="Hauteur °"
                          value={obstacle.height}
                          onChange={(e) =>
                            handleObstacleChange(
                              index,
                              "height",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <button
                        onClick={() => removeObstacle(index)}
                        className="text-red-500"
                      >
                        <Trash className="h-5 w-5 mt-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}*/}

            {showObstacleInputs && (
              <div>
                <div className="flex justify-between mt-2 items-center">
                  {/* Section Header */}
                  <h2 className="font-semibold text-[#0f427c] text-[1.1rem] underline uppercase">
                    Obstacles
                  </h2>

                  {/* Button to Add Obstacle */}
                  <Button
                    onClick={addObstacle}
                    className="bg-transparent text-white text-[40px] p-2 hover:text-[#0f427c] hover:bg-gray-200"
                  >
                    <Plus className="h-6 w-6 text-[#0f427c]" />
                  </Button>
                </div>

                {obstacles.map((obstacle, obstacleIndex) => (
                  <div
                    key={obstacleIndex}
                    className="mb-4 border-b border-gray-300 pb-4"
                  >
                    {/* Obstacle Title and Remove Button */}
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-[1.1rem] text-[#0f427c]">
                        Obstacle {obstacleIndex + 1}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => removeObstacle(obstacleIndex)}
                          className="bg-transparent text-white p-2 hover:bg-gray-200 hover:text-red-500"
                        >
                          <TrashIcon className="h-5 w-5 text-red-500" />
                        </Button>
                        <Button
                          onClick={() => addPointToObstacle(obstacleIndex)}
                          className="bg-transparent text-white text-[40px] p-2 hover:text-[#0f427c] hover:bg-gray-200"
                        >
                          <Plus className="h-6 w-6 text-[#0f427c]" />
                        </Button>
                      </div>
                    </div>

                    {/* Points for this obstacle */}
                    <div className="">
                      {obstacle.points.map((point, pointIndex) => (
                        <div
                          key={pointIndex}
                          className="flex gap-4  mb-2 items-center"
                        >
                          <div>
                            <Label>Azimuth</Label>
                            <Input
                              name="point-azimuth"
                              value={point.azimuth ?? ""}
                              onChange={(e) =>
                                handlePointChange(
                                  obstacleIndex,
                                  pointIndex,
                                  "azimuth",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Height</Label>
                            <Input
                              name="point-height"
                              value={point.height ?? ""}
                              onChange={(e) =>
                                handlePointChange(
                                  obstacleIndex,
                                  pointIndex,
                                  "height",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <Button
                            onClick={() =>
                              removePointFromObstacle(obstacleIndex, pointIndex)
                            }
                            className="bg-transparent text-white p-2 hover:bg-gray-200 hover:text-red-500 mt-4"
                          >
                            <TrashIcon className="h-5 w-5 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#f8f9fa] rounded-[10px] lg:w-[39%] w-full flex flex-col gap-[ 0.8rem] lg:overflow-y-auto  p-[30px] shadow-[0_4px_10px_rgba(0,0,0,0.2)] no-scrollbar">
            <h2 className="font-semibold text-[#0f427c] text-[1.1rem] underline ">
              PERFORMANCE DU SYSTÈME PV
            </h2>
            <p className="italic font-medium text-[#008f31] text-[13px] mb-[20px]">
              Veuillez indiquer la puissance souhaitée pour l'installation.
            </p>
            <div>
              <Label className="text-[13px]">
                Puissance PV crête installée [kW]{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`mt-2 ${
                  formErrors.puissancePv ? "border-red-500 border-2" : ""
                }`}
                value={puissancePv}
                onChange={(e) => setPuissancePv(e.target.value)}
                placeholder="Puissance PV"
              />
            </div>
            <div>
              <Label className="text-[13px]">
                Pertes du système [%] <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`mt-2 ${
                  formErrors.systemLosses ? "border-red-500 border-2" : ""
                }`}
                value={systemLosses}
                onChange={(e) => setSystemLosses(e.target.value)}
                placeholder="Pertes du système"
              />
            </div>

            <div className="h-[10px] border-b-[3px] border-[#d4d4d4] my-[10px]"></div>

            <div className="flex justify-between gap-2">
              <div>
                <Label className="text-[13px]">
                  Inclinaison [°] <span className="text-red-500">*</span>
                </Label>
                <Input
                  className={`mt-2 ${
                    formErrors.inclinaison ? "border-red-500 border-2 " : ""
                  }`}
                  value={inclinaison}
                  onChange={(e) => setInclinaison(e.target.value)}
                  placeholder="Inclinaison"
                />
              </div>
              <div>
                <Label className="text-[13px]">
                  Azimut [°] <span className="text-red-500">*</span>
                </Label>
                <Input
                  className={`mt-2 ${error || errorAzimuth ? "border-red-500 border-2" : ""}`}
                  value={azimut} // Keep as string for the input
                  onChange={handleAzimutChange}
                  placeholder="Azimut"
                />
              </div>
            </div>
            {error && error === "Veuillez remplir les champs manquants." && (
              <p className="text-red-500 mt-2">{error}</p>
            )}
            {errorAzimuth && (
              <p className="text-red-500 mt-2">{errorAzimuth}</p>
            )}
          </div>
        </main>
        <div className="flex justify-end  w-full mx-auto lg:px-10 px-2 z-[1000]">
          <Button
            onClick={handleVisualiserResultats}
            className=" bg-[#008F31] text-white  lg:w-[39%] w-full ml-8 !rounded-['10px']"
          >
            Visualiser Résultats
          </Button>
        </div>

        {data && !error && (
          <PrintComponentTwo
            data={data}
            monthNames={monthNames}
            azimut={azimut}
            ref={componentRef}
            inclinaison={inclinaison}
            error={error}
            obstacles={obstacles}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Home;
