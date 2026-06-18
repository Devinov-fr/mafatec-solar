"use client";

import React from "react";
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

interface StudyReportContentProps {
  data: any;
  monthNames: string[];
  azimut: string;
  inclinaison: string;
  clickedPosition: { lat: number; lng: number; address: string };
  puissancePv: string;
  systemLosses: string;
  voltageDropResult: any;
  panels: any[];
  obstacles?: any[];
  roofImageUrl: string | null;
  date: string;
}

const StudyReportContent = React.forwardRef<HTMLDivElement, StudyReportContentProps>(
  ({ data, monthNames, azimut, inclinaison, clickedPosition, puissancePv, systemLosses, voltageDropResult, panels, obstacles, roofImageUrl, date }, ref) => {
    
    const formatNumber = (value: number, decimals: number = 2): string => {
      if (isNaN(value)) return "0";
      return value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };

    const formatInteger = (value: number): string => {
      if (isNaN(value)) return "0";
      return Math.round(value).toLocaleString('fr-FR');
    };

    const productionAnnuelle = data?.outputs?.totals?.fixed?.E_y || data?.outputs?.totals?.fixed?.production || 0;
    const irradiationAnnuelle = data?.outputs?.totals?.fixed?.["H(i)_y"] || data?.outputs?.totals?.fixed?.irradiation || 0;
    const variabiliteAnnuelle = data?.outputs?.totals?.fixed?.SD_y || data?.outputs?.totals?.fixed?.variabilite || 0;

    const monthlyData = data?.outputs?.monthly?.fixed || [];
    
    const chartDataProduction = monthlyData.map((m: any, i: number) => ({ 
      month: monthNames[i] || `M${i+1}`, 
      value: m.E_m || m.production || 0 
    }));
    const chartDataIrradiation = monthlyData.map((m: any, i: number) => ({ 
      month: monthNames[i] || `M${i+1}`, 
      value: m["H(i)_m"] || m.irradiation || 0 
    }));
    const chartDataVariability = monthlyData.map((m: any, i: number) => ({ 
      month: monthNames[i] || `M${i+1}`, 
      value: m.SD_m || m.variabilite || 0 
    }));
    
    const maxProduction = chartDataProduction.length > 0 ? Math.max(...chartDataProduction.map((d: any) => d.value), 1) : 1;
    const maxIrradiation = chartDataIrradiation.length > 0 ? Math.max(...chartDataIrradiation.map((d: any) => d.value), 1) : 1;
    const maxVariability = chartDataVariability.length > 0 ? Math.max(...chartDataVariability.map((d: any) => d.value), 1) : 1;

    const totalProduction = chartDataProduction.reduce((sum: number, d: any) => sum + d.value, 0);
    const totalIrradiation = chartDataIrradiation.reduce((sum: number, d: any) => sum + d.value, 0);

    const getAzimuthDirection = (az: number) => {
      if (az === 0) return "Sud";
      if (az > 0) return `Sud-Ouest (${az}°)`;
      return `Sud-Est (${Math.abs(az)}°)`;
    };

    const renderAreaChart = (chartData: any[], color: string, maxValue: number, height: number = 140) => {
      if (chartData.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7e95', fontSize: '12px' }}>Données non disponibles</div>;
      
      const maxVal = maxValue || 1;
      const chartWidth = 450;
      const chartHeight = height - 40;
      const step = chartWidth / (chartData.length - 1 || 1);

      const points: string[] = [];
      chartData.forEach((item, idx) => {
        const x = idx * step;
        const y = chartHeight - (item.value / maxVal) * chartHeight + 10;
        points.push(`${x},${y}`);
      });

      const areaPoints = [...points];
      areaPoints.push(`${chartWidth},${chartHeight + 10}`);
      areaPoints.push(`0,${chartHeight + 10}`);
      const areaPath = `M ${areaPoints.join(" L ")} Z`;

      const gradientId = `gradient-${color.replace("#", "")}-${Math.random().toString(36).substr(2, 9)}`;
      const gridLines = [0, 25, 50, 75, 100];

      return (
        <svg viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", maxHeight: `${height}px` }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {gridLines.map((line) => {
            const yPos = chartHeight + 10 - (line / 100) * chartHeight;
            return <line key={line} x1={0} y1={yPos} x2={chartWidth} y2={yPos} stroke="#e8e8ea" strokeWidth="0.8" strokeDasharray={line > 0 && line < 100 ? "4,4" : "none"} />;
          })}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {chartData.map((item, idx) => {
            const x = idx * step;
            const y = chartHeight + 10 - (item.value / maxVal) * chartHeight;
            return <circle key={idx} cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth="2" />;
          })}
          {chartData.map((item, idx) => {
            const x = idx * step;
            return <text key={`label-${idx}`} x={x} y={chartHeight + 25} textAnchor="middle" fontSize="9" fill="#7a7e95" fontFamily="'Plus Jakarta Sans', sans-serif">{item.month.substring(0, 3)}</text>;
          })}
          <text x={-5} y={15} textAnchor="end" fontSize="8" fill="#a0a4b8" fontFamily="'Plus Jakarta Sans', sans-serif">{formatInteger(maxVal)}</text>
          <text x={-5} y={chartHeight + 10} textAnchor="end" fontSize="8" fill="#a0a4b8" fontFamily="'Plus Jakarta Sans', sans-serif">0</text>
        </svg>
      );
    };

    const PageFooter = ({ pageNumber, totalPages = 6 }: { pageNumber: number; totalPages?: number }) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e8e8ea", fontSize: "8px", color: "#7a7e95", paddingTop: "15px", marginTop: "auto", width: "100%" }}>
        <span>MAFATEC — Énergie solaire</span>
        <span style={{ letterSpacing: "2px", textTransform: "uppercase" }}>Étude Installation PV</span>
        <span>Page {pageNumber} / {totalPages}</span>
      </div>
    );

    return (
      <div ref={ref} className="study-report-content" style={{ width: "210mm", minWidth: "210mm", margin: "0 auto", background: "#e9eaee" }}>
        {/* PAGE 1 - COVER */}
        <div className="page" style={{ width: "210mm", minHeight: "297mm", background: "#131839", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 70% at 15% 85%, #131839 0%, rgba(19, 22, 47, 0.7) 40%, transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 2, padding: "15mm", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <img src="/logo-mafatec-blanc.png" alt="MAFATEC" style={{ height: "20px" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  {["RGE", "Qualifelec"].map(t => <span key={t} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "9px", letterSpacing: "1.4px", textTransform: "uppercase", color: "#A82E12", padding: "4px 8px", borderRadius: "3px", border: "1px solid rgba(168,46,18,0.3)" }}>{t}</span>)}
                </div>
              </div>
            </div>
            <div style={{ padding: "8mm 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "30px auto", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <div style={{ width: "30px", height: "1px", background: "#A82E12" }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#A82E12" }}>Étude de production photovoltaïque</span>
              </div>
              <h1 style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "42px", fontWeight: 500, color: "#f3efe6", lineHeight: 1.04, marginBottom: "20px" }}>Rapport de <em style={{ fontStyle: "italic", color: "#A82E12" }}>Production</em><br />photovoltaïque détaillé</h1>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(243,239,230,0.62)", maxWidth: "450px" }}>Estimation de production, irradiation et performance d'une installation photovoltaïque de {puissancePv} kWc, calculée selon les données d'irradiation officielles.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginTop: "30px", paddingTop: "12px", borderTop: "1px solid rgba(201,169,106,0.28)" }}>
                {[
                  { k: "Site analysé", v: clickedPosition.address || "Adresse non définie" },
                  { k: "Coordonnées", v: `${clickedPosition.lat.toFixed(6)} N · ${clickedPosition.lng.toFixed(6)} E` },
                  { k: "Puissance installée", v: `${puissancePv} kWc` },
                  { k: "Production annuelle estimée", v: `${formatInteger(productionAnnuelle)} kWh / an` }
                ].map(item => (
                  <div key={item.k}>
                    <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#A82E12", marginBottom: "4px" }}>{item.k}</div>
                    <div style={{ fontSize: "13px", color: "#f3efe6" }}>{item.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8px", color: "#ffffff", minHeight: "50px" }}>
              <div style={{ fontFamily: "'Spectral', Georgia, serif", fontStyle: "italic", fontSize: "11px" }}>Préparé par <strong style={{ fontStyle: "normal", fontWeight: 600 }}>MAFATEC</strong> — Énergie solaire</div>
              <div style={{ textAlign: "right", lineHeight: "1.5", letterSpacing: "0.5px" }}>Réf. ÉTUDE PV · {puissancePv} kWc<br />Édité le {date}</div>
            </div>
          </div>
        </div>

        {/* PAGE 2 - SYNTHÈSE */}
        <div className="page" style={{ width: "210mm", minHeight: "297mm", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15mm", display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #e8e8ea" }}>
              <img src="/mafatec-logo-rge.png" alt="MAFATEC" style={{ height: "24px" }} />
              <div style={{ fontSize: "9px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#7a7e95", fontWeight: 600 }}>Synthèse de l'étude</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}><div style={{ width: "30px", height: "1px", background: "#A82E12" }} /><span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#c93b18" }}>Résultats de la simulation</span></div>
            <h2 style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "24px", fontWeight: 600, color: "#15172b" }}>Les indicateurs <em style={{ fontStyle: "italic", color: "#c93b18" }}>clés</em> de production</h2>
            <p style={{ fontSize: "13px", color: "#7a7e95", margin: "4px 0 24px" }}>Performance annuelle estimée — inclinaison {inclinaison}°, azimut {azimut}° ({getAzimuthDirection(parseFloat(azimut))}).</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { k: "Production annuelle", v: formatInteger(productionAnnuelle), u: "kWh", d: "Énergie produite estimée sur une année complète." },
                { k: "Irradiation annuelle", v: formatInteger(irradiationAnnuelle), u: "kWh/m²", d: "Rayonnement solaire reçu par mètre carré." },
                { k: "Variabilité interannuelle", v: formatNumber(variabiliteAnnuelle, 1), u: "%", d: "Écart-type de production d'une année sur l'autre." }
              ].map(item => (
                <div key={item.k} style={{ background: "#131839", borderRadius: "14px", padding: "20px", color: "#f3efe6" }}>
                  <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#A82E12", marginBottom: "12px" }}>{item.k}</div>
                  <div style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "28px", fontWeight: 500, marginBottom: "8px" }}>{item.v}<span style={{ fontSize: "11px", marginLeft: "4px" }}>{item.u}</span></div>
                  <div style={{ fontSize: "10px", color: "#ffffff" }}>{item.d}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div style={{ border: "1px solid #e8e8ea", borderRadius: "12px", padding: "16px", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}><h3 style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#c93b18" }}>Entrées fournies</h3></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { k: "Latitude", v: clickedPosition.lat.toFixed(6) },
                    { k: "Longitude", v: clickedPosition.lng.toFixed(6) },
                    { k: "Horizon", v: "Calculé" },
                    { k: "PV installée", v: `${puissancePv} kWc` },
                    { k: "Pertes système", v: `${systemLosses} %` },
                    { k: "Inclinaison", v: `${inclinaison}°` },
                    { k: "Azimut", v: `${azimut}° (${getAzimuthDirection(parseFloat(azimut))})` }
                  ].map(r => (
                    <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span style={{ color: "#454a63" }}>{r.k}</span><span style={{ fontWeight: "bold", color: "#15172b" }}>{r.v}</span></div>
                  ))}
                </div>
              </div>
              <div style={{ border: "1px solid #e8e8ea", borderRadius: "12px", padding: "16px", background: "#fff" }}>
                <h3 style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#c93b18", marginBottom: "16px" }}>Changements de la production</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { k: "Angle d'incidence", v: formatNumber(data?.outputs?.totals?.fixed?.l_aoi || 0, 2) },
                    { k: "Effets spectraux", v: data?.outputs?.totals?.fixed?.l_spec || "0" },
                    { k: "Température & faible irradiance", v: `${formatNumber(data?.outputs?.totals?.fixed?.l_tg || 0, 2)} %` },
                    { k: "Pertes totales", v: formatNumber(data?.outputs?.totals?.fixed?.l_total || 0, 2) }
                  ].map(r => (
                    <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span style={{ color: "#454a63" }}>{r.k}</span><span style={{ fontWeight: "bold", color: "#15172b" }}>{r.v}</span></div>
                  ))}
                </div>
                {voltageDropResult && (
                  <div style={{ marginTop: "14px" }}>
                    <h3 style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#c93b18", marginBottom: "12px" }}>Chute de tension du câblage</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { k: "Chute de tension", v: `${voltageDropResult.vdrop} V` },
                        { k: "Pourcentage", v: `${voltageDropResult.vdropPct} %` },
                        { k: "Résistance fil", v: `${voltageDropResult.rwire} Ω` }
                      ].map(r => <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span style={{ color: "#454a63" }}>{r.k}</span><span style={{ fontWeight: "bold", color: "#15172b" }}>{r.v}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ background: "#f5f5f7", padding: "16px", borderRadius: "12px", marginTop: "auto" }}>
              <h4 style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "#3a55b0", marginBottom: "6px" }}>Méthodologie</h4>
              <p style={{ fontSize: "12px", color: "#454a63", lineHeight: 1.55 }}>Estimation basée sur les données d'irradiation PVGIS, intégrant les paramètres de configuration ({systemLosses}% de pertes système) et le profil d'horizon local.</p>
            </div>
            <PageFooter pageNumber={2} />
          </div>
        </div>

        {/* PAGE 3 - CALEPINAGE */}
        <div className="page" style={{ width: "210mm", minHeight: "297mm", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15mm", display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #e8e8ea" }}>
              <img src="/mafatec-logo-rge.png" alt="MAFATEC" style={{ height: "24px" }} />
              <div style={{ fontSize: "9px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#7a7e95", fontWeight: 600 }}>Calepinage</div>
            </div>
            <h2 style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "24px", fontWeight: 600, color: "#15172b" }}>Emplacement des <em style={{ fontStyle: "italic", color: "#c93b18" }}>panneaux</em></h2>
            <p style={{ fontSize: "13px", color: "#7a7e95", margin: "4px 0 20px" }}>Implantation optimisée du champ photovoltaïque sur la toiture.</p>
            <div style={{ border: "1px solid #e8e8ea", borderRadius: "14px", padding: "20px", background: "#fff", marginBottom: "20px", textAlign: "center" }}>
              {panels && panels.length > 0 ? (
                <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                  <img src={roofImageUrl || "/toit-maison.jpg"} alt="Toiture" style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }} />
                  <svg viewBox="0 0 1024 730" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                    {panels.map((p: any) => <rect key={p.id} x={p.x} y={p.y} width={p.width} height={p.height} fill="rgba(11,14,29,0.85)" stroke="#f97316" strokeWidth="3" rx="4" />)}
                  </svg>
                </div>
              ) : (
                <div style={{ background: "#f5f5f7", borderRadius: "8px", padding: "60px", color: "#7a7e95" }}>📐 Aucun calepinage défini</div>
              )}
            </div>
            <PageFooter pageNumber={3} />
          </div>
        </div>

        {/* PAGE 4 - TABLEAU MENSUEL */}
        <div className="page" style={{ width: "210mm", minHeight: "297mm", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15mm", display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #e8e8ea" }}>
              <img src="/mafatec-logo-rge.png" alt="MAFATEC" style={{ height: "24px" }} />
              <div style={{ fontSize: "9px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#7a7e95", fontWeight: 600 }}>Détail mensuel</div>
            </div>
            <h2 style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "24px", fontWeight: 600, color: "#15172b" }}>Énergie PV & irradiation <em style={{ fontStyle: "italic", color: "#c93b18" }}>mensuelle</em></h2>
            <p style={{ fontSize: "13px", color: "#7a7e95", margin: "4px 0 20px" }}>Production, irradiation et variabilité mois par mois.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", border: "1px solid #e8e8ea", borderRadius: "12px", overflow: "hidden" }}>
              <thead>
                <tr style={{ background: "#131839", color: "#f3efe6" }}>
                  <th style={{ padding: "12px", textAlign: "left", textTransform: "uppercase" }}>Mois</th>
                  <th style={{ padding: "12px", textAlign: "right", textTransform: "uppercase" }}>Production (kWh)</th>
                  <th style={{ padding: "12px", textAlign: "right", textTransform: "uppercase" }}>Irradiation (kWh/m²)</th>
                  <th style={{ padding: "12px", textAlign: "right", textTransform: "uppercase" }}>Variabilité (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {chartDataProduction.map((m: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e8e8ea", background: i % 2 === 0 ? "#fff" : "#f9f9fb" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.month}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatNumber(m.value, 2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatNumber(chartDataIrradiation[i].value, 2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatNumber(chartDataVariability[i].value, 2)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#131839", color: "#fff", fontWeight: "bold" }}>
                  <td style={{ padding: "12px" }}>Total annuel</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{formatNumber(totalProduction, 2)}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{formatNumber(totalIrradiation, 2)}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{formatNumber(variabiliteAnnuelle, 1)}</td>
                </tr>
              </tbody>
            </table>
            <PageFooter pageNumber={4} />
          </div>
        </div>

        {/* PAGE 5 - COURBES */}
        <div className="page" style={{ width: "210mm", minHeight: "297mm", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15mm", display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #e8e8ea" }}>
              <img src="/mafatec-logo-rge.png" alt="MAFATEC" style={{ height: "24px" }} />
              <div style={{ fontSize: "9px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#7a7e95", fontWeight: 600 }}>Courbes mensuelles</div>
            </div>
            <h2 style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "24px", fontWeight: 600, color: "#15172b" }}>Courbes <em style={{ fontStyle: "italic", color: "#c93b18" }}>mensuelles</em></h2>
            <p style={{ fontSize: "13px", color: "#7a7e95", margin: "4px 0 20px" }}>Évolution sur les douze mois de l'année.</p>
            {[
              { label: "Production mensuelle (kWh)", color: "#c93b18", data: chartDataProduction, max: maxProduction },
              { label: "Irradiation mensuelle (kWh/m²)", color: "#a8884a", data: chartDataIrradiation, max: maxIrradiation },
              { label: "Variabilité mensuelle (kWh)", color: "#3a55b0", data: chartDataVariability, max: maxVariability }
            ].map(chart => (
              <div key={chart.label} style={{ border: "1px solid #e8e8ea", borderRadius: "12px", padding: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: chart.color }} />
                  <span style={{ fontSize: "11px", fontWeight: "bold" }}>{chart.label}</span>
                </div>
                {renderAreaChart(chart.data, chart.color, chart.max, 140)}
              </div>
            ))}
            <PageFooter pageNumber={5} />
          </div>
        </div>

        {/* PAGE 6 - DIAGRAMME SOLAIRE */}
        <div className="page" style={{ width: "210mm", minHeight: "297mm", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15mm", display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #e8e8ea" }}>
              <img src="/mafatec-logo-rge.png" alt="MAFATEC" style={{ height: "24px" }} />
              <div style={{ fontSize: "9px", letterSpacing: "1.8px", textTransform: "uppercase", color: "#7a7e95", fontWeight: 600 }}>Diagramme solaire</div>
            </div>
            <h2 style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: "24px", fontWeight: 600, color: "#15172b" }}>Diagramme solaire avec <em style={{ fontStyle: "italic", color: "#c93b18" }}>masques d'ombrage</em></h2>
            <p style={{ fontSize: "13px", color: "#7a7e95", margin: "4px 0 20px" }}>Trajectoire du soleil et impact des ombrages sur l'année.</p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px", background: "#fff" }}>
              <div style={{ transform: "scale(0.85)" }}>
                {(() => {
                  const lat = data?.inputs?.location?.latitude || clickedPosition?.lat || 0;
                  const latStr = String(lat);
                  if (latStr.startsWith("43.")) return <Altitude43 obstacles={obstacles || []} />;
                  if (latStr.startsWith("44.")) return <Altitude44 obstacles={obstacles || []} />;
                  if (latStr.startsWith("45.")) return <Altitude45 obstacles={obstacles || []} />;
                  if (latStr.startsWith("46.")) return <Altitude46 obstacles={obstacles || []} />;
                  if (latStr.startsWith("47.")) return <Altitude47 obstacles={obstacles || []} />;
                  if (latStr.startsWith("48.")) return <Altitude48 obstacles={obstacles || []} />;
                  if (latStr.startsWith("49.")) return <Altitude49 obstacles={obstacles || []} />;
                  if (latStr.startsWith("50.")) return <Altitude50 obstacles={obstacles || []} />;
                  if (latStr.startsWith("51.") || lat > 51) return <Altitude51 obstacles={obstacles || []} />;
                  return <Altitude42 obstacles={obstacles || []} />;
                })()}
              </div>
            </div>
            <PageFooter pageNumber={6} />
          </div>
        </div>

        <style jsx global>{`
          .study-report-content .page {
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }
          @media print {
            .study-report-content {
              background: white !important;
            }
            .study-report-content .page {
              page-break-after: always;
              break-after: page;
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

StudyReportContent.displayName = "StudyReportContent";

export default StudyReportContent;
