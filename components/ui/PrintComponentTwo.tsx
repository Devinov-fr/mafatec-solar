import React, { forwardRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Download } from "lucide-react";
import Altitude42 from "./Altitude42";
import Altitude43 from "./Altitude43";
import Altitude44 from "./Altitude44";
import Altitude45 from "./Altitude45";
import Altitude47 from "./Altitude47";
import Altitude46 from "./Altitude46";
import Altitude48 from "./Altitude48";
import Altitude49 from "./Altitude49";
import Altitude50 from "./Altitude50";
import Altitude51 from "./Altitude51";
import ReactToPrint from "react-to-print";

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
  azimuth: number | null;
  height: number | null;
  points: { azimuth: number | null; height: number | null }[];
}

// ✅ Interface pour les résultats de chute de tension
interface VoltageDropResult {
  vdrop: string | null;
  vdropPct: string | null;
  rwire: string | null;
}

interface PrintComponentProps {
  data: Data;
  monthNames: string[];
  azimut: string;
  inclinaison: string;
  error?: string;
  obstacles?: Obstacle[];
  // ✅ Résultats de la chute de tension (optionnel)
  voltageDropResult?: VoltageDropResult | null;
}

// Forward ref component
const PrintComponentTwo = forwardRef<HTMLDivElement, PrintComponentProps>(
  (
    {
      data,
      monthNames,
      azimut,
      inclinaison,
      error,
      obstacles = [],
      voltageDropResult,
    },
    ref
  ) => {
    const [selectedChart] = useState<
      "production" | "irradiation" | "variability"
    >("production");

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

    const componentRef = ref as React.MutableRefObject<HTMLDivElement>;
    console.log("componentRef", componentRef);

    return (
      <div className="">
        <div className="py-4 lg:px-0 px-4 "></div>
        <div className="flex justify-end z-1000 max-w-[1200px] mx-auto px-10">
          <ReactToPrint
            trigger={() => (
              <button className="mt-4 bg-[#0F427C] text-white flex items-center gap-2 px-3 py-2 rounded-md shadow-sm hover:bg-[#0c3260] transition">
                <Download className="h-5 w-5 text-white" />
                <span className="text-sm font-medium">Télécharger</span>
              </button>
            )}
            content={() => componentRef.current}
          />
        </div>
        <div ref={ref} style={{ position: "relative" }}>
          <div className="flex justify-center mb-6">
            <img
              src="/mafatec-logo-rge.png"
              alt="rge logo"
              className="w-[20%] h-auto mt-4 "
            />
          </div>

          {data && (
            <div className="pb-6">
              <div className="h-full z-10 border-t-gray-500 lg:px-0 px-4">
                {/* Bloc cartes */}
                <div className="lg:px-16 lg:py-4 px-0 py-3">
                  <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-4">
                    {/* Carte 1 – Entrées fournies */}
                    <div className="lg:w-1/4 w-full p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <h2 className="text-sm font-semibold text-[#0f459e] mb-2 uppercase tracking-wide">
                        Entrées fournies
                      </h2>
                      <div className="h-[1px] w-12 bg-[#0f459e] rounded-full mb-3" />
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        <li>
                          <span className="font-semibold text-slate-900">
                            Latitude :
                          </span>{" "}
                          {data.inputs.location.latitude}
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Longitude :
                          </span>{" "}
                          {data.inputs.location.longitude}
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Horizon :
                          </span>{" "}
                          Calculé
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            PV installée :
                          </span>{" "}
                          {data.inputs.pv_module.peak_power} kWc
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Pertes système :
                          </span>{" "}
                          {data.inputs.pv_module.system_loss} %
                        </li>
                      </ul>
                    </div>

                    {/* Carte 2 – Résultats de la simulation */}
                    <div className="lg:w-1/4 w-full p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <h2 className="text-sm font-semibold text-[#0f459e] mb-2 uppercase tracking-wide">
                        Résultats de la simulation
                      </h2>
                      <div className="h-[1px] w-12 bg-[#0f459e] rounded-full mb-3" />
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        <li>
                          <span className="font-semibold text-slate-900">
                            Inclinaison :
                          </span>{" "}
                          {inclinaison}°
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Azimut :
                          </span>{" "}
                          {azimut}°
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Production annuelle :
                          </span>{" "}
                          {data.outputs.totals.fixed.E_y} kWh
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Irradiation annuelle :
                          </span>{" "}
                          {data.outputs.totals.fixed["H(i)_y"]} kWh/m²
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Variabilité interannuelle :
                          </span>{" "}
                          {data.outputs.totals.fixed.SD_y}
                        </li>
                      </ul>
                    </div>

                    {/* Carte 3 – Changements de la production */}
                    <div className="lg:w-1/4 w-full p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <h2 className="text-sm font-semibold text-[#0f459e] mb-2 uppercase tracking-wide">
                        Changements de la production
                      </h2>
                      <div className="h-[1px] w-12 bg-[#0f459e] rounded-full mb-3" />
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        <li>
                          <span className="font-semibold text-slate-900">
                            Angle d’incidence :
                          </span>{" "}
                          {data.outputs.totals.fixed.l_aoi}
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Effets spectraux :
                          </span>{" "}
                          {data.outputs.totals.fixed.l_spec}
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Température & faible irradiance :
                          </span>{" "}
                          {data.outputs.totals.fixed.l_tg} %
                        </li>
                        <li>
                          <span className="font-semibold text-slate-900">
                            Pertes totales :
                          </span>{" "}
                          {data.outputs.totals.fixed.l_total}
                        </li>
                      </ul>
                    </div>

                    {/* Carte 4 – Chute de tension du câblage */}
                    <div className="lg:w-1/4 w-full p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <h2 className="text-sm font-semibold text-[#0f459e] mb-2 uppercase tracking-wide">
                        Chute de tension du câblage
                      </h2>
                      <div className="h-[1px] w-12 bg-[#0f459e] rounded-full mb-3" />
                      {voltageDropResult ? (
                        <ul className="text-xs text-slate-700 space-y-1.5">
                          <li>
                            <span className="font-semibold text-slate-900">
                              Chute de tension (ΔU) :
                            </span>{" "}
                            {voltageDropResult.vdrop ?? "–"} V
                          </li>
                          <li>
                            <span className="font-semibold text-slate-900">
                              ΔU / U :
                            </span>{" "}
                            {voltageDropResult.vdropPct ?? "–"} %
                          </li>
                          <li>
                            <span className="font-semibold text-slate-900">
                              Résistance équivalente :
                            </span>{" "}
                            {voltageDropResult.rwire ?? "–"} Ω
                          </li>
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Aucun calcul de chute de tension n&apos;a été
                          renseigné pour cette étude.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monthly data section */}
                <div className="lg:px-16 lg:py-6 px-0 py-4 flex lg:flex-col flex-col justify-between">
                  <h2 className="text-xl font-bold text-[#0f459e] mb-[10px]">
                    Énergie PV et irradiation solaire mensuelle
                  </h2>
                  <div className="flex lg:flex-col flex-col justify-center gap-10">
                    {/* Monthly data table */}
                    <div className="overflow-x-auto lg:w-full w-full">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#0f459e] text-white">
                            <tr>
                              <th className="p-2 border-b border-slate-300/40 text-left">
                                Mois
                              </th>
                              <th className="p-2 border-b border-slate-300/40 text-right">
                                Production (kWh)
                              </th>
                              <th className="p-2 border-b border-slate-300/40 text-right">
                                Irradiation (kWh/m²)
                              </th>
                              <th className="p-2 border-b border-slate-300/40 text-right">
                                Variabilité (kWh)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.outputs.monthly.fixed.map(
                              (monthlyData: MonthlyData, index: number) => (
                                <tr
                                  key={index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-slate-50/60"
                                      : "bg-white"
                                  }
                                >
                                  <td className="capitalize p-2 border-b border-slate-100 text-left">
                                    {monthNames[index]}
                                  </td>
                                  <td className="p-2 border-b border-slate-100 text-right">
                                    {monthlyData.E_m.toFixed(2)}
                                  </td>
                                  <td className="p-2 border-b border-slate-100 text-right">
                                    {monthlyData["H(i)_m"].toFixed(2)}
                                  </td>
                                  <td className="p-2 border-b border-slate-100 text-right">
                                    {monthlyData.SD_m.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="lg:w-full w-full flex lg:flex-row flex-col justify-between gap-4 mb-2">
                      <div className="w-full lg:w-[33%]">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
                          <p className="text-xs font-semibold text-slate-700 mb-2">
                            Production mensuelle (kWh)
                          </p>
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
                              <Bar
                                dataKey="value"
                                fill="#ff8b01ff"
                                name="kWh"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="w-full lg:w-[33%]">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
                          <p className="text-xs font-semibold text-slate-700 mb-2">
                            Irradiation mensuelle (kWh/m²)
                          </p>
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
                              <Bar
                                dataKey="value"
                                fill="#ffc700ff"
                                name="kWh/m²"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="w-full lg:w-[33%]">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
                          <p className="text-xs font-semibold text-slate-700 mb-2">
                            Variabilité mensuelle (kWh)
                          </p>
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
                              <Bar
                                dataKey="value"
                                fill="#0faa58ff"
                                name="kWh"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagramme solaire */}
              <div className="mt-4">
                <h2 className="text-xl font-bold text-black text-center mt-4 !mb-[-40px]">
                  Diagramme solaire avec masques d&apos;ombrage
                </h2>
                <div className="flex justify-center mx-auto w-full lg:w-[75%] overflow-x-auto lg:overflow-x-visible mt-8">
                  <div className="flex flex-nowrap">
                    {(String(data.inputs.location.latitude).startsWith("42.") ||
                      data.inputs.location.latitude < 42) && (
                      <Altitude42 obstacles={obstacles || []} />
                    )}
                    {String(data.inputs.location.latitude).startsWith(
                      "43."
                    ) && <Altitude43 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "44."
                    ) && <Altitude44 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "45."
                    ) && <Altitude45 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "46."
                    ) && <Altitude46 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "47."
                    ) && <Altitude47 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "48."
                    ) && <Altitude48 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "49."
                    ) && <Altitude49 obstacles={obstacles || []} />}
                    {String(data.inputs.location.latitude).startsWith(
                      "50."
                    ) && <Altitude50 obstacles={obstacles || []} />}
                    {(String(data.inputs.location.latitude).startsWith("51.") ||
                      data.inputs.location.latitude > 51) && (
                      <Altitude51 obstacles={obstacles || []} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default PrintComponentTwo;
