import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';

interface PDFChunk {
  id: string;
  text: string;
  pageNumber: number;
  embedding?: number[];
}

interface ProcessedPDF {
  id: string;
  name: string;
  chunks: PDFChunk[];
  totalPages: number;
  createdAt: Date;
}

class PDFService {
  private processedPDFs: Map<string, ProcessedPDF> = new Map();

  async extractTextFromPDF(file: File): Promise<{ text: string; totalPages: number }> {
    try {
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }

      return { text: fullText, totalPages };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
    }
  }

  async processText(text: string): Promise<ProcessedPDF> {
    const chunks = this.chunkText(text, 1000);
    
    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      chunk.embedding = await this.generateEmbedding(chunk.text);
    }
    
    const processedText: ProcessedPDF = {
      id: `text_${Date.now()}`,
      name: 'Pasted Text Document',
      chunks,
      totalPages: 1,
      createdAt: new Date(),
    };
    
    this.processedPDFs.set(processedText.id, processedText);
    return processedText;
  }

  chunkText(text: string, chunkSize: number = 1000): PDFChunk[] {
    const chunks: PDFChunk[] = [];
    
    // Check if text has page markers (from PDF extraction)
    if (text.includes('--- Page')) {
      const pages = text.split(/--- Page \d+ ---/);
      
      pages.forEach((pageText, pageIndex) => {
        if (!pageText.trim()) return;
        
        // Split page into smaller chunks if it's too long
        const sentences = pageText.split(/[.!?]+/).filter(s => s.trim());
        let currentChunk = '';
        
        sentences.forEach(sentence => {
          if ((currentChunk + sentence).length > chunkSize && currentChunk) {
            chunks.push({
              id: `chunk_${chunks.length}`,
              text: currentChunk.trim(),
              pageNumber: pageIndex + 1,
            });
            currentChunk = sentence;
          } else {
            currentChunk += ' ' + sentence;
          }
        });
        
        if (currentChunk.trim()) {
          chunks.push({
            id: `chunk_${chunks.length}`,
            text: currentChunk.trim(),
            pageNumber: pageIndex + 1,
          });
        }
      });
    } else {
      // Handle plain text without page markers
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      let currentChunk = '';
      
      sentences.forEach(sentence => {
        if ((currentChunk + sentence).length > chunkSize && currentChunk) {
          chunks.push({
            id: `chunk_${chunks.length}`,
            text: currentChunk.trim(),
            pageNumber: 1,
          });
          currentChunk = sentence;
        } else {
          currentChunk += ' ' + sentence;
        }
      });
      
      if (currentChunk.trim()) {
        chunks.push({
          id: `chunk_${chunks.length}`,
          text: currentChunk.trim(),
          pageNumber: 1,
        });
      }
    }
    
    return chunks;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use Groq for text embeddings (simulated - in reality you'd use a specific embedding model)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Convert the following text into a semantic representation by extracting key concepts and returning them as a similarity score array. Focus on main topics, entities, and concepts.'
            },
            {
              role: 'user',
              content: `Extract semantic concepts from: ${text.substring(0, 500)}`
            }
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      // For simplicity, create a basic embedding based on text characteristics
      const words = text.toLowerCase().split(/\s+/);
      const embedding = new Array(384).fill(0); // Standard embedding size
      
      words.forEach((word, index) => {
        const hash = this.simpleHash(word);
        embedding[hash % 384] += 1;
      });
      
      // Normalize the embedding
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
    } catch (error) {
      console.error('Embedding generation error:', error);
      // Fallback to simple text-based embedding
      return this.createSimpleEmbedding(text);
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private createSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    });
    
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async processPDF(file: File): Promise<ProcessedPDF> {
    const { text, totalPages } = await this.extractTextFromPDF(file);
    const chunks = this.chunkText(text);
    
    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      chunk.embedding = await this.generateEmbedding(chunk.text);
    }
    
    const processedPDF: ProcessedPDF = {
      id: `pdf_${Date.now()}`,
      name: file.name,
      chunks,
      totalPages,
      createdAt: new Date(),
    };
    
    this.processedPDFs.set(processedPDF.id, processedPDF);
    return processedPDF;
  }

  async searchRelevantChunks(pdfId: string, query: string, limit: number = 5): Promise<PDFChunk[]> {
    const pdf = this.processedPDFs.get(pdfId);
    if (!pdf) throw new Error('Document not found');
    
    const queryEmbedding = await this.generateEmbedding(query);
    
    const similarities = pdf.chunks.map(chunk => ({
      chunk,
      similarity: chunk.embedding ? this.cosineSimilarity(queryEmbedding, chunk.embedding) : 0,
    }));
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit).map(item => item.chunk);
  }

  async answerQuestion(pdfId: string, question: string): Promise<string> {
    const relevantChunks = await this.searchRelevantChunks(pdfId, question);
    const pdf = this.processedPDFs.get(pdfId);
    
    if (!pdf || relevantChunks.length === 0) {
      return "I couldn't find relevant information in the document to answer your question.";
    }
    
    const context = relevantChunks.map(chunk => 
      `[Page ${chunk.pageNumber}]: ${chunk.text}`
    ).join('\n\n');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant that answers questions based on document content. Always ground your responses in the provided context and cite page numbers when possible. If you cannot find the answer in the context, say so clearly.`
          },
          {
            role: 'user',
            content: `Document: ${pdf.name}\n\nContext from the document:\n${context}\n\nQuestion: ${question}\n\nPlease provide a comprehensive answer based on the document content above. Include page references when relevant.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate answer');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I could not generate an answer at this time.';
  }

  getPDF(pdfId: string): ProcessedPDF | undefined {
    return this.processedPDFs.get(pdfId);
  }

  getAllPDFs(): ProcessedPDF[] {
    return Array.from(this.processedPDFs.values());
  }

  removePDF(pdfId: string): boolean {
    return this.processedPDFs.delete(pdfId);
  }
}

export const pdfService = new PDFService();
