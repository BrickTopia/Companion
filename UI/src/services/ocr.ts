import { createWorker, PSM, OEM } from 'tesseract.js';
import { ocr as webAiOcr } from 'web-ai-toolkit';
import type { RecognizeResult } from 'tesseract.js';
import { Jimp } from 'jimp';

export type OcrProvider = 'tesseract' | 'web-ai-toolkit';

interface OcrResult {
  text: string;
  confidence: number;
}

// Define available OCR model configurations
const OCR_MODELS = {
  basic: {
    name: 'basic',
    config: {
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%,.()- ',
    },
    preprocess: false
  },
  enhanced: {
    name: 'enhanced',
    config: {
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%,.()- ',
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1',
    },
    preprocess: true
  }
};

export class OcrService {
  private static instance: OcrService;
  private provider: OcrProvider = 'tesseract';
  private worker: Tesseract.Worker | null = null;
  private activeModels: string[] = ['enhanced']; // Default to enhanced model

  private constructor() {}

  static getInstance(): OcrService {
    if (!this.instance) {
      this.instance = new OcrService();
    }
    return this.instance;
  }

  setProvider(provider: OcrProvider) {
    this.provider = provider;
  }

  setActiveModels(modelNames: string[]) {
    const validModels = modelNames.filter(name => name in OCR_MODELS);
    if (validModels.length === 0) {
      console.warn('No valid models specified, using enhanced model');
      this.activeModels = ['enhanced'];
    } else {
      this.activeModels = validModels;
    }
  }

  private async initializeWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
    return this.worker;
  }

  private async preprocessImage(inputImage: string | File | Blob): Promise<string> {
    try {
      const buffer = typeof inputImage === 'string'
        ? await fetch(inputImage).then(r => r.arrayBuffer())
        : await inputImage.arrayBuffer();

      const image = await Jimp.read(Buffer.from(buffer));
      
      image
        .normalize()
        .contrast(0.5)
        .brightness(0.2)
        .greyscale()
        .scale(2)
        .threshold({ max: 128 });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      const processedData = new ImageData(
        new Uint8ClampedArray(image.bitmap.data),
        image.width,
        image.height
      );
      ctx.putImageData(processedData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Preprocessing error:', error);
      throw error;
    }
  }

  private async runModel(imageData: string | File | Blob, modelName: string): Promise<OcrResult> {
    const worker = await this.initializeWorker();
    const model = OCR_MODELS[modelName as keyof typeof OCR_MODELS];

    try {
      await worker.setParameters(model.config);

      // Apply preprocessing if model requires it
      const dataToProcess = model.preprocess 
        ? await this.preprocessImage(imageData)
        : imageData;

      const result = await worker.recognize(dataToProcess);
      
      return {
        text: this.cleanText(result.data.text),
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error(`Error running model ${modelName}:`, error);
      // Fallback to basic model if enhanced fails
      if (modelName === 'enhanced') {
        console.log('Falling back to basic model...');
        return this.runModel(imageData, 'basic');
      }
      throw error;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/[^\x20-\x7E\n]/g, '')
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[;]/g, ',')
      .replace(/(\d+)\s*[.,]\s*(\d+)/g, '$1.$2')
      .trim();
  }

  async extractText(imageData: string | File | Blob): Promise<OcrResult> {
    try {
      if (this.provider === 'web-ai-toolkit') {
        const imageBlob = typeof imageData === 'string' 
          ? await fetch(imageData).then(r => r.blob())
          : imageData;
        return await webAiOcr(imageBlob) as OcrResult;
      }

      // If only one model is active, just run that
      if (this.activeModels.length === 1) {
        return await this.runModel(imageData, this.activeModels[0]);
      }

      // Run all active models and select best result
      const results = await Promise.all(
        this.activeModels.map(modelName => this.runModel(imageData, modelName))
      );

      // Select best result based on confidence
      return results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

    } catch (error) {
      console.error('OCR error:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = OcrService.getInstance(); 