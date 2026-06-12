"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/lib/pdfGenerator";
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

interface ReportPDFPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  monthNames: string[];
  azimut: string;
  inclinaison: string;
  clickedPosition: { lat: number; lng: number; address: string };
  puissancePv: string;
  systemLosses: string;
  voltageDropResult: any;
  panels: any[];
  calepinageImage?: string | null;
  obstacles?: any[];
}

const ReportPDFPopup: React.FC<ReportPDFPopupProps> = ({
  isOpen,
  onClose,
  data,
  monthNames,
  azimut,
  inclinaison,
  clickedPosition,
  puissancePv,
  systemLosses,
  voltageDropResult,
  panels,
  obstacles,
  calepinageImage,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [date, setDate] = useState("");
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR"));
  }, []);

  // Process the calepinage image when popup opens
  useEffect(() => {
    if (isOpen) {
      const processImage = async () => {
        const imageUrl =
          calepinageImage ||
          panels.find((p: any) => p.imageUrl)?.imageUrl ||
          "/toit-maison.jpg";

        // If it's a blob URL or localhost URL, convert it to data URL
        if (
          imageUrl &&
          (imageUrl.startsWith("blob:") || imageUrl.includes("localhost"))
        ) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            setProcessedImageUrl(dataUrl);
          } catch (error) {
            console.error("Error converting image:", error);
            setProcessedImageUrl(imageUrl);
          }
        } else {
          setProcessedImageUrl(imageUrl);
        }
        setIsImageReady(true);
      };

      processImage();
    }
  }, [calepinageImage, panels, isOpen]);

  if (!isOpen) return null;

  const formatNumber = (value: number, decimals: number = 2): string => {
    if (isNaN(value)) return "0";
    return value.toFixed(decimals);
  };

  const formatInteger = (value: number): string => {
    if (isNaN(value)) return "0";
    return Math.round(value).toString();
  };

  const productionAnnuelle = data?.outputs?.totals?.fixed.E_y || 0;
  const irradiationAnnuelle = data?.outputs?.totals?.fixed["H(i)_y"] || 0;
  const variabiliteAnnuelle = data?.outputs?.totals?.fixed.SD_y || 0;

  const monthlyData = data?.outputs?.monthly?.fixed || [];
  const totalProduction = monthlyData.reduce(
    (sum: number, m: any) => sum + (m.E_m || 0),
    0,
  );
  const totalIrradiation = monthlyData.reduce(
    (sum: number, m: any) => sum + (m["H(i)_m"] || 0),
    0,
  );
  const maxProduction =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((m: any) => m.E_m || 0))
      : 0;
  const maxIrradiation =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((m: any) => m["H(i)_m"] || 0))
      : 0;
  const maxVariability =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((m: any) => m.SD_m || 0))
      : 0;

  const getAzimuthDirection = (az: number) => {
    if (az === 0) return "Sud";
    if (az > 0) return `Sud-Ouest (${az}°)`;
    return `Sud-Est (${Math.abs(az)}°)`;
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    if (!isImageReady) {
      alert(
        "Chargement de l'image en cours, veuillez réessayer dans un instant...",
      );
      return;
    }

    setIsGenerating(true);
    try {
      await generatePDF(reportRef.current, "rapport-installation-pv");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const content = reportRef.current.cloneNode(true) as HTMLElement;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Rapport Installation PV - ${new Date().toLocaleDateString()}</title>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif; 
                background: white;
                padding: 0;
                margin: 0;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .page { 
                  page-break-after: always; 
                  break-after: page;
                  min-height: 297mm;
                  width: 210mm;
                }
                .page:last-child {
                  page-break-after: auto;
                  break-after: auto;
                }
              }
            </style>
          </head>
          <body>${content.outerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const renderAreaChart = (
    data: any[],
    color: string,
    maxValue: number,
    height: number = 140,
  ) => {
    const maxVal = maxValue || Math.max(...data.map((d) => d.value), 1);
    const chartWidth = 450;
    const chartHeight = height - 40;
    const step = chartWidth / (data.length - 1);

    const points: string[] = [];
    data.forEach((item, idx) => {
      const x = idx * step;
      const y = chartHeight - (item.value / maxVal) * chartHeight + 10;
      points.push(`${x},${y}`);
    });

    const areaPoints = [...points];
    areaPoints.push(`${chartWidth},${chartHeight + 10}`);
    areaPoints.push(`0,${chartHeight + 10}`);
    const areaPath = `M ${areaPoints.join(" L ")} Z`;

    const gradientId = `gradient-${color.replace("#", "")}`;
    const gridLines = [0, 25, 50, 75, 100];

    return (
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto", maxHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {gridLines.map((line) => {
          const yPos = chartHeight + 10 - (line / 100) * chartHeight;
          return (
            <line
              key={line}
              x1={0}
              y1={yPos}
              x2={chartWidth}
              y2={yPos}
              stroke="#e8e8ea"
              strokeWidth="0.8"
              strokeDasharray={line > 0 && line < 100 ? "4,4" : "none"}
            />
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((item, idx) => {
          const x = idx * step;
          const y = chartHeight + 10 - (item.value / maxVal) * chartHeight;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}

        {data.map((item, idx) => {
          const x = idx * step;
          return (
            <text
              key={`label-${idx}`}
              x={x}
              y={chartHeight + 25}
              textAnchor="middle"
              fontSize="9"
              fill="#7a7e95"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {item.month.substring(0, 3)}
            </text>
          );
        })}

        <text
          x={-5}
          y={15}
          textAnchor="end"
          fontSize="8"
          fill="#a0a4b8"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {formatInteger(maxVal)}
        </text>
        <text
          x={-5}
          y={chartHeight + 10}
          textAnchor="end"
          fontSize="8"
          fill="#a0a4b8"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          0
        </text>
      </svg>
    );
  };

  const chartDataProduction = monthlyData.map((m: any, i: number) => ({
    month: monthNames[i],
    value: m.E_m || 0,
  }));

  const chartDataIrradiation = monthlyData.map((m: any, i: number) => ({
    month: monthNames[i],
    value: m["H(i)_m"] || 0,
  }));

  const chartDataVariability = monthlyData.map((m: any, i: number) => ({
    month: monthNames[i],
    value: m.SD_m || 0,
  }));

  // Use the processed image URL
  const roofImageUrl =
    processedImageUrl ||
    calepinageImage ||
    panels.find((p: any) => p.imageUrl)?.imageUrl ||
    "/toit-maison.jpg";

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-xl font-serif font-semibold text-[#15172b]">
            Aperçu du rapport -{" "}
            <span className="italic text-[#c93b18]">Téléchargement PDF</span>
          </h2>
          <div className="flex items-center gap-3">
            {/*<Button
              onClick={handlePrint}
              disabled={isGenerating}
              className="bg-[#131839] hover:bg-[#141832] text-white"
            >
              <Printer size={16} className="mr-2" />
              Imprimer
            </Button>*/}
            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="bg-[#c93b18] hover:bg-[#a82e12] text-white"
            >
              <Download size={16} className="mr-2" />
              {isGenerating ? "Génération..." : "Télécharger PDF"}
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto bg-[#e9eaee] p-6">
          <div ref={reportRef} style={{ maxWidth: "210mm", margin: "0 auto" }}>
            {/* PAGE 1 - COVER */}
            <div
              className="page"
              style={{
                width: "210mm",
                minHeight: "273.9mm",
                background: "#131839",
                position: "relative",
                overflow: "hidden",
                marginBottom: "0px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse 80% 70% at 15% 85%, #131839 0%, rgba(19, 22, 47, 0.7) 40%, transparent 70%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  paddingTop: "4mm",
                  paddingLeft: "8mm",
                  paddingRight: "20mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src="/logo-mafatec-blanc.png"
                      alt="MAFATEC"
                      style={{ height: "20px" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: "9px",
                          letterSpacing: "1.4px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          padding: "4px 8px",
                          borderRadius: "3px",
                        }}
                      >
                        RGE
                      </span>
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: "9px",
                          letterSpacing: "1.4px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          padding: "4px 8px",
                          borderRadius: "3px",
                        }}
                      >
                        Qualifelec
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "8mm 0" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "30px auto",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "-40px",
                      //paddingBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "1px",
                        background: "#A82E12",
                        transform: "translateY(6px)", // Moves the line down by 1px
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        color: "#A82E12",
                      }}
                    >
                      Étude de production photovoltaïque
                    </span>
                  </div>
                  <h1
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontSize: "42px",
                      fontWeight: 500,
                      color: "#f3efe6",
                      lineHeight: 1.04,
                      marginBottom: "20px",
                    
                    }}
                  >
                    Rapport de 
                    <em style={{ fontStyle: "italic", color: "#A82E12" }}>
                    {" "}Production
                    </em>
                    <br />
                    photovoltaïque détaillé
                  </h1>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: "rgba(243,239,230,0.62)",
                      maxWidth: "450px",
                    }}
                  >
                    Estimation de production, irradiation et performance d'une
                    installation photovoltaïque de {puissancePv} kWc, calculée
                    selon les données d'irradiation officielles et les
                    paramètres réels du site.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "20px",
                      marginTop: "30px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(201,169,106,0.28)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "4px",
                        }}
                      >
                        Site analysé
                      </div>
                      <div style={{ fontSize: "13px", color: "#f3efe6" }}>
                        {clickedPosition.address || "Adresse non définie"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "4px",
                        }}
                      >
                        Coordonnées
                      </div>
                      <div style={{ fontSize: "13px", color: "#f3efe6" }}>
                        {clickedPosition.lat.toFixed(6)} N ·{" "}
                        {clickedPosition.lng.toFixed(6)} E
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "4px",
                        }}
                      >
                        Puissance installée
                      </div>
                      <div style={{ fontSize: "13px", color: "#f3efe6" }}>
                        {puissancePv} kWc{" "}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "4px",
                        }}
                      >
                        Production annuelle estimée
                      </div>
                      <div style={{ fontSize: "13px", color: "#f3efe6" }}>
                        {formatInteger(productionAnnuelle)} kWh / an
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "8px",
                    color: "#ffffff",
                    minHeight: "50px",
                    marginTop: "-100px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "11px",
                      color: "#ffffff",
                    }}
                  >
                    Préparé par{" "}
                    <strong
                      style={{
                        fontStyle: "normal",
                        fontWeight: 600,
                        color: "#ffffff",
                      }}
                    >
                      MAFATEC
                    </strong>{" "}
                    — Énergie solaire
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      textAlign: "right",
                      lineHeight: "1.5",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Réf. ÉTUDE PV · {puissancePv} kWc
                    <br />
                    Édité le {date}
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 2 - SYNTHÈSE */}
            <div
              className="page"
              style={{
                width: "210mm",
                minHeight: "273mm",
                background: "#fff",
                //marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  paddingTop: "4mm",
                  paddingLeft: "6mm",
                  paddingRight: "22mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "20px",
                      marginBottom: "24px",
                      borderBottom: "1px solid #e8e8ea",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <img
                        src="/mafatec-logo-rge.png"
                        alt="MAFATEC"
                        style={{ height: "24px" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: "#7a7e95",
                        fontWeight: 600,
                      }}
                    >
                      Synthèse de l'étude
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "1px",
                        background: "#A82E12",
                        transform: "translateY(6px)", // Moves the line down by 1px
                      }}
                    />
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "#c93b18",
                      }}
                    >
                      Résultats de la simulation
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#15172b",
                      marginBottom: "8px",
                    }}
                  >
                    Les indicateurs{" "}
                    <em style={{ fontStyle: "italic", color: "#c93b18" }}>
                      clés
                    </em>{" "}
                    de production
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a7e95",
                      marginTop: "4px",
                      marginBottom: "24px",
                    }}
                  >
                    Performance annuelle estimée pour l'installation configurée
                    — inclinaison {inclinaison}°, azimut {azimut}° (
                    {getAzimuthDirection(parseFloat(azimut))}).
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        background: "#131839",
                        borderRadius: "14px",
                        padding: "20px",
                        color: "#f3efe6",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "12px",
                        }}
                      >
                        Production annuelle
                      </div>
                      <div
                        style={{
                          fontFamily: "'Spectral', Georgia, serif",
                          fontSize: "28px",
                          fontWeight: 500,
                          marginBottom: "8px",
                        }}
                      >
                        {formatInteger(productionAnnuelle)}
                        <span style={{ fontSize: "11px", marginLeft: "4px" }}>
                          kWh
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#ffffff",
                        }}
                      >
                        Énergie produite estimée sur une année complète.
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#131839",
                        borderRadius: "14px",
                        padding: "20px",
                        color: "#f3efe6",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "12px",
                        }}
                      >
                        Irradiation annuelle
                      </div>
                      <div
                        style={{
                          fontFamily: "'Spectral', Georgia, serif",
                          fontSize: "28px",
                          fontWeight: 500,
                          marginBottom: "8px",
                        }}
                      >
                        {formatInteger(irradiationAnnuelle)}
                        <span style={{ fontSize: "11px", marginLeft: "4px" }}>
                          kWh/m²
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#ffffff",
                        }}
                      >
                        Rayonnement solaire reçu par mètre carré.
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#131839",
                        borderRadius: "14px",
                        padding: "20px",
                        color: "#f3efe6",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#A82E12",
                          marginBottom: "12px",
                        }}
                      >
                        Variabilité interannuelle
                      </div>
                      <div
                        style={{
                          fontFamily: "'Spectral', Georgia, serif",
                          fontSize: "28px",
                          fontWeight: 500,
                          marginBottom: "8px",
                        }}
                      >
                        {formatNumber(variabiliteAnnuelle, 1)}
                        <span style={{ fontSize: "11px", marginLeft: "4px" }}>
                          kWh
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#ffffff",
                        }}
                      >
                        Écart-type de production d'une année sur l'autre.
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e8e8ea",
                        borderRadius: "12px",
                        padding: "16px",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#c93b18"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 5h16M4 12h16M4 19h10" />
                        </svg>
                        <h3
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            color: "#c93b18",
                            margin: 0,
                          }}
                        >
                          Entrées fournies
                        </h3>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Latitude
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {clickedPosition.lat.toFixed(6)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Longitude
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {clickedPosition.lng.toFixed(6)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Horizon
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            Calculé
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            PV installée
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {puissancePv} kWc
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Pertes système
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {systemLosses} %
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Inclinaison
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {inclinaison}°
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Azimut
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {azimut}° ({getAzimuthDirection(parseFloat(azimut))}
                            )
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid #e8e8ea",
                        borderRadius: "12px",
                        padding: "16px",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#c93b18"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2v6M12 22v-2M4 12H2M6.3 6.3 4.9 4.9M17.7 6.3l1.4-1.4M22 12h-2" />
                          <circle cx="12" cy="14" r="4" />
                        </svg>
                        <h3
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            color: "#c93b18",
                            margin: 0,
                          }}
                        >
                          Changements de la production
                        </h3>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Angle d'incidence
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {formatNumber(
                              data?.outputs?.totals?.fixed?.l_aoi || 0,
                              2,
                            )}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Effets spectraux
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {data?.outputs?.totals?.fixed?.l_spec || "0"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            paddingBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Température & faible irradiance
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {formatNumber(
                              data?.outputs?.totals?.fixed?.l_tg || 0,
                              2,
                            )}{" "}
                            %
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#454a63" }}>
                            Pertes totales
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#15172b",
                            }}
                          >
                            {formatNumber(
                              data?.outputs?.totals?.fixed?.l_total || 0,
                              2,
                            )}
                          </span>
                        </div>
                      </div>

                      {voltageDropResult && voltageDropResult.vdrop && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginTop: "14px",
                              marginBottom: "16px",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#c93b18"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
                            </svg>
                            <h3
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "1.5px",
                                textTransform: "uppercase",
                                color: "#c93b18",
                                margin: 0,
                              }}
                            >
                              Chute de tension du câblage
                            </h3>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                paddingBottom: "6px",
                              }}
                            >
                              <span
                                style={{ fontSize: "11px", color: "#454a63" }}
                              >
                                Chute de tension
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color: "#15172b",
                                }}
                              >
                                {voltageDropResult.vdrop} V
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                paddingBottom: "6px",
                              }}
                            >
                              <span
                                style={{ fontSize: "11px", color: "#454a63" }}
                              >
                                Pourcentage de chute
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color: "#15172b",
                                }}
                              >
                                {voltageDropResult.vdropPct} %
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                              }}
                            >
                              <span
                                style={{ fontSize: "11px", color: "#454a63" }}
                              >
                                Résistance de fil
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color: "#15172b",
                                }}
                              >
                                {voltageDropResult.rwire} Ω
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f5f5f7",
                      padding: "16px",
                      borderRadius: "12px",
                      marginTop: "20px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: "#3a55b0",
                        marginBottom: "6px",
                      }}
                    >
                      Méthodologie
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#454a63",
                        lineHeight: 1.55,
                      }}
                    >
                      Les estimations sont calculées à partir des données
                      d'irradiation solaire de référence pour la localisation du
                      site, en tenant compte de l'inclinaison, de l'azimut, des
                      pertes système ({systemLosses}%) et du calcul automatique
                      de l'horizon. Les valeurs de production constituent une
                      estimation et peuvent varier selon les conditions
                      météorologiques réelles.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e8e8ea",
                    fontSize: "8px",
                    color: "#7a7e95",
                    minHeight: "40px",
                    marginTop: "-20px",
                  }}
                >
                  <span>MAFATEC — Énergie solaire</span>
                  <span
                    style={{ letterSpacing: "2px", textTransform: "uppercase" }}
                  >
                    Étude Installation PV
                  </span>
                  <span>Page 2 / 6</span>
                </div>
              </div>
            </div>

            {/* PAGE 3 - CALEPINAGE - FIXED WITH IMG TAG */}
            <div
              className="page"
              style={{
                width: "210mm",
                minHeight: "274mm",
                background: "#fff",
                marginBottom: "10px",
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  paddingTop: "4mm",
                  paddingLeft: "6mm",
                  paddingRight: "22mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "20px",
                      marginBottom: "24px",
                      marginTop: "-20px",
                      borderBottom: "1px solid #e8e8ea",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <img
                        src="/mafatec-logo-rge.png"
                        alt="MAFATEC"
                        style={{ height: "24px" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: "#7a7e95",
                        fontWeight: 600,
                      }}
                    >
                      Calepinage
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "1px",
                        background: "#A82E12",
                        transform: "translateY(6px)", // Moves the line down by 1px
                      }}
                    />
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "#c93b18",
                      }}
                    >
                      Calepinage
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#15172b",
                      marginBottom: "8px",
                    }}
                  >
                    Emplacement des{" "}
                    <em style={{ fontStyle: "italic", color: "#c93b18" }}>
                      panneaux
                    </em>
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a7e95",
                      marginTop: "4px",
                      marginBottom: "20px",
                    }}
                  >
                    Implantation et forme du champ photovoltaïque sur la
                    toiture.
                  </p>

                  <div
                    style={{
                      border: "1px solid #e8e8ea",
                      borderRadius: "14px",
                      padding: "20px",
                      background: "#fff",
                      marginBottom: "20px",
                      textAlign: "center",
                    }}
                  >
                    {panels && panels.length > 0 && roofImageUrl ? (
                      <div
                        style={{
                          position: "relative",
                          display: "inline-block",
                          width: "100%",
                        }}
                      >
                        <img
                          src={roofImageUrl}
                          alt="Toiture"
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            display: "block",
                          }}
                          crossOrigin="anonymous"
                        />
                        <svg
                          viewBox="0 0 1024 730"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                          }}
                        >
                          {panels.map((panel: any) => (
                            <rect
                              key={panel.id}
                              x={panel.x}
                              y={panel.y}
                              width={panel.width}
                              height={panel.height}
                              fill="rgba(11,14,29,0.85)"
                              stroke="#f97316"
                              strokeWidth="3"
                              rx="4"
                            />
                          ))}
                        </svg>
                      </div>
                    ) : panels && panels.length > 0 ? (
                      <div>
                        <svg
                          viewBox="0 0 1024 730"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            marginBottom: "16px",
                          }}
                        >
                          <image
                            href="/toit-maison.jpg"
                            x="0"
                            y="0"
                            width="1024"
                            height="730"
                            preserveAspectRatio="xMidYMid slice"
                          />
                          {panels.map((panel: any) => (
                            <rect
                              key={panel.id}
                              x={panel.x}
                              y={panel.y}
                              width={panel.width}
                              height={panel.height}
                              fill="rgba(11,14,29,0.85)"
                              stroke="#f97316"
                              strokeWidth="3"
                              rx="4"
                            />
                          ))}
                        </svg>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: "#f5f5f7",
                          borderRadius: "8px",
                          padding: "40px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#7a7e95",
                            marginBottom: "8px",
                          }}
                        >
                          📐 Aucun calepinage défini
                        </div>
                        <div style={{ fontSize: "12px", color: "#a0a4b8" }}>
                          Utilisez l'outil de calepinage pour définir
                          l'emplacement des panneaux
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e8e8ea",
                    fontSize: "8px",
                    color: "#7a7e95",
                    minHeight: "40px",
                  }}
                >
                  <span>MAFATEC — Énergie solaire</span>
                  <span
                    style={{ letterSpacing: "2px", textTransform: "uppercase" }}
                  >
                    Étude Installation PV
                  </span>
                  <span>Page 3 / 6</span>
                </div>
              </div>
            </div>

            {/* PAGE 4 - TABLEAU MENSUEL */}
            <div
              className="page"
              style={{
                width: "210mm",
                minHeight: "272mm",
                background: "#fff",
                marginBottom: "30px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  paddingTop: "4mm",
                  paddingLeft: "6mm",
                  paddingRight: "22mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "20px",
                      marginBottom: "24px",
                      borderBottom: "1px solid #e8e8ea",
                      marginTop: "-15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <img
                        src="/mafatec-logo-rge.png"
                        alt="MAFATEC"
                        style={{ height: "24px" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: "#7a7e95",
                        fontWeight: 600,
                      }}
                    >
                      Détail mensuel
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "1px",
                        background: "#A82E12",
                        transform: "translateY(6px)", // Moves the line down by 1px
                      }}
                    />
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "#c93b18",
                      }}
                    >
                      Détail mensuel
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#15172b",
                      marginBottom: "8px",
                    }}
                  >
                    Énergie PV & irradiation{" "}
                    <em style={{ fontStyle: "italic", color: "#c93b18" }}>
                      mensuelle
                    </em>
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a7e95",
                      marginTop: "4px",
                      marginBottom: "20px",
                    }}
                  >
                    Production, irradiation et variabilité mois par mois, avec
                    total annuel.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                      marginBottom: "20px",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        border: "1px solid #e8e8ea",
                        borderRadius: "12px",
                        overflow: "hidden",
                        margin: "0 auto",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#131839" }}>
                          <th
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              color: "#f3efe6",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              verticalAlign: "bottom",
                            }}
                          >
                            Mois
                          </th>
                          <th
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              color: "#f3efe6",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              verticalAlign: "bottom",
                            }}
                          >
                            Production
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 400,
                                letterSpacing: "0.5px",
                                marginTop: "4px",
                                color: "#ffffff",
                              }}
                            >
                              (kWh)
                            </div>
                          </th>
                          <th
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              color: "#f3efe6",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              verticalAlign: "bottom",
                            }}
                          >
                            Irradiation
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 400,
                                letterSpacing: "0.5px",
                                marginTop: "4px",
                                color: "#ffffff",
                              }}
                            >
                              (kWh/m²)
                            </div>
                          </th>
                          <th
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              color: "#f3efe6",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              verticalAlign: "bottom",
                            }}
                          >
                            Variabilité
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 400,
                                letterSpacing: "0.5px",
                                marginTop: "4px",
                                color: "#ffffff",
                              }}
                            >
                              (kWh)
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((m: any, i: number) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom:
                                i === monthlyData.length - 1
                                  ? "none"
                                  : "1px solid #e8e8ea",
                              background: i % 2 === 0 ? "#ffffff" : "#f9f9fb",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 12px",
                                fontWeight: 600,
                                textAlign: "center",
                                fontSize:"12px"
                              }}
                            >
                              {monthNames[i]}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize:"12px"
                              }}
                            >
                              {formatNumber(m.E_m || 0, 2)}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "center",
                                fontSize:"12px"
                              }}
                            >
                              {formatNumber(m["H(i)_m"] || 0, 2)}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "center",
                                fontSize:"12px"
                              }}
                            >
                              {formatNumber(m.SD_m || 0, 2)}
                            </td>
                          </tr>
                        ))}
                        <tr
                          style={{
                            background: "#131839",
                            fontWeight: "bold",
                            borderTop: "1px solid #e8e8ea",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 12px",
                              color: "#ffffff",
                              textAlign: "center",
                              fontWeight: 700,
                              fontSize:"13px"
                            }}
                          >
                            Total annuel
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              textAlign: "center",
                              fontWeight: "bold",
                              color: "#ffffff",
                              fontSize:"13px"
                            }}
                          >
                            {formatNumber(totalProduction, 2)}
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              textAlign: "center",
                              fontWeight: "bold",
                              color: "#ffffff",
                              fontSize:"13px"
                            }}
                          >
                            {formatNumber(totalIrradiation, 2)}
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              textAlign: "center",
                              fontWeight: "bold",
                              color: "#ffffff",
                              fontSize:"13px"
                            }}
                          >
                            {formatNumber(variabiliteAnnuelle, 1)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f5f5f7",
                    padding: "16px",
                    borderRadius: "12px",
                    marginTop: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "1.8px",
                      textTransform: "uppercase",
                      color: "#3a55b0",
                      marginBottom: "6px",
                    }}
                  >
                    Note
                  </h4>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#454a63",
                      lineHeight: 1.55,
                    }}
                  >
                    Les valeurs mensuelles sont issues de la simulation
                    d'irradiation pour le site et tiennent compte des pertes
                    système. Le total annuel de production s'élève à{" "}
                    {formatNumber(totalProduction, 2)} kWh.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e8e8ea",
                    fontSize: "8px",
                    color: "#7a7e95",
                    minHeight: "50px",
                    marginTop: "-50px",
                  }}
                >
                  <span>MAFATEC — Énergie solaire</span>
                  <span
                    style={{ letterSpacing: "2px", textTransform: "uppercase" }}
                  >
                    Étude Installation PV
                  </span>
                  <span>Page 4 / 6</span>
                </div>
              </div>
            </div>

            {/* PAGE 5 - COURBES */}
            <div
              className="page"
              style={{
                width: "210mm",
                minHeight: "266mm",
                background: "#fff",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  paddingTop: "4mm",
                  paddingLeft: "6mm",
                  paddingRight: "22mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "20px",
                      marginBottom: "24px",
                      borderBottom: "1px solid #e8e8ea",
                      marginTop: "-40px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <img
                        src="/mafatec-logo-rge.png"
                        alt="MAFATEC"
                        style={{ height: "24px" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: "#7a7e95",
                        fontWeight: 600,
                      }}
                    >
                      Courbes mensuelles
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "1px",
                        background: "#A82E12",
                        transform: "translateY(6px)", // Moves the line down by 1px
                      }}
                    />
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "#c93b18",
                      }}
                    >
                      Évolution annuelle
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#15172b",
                      marginBottom: "8px",
                    }}
                  >
                    Courbes{" "}
                    <em style={{ fontStyle: "italic", color: "#c93b18" }}>
                      mensuelles
                    </em>
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a7e95",
                      marginTop: "4px",
                      marginBottom: "20px",
                    }}
                  >
                    Profil de production, d'irradiation et de variabilité sur
                    les douze mois de l'année.
                  </p>

                  <div
                    style={{
                      border: "1px solid #e8e8ea",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "24px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#c93b18",
                          marginTop: "14px"
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#15172b",
                        }}
                      >
                        Production mensuelle (kWh)
                      </span>
                    </div>
                    {renderAreaChart(
                      chartDataProduction,
                      "#c93b18",
                      maxProduction,
                      160,
                    )}
                  </div>

                  <div
                    style={{
                      border: "1px solid #e8e8ea",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "24px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#a8884a",
                          marginTop: "14px"
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#15172b",
                        }}
                      >
                        Irradiation mensuelle (kWh/m²)
                      </span>
                    </div>
                    {renderAreaChart(
                      chartDataIrradiation,
                      "#a8884a",
                      maxIrradiation,
                      160,
                    )}
                  </div>

                  <div
                    style={{
                      border: "1px solid #e8e8ea",
                      borderRadius: "12px",
                      padding: "20px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#3a55b0",
                          marginTop: "14px"
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#15172b",
                        }}
                      >
                        Variabilité mensuelle (kWh)
                      </span>
                    </div>
                    {renderAreaChart(
                      chartDataVariability,
                      "#3a55b0",
                      maxVariability,
                      160,
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e8e8ea",
                    fontSize: "8px",
                    color: "#7a7e95",
                    minHeight: "50px",
                  }}
                >
                  <span>MAFATEC — Énergie solaire</span>
                  <span
                    style={{ letterSpacing: "2px", textTransform: "uppercase" }}
                  >
                    Étude Installation PV
                  </span>
                  <span>Page 5 / 6</span>
                </div>
              </div>
            </div>

            {/* PAGE 6 - DIAGRAMME SOLAIRE & CONCLUSION */}
            <div
              className="page"
              style={{
                width: "210mm",
                minHeight: "266mm",
                background: "#fff",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  paddingTop: "4mm",
                  paddingLeft: "6mm",
                  paddingRight: "22mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "20px",
                      marginBottom: "24px",
                      borderBottom: "1px solid #e8e8ea",
                      marginTop: "-20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <img
                        src="/mafatec-logo-rge.png"
                        alt="MAFATEC"
                        style={{ height: "24px" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: "#7a7e95",
                        fontWeight: 600,
                      }}
                    >
                      Diagramme solaire
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "1px",
                        background: "#A82E12",
                        transform: "translateY(6px)", // Moves the line down by 1px
                      }}
                    />
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "#c93b18",
                      }}
                    >
                      Ensoleillement
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Spectral', Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#15172b",
                      marginBottom: "8px",
                    }}
                  >
                    Diagramme solaire avec{" "}
                    <em style={{ fontStyle: "italic", color: "#c93b18" }}>
                      masques d'ombrage
                    </em>
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a7e95",
                      marginTop: "4px",
                      marginBottom: "20px",
                    }}
                  >
                    Trajectoire du soleil selon l'azimut et la hauteur
                    angulaire, lignes horaires et impact des ombrages sur
                    l'année.
                  </p>

                  <div
                    style={{
                      padding: "0px",
                      background: "#fff",
                      marginBottom: "20px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "380px",
                    }}
                  >
                    <div
                      style={{
                        transform: "scale(0.8)",
                        transformOrigin: "center",
                      }}
                    >
                      {(String(data?.inputs?.location?.latitude).startsWith(
                        "42.",
                      ) ||
                        (data?.inputs?.location?.latitude || 0) < 42) && (
                        <Altitude42 obstacles={obstacles || []} />
                      )}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "43.",
                      ) && <Altitude43 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "44.",
                      ) && <Altitude44 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "45.",
                      ) && <Altitude45 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "46.",
                      ) && <Altitude46 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "47.",
                      ) && <Altitude47 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "48.",
                      ) && <Altitude48 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "49.",
                      ) && <Altitude49 obstacles={obstacles || []} />}
                      {String(data?.inputs?.location?.latitude).startsWith(
                        "50.",
                      ) && <Altitude50 obstacles={obstacles || []} />}
                      {(String(data?.inputs?.location?.latitude).startsWith(
                        "51.",
                      ) ||
                        (data?.inputs?.location?.latitude || 0) > 51) && (
                        <Altitude51 obstacles={obstacles || []} />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e8e8ea",
                    fontSize: "8px",
                    color: "#7a7e95",
                    minHeight: "20px",
                    marginTop: "-20px",
                  }}
                >
                  <span>MAFATEC — Énergie solaire</span>
                  <span
                    style={{ letterSpacing: "2px", textTransform: "uppercase" }}
                  >
                    Étude Installation PV
                  </span>
                  <span>Page 6 / 6</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFPopup;
