//@ts-nocheck

import { NextResponse } from 'next/server';
import React from 'react';

export async function GET() {
  try {
    console.log('🧪 ========== TESTING PDF GENERATION ==========');
    
    const { pdf } = await import('@react-pdf/renderer');
    const { PrintComponentPDF } = await import('@/components/ui/PrintComponentPDF');

    const testData = {
      data: {
        outputs: {
          totals: {
            fixed: {
              E_y: 5000,
              "H(i)_y": 1200,
              SD_y: 5.2,
              l_aoi: 2.1,
              l_spec: "0.5",
              l_tg: 3.2,
              l_total: 5.8,
            }
          },
          monthly: {
            fixed: Array(12).fill(null).map((_, i) => ({
              E_m: 400 + i * 50,
              "H(i)_m": 100 + i * 10,
              SD_m: 2 + i * 0.3,
            }))
          }
        }
      },
      monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      azimut: '0',
      inclinaison: '35',
      clickedPosition: {
        lat: 48.8566,
        lng: 2.3522,
        address: 'Paris, France',
      },
      puissancePv: '9',
      systemLosses: '14',
      voltageDropResult: {
        vdrop: '1.2',
        vdropPct: '0.5',
        rwire: '0.024',
      },
      panels: [],
      logoUrl: '/logo-mafatec-2048x423.png',
    };

    console.log('🧪 Creating PDF with test data...');
    const element = React.createElement(PrintComponentPDF, testData);
    const pdfStream = pdf(element);
    const buffer = await pdfStream.toBuffer();

    console.log(`🧪 PDF generated, size: ${buffer?.length || 0} bytes`);
    console.log('🧪 ========== TEST COMPLETE ==========');

    return NextResponse.json({
      success: true,
      size: buffer?.length || 0,
      message: 'PDF generated successfully',
    });

  } catch (error: any) {
    console.error('🧪 Test PDF generation failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}