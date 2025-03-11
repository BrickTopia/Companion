interface TextDetector {
  detect(image: ImageBitmapSource): Promise<DetectedText[]>;
}

interface DetectedText {
  rawValue: string;
  boundingBox: DOMRectReadOnly;
}

interface Window {
  TextDetector: {
    new (): TextDetector;
  };
} 