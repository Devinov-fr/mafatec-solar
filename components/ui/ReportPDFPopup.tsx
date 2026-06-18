"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/lib/pdfGenerator";
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
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR"));
  }, []);

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

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-xl font-serif font-semibold text-[#15172b]">
            Aperçu du rapport - <span className="italic text-[#c93b18]">Téléchargement PDF</span>
          </h2>
          <div className="flex items-center gap-3">
            <Button onClick={handleDownloadPDF} disabled={isGenerating} className="bg-[#c93b18] hover:bg-[#a82e12] text-white">
              <Download size={16} className="mr-2" />
              {isGenerating ? "Génération..." : "Télécharger PDF"}
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
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
  );
};

export default ReportPDFPopup;
