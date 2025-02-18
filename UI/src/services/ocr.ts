import { createWorker, PSM } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import { isOpenCVReady, waitForOpenCV } from '@/utils/opencv';
import { loadImage } from '@/utils/imageProcessing';
import cv from '@techstark/opencv-js';
import { ocr as webAiOcr } from 'web-ai-toolkit';
import { preprocessImage, parseIngredients, basicPreprocess } from '@/utils';

export type OcrProvider = 'tesseract' | 'web-ai-toolkit';

export interface TextRegion {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrResult {
  regions: TextRegion[];
  ingredients?: TextRegion; // The identified ingredients region
  rawText: string;
  confidence: number;
}

const OCR_CONFIG = {
  tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.()-/ ',
  preserve_interword_spaces: '1',
  tessedit_enable_dict_correction: '0',
  textord_min_linesize: '1.2',
  tessedit_write_images: '0',
  tessedit_create_hocr: '1'
};

export class OcrService {
  private static instance: OcrService;
  private worker: Worker | null = null;

  private constructor() {}

  static getInstance(): OcrService {
    if (!this.instance) {
      this.instance = new OcrService();
    }
    return this.instance;
  }

  private async initializeWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
    return this.worker;
  }

  private async preprocessImage(inputImage: string | File | Blob): Promise<string> {
    try {
      const processedImageData = await preprocessImage(inputImage);
      const canvas = document.createElement('canvas');
      canvas.width = processedImageData.width;
      canvas.height = processedImageData.height;
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true
      })!;
      
      ctx.putImageData(processedImageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Preprocessing error:', error);
      throw error;
    }
  }

  async extractText(imageData: string | File | Blob): Promise<OcrResult> {
    try {
      console.log('Starting OCR extraction...');
      return this.detectRegions(imageData);
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (error) {
        console.error('Error terminating worker:', error);
      } finally {
        this.worker = null;
      }
    }
  }

  async detectRegions(imageData: string | File | Blob): Promise<OcrResult> {
    try {
      const worker = await this.initializeWorker();
      
      const imageToProcess = typeof imageData === 'string' 
        ? imageData 
        : await this.fileToBase64(imageData);

      const processedImage = await this.simplePreprocess(imageToProcess);
      
      await worker.setParameters(OCR_CONFIG);
      const result = await worker.recognize(processedImage);

      const regions = this.parseHOCR(result.data.hocr);
      const ingredients = this.findIngredientsRegion(regions);

      return {
        regions,
        ingredients,
        rawText: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('OCR failed:', error);
      throw error;
    }
  }

  private async simplePreprocess(imageData: string): Promise<string> {
    if (!isOpenCVReady) {
      await waitForOpenCV();
    }

    const sourceImage = await loadImage(imageData);
    const mat = cv.imread(sourceImage);
    const processed = new cv.Mat();

    try {
      // Convert to grayscale
      cv.cvtColor(mat, processed, cv.COLOR_RGBA2GRAY);
      
      // Simple thresholding - good for clear black text
      cv.threshold(processed, processed, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

      // Convert back to base64
      const canvas = document.createElement('canvas');
      canvas.width = processed.cols;
      canvas.height = processed.rows;
      cv.imshow(canvas, processed);
      return canvas.toDataURL('image/png');
    } finally {
      mat.delete();
      processed.delete();
    }
  }

  private async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private parseHOCR(hocrData: string): TextRegion[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(hocrData, 'text/html');
    const words = Array.from(doc.querySelectorAll('.ocrx_word'));
    
    return words.map(word => {
      const title = word.getAttribute('title') || '';
      const bbox = title.match(/bbox (\d+) (\d+) (\d+) (\d+)/);
      const conf = title.match(/x_wconf (\d+)/);
      
      return {
        text: word.textContent || '',
        confidence: conf ? parseInt(conf[1]) / 100 : 0,
        bbox: bbox ? {
          x0: parseInt(bbox[1]),
          y0: parseInt(bbox[2]),
          x1: parseInt(bbox[3]),
          y1: parseInt(bbox[4])
        } : { x0: 0, y0: 0, x1: 0, y1: 0 }
      };
    });
  }

  private findIngredientsRegion(regions: TextRegion[]): TextRegion | undefined {
    // Find regions that might contain "ingredients"
    const ingredientHeaders = regions.filter(r => 
      r.text.toLowerCase().includes('ingredient')
    );

    if (ingredientHeaders.length === 0) return undefined;

    // Get the most likely ingredients header
    const header = ingredientHeaders[0];
    
    // Find all regions below and to the right of the header
    const ingredientsList = regions.filter(r => 
      r.bbox.y0 >= header.bbox.y0 &&
      r.bbox.x0 >= header.bbox.x0 &&
      // Filter out nutrition facts and allergen info
      !r.text.toLowerCase().includes('nutrition') &&
      !r.text.toLowerCase().includes('allergen') &&
      !r.text.toLowerCase().includes('contains')
    );

    // Combine into one region
    if (ingredientsList.length > 0) {
      const x0 = Math.min(...ingredientsList.map(r => r.bbox.x0));
      const y0 = Math.min(...ingredientsList.map(r => r.bbox.y0));
      const x1 = Math.max(...ingredientsList.map(r => r.bbox.x1));
      const y1 = Math.max(...ingredientsList.map(r => r.bbox.y1));

      return {
        text: ingredientsList.map(r => r.text).join(' '),
        confidence: ingredientsList.reduce((acc, r) => acc + r.confidence, 0) / ingredientsList.length,
        bbox: { x0, y0, x1, y1 }
      };
    }

    return undefined;
  }
}

export const ocrService = OcrService.getInstance(); 