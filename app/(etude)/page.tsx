"use client";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

import Footer from "@/components/ui/footer";

import Header from "@/components/ui/Header";
import Hero from "@/components/ui/Hero";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import PrintComponentTwo, { Panel } from "@/components/ui/PrintComponentTwo";
import RoofPlanner from "@/components/ui/RoofPlanner";
import { Plus, TrashIcon } from "lucide-react";

// Map sans SSR
const DynamicMap = dynamic(() => import("@/components/ui/Map"), {
  ssr: false,
});

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
          interest: { description: string; units: string };
          lifetime: { description: string; units: string };
          system_cost: { description: string; units: string };
        };
      };
      location: {
        description: string;
        variables: {
          elevation: { description: string; units: string };
          latitude: { description: string; units: string };
          longitude: { description: string; units: string };
        };
      };
      meteo_data: {
        description: string;
        variables: {
          horizon_db: { description: string };
          meteo_db: { description: string };
          radiation_db: { description: string };
          use_horizon: { description: string };
          year_max: { description: string };
          year_min: { description: string };
        };
      };
      mounting_system: {
        choices: string;
        description: string;
        fields: {
          azimuth: { description: string; units: string };
          slope: { description: string; units: string };
        };
      };
      pv_module: {
        description: string;
        variables: {
          peak_power: { description: string; units: string };
          system_loss: { description: string; units: string };
          technology: { description: string };
        };
      };
    };
    outputs: {
      monthly: {
        timestamp: string;
        type: string;
        variables: {
          E_d: { description: string; units: string };
          E_m: { description: string; units: string };
          H_i_d: { description: string; units: string };
          H_i_m: { description: string; units: string };
          SD_m: { description: string; units: string };
        };
      };
      totals: {
        type: string;
        variables: {
          E_d: { description: string; units: string };
          E_m: { description: string; units: string };
          E_y: { description: string; units: string };
          H_i_d: { description: string; units: string };
          H_i_m: { description: string; units: string };
          "H(i)_y": { description: string; units: string };
          SD_m: { description: string; units: string };
          SD_y: { description: string; units: string };
          l_aoi: { description: string; units: string };
          l_spec: { description: string; units: string };
          l_tg: { description: string; units: string };
          l_total: { description: string; units: string };
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
  name: string;
  azimuth: number | null;
  height: number | null;
  points: { azimuth: number | null; height: number | null }[];
}

// ---------------------------
// Constantes chute de tension
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
// Calculateur de chute de tension – MODE CLAIR
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

    let Lm = lenVal;
    if (lengthUnit === "ft") {
      Lm = lenVal * 0.3048;
    }

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

    onResult({
      vdrop: vdropStr,
      vdropPct: pctStr,
      rwire: rwireStr,
    });

    if (closeTimeoutRef.current !== null) {
  window.clearTimeout(closeTimeoutRef.current);
}
closeTimeoutRef.current = window.setTimeout(() => {
  onClose();
}, 2000); // 10 secondes
  };

  return (
    <div className="bg-white text-slate-900 w-full">
    <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-7 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f427c]/8 ring-1 ring-[#0f427c]/15">
              <span className="text-xl text-[#0f427c]">⚡</span>
            </div>
            <div>
              
              <h2 className="mt-2 text-[1.3rem] font-semibold tracking-tight text-slate-900">
                Calculateur de chute de tension
              </h2>
              <p className="mt-1.5 max-w-xl text-xs text-slate-500">
                Entrez le matériau, la section, la longueur et les paramètres
                électriques pour vérifier la chute de tension de votre ligne.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Formulaire → 3 colonnes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Matériau */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Matériau
            </p>

            <div className="space-y-1.5">
              <Label className="text-[14px] text-slate-700 font-bold">Type de fil</Label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0f427c] focus:ring-2 focus:ring-[#0f427c]/20"
                value={material}
                onChange={(e) => handleMaterialChange(e.target.value)}
              >
                <option value="">– Sélectionnez –</option>
                <option value="copper">Cuivre</option>
                <option value="aluminium">Aluminium</option>
                <option value="carbon_steel">Acier au carbone</option>
                <option value="electrical_steel">Acier électrique</option>
                <option value="gold">Or</option>
                <option value="nichrome">Nichrome</option>
                <option value="nickel_silver">Nickel argent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[14px] text-slate-700 font-bold">
                Résistivité (Ω·m)
              </Label>
              <Input
                className="h-9 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
                value={rho}
                onChange={(e) => setRho(e.target.value)}
                placeholder="1.72e-8 pour le cuivre"
              />
              <p className="text-[10px] text-slate-500">
                Auto-rempli selon le matériau, modifiable si besoin.
              </p>
            </div>
          </div>

          {/* Géométrie */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Géométrie
            </p>

            <div className="space-y-1.5">
              <Label className="text-[14px] text-slate-700 font-bold">
                Diamètre / taille du fil
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  type="number"
                  className="h-9 flex-1 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
                  value={diameterValue}
                  onChange={(e) => setDiameterValue(e.target.value)}
                />
                <select
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-[#0f427c] focus:ring-2 focus:ring-[#0f427c]/20"
                  value={diameterUnit}
                  onChange={(e) =>
                    setDiameterUnit(e.target.value as "mm" | "inch" | "awg")
                  }
                >
                  <option value="mm">mm</option>
                  <option value="inch">Pouce</option>
                  <option value="awg">AWG</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[14px] text-slate-700 font-bold">
                Longueur (aller simple)
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  type="number"
                  className="h-9 flex-1 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
                  value={lengthValue}
                  onChange={(e) => setLengthValue(e.target.value)}
                />
                <select
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-[#0f427c] focus:ring-2 focus:ring-[#0f427c]/20"
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
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Paramètres électriques
            </p>

            <div className="space-y-1.5">
              <Label className="text-[14px] text-slate-700 font-bold">
                Type de courant
              </Label>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0f427c] focus:ring-2 focus:ring-[#0f427c]/20"
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[14px] text-slate-700 font-bold">
                  Tension (V)
                </Label>
                <Input
                  className="mt-1.5 h-9 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[14px] text-slate-700 font-bold">
                  Courant (A)
                </Label>
                <Input
                  className="mt-1.5 h-9 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
                  type="number"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            Fermer
          </Button>
          <Button
            type="button"
            onClick={compute}
            className="bg-[#344d95] hover:bg-[#344d95] text-white font-semibold px-6"
          >
            Calculer
          </Button>
        </div>

        {/* Résultats */}
        <div className="mt-2 border-t border-slate-200 pt-4 text-sm">
          {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Chute de tension
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {vdrop !== null ? `${vdrop} V` : "–"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                % de chute
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {vdropPct !== null ? `${vdropPct} %` : "–"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Résistance du fil
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {rwire !== null ? `${rwire} Ω` : "–"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            Pour DC et AC monophasé, la résistance est donnée pour l&apos;aller-retour.
            Pour le triphasé, elle est indiquée par conducteur.
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------
// Composant principal Home – MODE CLAIR
// ---------------------------
const Home = () => {
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [showObstacleInputs, setShowObstacleInputs] = useState(false);
  const [useTerrainShadows, setUseTerrainShadows] = useState("non");

  const [obstacles, setObstacles] = useState<Obstacle[]>([
    {
      name: "Obstacle 1",
      azimuth: 0,
      height: 0,
      points: [{ azimuth: 0, height: 0 }],
    },
  ]);

  const componentRef = useRef<HTMLDivElement | null>(null);
  const [puissancePv, setPuissancePv] = useState("");
  const [systemLosses, setSystemLosses] = useState("14");
  const [inclinaison, setInclinaison] = useState("35");
  const [azimut, setAzimut] = useState("0");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [errorAzimuth, setErrorAzimuth] = useState("");
  const [isRoofPlannerOpen, setIsRoofPlannerOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({
    puissancePv: false,
    systemLosses: false,
    azimut: false,
    obstacles: [{ azimuth: false, height: false }],
    inclinaison: false,
  });

  const [selectedChart, setSelectedChart] = useState<
    "production" | "irradiation" | "variability"
  >("production");

  const [calculateVoltageDrop, setCalculateVoltageDrop] =
    useState<"oui" | "non">("non");

  const [addCalpinage, setAddCalpinage] = useState<"oui" | "non">("non");

  const [isVoltageModalOpen, setIsVoltageModalOpen] = useState(false);

  const [voltageDropResult, setVoltageDropResult] = useState<{
    vdrop: string | null;
    vdropPct: string | null;
    rwire: string | null;
  } | null>(null);

  const [panels, setPanels] = useState<Panel[]>([]);

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
    setObstacles((prev) => [
      ...prev,
      {
        name: `Obstacle ${prev.length + 1}`,
        azimuth: 0,
        height: 0,
        points: [{ azimuth: 0, height: 0 }],
      },
    ]);
  };

  const removeObstacle = (indexToRemove: number) => {
    setObstacles(obstacles.filter((_, index) => index !== indexToRemove));
  };

  const handleObstacleNameChange = (index: number, value: string) => {
    setObstacles((prev) =>
      prev.map((obstacle, i) =>
        i === index ? { ...obstacle, name: value } : obstacle
      )
    );
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
      if (result.error) {
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

  const handleAddressSelect = (lat: number, lng: number) => {
    setClickedPosition({ lat, lng });
  };

  useEffect(() => {
    if (data && !error) {
      console.log("Data changed, regenerating component...");
    }
  }, [data, error]);

  const removePointFromObstacle = (obstacleIndex: number, pointIndex: number) => {
    const updatedObstacles = obstacles.map((obstacle, oIndex) =>
      oIndex === obstacleIndex
        ? {
            ...obstacle,
            points: obstacle.points.filter((_, pIndex) => pIndex !== pointIndex),
          }
        : obstacle
    );
    setObstacles(updatedObstacles);
  };

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
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <Header />
      <Hero />

      <div className="max-w-[1220px] mx-auto flex flex-col mb-6 px-3 lg:px-4">
        <main className="flex lg:flex-row flex-col gap-4 lg:gap-5 mt-8">
          {/* COLONNE GAUCHE : carte + adresse */}
          <div className="lg:w-[38%] w-full space-y-4">
            {/* Carte */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div>
                 
                  <h3 className="text-sm font-bold text-black">
                    Localisation sur la carte
                  </h3>
                </div>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] text-slate-500 border border-slate-200">
                  Cliquer sur la carte
                </span>
              </div>
              <div className="h-[1px] w-full bg-slate-100" />
              <div className="h-[320px] rounded-b-2xl overflow-hidden">
                <DynamicMap onPositionChange={handlePositionChange} />
              </div>
            </div>

          </div>

          {/* COLONNE 2 : Étape 1 AU-DESSUS de Étape 2 */}
  <div className="lg:w-[35%] w-full space-y-4 mt-4 lg:mt-0">
    {/* Étape 1 : Adresse & coordonnées */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
       
          <h2 className="font-bold text-black text-[18px]">
            Adresse & coordonnées
          </h2>
          <p className="italic text-[11px] text-[#d32f2f] mt-1">
            Sélectionnez l&apos;adresse ou saisissez la latitude / longitude.
          </p>
        </div>
       
      </div>

      <AddressAutocomplete onAddressSelect={handleAddressSelect} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[15px] text-slate-700 font-bold">
            Latitude <span className="text-red-500">*</span>
          </Label>
          <Input
            className="h-9 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
            name="latitude"
            placeholder="Ex : 48.85"
            value={clickedPosition.lat}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[15px] text-slate-700 font-bold">
            Longitude <span className="text-red-500">*</span>
          </Label>
          <Input
            className="h-9 border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0f427c]/30"
            name="longitude"
            placeholder="Ex : 2.35"
            value={clickedPosition.lng}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {error ===
        "Veuillez sélectionner votre adresse sur la carte ou entrer sa latitude et longitude exacte." && (
        <p className="text-[12px] text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>

    {/* Étape 2 : Gestion des ombrages */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-5 space-y-4">
  <div className="flex items-start justify-between gap-3">
    <div>
      <h2 className="font-bold text-black text-[18px]">
        Gestion des ombrages
      </h2>
      <p className="text-[12px] text-slate-500 mt-1">
        Ajoutez les obstacles susceptibles de créer de l&apos;ombre sur vos panneaux.
      </p>
    </div>
  </div>

  <div className="flex justify-between items-start gap-2">
    <Label className="text-[12px] text-black font-bold">
      Calcul automatique de l&apos;horizon{" "}
      <span className="text-red-500">*</span>
    </Label>
    <RadioGroup
      onValueChange={(value) => handleTerrainShadowsChange(value)}
      className="flex gap-3"
      value={useTerrainShadows}
    >
      <div className="flex items-center gap-1.5 text-[12px]">
        <RadioGroupItem value="oui" id="oui" />
        <Label htmlFor="oui">Oui</Label>
      </div>
      <div className="flex items-center gap-1.5 text-[12px]">
        <RadioGroupItem value="non" id="non" />
        <Label htmlFor="non">Non</Label>
      </div>
    </RadioGroup>
  </div>

  {showObstacleInputs && (
    <div className="mt-3 space-y-4">
      {/* en-tête + bouton ajout simple */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Obstacles personnalisés
          </p>
          <h2 className="font-semibold text-[#0f427c] text-[0.95rem]">
            Obstacles & points d&apos;ombrage
          </h2>
        </div>

      
      </div>

      {obstacles.map((obstacle, obstacleIndex) => (
        <div
          key={obstacleIndex}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 space-y-3"
        >
          {/* Titre obstacle + bouton supprimer en texte */}
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-semibold text-[0.95rem] text-slate-900">
              {obstacle.name || `Obstacle ${obstacleIndex + 1}`}
            </h3>
            <Button
              type="button"
              onClick={() => removeObstacle(obstacleIndex)}
              variant="ghost"
              className="h-8 px-2 text-[11px] text-red-500 hover:bg-red-50 flex items-center gap-1"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>

          {/* Nom obstacle */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-700">
              Nom de l&apos;obstacle
            </Label>
            <Input
              className="h-8 text-xs border-slate-300 bg-white text-slate-800 focus-visible:ring-[#0f427c]/30"
              value={obstacle.name}
              onChange={(e) =>
                handleObstacleNameChange(obstacleIndex, e.target.value)
              }
              placeholder={`Obstacle ${obstacleIndex + 1}`}
            />
          </div>

          {/* Points azimut / hauteur */}
          <div className="space-y-2 mt-1">
            {obstacle.points.map((point, pointIndex) => (
              <div
                key={pointIndex}
                className="flex gap-3 items-end"
              >
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-slate-700">
                    Azimut (°)
                  </Label>
                  <Input
                    className="h-8 text-xs border-slate-300 bg-white text-slate-800"
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
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-slate-700">
                    Hauteur (°)
                  </Label>
                  <Input
                    className="h-8 text-xs border-slate-300 bg-white text-slate-800"
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

                
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bouton d’ajout en bas aussi (optionnel, plus UX) */}
      {obstacles.length > 0 && (
        <div className="pt-1">
          <Button
            type="button"
            onClick={addObstacle}
            variant="outline"
            className="w-full h-9 text-[12px] border-dashed border-slate-300 text-slate-600 hover:border-[#0f427c] hover:text-[#0f427c] hover:bg-[#0f427c]/5 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter un autre obstacle
          </Button>
        </div>
      )}
    </div>
  )}
</div>

  </div>

          {/* COLONNE DROITE : PV + chute + calepinage */}
          <div className="lg:w-[32%] w-full">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  
                  <h2 className="font-bold text-black text-[18px]">
                    Performance du système PV
                  </h2>
                  <p className="italic text-[11px] text-[#d32f2f] mt-1">
                    Saisissez la puissance cible et l&apos;orientation.
                  </p>
                </div>
               
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[15px] text-black font-bold">
                    Puissance PV crête installée [kW]{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-9 text-sm border-slate-300 bg-white text-slate-800 focus-visible:ring-[#008f31]/30 ${
                      formErrors.puissancePv ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={puissancePv}
                    onChange={(e) => setPuissancePv(e.target.value)}
                    placeholder="Ex : 6"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[15px] text-black font-bold">
                    Pertes du système [%]{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-9 text-sm border-slate-300 bg-white text-slate-800 focus-visible:ring-[#008f31]/30 ${
                      formErrors.systemLosses ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={systemLosses}
                    onChange={(e) => setSystemLosses(e.target.value)}
                    placeholder="Ex : 14"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[15px] text-slate-700 font-bold">
                    Inclinaison [°] <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-9 text-sm border-slate-300 bg-white text-slate-800 focus-visible:ring-[#008f31]/30 ${
                      formErrors.inclinaison ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={inclinaison}
                    onChange={(e) => setInclinaison(e.target.value)}
                    placeholder="Ex : 35"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[15px] text-slate-700 font-bold">
                    Azimut [°] <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-9 text-sm border-slate-300 bg-white text-slate-800 focus-visible:ring-[#008f31]/30 ${
                      error || errorAzimuth ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={azimut}
                    onChange={handleAzimutChange}
                    placeholder="Entre -180 et 180"
                  />
                </div>
              </div>

              {error === "Veuillez remplir les champs manquants." && (
                <p className="text-[12px] text-red-500 mt-1">
                  {error}
                </p>
              )}
              {errorAzimuth && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errorAzimuth}
                </p>
              )}

              {/* Chute de tension */}
              <div className="pt-3 border-t border-slate-200" />
              <div className="space-y-2">
                <Label className="text-[13px] text-black font-bold">
                  Calculer la chute de tension ?
                </Label>
                <RadioGroup
                  className="flex gap-4 mt-1"
                  value={calculateVoltageDrop}
                  onValueChange={(val) => {
                    const v = val as "oui" | "non";
                    setCalculateVoltageDrop(v);
                    if (v === "oui") {
                      setIsVoltageModalOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <RadioGroupItem id="chute-oui" value="oui" />
                    <Label htmlFor="chute-oui">Oui</Label>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <RadioGroupItem id="chute-non" value="non" />
                    <Label htmlFor="chute-non">Non</Label>
                  </div>
                </RadioGroup>

                {voltageDropResult && calculateVoltageDrop === "oui" && (
                  <div className="mt-3 rounded-xl bg-[#008f31]/6 border border-[#008f31]/30 px-3 py-2.5 text-[12px]">
                    <p className="font-semibold text-[#008f31] text-[13px] mb-1">
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
                    <p className="text-[11px] text-slate-600 mt-1">
                      Résistance de fil : {voltageDropResult.rwire ?? "–"} Ω
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

              {/* Calepinage */}
              <div className="pt-3 border-t border-slate-200" />
              <div className="space-y-2">
                <Label className="text-[13px] text-black font-bold">
                  Ajouter un calepinage ?
                </Label>
                <RadioGroup
  className="flex gap-4 mt-1"
  value={addCalpinage}
  onValueChange={(val) => {
    const v = val as "oui" | "non";
    setAddCalpinage(v);
    if (v === "oui") {
      setIsRoofPlannerOpen(true);   // 🔹 ouvre la popup
    }
  }}
>

                  <div className="flex items-center gap-1.5 text-[12px]">
                    <RadioGroupItem id="calp-oui" value="oui" />
                    <Label htmlFor="calp-oui">Oui</Label>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <RadioGroupItem id="calp-non" value="non" />
                    <Label htmlFor="calp-non">Non</Label>
                  </div>
                </RadioGroup>
              </div>

              {addCalpinage === "oui" && (
  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-[12px]">
    <p className="text-slate-700">
      Ouvrez l&apos;outil de calepinage pour définir la zone de panneaux sur le toit.
    </p>
    <button
      type="button"
      onClick={() => setIsRoofPlannerOpen(true)}
      className="mt-2 inline-flex items-center justify-center rounded-lg border border-[#0f427c] px-3 py-1.5 text-[12px] font-medium text-[#0f427c] hover:bg-[#0f427c]/5"
    >
      Ouvrir le calepinage
    </button>
  </div>
)}

            </div>
          </div>
        </main>

        {/* Bouton Visualiser résultats */}
        <div className="flex justify-end w-full mx-auto lg:px-0 px-1 z-[1000] mt-4">
          <Button
            onClick={handleVisualiserResultats}
            className="bg-[#344d95] hover:bg-[#d32f2f] text-white font-semibold lg:w-[29%] w-full rounded-2xl shadow-sm"
          >
            Visualiser les résultats
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
            panels={panels}
          />
        )}
      </div>

      {/* Popup chute de tension */}
      {isVoltageModalOpen && (
  <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
    <div className="relative w-full max-w-3xl mx-3 sm:mx-4">
      <div className="relative max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <VoltageDropCalculator
          onClose={() => setIsVoltageModalOpen(false)}
          onResult={(result) => {
            setVoltageDropResult(result);
          }}
        />
      </div>
    </div>
  </div>
)}



{/* Popup calepinage (RoofPlanner) */}
{isRoofPlannerOpen && (
  <div className="fixed inset-0 z-[2050] overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
    {/* spacer pour centrer + permettre le scroll */}
    <div className="min-h-screen px-4 py-6 flex items-center justify-center">
      <div className="relative w-full max-w-3xl">
        <div className="relative max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <RoofPlanner
            panels={panels}
            onPanelsChange={setPanels}
            onClose={() => setIsRoofPlannerOpen(false)}
          />
        </div>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
};

export default Home;
