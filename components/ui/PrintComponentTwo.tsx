import React, { forwardRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

// ---------------- Types ----------------

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

// ✅ Interface commune pour RoofPlanner & PrintComponentTwo
export interface Panel {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;

  // coins exacts du champ PV (calepinage libre / tracé à la main, etc.)
  corners?: { x: number; y: number }[];

  // URL de la photo utilisée pour le calepinage (optionnel)
  imageUrl?: string | null;

  // identifiant du bloc (6+6, plusieurs champs, etc.)
  blockId?: number;
}

// helper pour transformer les coins en string SVG
const buildPolygonPoints = (panel?: Panel): string | null => {
  if (!panel) return null;

  if (panel.corners && panel.corners.length >= 3) {
    const coords = panel.corners.map((p) => ({ x: p.x, y: p.y }));
    const cx = coords.reduce((s, c) => s + c.x, 0) / coords.length;
    const cy = coords.reduce((s, c) => s + c.y, 0) / coords.length;

    (coords as any[]).forEach((c: any) => {
      c.angle = Math.atan2(c.y - cy, c.x - cx);
    });
    (coords as any[]).sort((a: any, b: any) => a.angle - b.angle);

    return coords.map((c) => `${c.x},${c.y}`).join(" ");
  }

  // fallback rectangle si jamais corners n'est pas fourni
  const { x, y, width, height } = panel;
  return `${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${
    y + height
  }`;
};

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

  // ✅ Nouveau : panneaux calepinage
  panels?: Panel[];
}

