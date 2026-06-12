import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Styles matching the HTML/CSS design
const styles = StyleSheet.create({
  // Page container
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    position: "relative",
  },

  // Page padding
  pagePad: {
    padding: "17mm 16mm",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  // Cover page specific
  cover: {
    backgroundColor: "#0b0e1d",
    position: "relative",
  },
  coverBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0b0e1d",
  },
  coverIn: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "20mm 17mm",
  },
  coverTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverLogo: {
    height: 30,
    width: "auto",
  },
  coverBadges: {
    flexDirection: "row",
    gap: 8,
  },
  coverBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    color: "#e3cfa3",
    borderWidth: 1,
    borderColor: "rgba(201,169,106,0.28)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  coverMid: {
    marginTop: "auto",
    marginBottom: "auto",
    paddingVertical: "14mm",
  },
  coverEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  coverEyebrowMark: {
    width: 30,
    height: 1,
    backgroundColor: "#c9a96a",
  },
  coverEyebrowText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase" as const,
    color: "#e3cfa3",
  },
  coverTitle: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: "#f3efe6",
    lineHeight: 1.04,
    marginBottom: 20,
  },
  coverTitleEm: {
    fontFamily: "Helvetica-Oblique",
    color: "#e3cfa3",
  },
  coverLead: {
    fontSize: 14,
    color: "rgba(243,239,230,0.62)",
    lineHeight: 1.7,
    maxWidth: 450,
  },
  coverMeta: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "7mm 10mm",
    marginTop: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,169,106,0.28)",
  },
  coverMetaItem: {
    width: "45%",
  },
  coverMetaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    color: "#e3cfa3",
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 13,
    color: "#f3efe6",
    fontFamily: "Helvetica",
  },
  coverBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  coverSign: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 14,
    color: "rgba(243,239,230,0.62)",
  },
  coverSignStrong: {
    fontFamily: "Helvetica-Bold",
    color: "#e3cfa3",
  },
  coverRef: {
    fontSize: 9,
    color: "rgba(243,239,230,0.4)",
    textAlign: "right",
    lineHeight: 1.7,
  },

  // Runhead (header)
  runhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8ea",
  },
  runheadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  runheadLogo: {
    height: 24,
    width: "auto",
  },
  runheadRge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.2,
    color: "#3a55b0",
    borderWidth: 1.4,
    borderColor: "#3a55b0",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  runheadRight: {
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: "uppercase" as const,
    color: "#7a7e95",
    fontFamily: "Helvetica-Bold",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#e8e8ea",
    fontSize: 9,
    color: "#7a7e95",
  },
  footerMid: {
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },

  // Section headers
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  eyebrowMark: {
    width: 22,
    height: 1.4,
    backgroundColor: "#c93b18",
  },
  eyebrowText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
    color: "#c93b18",
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#15172b",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sectionTitleEm: {
    fontFamily: "Helvetica-Oblique",
    color: "#c93b18",
  },
  sectionSub: {
    fontSize: 11,
    color: "#7a7e95",
    marginTop: 4,
    lineHeight: 1.5,
    marginBottom: 20,
  },

  // KPI Cards
  kpis: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#0b0e1d",
    borderRadius: 14,
    padding: 20,
    position: "relative",
  },
  kpiLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    color: "#e3cfa3",
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#f3efe6",
    marginBottom: 8,
  },
  kpiUnit: {
    fontSize: 11,
    color: "rgba(243,239,230,0.62)",
    marginLeft: 4,
  },
  kpiFoot: {
    fontSize: 9,
    color: "rgba(243,239,230,0.4)",
    lineHeight: 1.45,
  },

  // Data grid
  dataGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  dataCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e8e8ea",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  dataCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dataCardTitleIcon: {
    fontSize: 14,
  },
  dataCardTitleText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    color: "#c93b18",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataKey: {
    fontSize: 11,
    color: "#454a63",
  },
  dataValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#15172b",
  },

  // Table
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e8e8ea",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0b0e1d",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: "#f3efe6",
  },
  tableHeaderCellRight: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: "#f3efe6",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8ea",
  },
  tableRowEven: {
    backgroundColor: "#fafafb",
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    color: "#15172b",
  },
  tableCellRight: {
    flex: 1,
    fontSize: 11,
    color: "#454a63",
    textAlign: "right",
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold",
  },
  tableTotalRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f7",
    borderTopWidth: 1.4,
    borderTopColor: "#e8e8ea",
  },

  // Note
  note: {
    backgroundColor: "#f5f5f7",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8ea",
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.8,
    textTransform: "uppercase" as const,
    color: "#3a55b0",
    marginBottom: 6,
  },
  noteText: {
    fontSize: 10,
    color: "#454a63",
    lineHeight: 1.55,
  },

  // Chart containers
  chartContainer: {
    borderWidth: 1,
    borderColor: "#e8e8ea",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#ffffff",
    marginBottom: 12,
  },
  chartTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  chartDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  chartTitleText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#15172b",
  },
  chartArea: {
    height: 100,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chartStats: {
    fontSize: 10,
    color: "#7a7e95",
    textAlign: "center" as const,
  },
  chartSub: {
    fontSize: 9,
    color: "#a0a4b8",
    marginTop: 6,
    textAlign: "center" as const,
  },

  // Calepinage
  visual: {
    borderWidth: 1,
    borderColor: "#e8e8ea",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#ffffff",
    marginBottom: 16,
  },
  calepWrap: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  calepImage: {
    flex: 1.45,
    height: 180,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calepStats: {
    flex: 0.55,
    gap: 12,
  },
  calepStat: {
    marginBottom: 8,
  },
  calepStatValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#15172b",
  },
  calepStatLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: "#7a7e95",
    marginTop: 4,
  },

  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 14,
    height: 2.4,
  },
  legendBox: {
    width: 12,
    height: 9,
    borderWidth: 1,
    borderColor: "rgba(25,29,73,0.4)",
    backgroundColor: "rgba(25,29,73,0.2)",
  },
  legendText: {
    fontSize: 9,
    color: "#454a63",
  },

  // Closing section
  closing: {
    backgroundColor: "#0b0e1d",
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    position: "relative",
  },
  closingTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#f3efe6",
    marginBottom: 8,
  },
  closingTitleEm: {
    fontFamily: "Helvetica-Oblique",
    color: "#e3cfa3",
  },
  closingText: {
    fontSize: 11,
    color: "rgba(243,239,230,0.62)",
    lineHeight: 1.65,
    marginBottom: 16,
  },
  closingContact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,169,106,0.28)",
  },
  closingContactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  closingContactText: {
    fontSize: 10,
    color: "rgba(243,239,230,0.8)",
  },
});

