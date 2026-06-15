"use client";
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
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
  User,
  Building2,
} from "lucide-react";
import ReportPDFPopup from "@/components/ui/ReportPDFPopup";
import LeadModal, { Gate } from "@/components/ui/LeadModal";

// Map sans SSR
const DynamicMap = dynamic(() => import("@/components/ui/Map"), {
  ssr: false,
});

// API URL configuration based on environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://solaire.mafatec.com/pvgis/calculate'
  : 'http://127.0.0.1:5000/calculate';

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
  const [useTerrainShadows, setUseTerrainShadows] = useState("non");
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
    inclinaison: false,
    address: false,
    latitude: false,
    longitude: false,
    terrainShadows: false,
  });
  const [calculateVoltageDrop, setCalculateVoltageDrop] = useState<"oui" | "non">("non");
  const [addCalpinage, setAddCalpinage] = useState<"oui" | "non">("non");
  const [isVoltageModalOpen, setIsVoltageModalOpen] = useState(false);
  const [voltageDropResult, setVoltageDropResult] = useState<any>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPDFPopupOpen, setIsPDFPopupOpen] = useState(false);

  // Sprint 2: Gating states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unlocked = Cookies.get("mafatec-etude-unlocked") === "true";
    setIsUnlocked(unlocked);
  }, []);

  const handleUnlock = (data: any) => {
    setUserData(data);
    setIsUnlocked(true);
    // Note: LeadModal now handles setting the cookie upon API success, 
    // but we keep this as a fallback for consistency if handleUnlock is called directly.
    Cookies.set("mafatec-etude-unlocked", "true", { expires: 7 });
  };

  // Ref for printing
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Fonction d'impression manuelle
  const handlePrint = async () => {
    if (!isUnlocked) {
      setIsLeadModalOpen(true);
      return;
    }
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
  if (!isUnlocked) {
    setIsLeadModalOpen(true);
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
    // Clear address error when position changes
    setFormErrors(prev => ({ ...prev, address: false, latitude: false, longitude: false }));
  };
  
  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setClickedPosition({ lat, lng, address });
    // Clear address error when address is selected
    setFormErrors(prev => ({ ...prev, address: false, latitude: false, longitude: false }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setClickedPosition((prev) => ({
        ...prev,
        [name === "latitude" ? "lat" : "lng"]: numValue,
      }));
      // Clear errors for the edited field
      if (name === "latitude") {
        setFormErrors(prev => ({ ...prev, latitude: false }));
      } else if (name === "longitude") {
        setFormErrors(prev => ({ ...prev, longitude: false }));
      }
    }
  };

  const handleTerrainShadowsChange = (value: string) => {
    setUseTerrainShadows(value);
    setShowObstacleInputs(value === "oui");
    // Clear terrain shadows error
    setFormErrors(prev => ({ ...prev, terrainShadows: false }));
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
      inclinaison: inclinaison.trim() === "",
      address: clickedPosition.address === "" && (clickedPosition.lat === 0 || clickedPosition.lng === 0),
      latitude: clickedPosition.lat === 0,
      longitude: clickedPosition.lng === 0,
      terrainShadows: useTerrainShadows === "",
    };
    setFormErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some((v) => v === true);
  };

  const handleVisualiserResultats = async () => {
    if (!validateForm()) {
      setError("Veuillez remplir tous les champs obligatoires.");
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
      // Using environment-based URL configuration
      const response = await fetch(API_BASE_URL, {
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
    // Clear azimut error when value is valid
    if (value.toString().trim() !== "") {
      setFormErrors(prev => ({ ...prev, azimut: false }));
    }
  };

  const getAzimuthDirection = (az: number) => {
    if (az === 0) return "Sud";
    if (az > 0) return `Sud-Ouest (${az}°)`;
    return `Sud-Est (${Math.abs(az)}°)`;
  };

  return (
    <div className="min-h-screen bg-white text-[var(--text)]">
      <Header />
      <Hero />

      {/* Action Bar */}
      {data && (
        <div className="tool-actionbar sticky top-[74px] z-[120] bg-[rgba(250,250,250,0.92)] backdrop-blur-[20px] border-b border-[var(--line-warm)]">
          <div className="wrap tool-actionbar-in flex items-center justify-between gap-[1.2rem] py-[0.85rem] flex-wrap mx-auto max-w-[1200px] px-10">
            <div className="tool-ref flex items-center gap-[0.8rem] min-w-0">
              <span className="badge inline-flex items-center gap-[0.45rem] text-[0.62rem] font-bold tracking-[0.16em] uppercase text-white bg-[var(--red-500)] px-[0.65rem] py-[0.32rem] rounded-[2px]">
                Étude Installation PV
              </span>
              <span className="ref-meta text-[0.8rem] text-[var(--text-soft)] truncate">
                <strong className="text-[var(--text)] font-semibold">{puissancePv || "0"} kWc</strong> ·{" "}
                {clickedPosition.address || "Adresse non définie"} ·{" "}
                {clickedPosition.lat.toFixed(2)} / {clickedPosition.lng.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={!data || isPrinting}
              className="btn-download inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.82rem] tracking-[0.02em] px-[1.5rem] py-[0.8rem] rounded-[var(--r-sm)] bg-[var(--ink-900)] text-white transition-all duration-[0.4s] ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:bg-[var(--ink-800)] disabled:opacity-50 shadow-[var(--sh-sm)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
              {isPrinting ? "Préparation..." : "Télécharger le rapport"}
            </button>
          </div>
        </div>
      )}

      <main className="wrap section mx-auto max-w-[1200px] px-10 py-28 md:py-36">
        {/* Intro */}
        <div className="mb-12">
          <span className="eyebrow mb-[1.4rem] flex items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase">
            <span className="mark w-[26px] h-px bg-[var(--champagne)] inline-block" />
            Paramètres de l&apos;étude
          </span>
          <h2 className="text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.015em] mb-4 font-[var(--head)] font-semibold">
            Votre installation,{" "}
            <em className="italic text-[var(--red-500)] font-medium not-italic-sans">configurée</em>
          </h2>
          <p className="lead max-w-[620px] text-[1.06rem] leading-[1.75] text-[var(--text-soft)] font-normal">
            Localisation, coordonnées et performances du système photovoltaïque retenu pour cette simulation.
          </p>
        </div>

        {/* Config Grid */}
        <div className="config-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.3rem] items-start">
          {/* Col 1: Map */}
          <div className="cfg-card">
            <h3>Localisation</h3>
            <p className="cfg-sub">Position géographique du site analysé.</p>
            <div className="cfg-map relative h-[212px] rounded-[var(--r-md)] overflow-hidden border border-[var(--line-warm)] mb-[0.2rem] bg-[#e9eef2] z-0">
              <DynamicMap onPositionChange={handlePositionChange} />
            </div>
          </div>

          {/* Col 2: Address & Shadows */}
          <div className="cfg-card">
            <h3>Adresse & coordonnées</h3>
            <p className="cfg-sub">Adresse géocodée et latitude / longitude.</p>
            <div className="field-sm">
             
              <AddressAutocomplete onAddressSelect={handleAddressSelect} />
              {(formErrors.address || formErrors.latitude || formErrors.longitude) && (
                <p className="text-[var(--red-500)] text-[10px] font-bold uppercase mt-1">L&apos;adresse est requise</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-[0.8rem]">
              <div className="field-sm">
                <label>Latitude <span className="text-[var(--red-500)]">*</span></label>
                <input
                  type="text"
                  name="latitude"
                  value={clickedPosition.lat}
                  onChange={handleInputChange}
                  className={formErrors.latitude ? "border-[var(--red-500)]" : ""}
                />
              </div>
              <div className="field-sm">
                <label>Longitude <span className="text-[var(--red-500)]">*</span></label>
                <input
                  type="text"
                  name="longitude"
                  value={clickedPosition.lng}
                  onChange={handleInputChange}
                  className={formErrors.longitude ? "border-[var(--red-500)]" : ""}
                />
              </div>
            </div>

            <div className="cfg-divider h-px bg-[var(--line-warm)] my-[1.3rem]" />

            <h3>Gestion des ombrages</h3>
            <p className="cfg-sub">Obstacles susceptibles de créer de l&apos;ombre sur les panneaux.</p>
            <div className="field-sm">
              <label>Calcul automatique de l&apos;horizon <span className="text-[var(--red-500)]">*</span></label>
              <div className="radio-line flex items-center gap-[1.4rem] mt-[0.2rem]">
                <label className="radio-opt inline-flex items-center gap-[0.5rem] text-[0.82rem] text-[var(--text)] cursor-pointer">
                  <input
                    type="radio"
                    name="horizon"
                    checked={useTerrainShadows === "oui"}
                    onChange={() => handleTerrainShadowsChange("oui")}
                    className="appearance-none w-[18px] h-[18px] border-[1.5px] border-[var(--line-warm)] rounded-full relative cursor-pointer bg-[var(--paper)] transition-all checked:border-[var(--red-500)] checked:after:content-[''] checked:after:absolute checked:after:inset-[3px] checked:after:rounded-full checked:after:bg-[var(--red-500)]"
                  />
                  Oui
                </label>
                <label className="radio-opt inline-flex items-center gap-[0.5rem] text-[0.82rem] text-[var(--text)] cursor-pointer">
                  <input
                    type="radio"
                    name="horizon"
                    checked={useTerrainShadows === "non"}
                    onChange={() => handleTerrainShadowsChange("non")}
                    className="appearance-none w-[18px] h-[18px] border-[1.5px] border-[var(--line-warm)] rounded-full relative cursor-pointer bg-[var(--paper)] transition-all checked:border-[var(--red-500)] checked:after:content-[''] checked:after:absolute checked:after:inset-[3px] checked:after:rounded-full checked:after:bg-[var(--red-500)]"
                  />
                  Non
                </label>
              </div>
            </div>

            {showObstacleInputs && (
              <div className="mt-6 space-y-4">
                {obstacles.map((obs, obsIdx) => (
                  <div key={obsIdx} className="p-4 bg-[var(--paper-2)] rounded-xl border border-[var(--line-warm)] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[0.64rem] font-bold uppercase tracking-widest text-[var(--text-soft)]">Obstacle {obsIdx + 1}</span>
                      <button onClick={() => removeObstacle(obsIdx)} className="text-[var(--red-500)] hover:text-[var(--red-600)] text-[10px] font-bold uppercase flex items-center gap-1">
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                    <input
                      value={obs.name}
                      onChange={(e) => handleObstacleNameChange(obsIdx, e.target.value)}
                      className="w-full py-2 px-3 border border-[var(--line-warm)] rounded-[5px] bg-white text-[0.86rem]"
                      placeholder="Nom de l'obstacle"
                    />
                    {obs.points.map((pt, ptIdx) => (
                      <div key={ptIdx} className="grid grid-cols-2 gap-3">
                        <input className="w-full py-2 px-3 border border-[var(--line-warm)] rounded-[5px] bg-white text-[0.86rem]" value={pt.azimuth ?? ""} onChange={(e) => handlePointChange(obsIdx, ptIdx, "azimuth", e.target.value)} placeholder="Azimut (°)" />
                        <input className="w-full py-2 px-3 border border-[var(--line-warm)] rounded-[5px] bg-white text-[0.86rem]" value={pt.height ?? ""} onChange={(e) => handlePointChange(obsIdx, ptIdx, "height", e.target.value)} placeholder="Hauteur (°)" />
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={addObstacle} className="w-full py-2.5 border border-dashed border-[var(--line-warm)] rounded-[5px] text-[var(--muted)] hover:border-[var(--red-500)] hover:bg-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Plus size={14} /> Ajouter un obstacle
                </button>
              </div>
            )}
          </div>

          {/* Col 3: PV Performance */}
          <div className="cfg-card">
            <h3>Performance du système PV</h3>
            <p className="cfg-sub">Puissance cible, orientation et pertes.</p>
            <div className="field-sm">
              <label>Puissance PV crête installée [kWc] <span className="text-[var(--red-500)]">*</span></label>
              <input
                className={formErrors.puissancePv ? "border-[var(--red-500)]" : ""}
                value={puissancePv}
                onChange={(e) => setPuissancePv(e.target.value)}
                placeholder="9"
              />
            </div>
            <div className="field-sm">
              <label>Pertes du système [%] <span className="text-[var(--red-500)]">*</span></label>
              <input
                className={formErrors.systemLosses ? "border-[var(--red-500)]" : ""}
                value={systemLosses}
                onChange={(e) => setSystemLosses(e.target.value)}
                placeholder="14"
              />
            </div>
            <div className="grid grid-cols-2 gap-[0.8rem]">
              <div className="field-sm">
                <label>Inclinaison [°] <span className="text-[var(--red-500)]">*</span></label>
                <input
                  className={formErrors.inclinaison ? "border-[var(--red-500)]" : ""}
                  value={inclinaison}
                  onChange={(e) => setInclinaison(e.target.value)}
                  placeholder="35"
                />
              </div>
              <div className="field-sm">
                <label>Azimut [°] <span className="text-[var(--red-500)]">*</span></label>
                <input
                  className={formErrors.azimut ? "border-[var(--red-500)]" : ""}
                  value={azimut}
                  onChange={handleAzimutChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="cfg-divider h-px bg-[var(--line-warm)] my-[1.3rem]" />

            <div className="space-y-6">
              {/* Voltage Drop Section */}
              <div className="field-sm">
                <label>Calculer la chute de tension ?</label>
                <div className="radio-line flex items-center gap-[1.4rem] mt-[0.2rem]">
                  <label className="radio-opt inline-flex items-center gap-[0.5rem] text-[0.82rem] text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="chute"
                      checked={calculateVoltageDrop === "oui"}
                      onChange={() => setCalculateVoltageDrop("oui")}
                      className="appearance-none w-[18px] h-[18px] border-[1.5px] border-[var(--line-warm)] rounded-full relative cursor-pointer bg-[var(--paper)] transition-all checked:border-[var(--red-500)] checked:after:content-[''] checked:after:absolute checked:after:inset-[3px] checked:after:rounded-full checked:after:bg-[var(--red-500)]"
                    />
                    Oui
                  </label>
                  <label className="radio-opt inline-flex items-center gap-[0.5rem] text-[0.82rem] text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="chute"
                      checked={calculateVoltageDrop === "non"}
                      onChange={() => setCalculateVoltageDrop("non")}
                      className="appearance-none w-[18px] h-[18px] border-[1.5px] border-[var(--line-warm)] rounded-full relative cursor-pointer bg-[var(--paper)] transition-all checked:border-[var(--red-500)] checked:after:content-[''] checked:after:absolute checked:after:inset-[3px] checked:after:rounded-full checked:after:bg-[var(--red-500)]"
                    />
                    Non
                  </label>
                </div>
              </div>

              {calculateVoltageDrop === "oui" && (
                <div className="reveal-card">
                  {!voltageDropResult ? (
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
                  ) : (
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
              )}

              {/* Calepinage Section */}
              <div className="field-sm">
                <label>Ajouter un calepinage ?</label>
                <div className="radio-line flex items-center gap-[1.4rem] mt-[0.2rem]">
                  <label className="radio-opt inline-flex items-center gap-[0.5rem] text-[0.82rem] text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="calep"
                      checked={addCalpinage === "oui"}
                      onChange={() => setAddCalpinage("oui")}
                      className="appearance-none w-[18px] h-[18px] border-[1.5px] border-[var(--line-warm)] rounded-full relative cursor-pointer bg-[var(--paper)] transition-all checked:border-[var(--red-500)] checked:after:content-[''] checked:after:absolute checked:after:inset-[3px] checked:after:rounded-full checked:after:bg-[var(--red-500)]"
                    />
                    Oui
                  </label>
                  <label className="radio-opt inline-flex items-center gap-[0.5rem] text-[0.82rem] text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="calep"
                      checked={addCalpinage === "non"}
                      onChange={() => setAddCalpinage("non")}
                      className="appearance-none w-[18px] h-[18px] border-[1.5px] border-[var(--line-warm)] rounded-full relative cursor-pointer bg-[var(--paper)] transition-all checked:border-[var(--red-500)] checked:after:content-[''] checked:after:absolute checked:after:inset-[3px] checked:after:rounded-full checked:after:bg-[var(--red-500)]"
                    />
                    Non
                  </label>
                </div>
              </div>

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

        {/* Visualise Button */}
        <div className="config-cta flex justify-center mt-[1.8rem]">
          <button
            onClick={handleVisualiserResultats}
            className="btn-visualize inline-flex items-center gap-[0.7rem] font-sans font-semibold text-[0.9rem] tracking-wide py-4 px-10 rounded-[var(--r-sm)] bg-[var(--navy-800)] text-white transition-all duration-400 ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:bg-[var(--navy-900)] shadow-[var(--sh-md)]"
          >
            Visualiser les résultats
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] transition-transform duration-400 group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Results Area */}
{data && (
  <div id="results" className="results-section w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-[var(--paper-2)] mt-24">
    <div className="wrap mx-auto max-w-[1200px] px-10 py-12">
      <div className="res-head flex flex-col items-center text-center mb-12">
        <div className="res-logo inline-flex items-center gap-[0.5rem] mb-6">
          <img src="/mafatec-logo-rge.png" alt="MAFATEC" className="h-[60px] w-auto" />
        </div>
        <span className="eyebrow flex items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase text-[var(--red-500)] mb-2">
          <span className="mark w-[26px] h-px bg-[var(--red-500)]" />
          Analyse de production
        </span>
        <h2 className="sec-h text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.015em] mb-4 font-[var(--head)] font-semibold">
          Les résultats de votre <em className="italic text-[var(--red-500)] font-medium not-italic-sans">étude</em>
        </h2>
        {isUnlocked && userData && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[var(--line-warm)] shadow-sm">
            <div className="text-[var(--red-500)]">
              {userData.universe === "pro" ? <Building2 size={14} /> : <User size={14} />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
              Profil {userData.universe === "pro" ? "Professionnel" : "Particulier"}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
            <span className="text-[10px] font-medium text-[var(--muted)]">
              {userData.prenom} {userData.nom}
            </span>
          </div>
        )}
      </div>

      {/* Simulation Results Header */}
      <div className="sim-head flex items-center gap-4 mb-4">
        <span className="sim-ic w-10 h-10 rounded-lg bg-white border border-[var(--line-warm)] flex items-center justify-center text-[var(--red-500)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>
        </span>
        <div>
          <h3 className="text-[1.1rem] font-semibold">Résultats <em className="italic text-[var(--red-500)] not-italic-sans">simulation</em></h3>
          <div className="sim-sub text-[0.78rem] text-[var(--muted)]">Paramètres d&apos;implantation retenus et indicateurs de performance calculés.</div>
        </div>
      </div>

      <div className="sim-provided flex flex-wrap gap-4 mb-8">
        <div className="sp flex items-center gap-3 bg-white border border-[var(--line-warm)] rounded-xl px-4 py-3">
          <span className="sp-ic text-[var(--muted)]"><TrendingUp size={16} /></span>
          <span className="sp-txt flex flex-col">
            <span className="sp-k text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Inclinaison</span>
            <span className="sp-v text-[1.1rem] font-bold">{inclinaison}°</span>
          </span>
          <span className="sp-badge bg-[var(--paper-2)] text-[var(--logo-blue)] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ml-4">Fourni</span>
        </div>
        <div className="sp flex items-center gap-3 bg-white border border-[var(--line-warm)] rounded-xl px-4 py-3">
          <span className="sp-ic text-[var(--muted)]"><Clock size={16} /></span>
          <span className="sp-txt flex flex-col">
            <span className="sp-k text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Azimut</span>
            <span className="sp-v text-[1.1rem] font-bold">{azimut}° · {getAzimuthDirection(parseFloat(azimut))}</span>
          </span>
          <span className="sp-badge bg-[var(--paper-2)] text-[var(--logo-blue)] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ml-4">Fourni</span>
        </div>
      </div>

      {/* KPIs (Gated) */}
      <div className="kpis grid grid-cols-1 md:grid-cols-3 gap-[1.3rem] mb-[1.4rem]">
        <div className={`kpi relative bg-[var(--ink-900)] text-[var(--on-dark)] rounded-[var(--r-lg)] p-8 overflow-hidden isolation-auto ${!isUnlocked ? "locked" : "unlocked"}`}>
          {!isUnlocked && (
            <span className="kpi-lock-ic absolute top-[1.3rem] right-[1.3rem] text-[var(--champagne-soft)] opacity-80"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
          )}
          <div className="kpi-label text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[var(--champagne-soft)] mb-4">Production annuelle</div>
          <div className={`${!isUnlocked ? "blur-[11px] opacity-70" : ""}`}>
            <span className="kpi-value font-[var(--serif)] font-medium text-[clamp(2.1rem,3.4vw,2.9rem)] leading-none tracking-[-0.01em]">
              {data?.outputs?.totals?.fixed.E_y.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="kpi-unit text-[0.9rem] font-medium text-[var(--on-dark-soft)] ml-1.5">kWh</span>
          </div>
          <div className="kpi-foot mt-4 text-[0.76rem] text-[var(--on-dark-mute)] leading-relaxed">Énergie produite estimée sur une année complète.</div>
          {!isUnlocked && (
            <button onClick={() => setIsLeadModalOpen(true)} className="kpi-mini-cta absolute right-[1.3rem] bottom-[1.3rem] inline-flex items-center gap-1.5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--champagne-soft)] border border-[rgba(201,169,106,0.4)] px-3 py-1.5 rounded-[3px] bg-[rgba(7,9,18,0.4)] transition-all hover:border-[var(--champagne)] hover:text-white hover:bg-[var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              Voir
            </button>
          )}
        </div>

        <div className={`kpi relative bg-[var(--ink-900)] text-[var(--on-dark)] rounded-[var(--r-lg)] p-8 overflow-hidden isolation-auto ${!isUnlocked ? "locked" : "unlocked"}`}>
          {!isUnlocked && (
            <span className="kpi-lock-ic absolute top-[1.3rem] right-[1.3rem] text-[var(--champagne-soft)] opacity-80"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
          )}
          <div className="kpi-label text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[var(--champagne-soft)] mb-4">Irradiation annuelle</div>
          <div className={`${!isUnlocked ? "blur-[11px] opacity-70" : ""}`}>
            <span className="kpi-value font-[var(--serif)] font-medium text-[clamp(2.1rem,3.4vw,2.9rem)] leading-none tracking-[-0.01em]">
              {data?.outputs?.totals?.fixed["H(i)_y"].toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
            </span>
            <span className="kpi-unit text-[0.9rem] font-medium text-[var(--on-dark-soft)] ml-1.5">kWh/m²</span>
          </div>
          <div className="kpi-foot mt-4 text-[0.76rem] text-[var(--on-dark-mute)] leading-relaxed">Rayonnement solaire reçu par mètre carré et par an.</div>
          {!isUnlocked && (
            <button onClick={() => setIsLeadModalOpen(true)} className="kpi-mini-cta absolute right-[1.3rem] bottom-[1.3rem] inline-flex items-center gap-1.5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--champagne-soft)] border border-[rgba(201,169,106,0.4)] px-3 py-1.5 rounded-[3px] bg-[rgba(7,9,18,0.4)] transition-all hover:border-[var(--champagne)] hover:text-white hover:bg-[var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              Voir
            </button>
          )}
        </div>

        <div className={`kpi relative bg-[var(--ink-900)] text-[var(--on-dark)] rounded-[var(--r-lg)] p-8 overflow-hidden isolation-auto ${!isUnlocked ? "locked" : "unlocked"}`}>
          {!isUnlocked && (
            <span className="kpi-lock-ic absolute top-[1.3rem] right-[1.3rem] text-[var(--champagne-soft)] opacity-80"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
          )}
          <div className="kpi-label text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[var(--champagne-soft)] mb-4">Variabilité interannuelle</div>
          <div className={`${!isUnlocked ? "blur-[11px] opacity-70" : ""}`}>
            <span className="kpi-value font-[var(--serif)] font-medium text-[clamp(2.1rem,3.4vw,2.9rem)] leading-none tracking-[-0.01em]">
              {data?.outputs?.totals?.fixed.SD_y.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="kpi-unit text-[0.9rem] font-medium text-[var(--on-dark-soft)] ml-1.5">%</span>
          </div>
          <div className="kpi-foot mt-4 text-[0.76rem] text-[var(--on-dark-mute)] leading-relaxed">Écart-type de production d&apos;une année sur l&apos;autre.</div>
          {!isUnlocked && (
            <button onClick={() => setIsLeadModalOpen(true)} className="kpi-mini-cta absolute right-[1.3rem] bottom-[1.3rem] inline-flex items-center gap-1.5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--champagne-soft)] border border-[rgba(201,169,106,0.4)] px-3 py-1.5 rounded-[3px] bg-[rgba(7,9,18,0.4)] transition-all hover:border-[var(--champagne)] hover:text-white hover:bg-[var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              Voir
            </button>
          )}
        </div>
      </div>

      {/* Synth Cards */}
      <div className="synth-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.2rem] mb-12">
        <div className="synth-card group bg-white border border-[var(--line-warm)] rounded-[var(--r-md)] p-6 relative overflow-hidden transition-all">
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--red-500)] scale-y-0 origin-top transition-transform duration-500 group-hover:scale-y-100" />
          <h4 className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] uppercase text-[var(--red-500)] mb-4">
            <User size={15} /> Entrées fournies
          </h4>
          <div className="synth-list flex flex-col gap-2.5">
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Latitude</span><span className="v font-bold">{clickedPosition.lat.toFixed(6)}</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Longitude</span><span className="v font-bold">{clickedPosition.lng.toFixed(6)}</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Horizon</span><span className="v font-bold">{useTerrainShadows === "oui" ? "Calculé" : "Manuel"}</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">PV installée</span><span className="v font-bold">{puissancePv} kWc</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Pertes système</span><span className="v font-bold">{systemLosses} %</span></div>
          </div>
        </div>

        <div className="synth-card group bg-white border border-[var(--line-warm)] rounded-[var(--r-md)] p-6 relative overflow-hidden transition-all">
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--red-500)] scale-y-0 origin-top transition-transform duration-500 group-hover:scale-y-100" />
          <h4 className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] uppercase text-[var(--red-500)] mb-4">
            <LineChart size={15} /> Pertes de production
          </h4>
          <div className="synth-list flex flex-col gap-2.5">
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Angle d&apos;incidence</span><span className="v font-bold">{data?.outputs.totals.fixed.l_aoi.toFixed(2)}</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Effets spectraux</span><span className="v font-bold">{data?.outputs.totals.fixed.l_spec}</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Temp. & irrad.</span><span className="v font-bold">{data?.outputs.totals.fixed.l_tg.toFixed(2)} %</span></div>
            <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Pertes totales</span><span className="v font-bold">{data?.outputs.totals.fixed.l_total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="synth-card group bg-white border border-[var(--line-warm)] rounded-[var(--r-md)] p-6 relative overflow-hidden transition-all">
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--red-500)] scale-y-0 origin-top transition-transform duration-500 group-hover:scale-y-100" />
          <h4 className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] uppercase text-[var(--red-500)] mb-4">
            <Zap size={15} /> Chute tension câblage
          </h4>
          {voltageDropResult && calculateVoltageDrop === "oui" ? (
            <div className="synth-list flex flex-col gap-2.5">
              <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Chute de tension</span><span className="v font-bold">{voltageDropResult.vdrop} V</span></div>
              <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Pourcentage</span><span className="v font-bold">{voltageDropResult.vdropPct} %</span></div>
              <div className="row flex justify-between gap-4 text-[0.82rem]"><span className="k text-[var(--text-soft)]">Résistance fil</span><span className="v font-bold">{voltageDropResult.rwire} Ω</span></div>
            </div>
          ) : (
            <p className="empty-note text-[0.82rem] text-[var(--muted)] italic leading-relaxed">Aucun calcul de chute de tension renseigné.</p>
          )}
        </div>
      </div>

      {/* Detailed Results (Table, Charts, etc.) */}
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
        isUnlocked={isUnlocked}
        onUnlock={() => setIsLeadModalOpen(true)}
      />
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

      {/* Lead Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onUnlock={handleUnlock}
        studyData={{
          puissance: puissancePv,
          adresse: clickedPosition.address,
          production: data?.outputs?.totals?.fixed.E_y,
          irradiation: data?.outputs?.totals?.fixed["H(i)_y"],
          variabilite: data?.outputs?.totals?.fixed.SD_y,
        }}
      />

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