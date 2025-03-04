import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonImg } from '@ionic/react';
import { Camera, CameraResultType } from '@capacitor/camera';
import './ProcessImage.css';

import { vl } from 'moondream';

const model = new vl({
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiJhODcwODVjZi01YTZkLTQ4MzMtODJhNy1mZmM5NzI0ODE2MWMiLCJpYXQiOjE3NDEwNDk3NTV9.TjUCBkFQfMhrVAi0IuT6ktRzfFuOBixyy3Ms7QaYmag"
});

const ProcessImage: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl
      });
      
      setCapturedImage(image.dataUrl || null);
      setProcessedImage(null); // Reset processed image when new photo is taken
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    try {
      // Here you would add your image processing logic
      // For example, sending to an API endpoint:
      /*
      const response = await fetch('your-api-endpoint', {
        method: 'POST',
        body: JSON.stringify({ image: capturedImage }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
     
      */
      const answer = await model.query({ image: capturedImage, question: "What are all the individual ingredients listed in this image?" })
      console.log("\nAnswer:", answer)
      
      // Placeholder: Currently just copying the original image
      setProcessedImage(capturedImage);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="image-container">
          {capturedImage && (
            <div className="image-preview">
              <h3>Original Image</h3>
              <IonImg src={capturedImage} alt="Captured" />
            </div>
          )}
          
          {processedImage && (
            <div className="image-preview">
              <h3>Processed Image</h3>
              <IonImg src={processedImage} alt="Processed" />
            </div>
          )}
        </div>

        <div className="button-container">
          <IonButton expand="block" onClick={takePicture}>
            Take Picture
          </IonButton>
          
          <IonButton 
            expand="block" 
            onClick={processImage}
            disabled={!capturedImage || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process Image'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProcessImage;