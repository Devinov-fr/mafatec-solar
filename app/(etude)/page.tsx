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
import {
  Plus,
  Download,
  Zap,
  ChevronRight,
  TrendingUp,
  LineChart,
  Clock,
  Trash2,
  Grid3X3,
  Pencil,
} from "lucide-react";
import ReportPDFPopup from "@/components/ui/ReportPDFPopup";

// Map sans SSR
const DynamicMap = dynamic(() => import("@/components/ui/Map"), {
  ssr: false,
});

// ---------------------------
// Types et interfaces
// ---------------------------
// In ./app/(etude)/page.tsx
interface Data {
  inputs: {
    economic_data: {
      interest: number | null;
      lifetime: number | null;
      system_cost: number | null;
    };
    location: { elevation: number; latitude: number; longitude: number };
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
        azimuth: { optimal: boolean; value: number };
        slope: { optimal: boolean; value: number };
        type: string;
      };
    };
    pv_module: { peak_power: number; system_loss: number; technology: string };
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
  meta: {
    inputs: any;
    outputs: any;
  };
}

interface Obstacle {
  name: string;
  azimuth: number | null;
  height: number | null;
  points: { azimuth: number | null; height: number | null }[];
}

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
    if (MATERIAL_RHO[value] !== undefined) setRho(String(MATERIAL_RHO[value]));
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
      return;
    }

    let Lm = lenVal;
    if (lengthUnit === "ft") Lm = lenVal * 0.3048;

    let d_m: number;
    if (diameterUnit === "mm") d_m = dVal / 1000.0;
    else if (diameterUnit === "inch") d_m = dVal * 0.0254;
    else {
      const d_mm = awgToDiameterMm(dVal);
      if (!isFinite(d_mm) || d_mm <= 0) {
        setError("Valeur AWG invalide.");
        return;
      }
      d_m = d_mm / 1000.0;
    }

    const A = Math.PI * Math.pow(d_m / 2, 2);
    let R_path, Vdrop;

    if (currentType === "dc" || currentType === "ac1") {
      R_path = (2 * rhoNum * Lm) / A;
      Vdrop = I * R_path;
    } else {
      const R_phase = (rhoNum * Lm) / A;
      R_path = R_phase;
      Vdrop = Math.sqrt(3) * I * R_phase;
    }

    const pct = (Vdrop / U) * 100;
    const vdropStr = isFinite(Vdrop) ? Vdrop.toFixed(3) : null;
    const pctStr = isFinite(pct) ? pct.toFixed(3) : null;
    const rwireStr = isFinite(R_path) ? R_path.toFixed(6) : null;

    setVdrop(vdropStr);
    setVdropPct(pctStr);
    setRwire(rwireStr);

    onResult({ vdrop: vdropStr, vdropPct: pctStr, rwire: rwireStr });
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => onClose(), 2000);
  };

  return (
    <div className="bg-white text-slate-900 w-full">
      <div className="px-6 py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c93b18]/10 ring-1 ring-[#d65128]/20">
              <span className="text-xl"><Zap className="text-[#c93b18]"/></span>
            </div>
            <div>
              <h2 className="text-2xl font-serif text-slate-900">
                Calculateur de <span className="italic text-[#c93b18]">chute de tension</span>
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Entrez le matériau, la section, la longueur et les paramètres électriques pour vérifier la chute de tension de votre ligne.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Matériau</p>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Type de fil</Label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#d65128]" value={material} onChange={(e) => handleMaterialChange(e.target.value)}>
                <option value="copper">Cuivre</option>
                <option value="aluminium">Aluminium</option>
                <option value="carbon_steel">Acier au carbone</option>
                <option value="electrical_steel">Acier électrique</option>
                <option value="gold">Or</option>
                <option value="nichrome">Nichrome</option>
                <option value="nickel_silver">Nickel argent</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Résistivité (Ω·m)</Label>
              <Input className="h-10 border-slate-200 text-sm" value={rho} onChange={(e) => setRho(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Géométrie</p>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Diamètre / taille du fil</Label>
              <div className="flex gap-2">
                <Input type="number" className="h-10 border-slate-200" value={diameterValue} onChange={(e) => setDiameterValue(e.target.value)} />
                <select className="rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none" value={diameterUnit} onChange={(e) => setDiameterUnit(e.target.value as any)}>
                  <option value="mm">mm²</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Longueur (aller simple)</Label>
              <div className="flex gap-2">
                <Input type="number" className="h-10 border-slate-200" value={lengthValue} onChange={(e) => setLengthValue(e.target.value)} />
                <select className="rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none" value={lengthUnit} onChange={(e) => setLengthUnit(e.target.value as any)}>
                  <option value="m">mètres</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Paramètres électriques</p>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Type de courant</Label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none" value={currentType} onChange={(e) => setCurrentType(e.target.value as any)}>
                <option value="dc">DC</option>
                <option value="ac1">AC – Monophasé</option>
                <option value="ac3">AC – Triphasé</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold text-slate-700">Tension (V)</Label>
                <Input className="h-10 mt-1 border-slate-200" type="number" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Courant (A)</Label>
                <Input className="h-10 mt-1 border-slate-200" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" className="border-slate-300 px-8" onClick={onClose}>Fermer</Button>
          <Button onClick={compute} className="bg-[#272a6b] hover:bg-[#272a6b]/90 text-white px-8">Calculer</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { label: "CHUTE DE TENSION", value: vdrop ? `${vdrop} V` : "—" },
            { label: "% DE CHUTE", value: vdropPct ? `${vdropPct} %` : "—" },
            { label: "RÉSISTANCE DU FIL", value: rwire ? `${rwire} Ω` : "—" }
          ].map((res, i) => (
            <div key={i} className="rounded-2xl bg-[#0c0f18] p-5">
              <p className="text-[10px] font-bold tracking-widest text-slate-400">{res.label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{res.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [clickedPosition, setClickedPosition] = useState({
    lat: 0,
    lng: 0,
    address: "",
  });
  const [showObstacleInputs, setShowObstacleInputs] = useState(false);
  const [useTerrainShadows, setUseTerrainShadows] = useState("non");ReportPDFPopup
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    {
      name: "Obstacle 1",
      azimuth: 0,
      height: 0,
      points: [{ azimuth: 0, height: 0 }],
    },
  ]);
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
    obstacles: [] as any[],
    inclinaison: false,
  });
  const [calculateVoltageDrop, setCalculateVoltageDrop] = useState<"oui" | "non">("non");
  const [addCalpinage, setAddCalpinage] = useState<"oui" | "non">("non");
  const [isVoltageModalOpen, setIsVoltageModalOpen] = useState(false);
  const [voltageDropResult, setVoltageDropResult] = useState<any>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPDFPopupOpen, setIsPDFPopupOpen] = useState(false);
  // Ref for printing
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Fonction d'impression manuelle
  const handlePrint = async () => {
    console.log("🟡 Début du processus d'impression");
    
    if (!data) {
      console.error("❌ Pas de données à imprimer");
      alert("Veuillez d'abord visualiser les résultats");
      return;
    }
    
    if (!printComponentRef.current) {
      console.error("❌ La ref n'est pas encore attachée");
      alert("Le rapport n'est pas encore prêt. Veuillez réessayer.");
      return;
    }

    setIsPrinting(true);

    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800,toolbars=yes');
      
      if (!printWindow) {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les pop-ups sont autorisés.");
      }

      const content = printComponentRef.current.cloneNode(true) as HTMLElement;
      
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      let stylesHTML = '';
      styles.forEach((style) => {
        if (style.tagName === 'LINK') {
          const link = style as HTMLLinkElement;
          if (link.href && !link.href.includes('leaflet')) {
            stylesHTML += `<link href="${link.href}" rel="stylesheet">`;
          }
        } else if (style.tagName === 'STYLE') {
          stylesHTML += style.outerHTML;
        }
      });

      const printStyles = `
        <style>
          @media print {
            body {
              margin: 0;
              padding: 20px;
              background: white;
            }
            .no-print {
              display: none !important;
            }
            button, .btn, [role="button"] {
              display: none !important;
            }
            .res-block {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
          }
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        </style>
      `;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Rapport Installation PV - ${new Date().toLocaleDateString()}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${stylesHTML}
            ${printStyles}
          </head>
          <body>
            ${content.outerHTML}
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          setIsPrinting(false);
        };
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de l'impression:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Impossible d'imprimer le rapport"}`);
      setIsPrinting(false);
    }
  };

  // Fonction de génération PDF
