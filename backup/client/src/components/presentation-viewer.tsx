
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';

interface Slide {
  slideNumber: number;
  title: string;
  content: string;
  detailedContent: string;
  designElements?: string;
}

interface PresentationViewerProps {
  title: string;
  slides: Slide[];
  documentId: string;
}

export default function PresentationViewer({ title, slides, documentId }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const downloadPPTX = async () => {
    const response = await fetch(`/api/documents/${documentId}/download?format=pptx`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.pptx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const response = await fetch(`/api/documents/${documentId}/download?format=pdf`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!slides || slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            PDF 다운로드
          </Button>
          <Button onClick={downloadPPTX} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            PPTX 다운로드
          </Button>
        </div>
      </div>

      {/* Presentation Area */}
      <Card className="w-full aspect-[16/9] mb-4 shadow-lg">
        <CardContent className="p-0 h-full relative">
          {/* Slide Content */}
          <div className="h-full flex flex-col">
            {/* Header Bar */}
            <div className="h-2 bg-blue-500"></div>
            
            {/* Slide Number */}
            <div className="absolute top-4 right-4 text-sm text-gray-500">
              {slide.slideNumber}/{slides.length}
            </div>

            {/* Title */}
            <div className="px-8 py-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 text-center">
                  {slide.title}
                </h1>
              </div>

              {/* Content */}
              <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm space-y-2">
                {slide.detailedContent.split('\n').map((line, index) => (
                  <div key={index} className={line.startsWith('•') ? 'ml-4' : ''}>
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto px-8 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>주식회사 해피솔라 - AI 문서 생성 시스템</span>
                <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1">
                  <span className="text-blue-600 font-medium">해피솔라</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          onClick={prevSlide} 
          variant="outline" 
          disabled={currentSlide === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </Button>
        
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <Button 
          onClick={nextSlide} 
          variant="outline" 
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2"
        >
          다음
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
