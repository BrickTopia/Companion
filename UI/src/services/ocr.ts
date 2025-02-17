import { createWorker, PSM, OEM, Worker } from 'tesseract.js';
import { ocr as webAiOcr } from 'web-ai-toolkit';
import { preprocessImage, parseIngredients } from '@/utils';

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
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%,.()[]-/ ',
      tessedit_write_images: '0',
      tessedit_create_boxfile: '0',
      tessedit_create_hocr: '0',
      tessedit_create_tsv: '0',
      tessedit_create_txt: '0',
    },
    preprocess: false
  },
  enhanced: {
    name: 'enhanced',
    config: {
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%,.()[]-/ ',
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1',
      textord_force_make_prop_words: '1',
      tessedit_write_images: '0',
      tessedit_create_boxfile: '0',
      tessedit_create_hocr: '0',
      tessedit_create_tsv: '0',
      tessedit_create_txt: '0',
      textord_tabfind_vertical_text: '1',
      textord_tabfind_force_vertical_text: '0',
      textord_single_column: '0',
      textord_min_linesize: '1.5',
    },
    preprocess: true
  },
  ingredients: {
    name: 'ingredients',
    config: {
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%,.()[]-/& ',
      tessedit_upper_case_only: '0',
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1',
      tessedit_fix_hyphens: '1',
      tessedit_enable_dict_correction: '1',
      textord_force_make_prop_words: '1',
      textord_min_linesize: '1.2',
    },
    preprocess: true
  }
};

export class OcrService {
  private static instance: OcrService;
  private provider: OcrProvider = 'tesseract';
  private worker: Worker | null = null;
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
    return parseIngredients(text).join(', ');
  }

  async extractText(imageData: string | File | Blob): Promise<OcrResult> {
    try {
      console.log('Starting OCR extraction...');
      
      if (!imageData) {
        throw new Error('No image data provided');
      }

      const worker = await this.initializeWorker();
      if (!worker) {
        throw new Error('Failed to initialize Tesseract worker');
      }

      try {
        // Convert image to proper format for Tesseract
        let imageToProcess: string | Blob;
        
        if (typeof imageData === 'string') {
          imageToProcess = imageData;
        } else {
          const buffer = await imageData.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const blob = new Blob([bytes], { type: 'image/png' });
          imageToProcess = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }

        console.log('Preprocessing image...');
        const processedImage = await preprocessImage(imageToProcess);
        if (!processedImage) {
          throw new Error('Image preprocessing failed');
        }

        // Convert ImageData back to base64
        const canvas = document.createElement('canvas');
        canvas.width = processedImage.width;
        canvas.height = processedImage.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        ctx.putImageData(processedImage, 0, 0);
        const processedBase64 = canvas.toDataURL('image/png');

        // Optimized configuration for ingredient lists
        const config = {
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.()•*-/ ',
          tessedit_enable_dict_correction: '0',  // Disable dictionary to preserve ingredient terms
          textord_heavy_nr: '1',
          textord_min_linesize: '1.2',
          language_model_penalty_non_dict_word: '0.5',  // Reduce penalty for non-dictionary words
          language_model_penalty_non_freq_dict_word: '0.5',
          textord_force_make_prop_words: '0',  // Don't force proportional words
          tessedit_write_images: '0',
          tessedit_create_boxfile: '0',
          tessedit_create_hocr: '0',
          tessedit_create_tsv: '0',
          tessedit_create_txt: '0'
        };

        console.log('Configuring OCR model...');
        await worker.setParameters(config);
        
        console.log('Performing OCR...');
        const result = await worker.recognize(processedBase64);
        
        if (!result?.data) {
          throw new Error('OCR recognition failed');
        }

        console.log('OCR complete, confidence:', result.data.confidence);
        
        // Basic text cleaning for ingredients
        const cleanedText = result.data.text
          .replace(/\s+/g, ' ')  // Normalize spaces
          .replace(/[•*]/g, '•')  // Normalize bullets
          .replace(/\s*[•]\s*/g, ', ')  // Convert bullets to commas
          .replace(/,,+/g, ',')  // Remove multiple commas
          .replace(/,\s*,/g, ',')  // Clean up spaces around commas
          .trim();
        
        console.log('Cleaned text:', cleanedText);
        
        return {
          text: cleanedText,
          confidence: result.data.confidence
        };

      } catch (ocrError) {
        const error = ocrError instanceof Error ? ocrError : new Error('OCR processing failed');
        console.error('OCR processing failed:', {
          stage: error.message,
          details: ocrError
        });
        throw error;
      }

    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Unknown OCR error');
      console.error('OCR extraction failed:', {
        errorType: typedError.constructor.name,
        message: typedError.message,
        stack: typedError.stack
      });
      throw typedError;
    } finally {
      await this.cleanup();
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