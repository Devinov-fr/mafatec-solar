'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import { generatePDF } from '@/lib/pdfGenerator';
import StudyReportContent from '@/components/ui/StudyReportContent';
import { toast } from 'sonner';

const monthNames = ["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function RapportDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [study, setStudy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (id && status === 'authenticated') {
      fetchStudy();
    }
  }, [id, status]);

  useEffect(() => {
    if (study) {
      const processImage = async () => {
        const calepinageImage = study.params?.calepinageImage;
        const panels = study.params?.panels || [];
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
  }, [study]);

  const fetchStudy = async () => {
    try {
      const res = await fetch(`/api/studies/${id}`);
      const data = await res.json();
      if (data.success) {
        setStudy(data.study);
      } else {
        toast.error(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current || !study) return;
    if (!isImageReady) {
      toast.error("Chargement de l'image en cours, veuillez réessayer dans un instant...");
      return;
    }
    setIsGenerating(true);
    try {
      await generatePDF(reportRef.current, `rapport-mafatec-${study.puissance}kwc`);
    } catch (error) {
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e9eaee]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#e9eaee] p-4">
        <p className="text-[#15172b] mb-4">Étude introuvable ou accès refusé.</p>
        <Button onClick={() => router.back()} variant="outline"><ArrowLeft size={16} className="mr-2" /> Retour</Button>
      </div>
    );
  }

  // Map database study structure back to what StudyReportContent expects
  let reportData;
  
  // Check if we have the full PVGIS data with outputs
  if (study.results?.fullData?.outputs) {
    // Use the full data from the fullData field
    reportData = study.results.fullData;
    console.log('📊 Using fullData for report');
  } else if (study.results?.data?.outputs) {
    // Alternative location for full data
    reportData = study.results.data;
    console.log('📊 Using data for report');
  } else if (study.results?.outputs) {
    // Data already has outputs at top level
    reportData = study.results;
    console.log('📊 Using results directly for report');
  } else {
    // Build from flat data
    console.log('📊 Building report data from flat structure');
    reportData = {
      outputs: {
        totals: {
          fixed: {
            E_y: study.results?.production || 0,
            "H(i)_y": study.results?.irradiation || 0,
            SD_y: study.results?.variabilite || 0,
            l_aoi: study.results?.l_aoi || 0,
            l_spec: study.results?.l_spec || "0",
            l_tg: study.results?.l_tg || 0,
            l_total: study.results?.l_total || 0,
          }
        },
        monthly: {
          fixed: study.results?.monthly || []
        }
      },
      inputs: {
        location: { 
          latitude: study.lat || 0, 
          longitude: study.lng || 0 
        }
      }
    };
  }

  // Ensure the data has all required fields
  if (!reportData.outputs) reportData.outputs = {};
  if (!reportData.outputs.totals) reportData.outputs.totals = {};
  if (!reportData.outputs.totals.fixed) reportData.outputs.totals.fixed = {};
  if (!reportData.outputs.monthly) reportData.outputs.monthly = {};
  if (!reportData.outputs.monthly.fixed) reportData.outputs.monthly.fixed = [];
  if (!reportData.inputs) reportData.inputs = {};
  if (!reportData.inputs.location) reportData.inputs.location = { latitude: 0, longitude: 0 };

  console.log('📊 Final report data:', reportData);

  return (
    <div className="min-h-screen bg-[#e9eaee] font-sans">
      {/* Toolbar - Matching ReportPDFPopup header styling */}
      <div className="rp-toolbar sticky top-0 z-[100] flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#15172b]">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-serif font-semibold text-[#15172b]">
            Aperçu du rapport - <span className="italic text-[#c93b18]">Installation PV {study.puissance} kWc</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownload} 
            disabled={isGenerating} 
            className="bg-[#c93b18] hover:bg-[#a82e12] text-white font-semibold"
          >
            {isGenerating ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Download size={16} className="mr-2" />}
            {isGenerating ? "Génération..." : "Télécharger PDF"}
          </Button>
        </div>
      </div>

      <div className="rp-stack flex flex-col items-center gap-4 py-8 px-4 overflow-y-auto">
        <StudyReportContent 
          ref={reportRef}
          data={reportData}
          monthNames={monthNames}
          azimut={study.params?.azimut || "0"}
          inclinaison={study.params?.inclinaison || "35"}
          clickedPosition={{ lat: study.lat || 0, lng: study.lng || 0, address: study.adresse }}
          puissancePv={study.puissance}
          systemLosses={study.params?.pertes || "14"}
          voltageDropResult={study.params?.voltageDropResult}
          panels={study.params?.panels || []}
          obstacles={study.params?.obstacles || []}
          roofImageUrl={processedImageUrl}
          date={new Date(study.createdAt).toLocaleDateString("fr-FR")}
        />
      </div>

      <style jsx global>{`
        @media print {
          .rp-toolbar { display: none !important; }
          .rp-stack { padding: 0 !important; gap: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

export default function RapportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#e9eaee]"><Loader2 className="animate-spin h-12 w-12 text-[#c93b18]" /></div>}>
      <RapportDetail />
    </Suspense>
  );
}