import cv from '@techstark/opencv-js';

export let isOpenCVReady = false;

export function waitForOpenCV(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOpenCVReady) {
      resolve();
      return;
    }
    
    const checkInterval = setInterval(() => {
      if (isOpenCVReady) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Add timeout
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('OpenCV initialization timed out'));
    }, timeout);
  });
}

// Initialize OpenCV
cv['onRuntimeInitialized'] = () => {
  try {
    if (cv.Mat && cv.imread && cv.imshow) {
      console.log('OpenCV core functions verified');
      isOpenCVReady = true;
    } else {
      console.error('OpenCV initialization incomplete');
    }
  } catch (e) {
    console.error('OpenCV initialization failed:', e);
  }
};

window.onOpenCvReady = () => {
  isOpenCVReady = true;
}; 