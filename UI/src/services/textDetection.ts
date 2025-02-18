import { createWorker } from 'tesseract.js';

declare const TextDetector: {
  new(): TextDetector;
};

export const detectText = async (imageBlob: Blob): Promise<string> => {
  // Try Shape Detection API first
  if ('TextDetector' in window) {
    try {
      const textDetector = new TextDetector();
      const imageElement = await createImageBitmap(imageBlob);
      const textDetections = await textDetector.detect(imageElement);
      return textDetections.map(text => text.rawValue).join('\n');
    } catch (e) {
      console.log('Shape Detection API failed, falling back to Tesseract');
    }
  }
  
  // Fall back to Tesseract
  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(imageBlob);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}; 