// Helper functions
const formatNumber = (value: number, decimals: number = 2): string => {
  if (isNaN(value)) return "0";
  return value.toFixed(decimals);
};

const formatInteger = (value: number): string => {
  if (isNaN(value)) return "0";
  return Math.round(value).toString();
};

interface PrintComponentPDFProps {
  data: any;
  monthNames: string[];
  azimut: string;
  inclinaison: string;
  clickedPosition: { lat: number; lng: number; address: string };
  puissancePv: string;
  systemLosses: string;
  voltageDropResult: any;
  panels: any[];
}

export const PrintComponentPDF: React.FC<PrintComponentPDFProps> = ({
  data,
  monthNames,
  azimut,
  inclinaison,
  clickedPosition,
  puissancePv,
  systemLosses,
  voltageDropResult,
  panels,
}) => {
  const productionAnnuelle = data?.outputs?.totals?.fixed.E_y || 0;
  const irradiationAnnuelle = data?.outputs?.totals?.fixed["H(i)_y"] || 0;
  const variabiliteAnnuelle = data?.outputs?.totals?.fixed.SD_y || 0;
  const today = new Date().toLocaleDateString("fr-FR");

  const monthlyData = data?.outputs?.monthly?.fixed || [];
  const totalProduction = monthlyData.reduce(
    (sum: number, m: any) => sum + (m.E_m || 0),
    0
  );
  const totalIrradiation = monthlyData.reduce(
    (sum: number, m: any) => sum + (m["H(i)_m"] || 0),
    0
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

  return (
    <Document>
      {/* ══════════ PAGE 1 — COUVERTURE ══════════ */}
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View style={styles.coverBg} />
        <View style={styles.coverIn}>
          <View style={styles.coverTop}>
            <Image src="/logo-mafatec-2048x423.png" style={styles.coverLogo} />
            <View style={styles.coverBadges}>
              <Text style={styles.coverBadge}>RGE</Text>
              <Text style={styles.coverBadge}>Qualifelec</Text>
            </View>
          </View>

          <View style={styles.coverMid}>
            <View style={styles.coverEyebrow}>
              <View style={styles.coverEyebrowMark} />
              <Text style={styles.coverEyebrowText}>
                Étude de production photovoltaïque
              </Text>
            </View>
            <Text style={styles.coverTitle}>
              Rapport de
              <Text style={styles.coverTitleEm}>Production</Text>
              {"\n"}photovoltaïque détaillé
            </Text>
            <Text style={styles.coverLead}>
              Estimation de production, irradiation et performance d'une
              installation photovoltaïque de {puissancePv} kWc, calculée selon
              les données d'irradiation officielles et les paramètres réels du
              site.
            </Text>

            <View style={styles.coverMeta}>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Site analysé</Text>
                <Text style={styles.coverMetaValue}>
                  {clickedPosition.address || "Adresse non définie"}
                </Text>
              </View>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Coordonnées</Text>
                <Text style={styles.coverMetaValue}>
                  {clickedPosition.lat.toFixed(6)} N ·{" "}
                  {clickedPosition.lng.toFixed(6)} E
                </Text>
              </View>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Puissance installée</Text>
                <Text style={styles.coverMetaValue}>{puissancePv} kWc</Text>
              </View>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>
                  Production annuelle estimée
                </Text>
                <Text style={styles.coverMetaValue}>
                  {formatInteger(productionAnnuelle)} kWh / an
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.coverBottom}>
            <Text style={styles.coverSign}>
              Préparé par{" "}
              <Text style={styles.coverSignStrong}>MAFATEC</Text> — Énergie
              solaire
            </Text>
            <Text style={styles.coverRef}>
              Réf. ÉTUDE PV · {puissancePv} kWc{"\n"}Édité le {today}
            </Text>
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 2 — SYNTHÈSE ══════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagePad}>
          <View style={styles.runhead}>
            <View style={styles.runheadLeft}>
              <Image
                src="/logo-mafatec-2048x423.png"
                style={styles.runheadLogo}
              />
              <Text style={styles.runheadRge}>RGE</Text>
            </View>
            <Text style={styles.runheadRight}>Synthèse de l'étude</Text>
          </View>

          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>Résultats de la simulation</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Les indicateurs{" "}
            <Text style={styles.sectionTitleEm}>clés</Text> de production
          </Text>
          <Text style={styles.sectionSub}>
            Performance annuelle estimée pour l'installation configurée —
            inclinaison {inclinaison}°, azimut {azimut}°.
          </Text>

          <View style={styles.kpis}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Production annuelle</Text>
              <Text style={styles.kpiValue}>
                {formatInteger(productionAnnuelle)}
                <Text style={styles.kpiUnit}> kWh</Text>
              </Text>
              <Text style={styles.kpiFoot}>
                Énergie produite estimée sur une année complète.
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Irradiation annuelle</Text>
              <Text style={styles.kpiValue}>
                {formatInteger(irradiationAnnuelle)}
                <Text style={styles.kpiUnit}> kWh/m²</Text>
              </Text>
              <Text style={styles.kpiFoot}>
                Rayonnement solaire reçu par mètre carré et par an.
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Variabilité interannuelle</Text>
              <Text style={styles.kpiValue}>
                {formatNumber(variabiliteAnnuelle, 1)}
                <Text style={styles.kpiUnit}> kWh</Text>
              </Text>
              <Text style={styles.kpiFoot}>
                Écart-type de production d'une année sur l'autre.
              </Text>
            </View>
          </View>

          <View style={styles.dataGrid}>
            <View style={styles.dataCard}>
              <View style={styles.dataCardTitle}>
                <Text style={styles.dataCardTitleIcon}>📋</Text>
                <Text style={styles.dataCardTitleText}>Entrées fournies</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Latitude</Text>
                <Text style={styles.dataValue}>
                  {clickedPosition.lat.toFixed(6)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Longitude</Text>
                <Text style={styles.dataValue}>
                  {clickedPosition.lng.toFixed(6)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Horizon</Text>
                <Text style={styles.dataValue}>Calculé</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>PV installée</Text>
                <Text style={styles.dataValue}>{puissancePv} kWc</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Pertes système</Text>
                <Text style={styles.dataValue}>{systemLosses} %</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Inclinaison</Text>
                <Text style={styles.dataValue}>{inclinaison}°</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Azimut</Text>
                <Text style={styles.dataValue}>{azimut}°</Text>
              </View>
            </View>

            <View style={styles.dataCard}>
              <View style={styles.dataCardTitle}>
                <Text style={styles.dataCardTitleIcon}>⚡</Text>
                <Text style={styles.dataCardTitleText}>
                  Changements de la production
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Angle d'incidence</Text>
                <Text style={styles.dataValue}>
                  {formatNumber(
                    data?.outputs.totals.fixed.l_aoi || 0,
                    2
                  )}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Effets spectraux</Text>
                <Text style={styles.dataValue}>
                  {data?.outputs.totals.fixed.l_spec || "0"}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Temp. & faible irrad.</Text>
                <Text style={styles.dataValue}>
                  {formatNumber(data?.outputs.totals.fixed.l_tg || 0, 2)} %
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Pertes totales</Text>
                <Text style={styles.dataValue}>
                  {formatNumber(
                    data?.outputs.totals.fixed.l_total || 0,
                    2
                  )}
                </Text>
              </View>

              {voltageDropResult && (
                <>
                  <View style={[styles.dataCardTitle, { marginTop: 16 }]}>
                    <Text style={styles.dataCardTitleIcon}>🔌</Text>
                    <Text style={styles.dataCardTitleText}>
                      Chute de tension du câblage
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataKey}>Chute de tension</Text>
                    <Text style={styles.dataValue}>
                      {voltageDropResult.vdrop || "0"} V
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataKey}>Pourcentage de chute</Text>
                    <Text style={styles.dataValue}>
                      {voltageDropResult.vdropPct || "0"} %
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataKey}>Résistance de fil</Text>
                    <Text style={styles.dataValue}>
                      {voltageDropResult.rwire || "0"} Ω
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.note}>
            <Text style={styles.noteTitle}>Méthodologie</Text>
            <Text style={styles.noteText}>
              Les estimations sont calculées à partir des données d'irradiation
              solaire de référence pour la localisation du site, en tenant compte
              de l'inclinaison, de l'azimut, des pertes système ({systemLosses}
              %) et du calcul automatique de l'horizon. Les valeurs de production
              constituent une estimation et peuvent varier selon les conditions
              météorologiques réelles.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text>MAFATEC — Énergie solaire</Text>
            <Text style={styles.footerMid}>Étude Installation PV</Text>
            <Text>Page 2 / 6</Text>
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 3 — TABLEAU MENSUEL ══════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagePad}>
          <View style={styles.runhead}>
            <View style={styles.runheadLeft}>
              <Image
                src="/logo-mafatec-2048x423.png"
                style={styles.runheadLogo}
              />
              <Text style={styles.runheadRge}>RGE</Text>
            </View>
            <Text style={styles.runheadRight}>Détail mensuel</Text>
          </View>

          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>Détail mensuel</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Énergie PV & irradiation{" "}
            <Text style={styles.sectionTitleEm}>mensuelle</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Production, irradiation et variabilité mois par mois, avec total
            annuel.
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Mois</Text>
              <Text style={styles.tableHeaderCellRight}>
                Production (kWh)
              </Text>
              <Text style={styles.tableHeaderCellRight}>
                Irradiation (kWh/m²)
              </Text>
              <Text style={styles.tableHeaderCellRight}>
                Variabilité (kWh)
              </Text>
            </View>
            {monthlyData.map((m: any, i: number) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i % 2 !== 0 ? styles.tableRowEven : {},
                ]}
              >
                <Text style={styles.tableCell}>{monthNames[i] || ""}</Text>
                <Text style={[styles.tableCellRight, styles.tableCellBold]}>
                  {formatNumber(m.E_m || 0, 2)}
                </Text>
                <Text style={styles.tableCellRight}>
                  {formatNumber(m["H(i)_m"] || 0, 2)}
                </Text>
                <Text style={styles.tableCellRight}>
                  {formatNumber(m.SD_m || 0, 2)}
                </Text>
              </View>
            ))}
            <View style={styles.tableTotalRow}>
              <Text style={[styles.tableCell, styles.tableCellBold]}>
                Total annuel
              </Text>
              <Text style={[styles.tableCellRight, styles.tableCellBold]}>
                {formatInteger(totalProduction)}
              </Text>
              <Text style={[styles.tableCellRight, styles.tableCellBold]}>
                {formatInteger(totalIrradiation)}
              </Text>
              <Text style={[styles.tableCellRight, styles.tableCellBold]}>
                {formatNumber(variabiliteAnnuelle, 1)}
              </Text>
            </View>
          </View>

          <View style={styles.note}>
            <Text style={styles.noteTitle}>Note</Text>
            <Text style={styles.noteText}>
              Les valeurs mensuelles sont issues de la simulation d'irradiation
              pour le site et tiennent compte des pertes système. Le total annuel
              de production s'élève à {formatInteger(productionAnnuelle)} kWh.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text>MAFATEC — Énergie solaire</Text>
            <Text style={styles.footerMid}>Étude Installation PV</Text>
            <Text>Page 3 / 6</Text>
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 4 — COURBES ══════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagePad}>
          <View style={styles.runhead}>
            <View style={styles.runheadLeft}>
              <Image
                src="/logo-mafatec-2048x423.png"
                style={styles.runheadLogo}
              />
              <Text style={styles.runheadRge}>RGE</Text>
            </View>
            <Text style={styles.runheadRight}>Courbes mensuelles</Text>
          </View>

          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>Évolution annuelle</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Courbes <Text style={styles.sectionTitleEm}>mensuelles</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Profil de production, d'irradiation et de variabilité sur les douze
            mois de l'année.
          </Text>

          <View style={styles.chartContainer}>
            <View style={styles.chartTitle}>
              <View
                style={[styles.chartDot, { backgroundColor: "#c93b18" }]}
              />
              <Text style={styles.chartTitleText}>
                Production mensuelle (kWh)
              </Text>
            </View>
            <View style={styles.chartArea}>
              <Text style={styles.chartStats}>
                Maximum: {formatInteger(maxProduction)} kWh
              </Text>
              <Text style={styles.chartSub}>
                Pics de production en été (mai–août)
              </Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.chartTitle}>
              <View
                style={[styles.chartDot, { backgroundColor: "#a8884a" }]}
              />
              <Text style={styles.chartTitleText}>
                Irradiation mensuelle (kWh/m²)
              </Text>
            </View>
            <View style={styles.chartArea}>
              <Text style={styles.chartStats}>
                Maximum: {formatInteger(maxIrradiation)} kWh/m²
              </Text>
              <Text style={styles.chartSub}>
                Rayonnement solaire maximal en juin–juillet
              </Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.chartTitle}>
              <View
                style={[styles.chartDot, { backgroundColor: "#3a55b0" }]}
              />
              <Text style={styles.chartTitleText}>
                Variabilité mensuelle (kWh)
              </Text>
            </View>
            <View style={styles.chartArea}>
              <Text style={styles.chartStats}>
                Maximum: {formatInteger(maxVariability)} kWh
              </Text>
              <Text style={styles.chartSub}>
                Variabilité plus élevée en hiver
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>MAFATEC — Énergie solaire</Text>
            <Text style={styles.footerMid}>Étude Installation PV</Text>
            <Text>Page 4 / 6</Text>
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 5 — CALEPINAGE & DIAGRAMME ══════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagePad}>
          <View style={styles.runhead}>
            <View style={styles.runheadLeft}>
              <Image
                src="/logo-mafatec-2048x423.png"
                style={styles.runheadLogo}
              />
              <Text style={styles.runheadRge}>RGE</Text>
            </View>
            <Text style={styles.runheadRight}>Calepinage</Text>
          </View>

          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>Calepinage</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Emplacement des{" "}
            <Text style={styles.sectionTitleEm}>panneaux</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Implantation et forme du champ photovoltaïque sur la toiture.
          </Text>

          <View style={styles.visual}>
            <View style={styles.calepWrap}>
              <View style={styles.calepImage}>
                <Text style={{ fontSize: 12, color: "#7a7e95" }}>
                  📐 {panels?.length || 0} panneaux
                </Text>
              </View>
              <View style={styles.calepStats}>
                <View style={styles.calepStat}>
                  <Text style={styles.calepStatValue}>
                    {panels?.length || 0}
                  </Text>
                  <Text style={styles.calepStatLabel}>Panneaux · 375 Wc</Text>
                </View>
                <View style={styles.calepStat}>
                  <Text style={styles.calepStatValue}>{puissancePv} kWc</Text>
                  <Text style={styles.calepStatLabel}>Puissance crête</Text>
                </View>
                <View style={styles.calepStat}>
                  <Text style={styles.calepStatValue}>
                    ≈ {((panels?.length || 0) * 1.8).toFixed(0)} m²
                  </Text>
                  <Text style={styles.calepStatLabel}>Surface toiture</Text>
                </View>
                <View style={styles.calepStat}>
                  <Text style={styles.calepStatValue}>
                    {inclinaison}° · {azimut}°
                  </Text>
                  <Text style={styles.calepStatLabel}>
                    Inclinaison · Azimut
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.note}>
            <Text style={styles.noteTitle}>Lecture du calepinage</Text>
            <Text style={styles.noteText}>
              Le schéma présente l'implantation optimisée des{" "}
              {panels?.length || 0} modules sur la toiture. La disposition
              réelle sera affinée lors de la visite technique en fonction des
              contraintes de toiture (chéneaux, chéminées, fenêtres de toit).
            </Text>
          </View>

          {/* Diagramme solaire */}
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>Ensoleillement</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Diagramme solaire avec{" "}
            <Text style={styles.sectionTitleEm}>masques d'ombrage</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Trajectoire du soleil selon l'azimut et la hauteur angulaire,
            lignes horaires et impact des ombrages sur l'année.
          </Text>

          <View style={styles.visual}>
            <View style={[styles.chartArea, { height: 180 }]}>
              <Text style={styles.chartStats}>
                ☀️ Latitude {clickedPosition.lat.toFixed(2)}° N
              </Text>
              <Text style={styles.chartSub}>
                Trajectoire solaire et masques d'ombrage
              </Text>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: "#3a55b0" },
                  ]}
                />
                <Text style={styles.legendText}>
                  Trajectoire solaire (dates)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: "#c93b18" },
                  ]}
                />
                <Text style={styles.legendText}>Lignes horaires</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendBox} />
                <Text style={styles.legendText}>
                  Masque d'ombrage (horizon)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>MAFATEC — Énergie solaire</Text>
            <Text style={styles.footerMid}>Étude Installation PV</Text>
            <Text>Page 5 / 6</Text>
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 6 — CLOSING ══════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagePad}>
          <View style={styles.runhead}>
            <View style={styles.runheadLeft}>
              <Image
                src="/logo-mafatec-2048x423.png"
                style={styles.runheadLogo}
              />
              <Text style={styles.runheadRge}>RGE</Text>
            </View>
            <Text style={styles.runheadRight}>Conclusion</Text>
          </View>

          <View style={styles.closing}>
            <Text style={styles.closingTitle}>
              Prêt à concrétiser votre{" "}
              <Text style={styles.closingTitleEm}>projet solaire</Text> ?
            </Text>
            <Text style={styles.closingText}>
              Un conseiller MAFATEC vous accompagne, de l'étude détaillée à la
              mise en service — certifié RGE &amp; Qualifelec.
            </Text>
            <View style={styles.closingContact}>
              <View style={styles.closingContactItem}>
                <Text style={styles.closingContactText}>
                  📞 01 23 45 67 89
                </Text>
              </View>
              <View style={styles.closingContactItem}>
                <Text style={styles.closingContactText}>
                  ✉️ contact@mafatec.fr
                </Text>
              </View>
              <View style={styles.closingContactItem}>
                <Text style={styles.closingContactText}>🌐 mafatec.fr</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>MAFATEC — Énergie solaire</Text>
            <Text style={styles.footerMid}>Étude Installation PV</Text>
            <Text>Page 6 / 6</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};