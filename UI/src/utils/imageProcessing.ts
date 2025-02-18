import cv from '@techstark/opencv-js';
import type { Mat, Size, Point, Scalar } from '@techstark/opencv-js';
import { isOpenCVReady, waitForOpenCV } from './opencv';


/**
 * Utility functions for image processing to improve OCR accuracy
 */

declare global {
  interface Window {
    onOpenCvReady: () => void;
  }
}

export async function loadImage(src: string | File | Blob, timeout = 5000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const timeoutId = setTimeout(() => {
      reject(new Error('Image loading timed out'));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
    
    if (typeof src === 'string') {
      img.src = src;
    } else {
      img.src = URL.createObjectURL(src);
    }
  });
}

/**
 * Applies a series of image processing steps to improve OCR results
 */
export async function preprocessImage(imageData: string | File | Blob): Promise<ImageData> {
  try {
    if (!isOpenCVReady) {
      await waitForOpenCV();
    }

    const sourceImage = await loadImage(imageData);
    const mat = cv.imread(sourceImage);
    const processed = new cv.Mat();

    try {
      // Basic cleanup
      cv.cvtColor(mat, processed, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(processed, processed, new cv.Size(3, 3), 0);
      cv.adaptiveThreshold(
        processed,
        processed,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );

      // Convert back to canvas
      const processedCanvas = document.createElement('canvas');
      processedCanvas.width = processed.cols;
      processedCanvas.height = processed.rows;
      cv.imshow(processedCanvas, processed);

      // Get final ImageData
      const processedCtx = processedCanvas.getContext('2d');
      if (!processedCtx) {
        throw new Error('Failed to get processed canvas context');
      }
      return processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    } finally {
      mat.delete();
      processed.delete();
    }
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    throw error;
  }
}

// Helper function to deskew image
async function deskewImage(src: cv.Mat): Promise<cv.Mat> {
  // Find all non-zero points
  const points = new cv.Mat();
  cv.findNonZero(src, points);
  
  // Get rotated rectangle
  const box = cv.minAreaRect(points);
  let angle = box.angle;
  
  // Adjust angle
  if (angle < -45) {
    angle = -(90 + angle);
  } else {
    angle = -angle;
  }
  
  // Get rotation matrix
  const center = new cv.Point(src.cols / 2, src.rows / 2);
  const rotMat = cv.getRotationMatrix2D(center, angle, 1.0);
  
  // Perform rotation
  const result = new cv.Mat();
  const size = new cv.Size(src.cols, src.rows);
  cv.warpAffine(src, result, rotMat, size, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255));
  
  // Cleanup
  points.delete();
  rotMat.delete();
  
  return result;
}

async function findIngredientsRegion(src: cv.Mat): Promise<{ x: number, y: number, width: number, height: number } | null> {
  try {
    // Create binary image for text detection
    const binary = new cv.Mat();
    cv.threshold(src, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Find potential ingredients regions by analyzing text patterns
    let bestRegion = null;
    let maxCommaScore = 0;

    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      
      // Filter based on basic size criteria
      if (rect.width > src.cols * 0.3 && // Wide enough
          rect.height > src.rows * 0.1 && // Tall enough
          rect.height < src.rows * 0.8) { // Not too tall
        
        // Get ROI and analyze text pattern
        const roi = src.roi(rect);
        
        // Create a larger kernel for detecting comma-like patterns
        const commaKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        const processed = new cv.Mat();
        
        // Apply morphological operations to highlight potential commas
        cv.morphologyEx(roi, processed, cv.MORPH_CLOSE, commaKernel);
        
        // Count potential comma-like patterns
        const commaCount = countCommaPatterns(processed);
        
        // Calculate comma density score
        const area = rect.width * rect.height;
        const commaScore = (commaCount / area) * rect.width;
        
        if (commaScore > maxCommaScore) {
          maxCommaScore = commaScore;
          bestRegion = {
            x: Math.max(0, rect.x - 5),
            y: Math.max(0, rect.y - 5),
            width: Math.min(src.cols - rect.x + 10, rect.width + 10),
            height: Math.min(src.rows - rect.y, rect.height * 1.5)
          };
        }
        
        processed.delete();
        roi.delete();
      }
    }

    // Cleanup
    binary.delete();
    contours.delete();
    hierarchy.delete();

    return bestRegion;
  } catch (error) {
    console.error('Error finding ingredients region:', error);
    return null;
  }
}

// Helper function to count comma-like patterns in an image
function countCommaPatterns(img: cv.Mat): number {
  try {
    // Create temporary matrices
    const temp = new cv.Mat();
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    
    // Apply threshold to isolate potential comma shapes
    cv.threshold(img, temp, 127, 255, cv.THRESH_BINARY);
    
    // Find small connected components that could be commas
    const labels = new cv.Mat();
    const stats = new cv.Mat();
    const centroids = new cv.Mat();
    
    const numLabels = cv.connectedComponentsWithStats(temp, labels, stats, centroids);
    
    // Count components that match comma characteristics
    let commaCount = 0;
    for (let i = 1; i < numLabels; i++) { // Skip background (label 0)
      const width = stats.intAt(i, cv.CC_STAT_WIDTH);
      const height = stats.intAt(i, cv.CC_STAT_HEIGHT);
      const area = stats.intAt(i, cv.CC_STAT_AREA);
      
      // Check if component has comma-like properties
      if (width < height * 1.5 && // Not too wide
          height < width * 3 &&    // Not too tall
          area < 50) {            // Not too big
        commaCount++;
      }
    }
    
    // Cleanup
    temp.delete();
    kernel.delete();
    labels.delete();
    stats.delete();
    centroids.delete();
    
    return commaCount;
  } catch (error) {
    console.error('Error counting comma patterns:', error);
    return 0;
  }
}

export async function basicPreprocess(imageData: string | File | Blob): Promise<ImageData> {
  try {
    if (!isOpenCVReady) {
      await waitForOpenCV();
    }

    const sourceImage = await loadImage(imageData);
    
    // Create initial canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw image with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, 0, 0);

    // Get image data for OpenCV
    const imageDataForCV = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const mat = cv.matFromImageData(imageDataForCV);
    const processed = new cv.Mat();

    try {
      // Basic cleanup
      cv.cvtColor(mat, processed, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(processed, processed, new cv.Size(3, 3), 0);
      cv.adaptiveThreshold(
        processed,
        processed,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );

      // Convert back to canvas
      const processedCanvas = document.createElement('canvas');
      processedCanvas.width = processed.cols;
      processedCanvas.height = processed.rows;
      cv.imshow(processedCanvas, processed);

      // Get final ImageData
      const processedCtx = processedCanvas.getContext('2d');
      if (!processedCtx) {
        throw new Error('Failed to get processed canvas context');
      }
      return processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    } finally {
      // Cleanup OpenCV objects
      mat.delete();
      processed.delete();
    }
  } catch (error) {
    console.error('Basic preprocessing failed:', error);
    throw error;
  }
} 