// ---------------- Composant ----------------

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
      panels = [],
    },
    ref
  ) => {
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

    const chartConfigs = [
      { title: "Production mensuelle (kWh)", data: chartDataProduction, color: "#C93B18", id: "prod" },
      { title: "Irradiation mensuelle (kWh/m²)", data: chartDataIrradiation, color: "#B09B3A", id: "irrad" },
      { title: "Variabilité mensuelle (kWh)", data: chartDataVariability, color: "#3A55B0", id: "var" },
    ];

    const componentRef = ref as React.MutableRefObject<HTMLDivElement>;

    // 🧩 On récupère les infos du calepinage
    const mainPanel = panels[0];
    const roofImageHref = panels.find((p) => p.imageUrl)?.imageUrl || mainPanel?.imageUrl || "/toit-maison.jpg";
    const panelPolygons = panels.map((panel) => ({ panel, points: buildPolygonPoints(panel) })).filter((p) => p.points !== null);
    const hasPanels = panelPolygons.length > 0;

    return (
      <div ref={ref} className="space-y-16">
        {/* Calepinage */}
        <div className="res-block">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[1.8rem] md:text-[2.2rem] font-serif font-medium text-text-luxe">
                Calepinage — <em className="italic text-[#c93b18]">emplacement des panneaux</em>
              </h2>
              <p className="text-[14px] text-[#7a7e95]">Implantation optimisée du champ photovoltaïque sur la toiture.</p>
            </div>
          </div>

          <div className="bg-white border border-line-warm rounded-[24px] p-8 shadow-sm">
            {hasPanels ? (
              <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-xl bg-paper-2">
                <svg viewBox="0 0 1024 730" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
                  <image href={roofImageHref} x="0" y="0" width="1024" height="730" preserveAspectRatio="xMidYMid slice" />
                  <defs>
                    <pattern id="pvPatternBlack" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
                      <rect x="0" y="0" width="1" height="1" fill="#02030a" />
                      <linearGradient id="pvGradBB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#1b2738" stopOpacity="0.95" />
                        <stop offset="0.45" stopColor="#050812" stopOpacity="0.97" />
                        <stop offset="1" stopColor="#000000" stopOpacity="0.99" />
                      </linearGradient>
                      <rect x="0" y="0" width="1" height="1" fill="url(#pvGradBB)" />
                      <path d="M0 0 H1 M0 0.5 H1 M0 1 H1 M0 0 V1 M0.25 0 V1 M0.5 0 V1 M0.75 0 V1 M1 0 V1" stroke="#222733" strokeWidth={0.006} />
                      <polygon points="-0.2,0 0.35,0 1,1 0.45,1" fill="rgba(255,255,255,0.07)" />
                    </pattern>
                  </defs>
                  {panelPolygons.map(({ panel, points }) => (
                    <polygon key={panel.id} points={points!} fill="url(#pvPatternBlack)" stroke="#181a1f" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
                  ))}
                </svg>
              </div>
            ) : (
              <p className="text-center py-12 text-[#7a7e95] italic">Aucun calepinage défini.</p>
            )}
          </div>
        </div>

        {/* Tableau mensuel */}
        <div className="res-block">
          <div className="mb-8">
            <h2 className="text-[1.8rem] md:text-[2.2rem] font-serif font-medium text-text-luxe">
              Énergie PV & irradiation <em className="italic text-[#c93b18]">mensuelle</em>
            </h2>
            <p className="text-[14px] text-[#7a7e95] mt-2">Production, irradiation et variabilité, mois par mois.</p>
          </div>

          <div className="bg-white border border-line-warm rounded-[24px] overflow-hidden shadow-sm">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-[#0b0e1d] text-white text-on-dark text-[11px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Mois</th>
                  <th className="px-6 py-4 text-right">Production (kWh)</th>
                  <th className="px-6 py-4 text-right">Irradiation (kWh/m²)</th>
                  <th className="px-6 py-4 text-right">Variabilité (kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-warm">
                {data.outputs.monthly.fixed.map((m, i) => (
                  <tr key={i} className="hover:bg-paper-2 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-luxe capitalize">{monthNames[i]}</td>
                    <td className="px-6 py-4 text-right text-text-soft">{m.E_m.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-text-soft">{m["H(i)_m"].toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-text-soft">{m.SD_m.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Graphiques - Version AreaChart avec gradients et points */}
        <div className="res-block">
          <div className="mb-8">
            <h2 className="text-[1.8rem] md:text-[2.2rem] font-serif font-medium text-text-luxe">
              Courbes <em className="italic text-[#c93b18]">mensuelles</em>
            </h2>
            <p className="text-[14px] text-[#7a7e95]">Évolution de la production, de l'irradiation et de la variabilité.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {chartConfigs.map((chart) => (
              <div key={chart.id} className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-luxe mb-6">{chart.title}</h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chart.color} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={chart.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#7a7e95' }}
                        interval={2} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#7a7e95' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chart.color} 
                        strokeWidth={2} 
                        fill={`url(#grad-${chart.id})`}
                        dot={{ r: 4, fill: chart.color, stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagramme solaire */}
        <div className="res-block">
          <div className="text-center mb-12">
            <h2 className="text-[1.8rem] md:text-[2.2rem] font-serif font-medium text-text-luxe">
              Diagramme solaire avec <em className="italic text-[#c93b18]">masques d'ombrage</em>
            </h2>
            <p className="text-[14px] text-[#7a7e95] mt-2">Trajectoire du soleil et impact des ombrages sur l'année.</p>
          </div>

          <div className="bg-white border border-line-warm rounded-[32px] p-8 md:p-12 shadow-sm overflow-hidden flex justify-center">
            <div className="scale-[0.85] md:scale-100 origin-center">
              {(String(data.inputs.location.latitude).startsWith("42.") || data.inputs.location.latitude < 42) && <Altitude42 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("43.") && <Altitude43 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("44.") && <Altitude44 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("45.") && <Altitude45 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("46.") && <Altitude46 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("47.") && <Altitude47 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("48.") && <Altitude48 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("49.") && <Altitude49 obstacles={obstacles || []} />}
              {String(data.inputs.location.latitude).startsWith("50.") && <Altitude50 obstacles={obstacles || []} />}
              {(String(data.inputs.location.latitude).startsWith("51.") || data.inputs.location.latitude > 51) && <Altitude51 obstacles={obstacles || []} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default PrintComponentTwo;