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
import Footer from "@/components/ui/footer";
import Header from "@/components/ui/Header";
import PrintComponent from "@/components/ui/PrintComponent";
import { Plus, Trash, TrashIcon } from "lucide-react";
import Hero from "@/components/ui/Hero";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import PrintComponentTwo from "@/components/ui/PrintComponentTwo";

// Dynamically import the Map component without SSR
const DynamicMap = dynamic(() => import("@/components/ui/Map"), { ssr: false });

// ---------------------------
// Types et interfaces existants
// ---------------------------
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
  onAddressSelect: (lat: number, lng: number) => void;
}

// ---------------------------
// Constantes pour le calcul de chute de tension
// ---------------------------
const MATERIAL_RHO: Record<string, number> = {
  copper: 1.724e-8,
  aluminium: 2.82e-8,
  carbon_steel: 1.43e-7,
  electrical_steel: 4.5e-7,
  gold: 2.44e-8,
  nichrome: 1.1e-6,
  nickel_silver: 3.0e-7,
};

function awgToDiameterMm(awg: number): number {
  const n = awg;
  if (!isFinite(n)) return NaN;
  const dInch = 0.005 * Math.pow(92, (36 - n) / 39);
  return dInch * 25.4;
}

// ---------------------------
// Composant React : Calculateur de chute de tension (dans un popup)
// ---------------------------
interface VoltageDropCalculatorProps {
  onClose: () => void;
  onResult: (result: {
    vdrop: string | null;
    vdropPct: string | null;
    rwire: string | null;
  }) => void;
}

