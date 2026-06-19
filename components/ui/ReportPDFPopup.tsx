// components/ReportPDFPopup.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, Download, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePDF, generatePDFBlob } from "@/lib/pdfGenerator";
import StudyReportContent from "./StudyReportContent";

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
  leadData?: {
    prenom: string;
    nom: string;
    email: string;
    entreprise?: string;
    universe?: string;
  };
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
  leadData,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientUniverse, setClientUniverse] = useState<"part" | "pro">("part");
  const [date, setDate] = useState("");
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR"));
    // Pre-fill from lead data if available
    if (leadData) {
      setEmailAddress(leadData.email || "");
      setClientName(leadData.prenom || "");
      setClientLastName(leadData.nom || "");
      setClientCompany(leadData.entreprise || "");
      setClientUniverse((leadData.universe as "part" | "pro") || "part");
    }
  }, [leadData]);

  useEffect(() => {
    if (isOpen) {
      const processImage = async () => {
        const imageUrl = calepinageImage || panels.find((p: any) => p.imageUrl)?.imageUrl || "/toit-maison.jpg";
        if (imageUrl && (imageUrl.startsWith("blob:") || imageUrl.includes("localhost"))) {
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

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    if (!isImageReady) {
      alert("Chargement de l'image en cours, veuillez réessayer dans un instant...");
      return;
    }
    setIsGenerating(true);
    try {
      await generatePDF(reportRef.current, `rapport-mafatec-${puissancePv}kwc`);
    } catch (error) {
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };



const handleSendEmail = async () => {
  if (!reportRef.current) return;
  if (!isImageReady) {
    alert("Chargement de l'image en cours, veuillez réessayer dans un instant...");
    return;
  }
  
  if (!emailAddress) {
    alert("Veuillez entrer une adresse email valide");
    return;
  }

  if (!clientName) {
    alert("Veuillez entrer le prénom du client");
    return;
  }

  setIsSendingEmail(true);
  try {
    // Prepare study data for email
    const productionAnnuelle = data?.outputs?.totals?.fixed?.E_y || data?.outputs?.totals?.fixed?.production || 0;
    const irradiationAnnuelle = data?.outputs?.totals?.fixed?.["H(i)_y"] || data?.outputs?.totals?.fixed?.irradiation || 0;
    const variabiliteAnnuelle = data?.outputs?.totals?.fixed?.SD_y || data?.outputs?.totals?.fixed?.variabilite || 0;

    // Prepare monthly data
    const monthlyData = data?.outputs?.monthly?.fixed || [];
    const monthNames = ["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    
    const formattedMonthlyData = monthlyData.map((m: any, i: number) => ({
      month: monthNames[i] || `M${i+1}`,
      production: m.E_m || m.production || 0,
      irradiation: m["H(i)_m"] || m.irradiation || 0,
      variabilite: m.SD_m || m.variabilite || 0,
    }));

    const studyData = {
      puissance: puissancePv,
      adresse: clickedPosition.address || "Adresse non définie",
      production: productionAnnuelle,
      irradiation: irradiationAnnuelle,
      variabilite: variabiliteAnnuelle,
      inclinaison: inclinaison,
      azimut: azimut,
      systemLosses: systemLosses,
      monthly: formattedMonthlyData,
      data: data, // Full PVGIS data
      panels: panels,
      obstacles: obstacles,
      voltageDropResult: voltageDropResult,
    };

    // Prepare lead data matching your schema
    const leadPayload = {
      prenom: clientName,
      nom: clientLastName || "Client",
      email: emailAddress,
      entreprise: clientCompany || "",
      universe: clientUniverse,
      studyData: studyData, // Send study data for server-side PDF generation
    };

    // Send to API
    const response = await fetch('/api/send-study-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });

    const result = await response.json();
    
    if (result.success) {
      let message = `✅ Email envoyé avec succès à ${emailAddress}`;
      if (result.pdfAttached) {
        message += " avec le PDF en pièce jointe !";
      } else {
        message += " (sans pièce jointe PDF)";
      }
      alert(message);
      setShowEmailDialog(false);
      // Reset form
      setEmailAddress("");
      setClientName("");
      setClientLastName("");
      setClientCompany("");
    } else {
      alert(`❌ Erreur lors de l'envoi de l'email: ${result.error || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('Error preparing email:', error);
    alert("Erreur lors de l'envoi de l'email");
  } finally {
    setIsSendingEmail(false);
  }
};

  const EmailDialog = () => (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-serif font-semibold text-[#15172b] mb-4">
          Envoyer l'étude par email
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Le rapport PDF sera envoyé en pièce jointe et le client sera enregistré dans votre base de données.
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Prénom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c93b18]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              placeholder="Nom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c93b18]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="email@client.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c93b18]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entreprise
            </label>
            <input
              type="text"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="Nom de l'entreprise (optionnel)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c93b18]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de client *
            </label>
            <select
              value={clientUniverse}
              onChange={(e) => setClientUniverse(e.target.value as "part" | "pro")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c93b18]"
            >
              <option value="part">Particulier</option>
              <option value="pro">Professionnel</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowEmailDialog(false);
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={!emailAddress || !clientName || isSendingEmail}
            className="bg-[#c93b18] hover:bg-[#a82e12] text-white"
          >
            {isSendingEmail ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail size={16} className="mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
            <h2 className="text-xl font-serif font-semibold text-[#15172b]">
              Aperçu du rapport - <span className="italic text-[#c93b18]">Téléchargement PDF</span>
            </h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowEmailDialog(true)}
                disabled={isGenerating}
                className="bg-[#0b0e1d] hover:bg-[#1a1d2f] text-white"
              >
                <Mail size={16} className="mr-2" />
                Envoyer par email
              </Button>
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

          <div className="flex-1 overflow-y-auto bg-[#e9eaee] p-6">
            <StudyReportContent
              ref={reportRef}
              data={data}
              monthNames={monthNames}
              azimut={azimut}
              inclinaison={inclinaison}
              clickedPosition={clickedPosition}
              puissancePv={puissancePv}
              systemLosses={systemLosses}
              voltageDropResult={voltageDropResult}
              panels={panels}
              obstacles={obstacles}
              roofImageUrl={processedImageUrl}
              date={date}
            />
          </div>
        </div>
      </div>

      {showEmailDialog && <EmailDialog />}
    </>
  );
};

export default ReportPDFPopup;