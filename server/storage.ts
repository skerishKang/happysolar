
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

// SVG-based slide generation for better quality and compatibility
async function generateSVGSlide(slideData: any, slideNumber: number, totalSlides: number): Promise<string> {
  const svgContent = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3c72;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a5298;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2980B9;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="4" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="1920" height="1080" fill="url(#bgGradient)"/>
      
      <!-- Decorative elements -->
      <circle cx="1750" cy="150" r="100" fill="rgba(255,255,255,0.1)"/>
      <polygon points="100,950 200,850 200,1050" fill="rgba(255,255,255,0.08)"/>
      
      <!-- Header bar -->
      <rect x="0" y="0" width="1920" height="200" fill="url(#headerGradient)"/>
      
      <!-- Slide number badge -->
      <circle cx="1750" cy="100" r="50" fill="#E74C3C" stroke="#C0392B" stroke-width="4"/>
      <text x="1750" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">${slideNumber}</text>
      
      <!-- Solar icon -->
      <circle cx="150" cy="100" r="60" fill="#F39C12" stroke="#E67E22" stroke-width="4"/>
      <text x="150" y="120" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48">☀</text>
      
      <!-- Title -->
      <text x="250" y="120" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold" filter="url(#shadow)">
        ${slideData.title || `슬라이드 ${slideNumber}`}
      </text>
      
      <!-- Content area -->
      <rect x="100" y="250" width="1720" height="750" fill="white" rx="20" filter="url(#shadow)"/>
      
      <!-- Content text -->
      <foreignObject x="150" y="300" width="1620" height="650">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Malgun Gothic', Arial, sans-serif; padding: 40px; line-height: 1.8; color: #2C3E50;">
          ${(slideData.detailedContent || slideData.content || '').split('\n').map((line: string, index: number) => {
            if (line.includes('•') || line.includes('-')) {
              return `<div style="margin: 15px 0; display: flex; align-items: flex-start;">
                <span style="color: #3498DB; font-weight: bold; margin-right: 15px; font-size: 18px;">●</span>
                <span style="font-size: 24px;">${line.replace(/^[•\-]\s*/, '')}</span>
              </div>`;
            } else if (line.trim()) {
              return `<div style="margin: 20px 0; font-size: ${index === 0 ? '28px' : '24px'}; ${index === 0 ? 'font-weight: bold; color: #2C3E50;' : 'color: #34495E;'}">${line}</div>`;
            }
            return '';
          }).join('')}
        </div>
      </foreignObject>
      
      <!-- Data visualization area (if content contains numbers) -->
      ${slideData.detailedContent && slideData.detailedContent.match(/\d+%|\d+억|\d+만|성장|증가|효율/) ? `
        <rect x="1300" y="700" width="450" height="250" fill="#ECF0F1" stroke="#BDC3C7" rx="10"/>
        <text x="1525" y="730" text-anchor="middle" fill="#7F8C8D" font-family="Arial, sans-serif" font-size="18" font-weight="bold">성과 지표</text>
        <rect x="1350" y="760" width="60" height="120" fill="#3498DB"/>
        <rect x="1430" y="740" width="60" height="140" fill="#3498DB"/>
        <rect x="1510" y="720" width="60" height="160" fill="#E74C3C"/>
        <rect x="1590" y="750" width="60" height="130" fill="#3498DB"/>
      ` : ''}
      
      <!-- Footer -->
      <rect x="0" y="1000" width="1920" height="80" fill="#34495E"/>
      <rect x="1500" y="1010" width="300" height="60" fill="#3498DB"/>
      <text x="1650" y="1050" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">해피솔라</text>
      <text x="100" y="1050" fill="#BDC3C7" font-family="Arial, sans-serif" font-size="18">주식회사 해피솔라 - AI 문서 생성 시스템</text>
      <text x="1400" y="1050" fill="#BDC3C7" font-family="Arial, sans-serif" font-size="18">${slideNumber} / ${totalSlides}</text>
    </svg>
  `;
  
  return svgContent;
}

// Enhanced PDF generation with better browser compatibility
async function generatePDFContent(document: Document): Promise<Buffer> {
  try {
    // Try using node-html-to-image for better compatibility
    const nodeHtmlToImage = (await import('node-html-to-image')).default;

    // Extract content from document
    let contentText = '';
    let slides: any[] = [];
    
    if (document.content && typeof document.content === 'object' && document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
      slides = document.content.slideStructure;
      contentText = slides.map((slide: any, index: number) => {
        const slideTitle = slide.title || `슬라이드 ${index + 1}`;
        const slideContent = slide.detailedContent || slide.content || slide.description || '';
        return `${slideTitle}\n\n${slideContent}`;
      }).join('\n\n' + '='.repeat(50) + '\n\n');
    } else if (typeof document.content === 'string') {
      contentText = document.content;
    } else if (document.content && document.content.fullText) {
      contentText = document.content.fullText;
    } else {
      contentText = '내용 처리 중...';
    }

    // Create beautiful HTML with enhanced Korean font support
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @font-face {
          font-family: 'Korean';
          src: local('Malgun Gothic'), local('맑은 고딕'), local('Apple Gothic'), local('Noto Sans KR');
        }
        
        body {
          font-family: 'Korean', 'Malgun Gothic', '맑은 고딕', 'Apple Gothic', 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .title {
          font-size: 2.5em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .company {
          font-size: 1.3em;
          color: #3498db;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .date {
          color: #7f8c8d;
          font-size: 1.1em;
        }
        
        .content {
          background: white;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .slide {
          margin-bottom: 50px;
          padding: 30px;
          border-left: 5px solid #3498db;
          background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 10px;
        }
        
        .slide-title {
          font-size: 1.8em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3498db;
        }
        
        .slide-content {
          font-size: 1.1em;
          line-height: 1.8;
          color: #34495e;
          white-space: pre-line;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          color: #7f8c8d;
          font-size: 0.9em;
        }
        
        .bullet-point {
          color: #3498db;
          font-weight: bold;
        }
        
        @page {
          margin: 20mm;
          size: A4;
        }
        
        @media print {
          body { background: white; }
          .header, .content, .footer { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${document.title || '문서'}</div>
        <div class="company">주식회사 해피솔라</div>
        <div class="date">생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</div>
      </div>
      
      <div class="content">
        ${slides.length > 0 ? 
          slides.map((slide: any, index: number) => `
            <div class="slide">
              <div class="slide-title">${slide.title || `슬라이드 ${index + 1}`}</div>
              <div class="slide-content">${(slide.detailedContent || slide.content || slide.description || '').replace(/•/g, '<span class="bullet-point">•</span>')}</div>
            </div>
          `).join('') :
          `<div class="slide-content">${contentText.replace(/•/g, '<span class="bullet-point">•</span>')}</div>`
        }
      </div>
      
      <div class="footer">
        <div>주식회사 해피솔라 - AI 문서 생성 시스템</div>
        <div>© 2025 HappySolar Co., Ltd. All rights reserved.</div>
      </div>
    </body>
    </html>`;

    // Try node-html-to-image first for better compatibility
    try {
      const imageBuffer = await nodeHtmlToImage({
        html: htmlContent,
        type: 'pdf',
        quality: 100,
        encoding: 'buffer',
        puppeteerArgs: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        }
      });
      
      if (Buffer.isBuffer(imageBuffer)) {
        return imageBuffer;
      }
    } catch (nodeHtmlError) {
      console.warn('node-html-to-image failed, trying Puppeteer:', nodeHtmlError);
    }

    // Fallback to Puppeteer with chromium
    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');

    const browser = await puppeteer.default.launch({
      args: [
        ...chromium.default.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    });

    const page = await browser.newPage();
    
    // Set content and wait for fonts to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    // Fallback to basic HTML when all methods fail
    const fallbackHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${document.title || '문서'}</title>
      <style>
        body { font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .content { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>${document.title || '문서'}</h1>
      <p><strong>회사:</strong> 주식회사 해피솔라</p>
      <p><strong>생성일:</strong> ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</p>
      <div class="content">
        ${typeof document.content === 'string' ? 
          document.content.replace(/\n/g, '<br>') : 
          JSON.stringify(document.content, null, 2).replace(/\n/g, '<br>')
        }
      </div>
    </body>
    </html>`;
    
    return Buffer.from(fallbackHtml, 'utf-8');
  }
}

// SVG-based PPTX generation for high-quality vector graphics
async function generatePPTXContent(document: Document): Promise<Buffer> {
  // Dynamic import for CommonJS module
  const PptxGenJS = (await import('pptxgenjs')).default;
  
  // Create a new presentation
  const pptx = new PptxGenJS();
  
  // Set presentation properties for better compatibility
  pptx.theme = {
    headFontFace: 'Arial',
    bodyFontFace: 'Arial'
  };
  
  // Set layout and compatibility options
  pptx.layout = 'LAYOUT_16x9';
  
  // Handle content whether it's string or object
  let slides: any[] = [];
  let requestedSlideCount = 5; // Default
  let uploadedFileContent = '';
  
  // Extract requested slide count from form data if available
  if (document.formData) {
    // Find slide count from form data (usually field_3 for presentations)
    if (document.formData.field_3 && !isNaN(Number(document.formData.field_3))) {
      requestedSlideCount = Number(document.formData.field_3);
    }
    
    // Extract uploaded file references
    const uploadedFiles = Object.values(document.formData).filter((value: any) => 
      typeof value === 'string' && (value.includes('.pdf') || value.includes('.ppt') || value.includes('.doc'))
    );
    
    if (uploadedFiles.length > 0) {
      uploadedFileContent = `\n\n참고자료: ${uploadedFiles.join(', ')} 기반으로 작성됨`;
    }
  }
  
  if (document.content && typeof document.content === 'object' && document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
    // Use slideStructure from OpenAI response - this contains the rich content
    slides = document.content.slideStructure.slice(0, requestedSlideCount).map((slide: any, index: number) => ({
      slideNumber: index + 1,
      title: slide.title || `슬라이드 ${index + 1}`,
      content: slide.content || slide.description || '',
      detailedContent: slide.detailedContent || slide.content || slide.description || '상세 내용을 생성 중입니다.',
      designElements: slide.designElements || (index === 0 ? 'cover-slide' : 'content-slide')
    }));
  } else if (typeof document.content === 'string') {
    const sections = document.content.split(/\n\n+/).filter(section => section.trim());
    slides = sections.slice(0, requestedSlideCount).map((section, index) => ({
      slideNumber: index + 1,
      title: section.split('\n')[0] || `슬라이드 ${index + 1}`,
      content: section,
      detailedContent: section.split('\n').slice(1).join('\n') || '상세 내용이 여기에 포함됩니다.'
    }));
  } else {
    // Fallback: Create minimal slides
    for (let i = 0; i < requestedSlideCount; i++) {
      slides.push({
        slideNumber: i + 1,
        title: `슬라이드 ${i + 1}`,
        content: `슬라이드 ${i + 1} 내용`,
        detailedContent: `• 주요 내용이 여기에 표시됩니다\n• 추가 설명과 데이터\n• 실행 방안 및 결론${uploadedFileContent}`
      });
    }
  }

  // Ensure we have the requested number of slides
  while (slides.length < requestedSlideCount) {
    const slideNum = slides.length + 1;
    slides.push({
      slideNumber: slideNum,
      title: `추가 슬라이드 ${slideNum}`,
      content: `이 슬라이드는 추가로 생성된 내용입니다.`,
      detailedContent: `• 주요 내용 포인트\n• 상세 설명\n• 분석 및 인사이트\n• 실행 방안\n\n구체적인 데이터와 사례가 포함됩니다.`
    });
  }

  // Add stunning title slide with SVG-based design
  const titleSlide = pptx.addSlide();
  
  // Generate SVG for title slide
  const titleSVG = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="titleBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3c72;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a5298;stop-opacity:1" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="1920" height="1080" fill="url(#titleBg)"/>
      
      <!-- Decorative geometric shapes -->
      <polygon points="1600,100 1750,100 1675,250" fill="rgba(255,255,255,0.15)" filter="url(#glow)"/>
      <circle cx="200" cy="900" r="120" fill="rgba(255,255,255,0.1)" filter="url(#glow)"/>
      
      <!-- Main title -->
      <text x="960" y="450" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="bold" filter="url(#glow)">
        ${document.title || '프레젠테이션'}
      </text>
      
      <!-- Subtitle -->
      <text x="960" y="550" text-anchor="middle" fill="#F39C12" font-family="Arial, sans-serif" font-size="36" font-style="italic">
        AI 기반 스마트 솔루션
      </text>
      
      <!-- Company branding box -->
      <rect x="660" y="650" width="600" height="150" fill="rgba(255,255,255,0.9)" rx="20" filter="url(#glow)"/>
      <text x="960" y="710" text-anchor="middle" fill="#2C3E50" font-family="Arial, sans-serif" font-size="42" font-weight="bold">
        주식회사 해피솔라
      </text>
      <text x="960" y="760" text-anchor="middle" fill="#7F8C8D" font-family="Arial, sans-serif" font-size="24">
        ${new Date().toLocaleDateString('ko-KR')}
      </text>
      
      <!-- Solar energy icons -->
      <circle cx="600" cy="725" r="40" fill="#F39C12"/>
      <text x="600" y="740" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32">☀</text>
      <circle cx="1320" cy="725" r="40" fill="#F39C12"/>
      <text x="1320" y="740" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32">☀</text>
    </svg>
  `;
  
  // Convert SVG to image data and add to slide
  try {
    const sharp = await import('sharp');
    const svgBuffer = Buffer.from(titleSVG, 'utf-8');
    const pngBuffer = await sharp.default(svgBuffer).png().toBuffer();
    const base64Image = pngBuffer.toString('base64');
    
    titleSlide.addImage({
      data: `data:image/png;base64,${base64Image}`,
      x: 0, y: 0, w: 10, h: 7.5
    });
  } catch (error) {
    console.warn('SVG conversion failed, using fallback design:', error);
    // Fallback to original design
    titleSlide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 7.5,
      fill: { type: 'linear', angle: 45, colors: [
        { color: '1e3c72', position: 0 },
        { color: '2a5298', position: 100 }
      ]},
      line: { width: 0 }
    });
    
    // Decorative geometric shapes
    titleSlide.addShape('triangle', {
      x: 8.5, y: 0.5, w: 1.5, h: 1.5,
      fill: { color: 'ffffff', transparency: 80 },
      line: { width: 0 }
    });
    
    titleSlide.addShape('circle', {
      x: 0.2, y: 5.8, w: 1, h: 1,
      fill: { color: 'ffffff', transparency: 70 },
      line: { width: 0 }
    });
    
    // Main title with modern styling
    titleSlide.addText(document.title || '프레젠테이션', {
      x: 0.5, y: 2, w: 9, h: 1.5,
      fontSize: 42, bold: true, color: 'FFFFFF',
      align: 'center', shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 45 }
    });
    
    // Subtitle with accent color
    titleSlide.addText('AI 기반 스마트 솔루션', {
      x: 0.5, y: 3.8, w: 9, h: 0.8,
      fontSize: 18, color: 'F39C12', align: 'center', italic: true
    });
    
    // Company branding
    titleSlide.addShape('rect', {
      x: 2, y: 5, w: 6, h: 1.2,
      fill: { color: 'ffffff', transparency: 90 },
      line: { color: 'ffffff', width: 1 }
    });
    
    titleSlide.addText('주식회사 해피솔라', {
      x: 2.2, y: 5.1, w: 5.6, h: 0.5,
      fontSize: 24, bold: true, color: 'FFFFFF', align: 'center'
    });
    
    titleSlide.addText(new Date().toLocaleDateString('ko-KR'), {
      x: 2.2, y: 5.7, w: 5.6, h: 0.4,
      fontSize: 14, color: 'BDC3C7', align: 'center'
    });
  }

  // Add content slides with SVG-based vector graphics
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const contentSlide = pptx.addSlide();
    
    // Generate SVG for this slide
    const slideSVG = await generateSVGSlide(slide, slide.slideNumber, slides.length);
    
    try {
      const sharp = await import('sharp');
      const svgBuffer = Buffer.from(slideSVG, 'utf-8');
      const pngBuffer = await sharp.default(svgBuffer)
        .png({ quality: 95 })
        .resize(1920, 1080)
        .toBuffer();
      const base64Image = pngBuffer.toString('base64');
      
      contentSlide.addImage({
        data: `data:image/png;base64,${base64Image}`,
        x: 0, y: 0, w: 10, h: 7.5
      });
    } catch (error) {
      console.warn('SVG slide conversion failed, using fallback design:', error);
      // Fallback to original design
      contentSlide.background = { color: 'F8FAFC' };
      
      contentSlide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 1.2,
        fill: { type: 'linear', angle: 90, colors: [
          { color: '3498DB', position: 0 },
          { color: '2980B9', position: 100 }
        ]},
        line: { width: 0 }
      });
      
      // Slide number with modern badge
      contentSlide.addShape('circle', {
        x: 9.2, y: 0.15, w: 0.6, h: 0.6,
        fill: { color: 'E74C3C' },
        line: { color: 'C0392B', width: 2 }
      });
      
      contentSlide.addText(`${slide.slideNumber}`, {
        x: 9.2, y: 0.15, w: 0.6, h: 0.6,
        fontSize: 16, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle'
      });
      
      // Main title with icon area
      contentSlide.addShape('rect', {
        x: 0.5, y: 0.2, w: 8.5, h: 0.8,
        fill: { color: 'FFFFFF', transparency: 95 },
        line: { width: 0 }
      });
      
      // Icon placeholder (solar panel icon representation)
      contentSlide.addShape('rect', {
        x: 0.7, y: 0.3, w: 0.6, h: 0.6,
        fill: { color: 'F39C12' },
        line: { color: 'E67E22', width: 2 }
      });
      
      contentSlide.addText('☀', {
        x: 0.7, y: 0.3, w: 0.6, h: 0.6,
        fontSize: 24, color: 'FFFFFF', align: 'center', valign: 'middle'
      });
      
      // Title text
      contentSlide.addText(slide.title || `슬라이드 ${i + 1}`, {
        x: 1.5, y: 0.3, w: 7.3, h: 0.6,
        fontSize: 26, bold: true, color: 'FFFFFF',
        align: 'left', valign: 'middle',
        shadow: { type: 'outer', color: '000000', blur: 4, offset: 1, angle: 45 }
      });
      
      // Content area with modern card design
      contentSlide.addShape('rect', {
        x: 0.5, y: 1.5, w: 9, h: 4.8,
        fill: { color: 'FFFFFF' },
        line: { color: 'E1E8ED', width: 1 },
        shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 45, transparency: 20 }
      });
      
      // Content processing with visual elements
      const contentText = slide.detailedContent || slide.content || '내용이 여기에 표시됩니다.';
      const contentLines = contentText.split('\n').filter(line => line.trim());
      
      // Add content with icons and formatting
      let yPos = 1.8;
      for (let lineIndex = 0; lineIndex < contentLines.length; lineIndex++) {
        const line = contentLines[lineIndex];
        
        if (line.includes('•') || line.includes('-')) {
          // Bullet point with custom icon
          contentSlide.addShape('circle', {
            x: 0.8, y: yPos + 0.05, w: 0.15, h: 0.15,
            fill: { color: '3498DB' },
            line: { width: 0 }
          });
          
          contentSlide.addText(line.replace(/^[•\-]\s*/, ''), {
            x: 1.1, y: yPos, w: 7.8, h: 0.25,
            fontSize: 14, color: '2C3E50', align: 'left'
          });
        } else {
          // Regular text with emphasis
          contentSlide.addText(line, {
            x: 0.8, y: yPos, w: 8.1, h: 0.3,
            fontSize: line.length > 50 ? 12 : 14,
            color: '34495E', align: 'left',
            bold: lineIndex === 0 // First line bold
          });
        }
        yPos += 0.35;
        
        if (yPos > 5.8) break; // Prevent overflow
      }
      
      // Add data visualization if content contains numbers
      if (contentText.match(/\d+%|\d+억|\d+만|성장|증가|효율/)) {
        // Simple chart representation
        contentSlide.addShape('rect', {
          x: 6.5, y: 4, w: 2.8, h: 1.8,
          fill: { color: 'ECF0F1' },
          line: { color: 'BDC3C7', width: 1 }
        });
        
        // Chart bars
        [0.3, 0.6, 0.9, 0.7].forEach((height, i) => {
          contentSlide.addShape('rect', {
            x: 6.8 + (i * 0.5), y: 5.8 - (height * 1.3), w: 0.3, h: height * 1.3,
            fill: { color: i === 2 ? 'E74C3C' : '3498DB' },
            line: { width: 0 }
          });
        });
        
        contentSlide.addText('성과 지표', {
          x: 6.5, y: 4.1, w: 2.8, h: 0.3,
          fontSize: 10, bold: true, color: '7F8C8D', align: 'center'
        });
      }
      
      // Footer with modern design
      contentSlide.addShape('rect', {
        x: 0, y: 6.8, w: 10, h: 0.7,
        fill: { color: '34495E' },
        line: { width: 0 }
      });
      
      // Company logo area
      contentSlide.addShape('rect', {
        x: 8.5, y: 6.9, w: 1.3, h: 0.5,
        fill: { color: '3498DB' },
        line: { width: 0 }
      });
      
      contentSlide.addText('해피솔라', {
        x: 8.5, y: 6.9, w: 1.3, h: 0.5,
        fontSize: 12, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle'
      });
      
      // Footer text with modern spacing
      contentSlide.addText(`주식회사 해피솔라 - AI 문서 생성 시스템`, {
        x: 0.5, y: 6.9, w: 7.5, h: 0.5,
        fontSize: 10, color: 'BDC3C7', align: 'left', valign: 'middle'
      });
      
      contentSlide.addText(`${slide.slideNumber} / ${slides.length}`, {
        x: 7.5, y: 6.9, w: 0.8, h: 0.5,
        fontSize: 10, color: 'BDC3C7', align: 'right', valign: 'middle'
      });
    }
  }

  // Generate and return the PPTX file as buffer
  const output = await pptx.write({ outputType: 'arraybuffer' });
  
  // Convert ArrayBuffer to Buffer
  if (output instanceof ArrayBuffer) {
    return Buffer.from(output);
  } else if (output instanceof Uint8Array) {
    return Buffer.from(output);
  } else if (Buffer.isBuffer(output)) {
    return output;
  } else {
    // Fallback conversion
    const arrayBuffer = output as ArrayBuffer;
    return Buffer.from(arrayBuffer);
  }
}

interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: { username: string; password: string }): Promise<User>;
  createDocument(documentData: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(userId?: number): Promise<Document[]>;
  getRecentDocuments(limit: number): Promise<Document[]>;
  getDocumentStats(): Promise<{
    monthlyDocuments: number;
    timeSaved: string;
    efficiency: string;
    activeUsers: number;
  }>;
  getCompanyInfo(): Promise<Company>;
  generatePDF(document: Document): Promise<Buffer>;
  generatePPTX(document: Document): Promise<Buffer>;
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: { username: string; password: string }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, parseInt(id)));
    return document || undefined;
  }

  async getDocuments(userId?: number): Promise<Document[]> {
    if (userId) {
      return await db.select().from(documents).where(eq(documents.userId, userId));
    }
    return await db.select().from(documents);
  }

  async getRecentDocuments(limit: number): Promise<Document[]> {
    const docs = await db.select().from(documents).limit(limit).orderBy(documents.createdAt);
    return docs.map(doc => ({
      ...doc,
      createdAt: doc.createdAt.toLocaleDateString('ko-KR') + ' ' + doc.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    })) as Document[];
  }

  async getDocumentStats(): Promise<{
    monthlyDocuments: number;
    timeSaved: string;
    efficiency: string;
    activeUsers: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyDocs = await db.select().from(documents)
      .where(eq(documents.createdAt, startOfMonth));

    return {
      monthlyDocuments: monthlyDocs.length,
      timeSaved: `${monthlyDocs.length * 2}시간`,
      efficiency: "95%",
      activeUsers: 28
    };
  }

  async getCompanyInfo(): Promise<Company> {
    const [companyInfo] = await db.select().from(company).limit(1);
    if (!companyInfo) {
      // Insert default company info if none exists
      const [newCompany] = await db.insert(company).values({}).returning();
      return newCompany;
    }
    return companyInfo;
  }

  async generatePDF(document: Document): Promise<Buffer> {
    return await generatePDFContent(document);
  }

  async generatePPTX(document: Document): Promise<Buffer> {
    return await generatePPTXContent(document);
  }
}

export const storage = new DatabaseStorage();
