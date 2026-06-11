"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  TrendingUp,
  Clock,
  Zap,
  ChevronRight,
  Download,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

// Types
interface MonthlyData {
  month: string;
  production: number;
  irradiation: number;
  variability: number;
}

const RapportPage = () => {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR"));
  }, []);

  // Static data (replace with your actual data)
  const monthlyData: MonthlyData[] = [
    { month: "Janvier", production: 195.67, irradiation: 28.89, variability: 19.76 },
    { month: "Février", production: 345.21, irradiation: 47.99, variability: 55.79 },
    { month: "Mars", production: 676.97, irradiation: 92.32, variability: 86.41 },
    { month: "Avril", production: 1013.15, irradiation: 139.51, variability: 128.88 },
    { month: "Mai", production: 1162.09, irradiation: 161.15, variability: 159.22 },
    { month: "Juin", production: 1221.95, irradiation: 173.80, variability: 152.79 },
    { month: "Juillet", production: 1236.57, irradiation: 178.41, variability: 130.99 },
    { month: "Août", production: 1046.15, irradiation: 150.05, variability: 87.01 },
    { month: "Septembre", production: 794.93, irradiation: 112.60, variability: 51.73 },
    { month: "Octobre", production: 480.24, irradiation: 68.04, variability: 39.74 },
    { month: "Novembre", production: 243.09, irradiation: 35.64, variability: 26.43 },
    { month: "Décembre", production: 164.91, irradiation: 25.52, variability: 24.16 },
  ];

  const totalProduction = monthlyData.reduce((sum, m) => sum + m.production, 0);
  const totalIrradiation = monthlyData.reduce((sum, m) => sum + m.irradiation, 0);
  const totalVariability = monthlyData.reduce((sum, m) => sum + m.variability, 0);

  const maxProduction = Math.max(...monthlyData.map(m => m.production));
  const maxIrradiation = Math.max(...monthlyData.map(m => m.irradiation));
  const maxVariability = Math.max(...monthlyData.map(m => m.variability));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#e9eaee]">
      {/* Toolbar - screen only */}
      <div className="rp-toolbar">
        <div className="rp-tb-l">
          <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-[22px] w-auto" />
          <span>
            Rapport d'étude — <strong>Installation PV 9 kWc · Villepinte</strong>
          </span>
        </div>
        <button onClick={handlePrint} className="btn-print">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
          </svg>
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      {/* Stack of pages */}
      <div className="rp-stack">
        {/* PAGE 1 - COVER */}
        <section className="page cover">
          <div className="cover-bg" />
          <div className="cover-grain" />
          <div className="cover-in">
            <div className="cover-top">
              <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="cover-logo" />
              <div className="cover-badges">
                <span>RGE</span>
                <span>Qualifelec</span>
              </div>
            </div>

            <div className="cover-mid">
              <span className="cover-eyebrow">
                <span className="mark"></span>
                Étude de production photovoltaïque
              </span>
              <h1 className="cover-title">
                Rapport d'<em>analyse</em><br />solaire détaillé
              </h1>
              <p className="cover-lead">
                Estimation de production, irradiation et performance d'une installation
                photovoltaïque de 9 kWc, calculée selon les données d'irradiation
                officielles et les paramètres réels du site.
              </p>

              <div className="cover-meta">
                <div className="cm">
                  <span className="cm-k">Site analysé</span>
                  <span className="cm-v">6 Parc de la Noue, 93420 Villepinte</span>
                </div>
                <div className="cm">
                  <span className="cm-k">Coordonnées</span>
                  <span className="cm-v">48.9593392 N · 2.5413257 E</span>
                </div>
                <div className="cm">
                  <span className="cm-k">Puissance installée</span>
                  <span className="cm-v">9 kWc</span>
                </div>
                <div className="cm">
                  <span className="cm-k">Production annuelle estimée</span>
                  <span className="cm-v">{totalProduction.toLocaleString("fr-FR")} kWh / an</span>
                </div>
              </div>
            </div>

            <div className="cover-bottom">
              <div className="cover-sign">
                Préparé par <strong>MAFATEC</strong> — Énergie solaire
              </div>
              <div className="cover-ref">
                Réf. ÉTUDE PV · 9 kWc<br />
                Édité le {date}
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 2 - SYNTHÈSE */}
        <section className="page">
          <div className="page-pad">
            <div className="rp-runhead">
              <div className="rh-l">
                <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-[24px] w-auto" />
                <span className="rh-rge">RGE</span>
              </div>
              <div className="rh-r">Synthèse de l'étude</div>
            </div>

            <div className="rp-block-head">
              <span className="rp-eyebrow">
                <span className="mark"></span>
                Résultats de la simulation
              </span>
              <h2 className="rp-h">
                Les indicateurs <em>clés</em> de production
              </h2>
              <p className="rp-sub">
                Performance annuelle estimée pour l'installation configurée — inclinaison 35°, azimut 0° (plein sud).
              </p>
            </div>

            <div className="rp-kpis">
              <div className="rp-kpi">
                <div className="k-lab">Production annuelle</div>
                <div>
                  <span className="k-val">{totalProduction.toLocaleString("fr-FR")}</span>
                  <span className="k-unit">kWh</span>
                </div>
                <div className="k-foot">Énergie produite estimée sur une année complète.</div>
              </div>
              <div className="rp-kpi">
                <div className="k-lab">Irradiation annuelle</div>
                <div>
                  <span className="k-val">{Math.round(totalIrradiation).toLocaleString("fr-FR")}</span>
                  <span className="k-unit">kWh/m²</span>
                </div>
                <div className="k-foot">Rayonnement solaire reçu par mètre carré et par an.</div>
              </div>
              <div className="rp-kpi">
                <div className="k-lab">Variabilité interannuelle</div>
                <div>
                  <span className="k-val">{totalVariability.toFixed(2)}</span>
                  <span className="k-unit">kWh</span>
                </div>
                <div className="k-foot">Écart-type de production d'une année sur l'autre.</div>
              </div>
            </div>

            <div className="rp-data-grid">
              <div className="rp-data-card">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 5h16M4 12h16M4 19h10" />
                  </svg>
                  Entrées fournies
                </h3>
                <div className="rp-dl">
                  <div className="row"><span className="k">Latitude</span><span className="v">48.9593392</span></div>
                  <div className="row"><span className="k">Longitude</span><span className="v">2.5413257</span></div>
                  <div className="row"><span className="k">Horizon</span><span className="v">Calculé</span></div>
                  <div className="row"><span className="k">PV installée</span><span className="v">9 kWc</span></div>
                  <div className="row"><span className="k">Pertes système</span><span className="v">14 %</span></div>
                  <div className="row"><span className="k">Inclinaison</span><span className="v">35°</span></div>
                  <div className="row"><span className="k">Azimut</span><span className="v">0° (Sud)</span></div>
                </div>
              </div>
              <div className="rp-data-card">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v6M12 22v-2M4 12H2M6.3 6.3 4.9 4.9M17.7 6.3l1.4-1.4M22 12h-2" />
                    <circle cx="12" cy="14" r="4" />
                  </svg>
                  Changements de la production
                </h3>
                <div className="rp-dl">
                  <div className="row"><span className="k">Angle d'incidence</span><span className="v">-4.38</span></div>
                  <div className="row"><span className="k">Effets spectraux</span><span className="v">1.48</span></div>
                  <div className="row"><span className="k">Température & faible irradiance</span><span className="v">-5.87 %</span></div>
                  <div className="row"><span className="k">Pertes totales</span><span className="v">-21.46</span></div>
                </div>
                <h3 style={{ marginTop: "6mm" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
                  </svg>
                  Chute de tension du câblage
                </h3>
                <div className="rp-dl">
                  <div className="row"><span className="k">Chute de tension</span><span className="v">0,305 V</span></div>
                  <div className="row"><span className="k">Pourcentage de chute</span><span className="v">2,541 %</span></div>
                  <div className="row"><span className="k">Résistance de fil</span><span className="v">0,060974 Ω</span></div>
                </div>
              </div>
            </div>

            <div className="rp-note">
              <h4>Méthodologie</h4>
              <p>
                Les estimations sont calculées à partir des données d'irradiation solaire de référence pour la localisation
                du site, en tenant compte de l'inclinaison, de l'azimut, des pertes système (14 %) et du calcul automatique
                de l'horizon. Les valeurs de production constituent une estimation et peuvent varier selon les conditions
                météorologiques réelles.
              </p>
            </div>

            <div className="rp-foot">
              <span>MAFATEC — Énergie solaire</span>
              <span className="rf-mid">Étude Installation PV</span>
              <span>Page 2 / 5</span>
            </div>
          </div>
        </section>

        {/* PAGE 3 - CALEPINAGE */}
        <section className="page">
          <div className="page-pad">
            <div className="rp-runhead">
              <div className="rh-l">
                <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-[24px] w-auto" />
                <span className="rh-rge">RGE</span>
              </div>
              <div className="rh-r">Calepinage</div>
            </div>

            <div className="rp-block-head">
              <span className="rp-eyebrow">
                <span className="mark"></span>
                Calepinage
              </span>
              <h2 className="rp-h">
                Emplacement des <em>panneaux</em>
              </h2>
              <p className="rp-sub">Implantation et forme du champ photovoltaïque sur la toiture.</p>
            </div>

            <div className="rp-visual">
              <div className="rp-calep-wrap">
                <div className="bg-[#f5f5f7] rounded-lg flex items-center justify-center h-[180px] border border-[#e8e8ea]">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📐</div>
                    <div className="text-sm text-[#454a63]">24 panneaux · 375 Wc</div>
                  </div>
                </div>
                <div className="rp-calep-stats">
                  <div className="rp-cs"><span className="cs-v">24</span><span className="cs-k">Panneaux · 375 Wc</span></div>
                  <div className="rp-cs"><span className="cs-v">9 kWc</span><span className="cs-k">Puissance crête</span></div>
                  <div className="rp-cs"><span className="cs-v">≈ 44 m²</span><span className="cs-k">Surface toiture</span></div>
                  <div className="rp-cs"><span className="cs-v">35° · 0°</span><span className="cs-k">Inclinaison · Azimut</span></div>
                </div>
              </div>
            </div>

            <div className="rp-note">
              <h4>Lecture du calepinage</h4>
              <p>
                Le schéma présente l'implantation optimisée des 24 modules sur la toiture, orientés plein sud (azimut 0°)
                avec une inclinaison de 35°. La disposition réelle sera affinée lors de la visite technique en fonction
                des contraintes de toiture (chéneaux, chéminées, fenêtres de toit).
              </p>
            </div>

            <div className="rp-foot">
              <span>MAFATEC — Énergie solaire</span>
              <span className="rf-mid">Étude Installation PV</span>
              <span>Page 3 / 6</span>
            </div>
          </div>
        </section>

        {/* PAGE 4 - TABLEAU MENSUEL */}
        <section className="page">
          <div className="page-pad">
            <div className="rp-runhead">
              <div className="rh-l">
                <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-[24px] w-auto" />
                <span className="rh-rge">RGE</span>
              </div>
              <div className="rh-r">Détail mensuel</div>
            </div>

            <div className="rp-block-head">
              <span className="rp-eyebrow">
                <span className="mark"></span>
                Détail mensuel
              </span>
              <h2 className="rp-h">
                Énergie PV & irradiation <em>mensuelle</em>
              </h2>
              <p className="rp-sub">Production, irradiation et variabilité mois par mois, avec total annuel.</p>
            </div>

            <table className="rp-monthtable">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Production (kWh)</th>
                  <th>Irradiation (kWh/m²)</th>
                  <th>Variabilité (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.month}</td>
                    <td>{row.production.toFixed(2)}</td>
                    <td>{row.irradiation.toFixed(2)}</td>
                    <td>{row.variability.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="tot">
                  <td>Total annuel</td>
                  <td>{totalProduction.toFixed(2)}</td>
                  <td>{totalIrradiation.toFixed(2)}</td>
                  <td>{totalVariability.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="rp-note">
              <h4>Note</h4>
              <p>
                Les valeurs mensuelles sont issues de la simulation d'irradiation pour le site et tiennent compte des
                pertes système. Le total annuel de production s'élève à {totalProduction.toLocaleString("fr-FR")} kWh.
              </p>
            </div>

            <div className="rp-foot">
              <span>MAFATEC — Énergie solaire</span>
              <span className="rf-mid">Étude Installation PV</span>
              <span>Page 4 / 6</span>
            </div>
          </div>
        </section>

        {/* PAGE 5 - COURBES */}
        <section className="page">
          <div className="page-pad">
            <div className="rp-runhead">
              <div className="rh-l">
                <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-[24px] w-auto" />
                <span className="rh-rge">RGE</span>
              </div>
              <div className="rh-r">Courbes mensuelles</div>
            </div>

            <div className="rp-block-head">
              <span className="rp-eyebrow">
                <span className="mark"></span>
                Évolution annuelle
              </span>
              <h2 className="rp-h">
                Courbes <em>mensuelles</em>
              </h2>
              <p className="rp-sub">Profil de production, d'irradiation et de variabilité sur les douze mois de l'année.</p>
            </div>

            <div className="rp-charts">
              <div className="rp-chart">
                <div className="ct">
                  <span className="dot" style={{ background: "#c93b18" }}></span>
                  Production mensuelle (kWh)
                </div>
                <div className="h-[100px] flex items-center justify-center bg-[#fafafa] rounded-lg mt-2">
                  <div className="text-center">
                    <div className="text-sm text-[#7a7e95]">Maximum: {Math.round(maxProduction)} kWh</div>
                    <div className="text-xs text-[#a0a4b8] mt-1">Pics de production en été (mai-août)</div>
                  </div>
                </div>
              </div>
              <div className="rp-chart">
                <div className="ct">
                  <span className="dot" style={{ background: "#a8884a" }}></span>
                  Irradiation mensuelle (kWh/m²)
                </div>
                <div className="h-[100px] flex items-center justify-center bg-[#fafafa] rounded-lg mt-2">
                  <div className="text-center">
                    <div className="text-sm text-[#7a7e95]">Maximum: {Math.round(maxIrradiation)} kWh/m²</div>
                    <div className="text-xs text-[#a0a4b8] mt-1">Rayonnement solaire maximal en juin-juillet</div>
                  </div>
                </div>
              </div>
              <div className="rp-chart">
                <div className="ct">
                  <span className="dot" style={{ background: "#3a55b0" }}></span>
                  Variabilité mensuelle (kWh)
                </div>
                <div className="h-[100px] flex items-center justify-center bg-[#fafafa] rounded-lg mt-2">
                  <div className="text-center">
                    <div className="text-sm text-[#7a7e95]">Maximum: {Math.round(maxVariability)} kWh</div>
                    <div className="text-xs text-[#a0a4b8] mt-1">Variabilité plus élevée en hiver</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rp-foot">
              <span>MAFATEC — Énergie solaire</span>
              <span className="rf-mid">Étude Installation PV</span>
              <span>Page 5 / 6</span>
            </div>
          </div>
        </section>

        {/* PAGE 6 - DIAGRAMME SOLAIRE */}
        <section className="page">
          <div className="page-pad">
            <div className="rp-runhead">
              <div className="rh-l">
                <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-[24px] w-auto" />
                <span className="rh-rge">RGE</span>
              </div>
              <div className="rh-r">Diagramme solaire</div>
            </div>

            <div className="rp-block-head">
              <span className="rp-eyebrow">
                <span className="mark"></span>
                Ensoleillement
              </span>
              <h2 className="rp-h">
                Diagramme solaire avec <em>masques d'ombrage</em>
              </h2>
              <p className="rp-sub">
                Trajectoire du soleil selon l'azimut et la hauteur angulaire, lignes horaires et impact des ombrages sur l'année.
              </p>
            </div>

            <div className="rp-visual">
              <div className="h-[240px] bg-[#fafafa] rounded-lg flex items-center justify-center border border-[#e8e8ea]">
                <div className="text-center">
                  <div className="text-4xl mb-3">☀️</div>
                  <div className="text-sm text-[#454a63]">Latitude 48.96° N</div>
                  <div className="text-xs text-[#a0a4b8] mt-1">Trajectoire solaire et masques d'ombrage</div>
                </div>
              </div>
              <div className="rp-legend">
                <span><span className="sw" style={{ background: "#3a55b0" }}></span>Trajectoire solaire (dates)</span>
                <span><span className="sw" style={{ background: "#c93b18" }}></span>Lignes horaires</span>
                <span><span className="sw box"></span>Masque d'ombrage (horizon)</span>
              </div>
            </div>

            <div className="rp-foot">
              <span>MAFATEC — Énergie solaire</span>
              <span className="rf-mid">Étude Installation PV</span>
              <span>Page 6 / 6</span>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* Global styles for the report */
        .rp-toolbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1.5rem;
          background: rgba(11, 14, 29, 0.96);
          backdrop-filter: blur(10px);
          color: #f3efe6;
        }
        
        .rp-tb-l {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 0.82rem;
          color: rgba(243, 239, 230, 0.62);
        }
        
        .rp-tb-l strong {
          color: #f3efe6;
          font-weight: 600;
        }
        
        .btn-print {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-weight: 600;
          font-size: 0.82rem;
          padding: 0.7rem 1.4rem;
          border-radius: 6px;
          background: #c93b18;
          color: #fff;
          transition: background 0.3s ease;
          cursor: pointer;
          border: none;
        }
        
        .btn-print:hover {
          background: #e0552e;
        }
        
        .rp-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 24px 12px 60px;
        }
        
        .page {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(11, 14, 29, 0.18);
          display: flex;
          flex-direction: column;
        }
        
        .page-pad {
          padding: 17mm 16mm;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        /* Cover */
        .cover {
          background: #0b0e1d;
          color: #f3efe6;
          padding: 0;
        }
        
        .cover-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 64% 60% at 8% 98%, rgba(42, 46, 114, 0.55) 0%, transparent 62%);
        }
        
        .cover-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
        }
        
        .cover-in {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20mm 17mm;
        }
        
        .cover-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .cover-logo {
          height: 30px;
          width: auto;
        }
        
        .cover-badges {
          display: flex;
          gap: 0.5rem;
        }
        
        .cover-badges span {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-weight: 700;
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #e3cfa3;
          border: 1px solid rgba(201, 169, 106, 0.28);
          padding: 0.3rem 0.6rem;
          border-radius: 3px;
        }
        
        .cover-mid {
          margin-top: auto;
          margin-bottom: auto;
          padding: 14mm 0;
        }
        
        .cover-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #e3cfa3;
          margin-bottom: 2rem;
        }
        
        .cover-eyebrow .mark {
          width: 30px;
          height: 1px;
          background: #c9a96a;
        }
        
        .cover-title {
          font-family: 'Spectral', Georgia, 'Times New Roman', serif;
          font-weight: 500;
          font-size: 3.1rem;
          line-height: 1.04;
          letter-spacing: -0.015em;
          color: #f3efe6;
          margin-bottom: 1.6rem;
        }
        
        .cover-title em {
          font-style: italic;
          color: #e3cfa3;
        }
        
        .cover-lead {
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(243, 239, 230, 0.62);
          max-width: 135mm;
        }
        
        .cover-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7mm 10mm;
          margin-top: 12mm;
          padding-top: 9mm;
          border-top: 1px solid rgba(201, 169, 106, 0.28);
        }
        
        .cover-meta .cm {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        
        .cover-meta .cm-k {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #e3cfa3;
        }
        
        .cover-meta .cm-v {
          font-size: 0.96rem;
          color: #f3efe6;
          font-weight: 500;
        }
        
        .cover-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 12mm;
        }
        
        .cover-sign {
          font-family: 'Spectral', Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: 1.05rem;
          color: rgba(243, 239, 230, 0.62);
        }
        
        .cover-sign strong {
          font-style: normal;
          font-weight: 600;
          color: #e3cfa3;
        }
        
        .cover-ref {
          text-align: right;
          font-size: 0.66rem;
          color: rgba(243, 239, 230, 0.4);
          letter-spacing: 0.06em;
          line-height: 1.7;
        }
        
        /* Runhead */
        .rp-runhead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 7mm;
          margin-bottom: 8mm;
          border-bottom: 1px solid #e8e8ea;
        }
        
        .rh-l {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        
        .rh-rge {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-weight: 800;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: #3a55b0;
          border: 1.4px solid #3a55b0;
          padding: 0.08rem 0.34rem;
          border-radius: 3px;
        }
        
        .rh-r {
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7a7e95;
          font-weight: 600;
        }
        
        /* Footer */
        .rp-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 6mm;
          margin-top: auto;
          border-top: 1px solid #e8e8ea;
          font-size: 0.64rem;
          color: #7a7e95;
          letter-spacing: 0.02em;
        }
        
        .rf-mid {
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        
        /* Section headers */
        .rp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c93b18;
          margin-bottom: 0.7rem;
        }
        
        .rp-eyebrow .mark {
          width: 22px;
          height: 1.4px;
          background: #c93b18;
        }
        
        .rp-h {
          font-family: 'Spectral', Georgia, 'Times New Roman', serif;
          font-weight: 600;
          font-size: 1.7rem;
          color: #15172b;
          letter-spacing: -0.01em;
          line-height: 1.08;
        }
        
        .rp-h em {
          font-style: italic;
          color: #c93b18;
        }
        
        .rp-sub {
          font-size: 0.82rem;
          color: #7a7e95;
          margin-top: 0.3rem;
          line-height: 1.5;
        }
        
        .rp-block-head {
          margin-bottom: 5mm;
        }
        
        /* KPIs */
        .rp-kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5mm;
          margin-bottom: 8mm;
        }
        
        .rp-kpi {
          position: relative;
          background: #0b0e1d;
          color: #f3efe6;
          border-radius: 14px;
          padding: 7mm 6mm;
          overflow: hidden;
          isolation: isolate;
        }
        
        .rp-kpi::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: radial-gradient(ellipse 90% 130% at 50% -12%, rgba(201, 169, 106, 0.16), transparent 62%);
        }
        
        .k-lab {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #e3cfa3;
          margin-bottom: 4mm;
        }
        
        .k-val {
          font-family: 'Spectral', Georgia, 'Times New Roman', serif;
          font-weight: 500;
          font-size: 1.85rem;
          line-height: 1;
          color: #f3efe6;
          letter-spacing: -0.01em;
        }
        
        .k-unit {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(243, 239, 230, 0.62);
          margin-left: 0.3rem;
        }
        
        .k-foot {
          margin-top: 3.5mm;
          font-size: 0.68rem;
          color: rgba(243, 239, 230, 0.4);
          line-height: 1.45;
        }
        
        /* Data grid */
        .rp-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6mm;
        }
        
        .rp-data-card {
          border: 1px solid #e8e8ea;
          border-radius: 12px;
          padding: 6mm;
          background: #fff;
        }
        
        .rp-data-card h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #c93b18;
          margin-bottom: 4mm;
        }
        
        .rp-data-card h3 svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }
        
        .rp-dl {
          display: flex;
          flex-direction: column;
          gap: 2.3mm;
        }
        
        .rp-dl .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          font-size: 0.84rem;
          line-height: 1.4;
        }
        
        .rp-dl .row .k {
          color: #454a63;
        }
        
        .rp-dl .row .v {
          color: #15172b;
          font-weight: 600;
          text-align: right;
          white-space: nowrap;
        }
        
        /* Visual */
        .rp-visual {
          border: 1px solid #e8e8ea;
          border-radius: 14px;
          padding: 6mm;
          background: #fff;
          margin-bottom: 8mm;
        }
        
        .rp-calep-wrap {
          display: grid;
          grid-template-columns: 1.45fr 0.55fr;
          gap: 7mm;
          align-items: center;
        }
        
        .rp-calep-stats {
          display: flex;
          flex-direction: column;
          gap: 5mm;
        }
        
        .rp-cs .cs-v {
          font-family: 'Spectral', Georgia, 'Times New Roman', serif;
          font-weight: 500;
          font-size: 1.45rem;
          color: #15172b;
          line-height: 1;
        }
        
        .rp-cs .cs-k {
          font-size: 0.66rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #7a7e95;
          margin-top: 0.3rem;
          display: block;
        }
        
        /* Table */
        .rp-monthtable {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          border: 1px solid #e8e8ea;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 6mm;
        }
        
        .rp-monthtable thead th {
          background: #0b0e1d;
          color: #f3efe6;
          text-align: left;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-weight: 600;
          font-size: 0.64rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3.6mm 5mm;
        }
        
        .rp-monthtable thead th:not(:first-child) {
          text-align: right;
        }
        
        .rp-monthtable tbody td {
          padding: 2.7mm 5mm;
          border-bottom: 1px solid #e8e8ea;
          color: #15172b;
        }
        
        .rp-monthtable tbody td:first-child {
          font-weight: 600;
        }
        
        .rp-monthtable tbody td:not(:first-child) {
          text-align: right;
          color: #454a63;
        }
        
        .rp-monthtable tbody tr:nth-child(even) td {
          background: #fafafb;
        }
        
        .rp-monthtable tbody tr.tot td {
          background: #f5f5f7;
          font-weight: 700;
          color: #15172b;
          border-top: 1.4px solid #e8e8ea;
        }
        
        /* Charts */
        .rp-charts {
          display: flex;
          flex-direction: column;
          gap: 4mm;
        }
        
        .rp-chart {
          border: 1px solid #e8e8ea;
          border-radius: 12px;
          padding: 4mm 5mm 3mm;
          background: #fff;
        }
        
        .rp-chart .ct {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.74rem;
          font-weight: 600;
          color: #15172b;
          margin-bottom: 1mm;
        }
        
        .rp-chart .ct .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        
        /* Note */
        .rp-note {
          margin-top: 6mm;
          padding: 5mm 6mm;
          border-radius: 12px;
          background: #f5f5f7;
          border: 1px solid #e8e8ea;
        }
        
        .rp-note h4 {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #3a55b0;
          margin-bottom: 2mm;
        }
        
        .rp-note p {
          font-size: 0.74rem;
          color: #454a63;
          line-height: 1.55;
        }
        
        /* Legend */
        .rp-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 2mm 6mm;
          justify-content: center;
          margin-top: 4mm;
          font-size: 0.72rem;
          color: #454a63;
        }
        
        .rp-legend span {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        
        .rp-legend .sw {
          width: 14px;
          height: 2.4px;
          display: inline-block;
        }
        
        .rp-legend .sw.box {
          width: 12px;
          height: 9px;
          border: 1px solid rgba(25, 29, 73, 0.4);
          background: rgba(25, 29, 73, 0.2);
        }
        
        /* Print styles */
        @media print {
          body {
            background: #fff;
          }
          
          .rp-toolbar {
            display: none;
          }
          
          .rp-stack {
            gap: 0;
            padding: 0;
          }
          
          .page {
            box-shadow: none;
            margin: 0;
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            break-after: page;
          }
          
          .page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RapportPage;