const VoltageDropCalculator = ({
  onClose,
  onResult,
}: VoltageDropCalculatorProps) => {
  const [material, setMaterial] = useState("");
  const [rho, setRho] = useState("");
  const [diameterValue, setDiameterValue] = useState("");
  const [diameterUnit, setDiameterUnit] = useState<"mm" | "inch" | "awg">("mm");
  const [lengthValue, setLengthValue] = useState("");
  const [lengthUnit, setLengthUnit] = useState<"m" | "ft">("m");
  const [currentType, setCurrentType] = useState<"dc" | "ac1" | "ac3">("dc");
  const [voltage, setVoltage] = useState("");
  const [current, setCurrent] = useState("");

  const [vdrop, setVdrop] = useState<string | null>(null);
  const [vdropPct, setVdropPct] = useState<string | null>(null);
  const [rwire, setRwire] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Pour gérer le timer de fermeture automatique
  const closeTimeoutRef = useRef<number | null>(null);

  const handleMaterialChange = (value: string) => {
    setMaterial(value);
    if (MATERIAL_RHO[value] !== undefined) {
      setRho(String(MATERIAL_RHO[value]));
    }
  };


  
  const compute = () => {
    setError(null);

    const rhoNum = parseFloat(rho);
    const dVal = parseFloat(diameterValue);
    const lenVal = parseFloat(lengthValue);
    const U = parseFloat(voltage);
    const I = parseFloat(current);

    if (
      !isFinite(rhoNum) ||
      rhoNum <= 0 ||
      !isFinite(dVal) ||
      dVal <= 0 ||
      !isFinite(lenVal) ||
      lenVal <= 0 ||
      !isFinite(U) ||
      U <= 0 ||
      !isFinite(I) ||
      I <= 0
    ) {
      setError("Merci de remplir tous les champs avec des valeurs valides.");
      setVdrop(null);
      setVdropPct(null);
      setRwire(null);
      return;
    }

    // Longueur en mètres (aller simple)
    let Lm = lenVal;
    if (lengthUnit === "ft") {
      Lm = lenVal * 0.3048;
    }

    // Diamètre en mètres
    let d_m: number;
    if (diameterUnit === "mm") {
      d_m = dVal / 1000.0;
    } else if (diameterUnit === "inch") {
      d_m = dVal * 0.0254;
    } else {
      const d_mm = awgToDiameterMm(dVal);
      if (!isFinite(d_mm) || d_mm <= 0) {
        setError("Valeur AWG invalide.");
        setVdrop(null);
        setVdropPct(null);
        setRwire(null);
        return;
      }
      d_m = d_mm / 1000.0;
    }

    const A = Math.PI * Math.pow(d_m / 2, 2);
    if (!isFinite(A) || A <= 0) {
      setError("Erreur dans le calcul de la section du fil.");
      setVdrop(null);
      setVdropPct(null);
      setRwire(null);
      return;
    }

    let R_path: number;
    let R_wire: number;
    let Vdrop: number;

    if (currentType === "dc" || currentType === "ac1") {
      R_path = (2 * rhoNum * Lm) / A;
      R_wire = R_path;
      Vdrop = I * R_path;
    } else {
      const R_phase = (rhoNum * Lm) / A;
      R_path = R_phase;
      R_wire = R_phase;
      Vdrop = Math.sqrt(3) * I * R_phase;
    }

    const pct = (Vdrop / U) * 100;

    const vdropStr = isFinite(Vdrop) ? Vdrop.toFixed(3) : null;
    const pctStr = isFinite(pct) ? pct.toFixed(3) : null;
    const rwireStr = isFinite(R_wire) ? R_wire.toFixed(6) : null;

    setVdrop(vdropStr);
    setVdropPct(pctStr);
    setRwire(rwireStr);

    // 🔹 On remonte le résultat au parent
    onResult({
      vdrop: vdropStr,
      vdropPct: pctStr,
      rwire: rwireStr,
    });

    // 🔹 Fermer automatiquement après 20 secondes
    // (on annule un éventuel ancien timer si l'utilisateur recalcule)
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      onClose();
    }, 1000);
  };


  return (
  <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100">
    {/* Header du popup */}
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-[#0f427c]/10 flex items-center justify-center shadow-inner">
          <span className="text-[#0f427c] text-lg">⚡</span>
        </div>
        <div>
          <h2 className="font-semibold text-[#0f427c] text-[1.25rem] tracking-tight">
            Calculateur de chute de tension
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Renseignez les caractéristiques du câble pour estimer la chute de tension
            sur votre ligne électrique.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 shadow-sm transition"
      >
        <span className="text-slate-500 text-lg">&times;</span>
      </button>
    </div>

    {/* Contenu du formulaire */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Matériau */}
      <div className="space-y-3">
        <div>
          <Label className="text-[13px] text-slate-700">Type de fil</Label>
          <select
            className="mt-1 w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f427c]/60 focus:border-[#0f427c]/70 bg-white"
            value={material}
            onChange={(e) => handleMaterialChange(e.target.value)}
          >
            <option value="">– sélectionnez –</option>
            <option value="copper">Cuivre</option>
            <option value="aluminium">Aluminium</option>
            <option value="carbon_steel">Acier au carbone</option>
            <option value="electrical_steel">Acier électrique</option>
            <option value="gold">Or</option>
            <option value="nichrome">Nichrome</option>
            <option value="nickel_silver">Nickel argent</option>
          </select>
        </div>
        <div>
          <Label className="text-[13px] text-slate-700">
            Résistivité (Ω·m)
          </Label>
          <Input
            className="mt-1 text-sm border-slate-200 focus-visible:ring-[#0f427c]/60"
            value={rho}
            onChange={(e) => setRho(e.target.value)}
            placeholder="1.72e-8 pour le cuivre"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Pré-remplie selon le matériau, modifiable si besoin.
          </p>
        </div>
      </div>

      {/* Géométrie du fil */}
      <div className="space-y-3">
        <div>
          <Label className="text-[13px] text-slate-700">
            Diamètre / taille du fil
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              className="flex-1 text-sm border-slate-200 focus-visible:ring-[#0f427c]/60"
              value={diameterValue}
              onChange={(e) => setDiameterValue(e.target.value)}
            />
            <select
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f427c]/60"
              value={diameterUnit}
              onChange={(e) =>
                setDiameterUnit(e.target.value as "mm" | "inch" | "awg")
              }
            >
              <option value="mm">Diamètre (mm)</option>
              <option value="inch">Diamètre (pouce)</option>
              <option value="awg">AWG</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-[13px] text-slate-700">
            Longueur de câble (aller simple)
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              className="flex-1 text-sm border-slate-200 focus-visible:ring-[#0f427c]/60"
              value={lengthValue}
              onChange={(e) => setLengthValue(e.target.value)}
            />
            <select
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f427c]/60"
              value={lengthUnit}
              onChange={(e) => setLengthUnit(e.target.value as "m" | "ft")}
            >
              <option value="m">mètres</option>
              <option value="ft">pieds</option>
            </select>
          </div>
        </div>

        

       
      </div>

      {/* Paramètres électriques */}
      <div className="space-y-3">
         <div>
          <Label className="text-[13px] text-slate-700">
            Type de courant
          </Label>
          <select
            className="mt-1 w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f427c]/60"
            value={currentType}
            onChange={(e) =>
              setCurrentType(e.target.value as "dc" | "ac1" | "ac3")
            }
          >
            <option value="dc">DC</option>
            <option value="ac1">AC – Monophasé</option>
            <option value="ac3">AC – Triphasé</option>
          </select>
        </div>
        <div>
          <Label className="text-[13px] text-slate-700">Tension (V)</Label>
          <Input
            className="mt-1 text-sm border-slate-200 focus-visible:ring-[#0f427c]/60"
            type="number"
            value={voltage}
            onChange={(e) => setVoltage(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-[13px] text-slate-700">Courant (A)</Label>
          <Input
            className="mt-1 text-sm border-slate-200 focus-visible:ring-[#0f427c]/60"
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      </div>
    </div>

    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        className="border-slate-300 text-slate-600 hover:bg-slate-50"
        onClick={onClose}
      >
        Fermer
      </Button>
      <Button
        type="button"
        onClick={compute}
        className="bg-[#008f31] hover:bg-[#007326] text-white shadow-md px-5"
      >
        Calculer
      </Button>
    </div>

    <div className="mt-5 border-t border-slate-200 pt-3 text-sm">
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Chute de tension
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {vdrop !== null ? `${vdrop} V` : "–"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Pourcentage de chute de tension
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {vdropPct !== null ? `${vdropPct} %` : "–"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Résistance de fil
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {rwire !== null ? `${rwire} Ω` : "–"}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 mt-3">
        Pour DC et AC monophasé, la résistance est donnée pour l&apos;aller-retour.
        Pour le triphasé, elle est indiquée par conducteur.
      </p>
    </div>
  </div>
);

};

// ---------------------------
// Composant principal Home
// ---------------------------
const Home = () => {
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 0, lng: 0 });
  const [showObstacleInputs, setShowObstacleInputs] = useState(false);
  const [useTerrainShadows, setUseTerrainShadows] = useState("non");
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

  // Affichage du choix de calcul de chute de tension
  const [calculateVoltageDrop, setCalculateVoltageDrop] = useState<"oui" | "non">("non");

  // 🔹 Popup ouvert/fermé
  const [isVoltageModalOpen, setIsVoltageModalOpen] = useState(false);

  // 🔹 Résultat à afficher sous le champ dans le formulaire principal
  const [voltageDropResult, setVoltageDropResult] = useState<{
    vdrop: string | null;
    vdropPct: string | null;
    rwire: string | null;
  } | null>(null);

  console.log("tobstable first", obstacles);

  const handlePositionChange = (position: { lat: number; lng: number }) => {
    setClickedPosition(position);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);

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
    setShowObstacleInputs(value === "oui");
  };

  const addObstacle = () => {
    setObstacles([
      ...obstacles,
      {
        azimuth: 0,
        height: 0,
        points: [
          {
            azimuth: 0,
            height: 0,
          },
        ],
      },
    ]);
  };

  const removeObstacle = (indexToRemove: number) => {
    setObstacles(obstacles.filter((_, index) => index !== indexToRemove));
  };

  const addPointToObstacle = (obstacleIndex: number) => {
    const updatedObstacles = obstacles.map((obstacle, index) =>
      index === obstacleIndex
        ? {
            ...obstacle,
            points: [...obstacle.points, { azimuth: 0, height: 0 }],
          }
        : obstacle
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
    const numericValue = value === "" ? null : parseFloat(value);

    if (updatedObstacles[obstacleIndex].points[pointIndex]) {
      updatedObstacles[obstacleIndex].points[pointIndex][field] = numericValue;
    }

    setObstacles(updatedObstacles);
  };

  const validateForm = () => {
    const obstacleErrors: ObstacleError[] = [];

    const newFormErrors = {
      puissancePv: puissancePv.trim() === "",
      systemLosses: systemLosses.trim() === "",
      azimut: azimut.trim() === "",
      obstacles: obstacleErrors,
      inclinaison: inclinaison.trim() === "",
    };

    setFormErrors(newFormErrors);

    return !Object.values(newFormErrors).some((error) =>
      typeof error === "boolean" ? error : error.some(Boolean)
    );
  };

  const handleVisualiserResultats = async () => {
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
        "https://solaire.mafatec.com/pvgis/calculate",
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

  const prepareChartData = (
    type: "production" | "irradiation" | "variability"
  ) => {
    if (!data || !data.outputs?.monthly.fixed) return [];
    return data.outputs.monthly.fixed.map((monthData) => ({
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
    setClickedPosition({ lat, lng });
    console.log(`Latitudesss: ${lat}, Longitude: ${lng}`);
  };

  console.log("error", error);

  useEffect(() => {
    if (data && !error) {
      console.log("Data changed, regenerating component...");
    }
  }, [data, error]);

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
    const rawValue = e.target.value;
    setError("");
    setErrorAzimuth("");

    if (rawValue === "-" || rawValue === "") {
      setAzimut(rawValue);
      return;
    }

    let value = Number(rawValue);
    if (isNaN(value)) value = 0;

    if (value > 180 || value < -180) {
      setErrorAzimuth("L'azimut doit être compris entre -180° et 180°.");
    }

    if (value > 180) value = 180;
    if (value < -180) value = -180;

    setAzimut(value.toString());
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
                Rajouter un ombrage
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

            {showObstacleInputs && (
              <div>
                <div className="flex justify-between mt-2 items-center">
                  <h2 className="font-semibold text-[#0f427c] text-[1.1rem] underline uppercase">
                    Obstacles
                  </h2>

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

          {/* Performance PV + Azimut/inclinaison */}
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
                  className={`mt-2 ${
                    error || errorAzimuth ? "border-red-500 border-2" : ""
                  }`}
                  value={azimut}
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

            {/* 🔹 Nouveau champ : calcul de chute de tension */}
            <div className="h-[10px] border-b-[3px] border-[#d4d4d4] my-[10px]"></div>
            <div className="mt-2">
              <Label className="text-[13px]">
                Voulez-vous calculer la chute de tension ?
              </Label>
              <RadioGroup
                className="flex gap-4 mt-2"
                value={calculateVoltageDrop}
                onValueChange={(val) => {
                  const v = val as "oui" | "non";
                  setCalculateVoltageDrop(v);
                  if (v === "oui") {
                    setIsVoltageModalOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem id="chute-oui" value="oui" />
                  <Label htmlFor="chute-oui">Oui</Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem id="chute-non" value="non" />
                  <Label htmlFor="chute-non">Non</Label>
                </div>
              </RadioGroup>

              {/* Résultat affiché dans le formulaire principal */}
              {voltageDropResult && calculateVoltageDrop === "oui" && (
                <div className="mt-3 bg-white/70 border border-dashed border-[#0f427c]/40 rounded-md px-3 py-2 text-[12px]">
                  <p className="font-semibold text-[#0f427c] text-[13px] mb-1">
                    Résultats de la chute de tension
                  </p>
                  <p>
                    Chute de tension ≈{" "}
                    <span className="font-semibold">
                      {voltageDropResult.vdrop ?? "–"} V
                    </span>
                  </p>
                  <p>
                    Pourcentage de chute de tension ≈{" "}
                    <span className="font-semibold">
                      {voltageDropResult.vdropPct ?? "–"} %
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Résistance de fil :{" "}
                    {voltageDropResult.rwire ?? "–"} Ω
                  </p>

                  <button
                    type="button"
                    className="mt-2 text-[11px] underline text-[#0f427c]"
                    onClick={() => setIsVoltageModalOpen(true)}
                  >
                    Modifier le calcul
                  </button>
                </div>
              )}
            </div>
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
            voltageDropResult={voltageDropResult} 
          />
        )}
      </div>

      {/* 🔹 Popup stylé pour le calcul de chute de tension */}
      {isVoltageModalOpen && (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/65 backdrop-blur-sm">
    <div className="relative w-full max-w-4xl mx-4">
      {/* Halo lumineux derrière la carte */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f427c]/30 via-[#008f31]/20 to-transparent blur-3xl opacity-80 pointer-events-none" />

      {/* Carte principale */}
      <div className="relative bg-white rounded-3xl shadow-[0_18px_60px_rgba(15,66,124,0.45)] border border-slate-100/80 overflow-hidden">
        {/* Bandeau décoratif en haut */}
        <div className="]" />

        <VoltageDropCalculator
          onClose={() => setIsVoltageModalOpen(false)}
          onResult={(result) => {
            setVoltageDropResult(result);
            // Si tu veux fermer automatiquement après calcul, décommente :
            // setIsVoltageModalOpen(false);
          }}
        />
      </div>
    </div>
  </div>
)}


      <Footer />
    </div>
  );
};

export default Home;
