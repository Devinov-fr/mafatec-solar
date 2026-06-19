// app/rapport-public/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ArrowLeft, Lock, FileText } from 'lucide-react';
import { generatePDF } from '@/lib/pdfGenerator';
import StudyReportContent from '@/components/ui/StudyReportContent';
import { toast } from 'sonner';

const monthNames = ["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function PublicRapportDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const router = useRouter();
  
  const [study, setStudy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    console.log('🔍 Public report params:', { id, token });
    
    if (id && token && id !== 'undefined' && token !== 'undefined' && id !== 'null' && token !== 'null') {
      fetchPublicStudy();
    } else {
      setError('Lien invalide. Veuillez vérifier votre lien.');
      setIsLoading(false);
    }
  }, [id, token]);

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

  const fetchPublicStudy = async () => {
    try {
      const res = await fetch(`/api/studies/public/${id}?token=${token}`);
      const data = await res.json();
      
      if (data.success) {
        setStudy(data.study);
        setIsValid(true);
        console.log('✅ Public study loaded:', data.study._id);
      } else {
        setError(data.error || 'Cette étude n\'est plus disponible ou le lien a expiré.');
        toast.error(data.error || 'Accès refusé');
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e9eaee]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  if (error || !study || !isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#e9eaee] p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-[#15172b] mb-2">Accès refusé</h2>
          <p className="text-[#7a7e95] mb-6">{error || 'Cette étude n\'est pas accessible.'}</p>
          <Button 
            onClick={() => router.push('/')} 
            className="bg-[#c93b18] hover:bg-[#a82e12] text-white"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Map database study structure back to what StudyReportContent expects
  let reportData = study.results;
  if (study.results?.data?.outputs) {
    reportData = study.results.data;
  } else if (!study.results?.outputs) {
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
        location: { latitude: study.lat || 0, longitude: study.lng || 0 }
      }
    };
  }

  // Calculate days remaining for the link
  const daysRemaining = study.publicTokenExpires 
    ? Math.ceil((new Date(study.publicTokenExpires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  return (
    <div className="min-h-screen bg-[#e9eaee] font-sans">
      {/* Toolbar - Public version (no login/back to home only) */}
      <div className="rp-toolbar sticky top-0 z-[100] flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#15172b]"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-serif font-semibold text-[#15172b]">
              Rapport d'étude - <span className="italic text-[#c93b18]">Installation PV {study.puissance} kWc</span>
            </h2>
            <p className="text-xs text-[#7a7e95] flex items-center gap-2">
              <span>🔗 Consultation publique</span>
              <span className="w-1 h-1 rounded-full bg-[#7a7e95]"></span>
              <span>Lien valable {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span>
            </p>
          </div>
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

      {/* Report Content */}
      <div className="rp-stack flex flex-col items-center gap-4 py-8 px-4 overflow-y-auto">
        {/* Public notice banner */}
        <div className="w-full max-w-[210mm] bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-2 flex items-center gap-3">
          <FileText size={18} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            📄 Vous consultez une étude en <strong>accès public</strong>. 
            Le lien est valable {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
          </p>
        </div>
        
        <StudyReportContent 
          ref={reportRef}
          data={reportData}
          monthNames={monthNames}
          azimut={study.params?.azimut || "0"}
          inclinaison={study.params?.inclinaison || "35"}
          clickedPosition={{ lat: study.lat || 0, lng: study.lng || 0, address: study.adresse || "Adresse non définie" }}
          puissancePv={study.puissance || "0"}
          systemLosses={study.params?.systemLosses || study.params?.pertes || "14"}
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

export default function PublicRapportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#e9eaee]">
        <Loader2 className="animate-spin h-12 w-12 text-[#c93b18]" />
      </div>
    }>
      <PublicRapportDetail />
    </Suspense>
  );
}