const handleGeneratePDF = async () => {
  if (!data) {
    alert("Veuillez d'abord visualiser les résultats");
    return;
  }
  setIsPDFPopupOpen(true);
};

  const handlePositionChange = (position: { lat: number; lng: number }) => {
    setClickedPosition((prev) => ({
      ...prev,
      lat: position.lat,
      lng: position.lng,
    }));
  };
  
  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setClickedPosition({ lat, lng, address });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setClickedPosition((prev) => ({
        ...prev,
        [name === "latitude" ? "lat" : "lng"]: numValue,
      }));
    }
  };

  const handleTerrainShadowsChange = (value: string) => {
    setUseTerrainShadows(value);
    setShowObstacleInputs(value === "oui");
  };

  const addObstacle = () =>
    setObstacles((prev) => [
      ...prev,
      {
        name: `Obstacle ${prev.length + 1}`,
        azimuth: 0,
        height: 0,
        points: [{ azimuth: 0, height: 0 }],
      },
    ]);
    
  const removeObstacle = (indexToRemove: number) =>
    setObstacles(obstacles.filter((_, index) => index !== indexToRemove));
    
  const handleObstacleNameChange = (index: number, value: string) =>
    setObstacles((prev) =>
      prev.map((o, i) => (i === index ? { ...o, name: value } : o)),
    );

  const handlePointChange = (
    obsIdx: number,
    ptIdx: number,
    field: "azimuth" | "height",
    value: string,
  ) => {
    const updated = [...obstacles];
    updated[obsIdx].points[ptIdx][field] =
      value === "" ? null : parseFloat(value);
    setObstacles(updated);
  };

  const validateForm = () => {
    const newErrors = {
      puissancePv: puissancePv.trim() === "",
      systemLosses: systemLosses.trim() === "",
      azimut: azimut.trim() === "",
      obstacles: [] as any[],
      inclinaison: inclinaison.trim() === "",
    };
    setFormErrors(newErrors);
    return !Object.values(newErrors).some((v) =>
      Array.isArray(v) ? v.some(Boolean) : v,
    );
  };

  const handleVisualiserResultats = async () => {
    if (!validateForm()) {
      setError("Veuillez remplir les champs manquants.");
      return;
    }
    setError("");
    setData(null);
    
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
      const response = await fetch("https://solaire.mafatec.com/pvgis/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const result = await response.json();
      if (result.error) {
        setError("Veuillez sélectionner votre adresse ou entrer ses coordonnées.");
        setData(null);
      } else {
        setData(result);
      }
    } catch (err) {
      setError("Une erreur est survenue lors du calcul.");
      setData(null);
    }
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
    if (value > 180 || value < -180)
      setErrorAzimuth("L'azimut doit être entre -180° et 180°.");
    if (value > 180) value = 180;
    if (value < -180) value = -180;
    setAzimut(value.toString());
  };

  const getAzimuthDirection = (az: number) => {
    if (az === 0) return "Sud";
    if (az > 0) return `Sud-Ouest (${az}°)`;
    return `Sud-Est (${Math.abs(az)}°)`;
  };

  return (
    <div className="min-h-screen bg-white text-[#15172b]">
      <Header />
      <Hero />

      {/* Action Bar */}
      {data && (
        <div className="sticky top-[74px] z-[120] bg-[#f5f5f7] backdrop-blur-[20px] border-b border-[#ececec]">
          <div className="max-w-[1200px] mx-auto px-10 py-[0.85rem] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-[0.8re[#A82E12]m] min-w-0">
              <span className="inline-flex items-center gap-[0.45rem] text-[0.62rem] font-bold tracking-[0.16em] uppercase text-white bg-[#c93b18] px-[0.65rem] py-[0.32rem] rounded-[2px] pl-2">
                Étude Installation PV
              </span>
              <span className="text-[0.8rem] text-[#454a63] truncate">
                <strong>{puissancePv || "0"} kWc</strong> ·
                {clickedPosition.address || "Adresse non définie"} ·
                {clickedPosition.lat.toFixed(4)} / {clickedPosition.lng.toFixed(4)}
              </span>
            </div>
            <Button 
              onClick={handleGeneratePDF}
              disabled={!data || isPrinting}
              className="bg-[#0b0e1d] hover:bg-[#141832] text-white text-[0.82rem] font-semibold px-[1.5rem] py-[0.8rem] rounded-[6px] transition-all hover:-translate-y-[2px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <>Préparation...</>
              ) : (
                <><Download size={15} /> Télécharger le rapport</>
              )}
            </Button>
          </div>
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-10 pt-16 md:pt-24 bg-white">
        {/* Intro */}
        <div className="mb-12">
          <div className="flex items-center gap-[0.6rem] text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-[#c93b18] mb-[1.4rem]">
            <span className="w-[26px] h-px bg-[#c93b18]" />
            Paramètres de l&apos;étude
          </div>
          <h2 className="font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.015em] mb-4">
            Votre installation,{" "}
            <em className="italic text-[#c93b18] font-medium">configurée</em>
          </h2>
          <p className="text-[1.05rem] text-[#454a63] max-w-[620px]">
            Localisation, coordonnées et performances du système photovoltaïque
          </p>
          <p className="text-[1.05rem] text-[#454a63] max-w-[620px]">
            retenu pour cette simulation.
          </p>
        </div>

        {/* Config Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.3rem] items-start">
          {/* Col 1: Map */}
          <div className="cfg-card">
            <h3 className="font-medium text-[17px]">Localisation</h3>
            <p className="cfg-sub">Position géographique du site analysé.</p>
            <div className="relative h-[320px] rounded-[18px] overflow-hidden border border-[#e8e8ea] z-0">
              <DynamicMap onPositionChange={handlePositionChange} />
            </div>
          </div>

          {/* Col 2: Address & Shadows */}
          <div className="cfg-card">
            <h3>Adresse & coordonnées</h3>
            <p className="cfg-sub">Adresse géocodée et latitude / longitude.</p>
            <div className="field-sm">
              <AddressAutocomplete onAddressSelect={handleAddressSelect} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="field-sm">
                <label>
                  Latitude <span className="text-red-600">*</span>
                </label>
                <Input
                  name="latitude"
                  value={clickedPosition.lat}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-sm">
                <label>
                  Longitude <span className="text-red-600">*</span>
                </label>
                <Input
                  name="longitude"
                  value={clickedPosition.lng}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="cfg-divider" />

            <h3>Gestion des ombrages</h3>
            <p className="cfg-sub">
              Obstacles susceptibles de créer de l&apos;ombre sur les panneaux.
            </p>
            <div className="field-sm">
              <label>
                Calcul automatique de l'horizon{" "}
                <span className="text-red-600">*</span>
              </label>
              <RadioGroup
                value={useTerrainShadows}
                onValueChange={handleTerrainShadowsChange}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="oui"
                    id="h-oui"
                    activeColor="#c93b18"
                    className="border-gray-200"
                  />
                  <label htmlFor="h-oui">Oui</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="non"
                    id="h-non"
                    activeColor="#c93b18"
                    className="border-gray-200"
                  />
                  <label htmlFor="h-non">Non</label>
                </div>
              </RadioGroup>
            </div>

            {showObstacleInputs && (
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-[0.66rem] uppercase tracking-[0.14em] text-[#3a55b0] font-bold">
                    Obstacles personnalisés
                  </h4>
                  <p className="text-xs text-[#6c757d] mt-1">
                    Obstacles & points d'ombrage
                  </p>
                </div>
                {obstacles.map((obs, obsIdx) => (
                  <div
                    key={obsIdx}
                    className="p-4 bg-[#f5f5f7] rounded-xl border border-[#e8e8ea] space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-semibold text-[#15172b]">
                          Obstacle {obsIdx + 1}
                        </span>
                      </div>
                      <Button
                        onClick={() => removeObstacle(obsIdx)}
                        variant="ghost"
                        className="h-8 text-red-600 hover:text-red-500 flex gap-1"
                      >
                        <Trash2 size={14} /> Supprimer
                      </Button>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Nom de l'obstacle
                      </label>
                      <Input
                        value={obs.name}
                        onChange={(e) =>
                          handleObstacleNameChange(obsIdx, e.target.value)
                        }
                        className="h-9 text-sm bg-white mt-1"
                      />
                    </div>
                    {obs.points.map((pt, ptIdx) => (
                      <div key={ptIdx} className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                            Azimut (°)
                          </label>
                          <Input
                            className="h-9 text-sm bg-white mt-1"
                            value={pt.azimuth ?? ""}
                            onChange={(e) =>
                              handlePointChange(
                                obsIdx,
                                ptIdx,
                                "azimuth",
                                e.target.value,
                              )
                            }
                            placeholder="0-360"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                            Hauteur (°)
                          </label>
                          <Input
                            className="h-9 text-sm bg-white mt-1"
                            value={pt.height ?? ""}
                            onChange={(e) =>
                              handlePointChange(
                                obsIdx,
                                ptIdx,
                                "height",
                                e.target.value,
                              )
                            }
                            placeholder="0-90"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <Button
                  onClick={addObstacle}
                  variant="outline"
                  className="w-full mt-2 border-dashed rounded-lg border-gray-300 text-gray-700 hover:border-[#3a55b0] hover:bg-white"
                >
                  <Plus size={14} className="mr-2" /> Ajouter un autre obstacle
                </Button>
              </div>
            )}
          </div>

          {/* Col 3: PV Performance */}
          <div className="cfg-card">
            <h3>Performance du système PV</h3>
            <p className="cfg-sub">Puissance cible, orientation et pertes.</p>
            <div className="field-sm">
              <label>
                Puissance PV installée [kWc]{" "}
                <span className="text-red-600">*</span>
              </label>
              <Input
                className={formErrors.puissancePv ? "border-red-500" : ""}
                value={puissancePv}
                onChange={(e) => setPuissancePv(e.target.value)}
                placeholder="9"
              />
            </div>
            <div className="field-sm">
              <label>
                Pertes du système [%] <span className="text-red-600">*</span>
              </label>
              <Input
                className={formErrors.systemLosses ? "border-red-500" : ""}
                value={systemLosses}
                onChange={(e) => setSystemLosses(e.target.value)}
                placeholder="14"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="field-sm">
                <label>
                  Inclinaison [°] <span className="text-red-600">*</span>
                </label>
                <Input
                  className={formErrors.inclinaison ? "border-red-500" : ""}
                  value={inclinaison}
                  onChange={(e) => setInclinaison(e.target.value)}
                  placeholder="35"
                />
              </div>
              <div className="field-sm">
                <label>
                  Azimut [°] <span className="text-red-600">*</span>
                </label>
                <Input
                  className={errorAzimuth ? "border-red-500" : ""}
                  value={azimut}
                  onChange={handleAzimutChange}
                  placeholder="0"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {errorAzimuth && (
              <p className="text-red-500 text-xs mt-2">{errorAzimuth}</p>
            )}

            <div className="cfg-divider" />

            <div className="space-y-4">
              {/* Voltage Drop Section */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold">
                  Calculer la chute de tension ?
                </label>
                <RadioGroup
                  className="flex gap-4"
                  value={calculateVoltageDrop}
                  onValueChange={(val: any) => {
                    setCalculateVoltageDrop(val);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem
                      value="oui"
                      id="v-oui"
                      activeColor="#c93b18"
                    />
                    <Label htmlFor="v-oui" className="text-xs">
                      Oui
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem
                      value="non"
                      id="v-non"
                      activeColor="#c93b18"
                    />
                    <Label htmlFor="v-non" className="text-xs">
                      Non
                    </Label>
                  </div>
                </RadioGroup>
                
                {calculateVoltageDrop === "oui" && !voltageDropResult && (
                  <div className="mt-6 p-5 bg-[#f4f6fb] rounded-xl border border-slate-200">
                    <p className="text-sm text-[#3a4055] mb-4">
                      Ouvrez le calculateur pour vérifier la chute de tension de votre ligne (matériau, section, longueur).
                    </p>
                    <Button
                      onClick={() => setIsVoltageModalOpen(true)}
                      className="w-full bg-[#272a6b] hover:bg-[#272a6b]/90 text-white flex items-center justify-center gap-2 py-5 rounded-lg"
                    >
                      <Zap size={18} />
                      Ouvrir le calculateur
                    </Button>
                  </div>
                )}
                
                {voltageDropResult && calculateVoltageDrop === "oui" && (
                  <div className="mt-4 p-5 bg-[#f0f9f4] border border-[#d1e7dd] rounded-2xl">
                    <div className="flex items-center gap-2 mb-4 text-[#1e6043]">
                      <Zap size={18} />
                      <p className="font-semibold text-[#1e6043] text-xs">Résultats de la chute de tension</p>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#4b5563]">Chute de tension</span>
                        <span className="font-semibold text-slate-900">≈ {voltageDropResult.vdrop} V</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#4b5563]">Pourcentage de chute de tension</span>
                        <span className="font-semibold text-slate-900">≈ {voltageDropResult.vdropPct} %</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#4b5563]">Résistance de fil</span>
                        <span className="font-semibold text-slate-900">{voltageDropResult.rwire} Ω</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#d1e7dd]">
                      <button
                        onClick={() => setIsVoltageModalOpen(true)}
                        className="flex items-center gap-2 text-[#1e6043] font-medium hover:text-[#1e6043]/80 transition-colors"
                      >
                        <Pencil size={16} />
                        Modifier le calcul
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Calepinage Section */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold">
                  Ajouter un calepinage ?
                </label>
                <RadioGroup
                  className="flex gap-4"
                  value={addCalpinage}
                  onValueChange={(val: any) => {
                    setAddCalpinage(val);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem
                      value="oui"
                      id="c-oui"
                      activeColor="#c93b18"
                    />
                    <Label htmlFor="c-oui" className="text-xs">
                      Oui
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem
                      value="non"
                      id="c-non"
                      activeColor="#c93b18"
                    />
                    <Label htmlFor="c-non" className="text-xs">
                      Non
                    </Label>
                  </div>
                </RadioGroup>
                
                {addCalpinage === "oui" && (
                  <div className="mt-6 p-5 bg-[#f4f6fb] rounded-xl border border-slate-200">
                    <p className="text-sm text-[#3a4055] mb-4">
                      Ouvrez l'outil de calepinage pour définir la zone de panneaux sur le toit.
                    </p>
                    <Button
                      onClick={() => setIsRoofPlannerOpen(true)}
                      className="w-full bg-[#272a6b] hover:bg-[#272a6b]/90 text-white flex items-center justify-center gap-2 py-5 rounded-lg"
                    >
                      <Grid3X3 size={18} />
                      Ouvrir le calepinage
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Visualise Button */}
        <div className="flex justify-center mt-12 pb-10">
          <Button
            onClick={handleVisualiserResultats}
            className="bg-[#2a2e72] hover:bg-[#191d49] text-white font-semibold text-[0.9rem] px-12 py-6 rounded-lg transition-all hover:-translate-y-1 flex items-center gap-2"
          >
            Visualiser les résultats <ChevronRight size={16} />
          </Button>
        </div>

        {/* Results Area */}
        {data && (
          <div className="mt-24">
            <div className="bg-[#f5f5f7] w-screen relative left-1/2 right-1/2 -mx-[50vw]">
              <div className="max-w-[1200px] mx-auto px-10 py-12">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-[0.5rem] mb-6">
                    <img
                      src="/mafatec-logo-rge.png"
                      alt="MAFATEC"
                      className="h-[60px] w-auto"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-[0.6rem] text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-[#A82E12] mb-2">
                    <span className="w-[26px] h-px bg-[#A82E12]" />
                    Analyse de production
                  </div>
                  <h2 className="font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.015em]">
                    Les résultats de votre{" "}
                    <em className="italic text-[#c93b18]">étude</em>
                  </h2>
                </div>

                {/* Results Cards - Updated Layout */}
                <div className="mb-10">
                  {/* Inclinaison and Azimut Cards Row */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 w-fit">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <TrendingUp className="text-slate-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">INCLINAISON</p>
                        <p className="text-xl font-bold text-[#15172b]">{inclinaison}°</p>
                      </div>
                      <div className="bg-[#eef0f7] text-[#4a55a8] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ml-4">
                        FOURNI
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 w-fit">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Clock className="text-slate-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">AZIMUT</p>
                        <p className="text-xl font-bold text-[#15172b]">{azimut}° · {getAzimuthDirection(parseFloat(azimut))}</p>
                      </div>
                      <div className="bg-[#eef0f7] text-[#4a55a8] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ml-4">
                        FOURNI
                      </div>
                    </div>
                  </div>

                  {/* Three Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
{/* Production Annuelle Card */}
  <div className="bg-[#15172b] rounded-3xl p-8">
    <h3 className="text-[#A82E12] font-medium text-xs uppercase tracking-[0.2em] mb-3">
      Production annuelle
    </h3>
    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-5xl font-serif text-white tracking-tight">
        {data?.outputs?.totals?.fixed.E_y.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-lg text-gray-400 font-light">kWh</span>
    </div>
    <p className="text-[12px] text-gray-400 font-light">
      Énergie produite estimée sur une année complète.
    </p>
  </div>

  {/* Irradiation Annuelle Card */}
  <div className="bg-[#15172b] rounded-3xl p-8">
    <h3 className="text-[#A82E12] font-medium text-xs uppercase tracking-[0.2em] mb-3">
      Irradiation annuelle
    </h3>
    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-5xl font-serif text-white tracking-tight">
        {data?.outputs?.totals?.fixed["H(i)_y"].toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
      </span>
      <span className="text-lg text-gray-400 font-light">kWh/m²</span>
    </div>
    <p className="text-[12px] text-gray-400 font-light">
      Rayonnement solaire reçu par mètre carré.
    </p>
  </div>

  {/* Variabilité Interannuelle Card */}
  <div className="bg-[#15172b] rounded-3xl p-8">
    <h3 className="text-[#A82E12] font-medium text-xs uppercase tracking-[0.2em] mb-3">
      Variabilité interannuelle
    </h3>
    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-5xl font-serif text-white tracking-tight">
        {data?.outputs?.totals?.fixed.SD_y.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      <span className="text-lg text-gray-400 font-light">%</span>
    </div>
    <p className="text-[12px] text-gray-400 font-light">
      Écart-type de production d'une année sur l'autre.
    </p>
  </div>
                  </div>
                </div>

                {/* Additional Info Cards (Entrées fournies, Changements production, Chute tension) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                  {/* Card 1 - Entrées fournies */}
                  <div className="bg-white rounded-md border border-gray-100 p-5 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c93b18] origin-top scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100" />
                    <h3 className="text-[#c93b18] font-semibold text-sm uppercase tracking-wide mb-4 pl-2">Entrées fournies</h3>
                    <div className="space-y-2 pl-2">
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Latitude</p><p className="text-xs font-medium">{clickedPosition.lat.toFixed(6)}</p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Longitude</p><p className="text-xs font-medium">{clickedPosition.lng.toFixed(6)}</p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Horizon</p><p className="text-xs font-medium">{useTerrainShadows === "oui" ? "Calculé" : "Défini manuellement"}</p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">PV installée</p><p className="text-xs font-medium">{puissancePv} kWc</p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Pertes système</p><p className="text-xs font-medium">{systemLosses} %</p></div>
                    </div>
                  </div>

                  {/* Card 2 - Changements production */}
                  <div className="bg-white rounded-md border border-gray-100 p-5 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c93b18] origin-top scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100" />
                    <h3 className="text-[#c93b18] font-semibold text-sm uppercase tracking-wide mb-4 pl-2">Changements production</h3>
                    <div className="space-y-2 pl-2">
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Angle d'incidence</p><p className="text-xs font-medium">{data?.outputs.totals.fixed.l_aoi.toFixed(2)}</p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Effets spectraux</p><p className="text-xs font-medium">{data?.outputs.totals.fixed.l_spec} </p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Temp. & faible irrad.</p><p className="text-xs font-medium">{data?.outputs.totals.fixed.l_tg.toFixed(2)} %</p></div>
                      <div className="flex justify-between"><p className="text-xs text-gray-500">Pertes totales</p><p className="text-xs font-medium">{data?.outputs.totals.fixed.l_total.toFixed(2)} </p></div>
                    </div>
                  </div>

                  {/* Card 3 - Chute tension câblage */}
                  <div className="bg-white rounded-md border border-gray-100 p-5 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c93b18] origin-top scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100" />
                    <h3 className="text-[#c93b18] font-semibold text-sm uppercase tracking-wide mb-4 pl-2">Chute tension câblage</h3>
                    {voltageDropResult && calculateVoltageDrop === "oui" ? (
                      <div className="space-y-2 pl-2">
                        <div className="flex justify-between"><p className="text-xs text-gray-500">Chute de tension</p><p className="text-xs font-medium">{voltageDropResult.vdrop} V</p></div>
                        <div className="flex justify-between">
                          <p className="text-xs text-gray-500">Pourcentage</p>
                          <p className="text-xs font-medium">{voltageDropResult.vdropPct} %</p>
                        </div>
                        <div className="flex justify-between"><p className="text-xs text-gray-500">Résistance de fil</p><p className="text-xs font-medium">{voltageDropResult.rwire} Ω</p></div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 pl-2">
                        <p className="text-xs text-gray-400 text-center">Aucun calcul de chute de tension n'a été renseigné.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Print Component */}
                <PrintComponentTwo
                  ref={printComponentRef}
                  data={data}
                  monthNames={["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]}
                  azimut={azimut}
                  inclinaison={inclinaison}
                  error={error}
                  obstacles={obstacles}
                  voltageDropResult={voltageDropResult}
                  panels={panels}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Final CTA */}
      <section className="bg-[#0c0f18] py-32 text-center px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(214,81,40,0.15),transparent_50%)]" />
        <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
          <h2 className="font-serif text-6xl md:text-7xl text-white leading-tight mb-8 tracking-tight">
            Prêt à concrétiser votre{" "}
            <em className="italic text-[#d65128] font-medium ">projet solaire</em> ?
          </h2>
          <p className="text-xl text-white max-w-2xl mb-14">
            Un conseiller MAFATEC vous accompagne, de l'étude détaillée à la mise en service — certifié RGE & Qualifelec.
          </p>
          <div>
            <Button className="group bg-[#d65128] hover:bg-[#d65128]/90 text-white font-semibold py-6 px-10 rounded-lg shadow-2xl inline-flex items-center gap-3 text-xl transition-all hover:scale-105">
              Nous contacter
              <ChevronRight size={24} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Modals */}
      {isVoltageModalOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-[24px] shadow-2xl bg-white">
            <VoltageDropCalculator
              onClose={() => setIsVoltageModalOpen(false)}
              onResult={(res) => setVoltageDropResult(res)}
            />
          </div>
        </div>
      )}
      
      {isRoofPlannerOpen && (
        <div className="fixed inset-0 z-[2050] overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
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

{/* PDF Report Popup */}
<ReportPDFPopup
  isOpen={isPDFPopupOpen}
  onClose={() => setIsPDFPopupOpen(false)}
  data={data}
  monthNames={["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]}
  azimut={azimut}
  inclinaison={inclinaison}
  clickedPosition={clickedPosition}
  puissancePv={puissancePv}
  systemLosses={systemLosses}
  voltageDropResult={voltageDropResult}
  panels={panels}
  calepinageImage={panels.find(p => p.imageUrl)?.imageUrl || null}
  obstacles={obstacles}  // Add this line
/>

      <Footer />
    </div>
  );
};

export default Home;