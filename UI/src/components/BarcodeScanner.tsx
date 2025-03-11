import React, { useEffect, useRef } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onDetected, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment',
            width: 640,
            height: 480,
          },
        },
        decoder: {
          readers: ['ean_reader', 'code_128_reader'],
          multiple: false,
        },
        locate: true,
        frequency: 10,
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((data) => {
      onDetected(data.codeResult.code);
      Quagga.stop();
    });

    return () => {
      Quagga.stop();
    };
  }, [onDetected]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={scannerRef} style={{ width: '100%', height: '100%' }} />
      <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10 }}>
        Close
      </button>
    </div>
  );
};

export default BarcodeScanner; 