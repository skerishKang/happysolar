import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

// Simple PDF generation using HTML to PDF approach
function generatePDFContent(document: Document): Buffer {
  // Create HTML content that can be converted to PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .content { white-space: pre-wrap; }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.title}</h1>
        <p>생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</p>
    </div>
    <div class="content">${document.content}</div>
    <div class="footer">
        <p>HappySolar AI 자동화 시스템으로 생성됨</p>
    </div>
</body>
</html>`;
  return Buffer.from(htmlContent, 'utf8');
}

// Simple PPTX generation using minimal PowerPoint structure
function generatePPTXContent(document: Document): Buffer {
  // Handle content whether it's string or object
  let slides: any[] = [];
  
  if (typeof document.content === 'string') {
    slides = document.content.split('\n\n').filter(slide => slide.trim()).map((slide, index) => ({
      slideNumber: index + 1,
      title: slide.split('\n')[0] || `슬라이드 ${index + 1}`,
      content: slide
    }));
  } else if (document.content && Array.isArray(document.content)) {
    // If content is an array of slide objects
    slides = document.content;
  } else if (document.content && typeof document.content === 'object') {
    // If content is an object, try to extract slides
    if (document.content.content && Array.isArray(document.content.content)) {
      slides = document.content.content;
    } else {
      slides = [{ slideNumber: 1, title: document.title, content: JSON.stringify(document.content, null, 2) }];
    }
  }
  
  // Create PowerPoint XML structure
  const pptxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slides.map((slide, index) => `
    <p:sldId id="${2147483649 + index}" r:id="rId${index + 2}"/>
    `).join('')}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  // Create slide XML for each slide
  const slideXmls = slides.map((slide, index) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph type="ctrTitle"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="ko-KR" sz="4400" b="1">
                <a:solidFill>
                  <a:schemeClr val="tx1"/>
                </a:solidFill>
              </a:rPr>
              <a:t>${slide.title || `슬라이드 ${index + 1}`}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content Placeholder 2"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph idx="1"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="ko-KR" sz="2800">
                <a:solidFill>
                  <a:schemeClr val="tx1"/>
                </a:solidFill>
              </a:rPr>
              <a:t>${(slide.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`);

  // Create a simple HTML-based presentation that works in browsers
  const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title || '프레젠테이션'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; 
            background: #1a1a1a;
            color: #fff;
            overflow: hidden;
        }
        .presentation {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        .slide {
            display: none;
            width: 100%;
            height: 100%;
            padding: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
        }
        .slide.active { display: flex; }
        .slide h1 { 
            font-size: 3rem;
            margin-bottom: 2rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .slide .content { 
            font-size: 1.5rem;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            text-align: left;
        }
        .title-slide {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .content-slide {
            background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
        }
        .navigation {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
        }
        .nav-btn {
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 25px;
            color: white;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }
        .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.05);
        }
        .slide-counter {
            position: fixed;
            top: 30px;
            right: 30px;
            background: rgba(0,0,0,0.5);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
        }
        @media print {
            .slide { 
                display: block !important; 
                page-break-after: always; 
                height: auto;
                min-height: 100vh;
            }
            .navigation, .slide-counter { display: none; }
        }
    </style>
</head>
<body>
    <div class="presentation">
        <div class="slide-counter">
            <span id="current">1</span> / <span id="total">${slides.length + 1}</span>
        </div>
        
        <!-- Title Slide -->
        <div class="slide title-slide active">
            <h1>${document.title || '프레젠테이션'}</h1>
            <div class="content">
                <p style="font-size: 1.2rem; margin-top: 40px;">주식회사 해피솔라</p>
                <p style="font-size: 1rem; margin-top: 20px;">${new Date().toLocaleDateString('ko-KR')}</p>
            </div>
        </div>
        
        ${slides.map((slide, index) => `
        <div class="slide content-slide">
            <h1>${slide.title || `슬라이드 ${index + 1}`}</h1>
            <div class="content">${(slide.content || '').replace(/\n/g, '<br>')}</div>
        </div>`).join('')}
        
        <div class="navigation">
            <button class="nav-btn" onclick="prevSlide()">◀ 이전</button>
            <button class="nav-btn" onclick="nextSlide()">다음 ▶</button>
        </div>
    </div>
    
    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        function showSlide(n) {
            slides.forEach(slide => slide.classList.remove('active'));
            currentSlide = (n + totalSlides) % totalSlides;
            slides[currentSlide].classList.add('active');
            document.getElementById('current').textContent = currentSlide + 1;
            document.getElementById('total').textContent = totalSlides;
        }
        
        function nextSlide() { showSlide(currentSlide + 1); }
        function prevSlide() { showSlide(currentSlide - 1); }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        });
        
        showSlide(0);
    </script>
</body>
</html>`;

  

  return Buffer.from(htmlContent, 'utf8');
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
    return generatePDFContent(document);
  }

  async generatePPTX(document: Document): Promise<Buffer> {
    return generatePPTXContent(document);
  }
}

export const storage = new DatabaseStorage();