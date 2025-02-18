import {
  Camera,
  Upload,
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { ocrService, type OcrResult } from '@/services/ocr';
import { toast } from 'sonner';
import { EditableIngredientList } from '@/components/ingredients/EditableIngredientList';
import { useIngredients } from '@/services/ingredientService';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  saveScannedLabel,
  savePendingLabel,
  recoverPendingSaves,
  clearPendingSave,
} from '@/utils/indexedDB';
import { nanoid } from 'nanoid';
import { ScannedLabel } from '@/types/scannedLabel';
import Loading from '@/components/Loading';
import type { Ingredient } from '@/types/ingredients';
import { OcrDebugView } from '@/components/ocr/OcrDebugView';

type Step = 'capture' | 'edit' | 'review';

const ocrLoadingMessages = [
  'Reading ingredients from image...',
  'Processing label text...',
  'Analyzing ingredients...',
  'Almost done...',
];

const ScanLabel = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('capture');
  const [showCamera, setShowCamera] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyzedIngredients, setAnalyzedIngredients] = useState<
    Array<{
      name: string;
      status: 'safe' | 'unsafe' | 'caution' | 'unknown';
    }>
  >([]);
  const dbIngredients = useIngredients();
  const [isSaving, setIsSaving] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const processImage = async (imageData: string | File) => {
    setIsProcessing(true);

    try {
      // Store image URL for debug view
      if (typeof imageData === 'string') {
        setImageUrl(imageData);
      } else {
        setImageUrl(URL.createObjectURL(imageData));
      }

      const result = await ocrService.extractText(imageData);
      setOcrResult(result);

      // Update extracted text from ingredients region if found
      if (result.ingredients) {
        setExtractedText(result.ingredients.text);
      } else {
        setExtractedText(result.rawText);
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setIsProcessing(true);
      await processImage(file);
      setCurrentStep('edit');
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    setShowCamera(false);
    setIsProcessing(true);
    await processImage(imageData);
    setCurrentStep('edit');
  };

  const analyzeIngredients = useCallback(
    (ingredientList: string[]) => {
      const analyzed = ingredientList.map((ingredient) => {
        const match = (dbIngredients as Ingredient[]).find(
          (dbIng) =>
            dbIng.name.toLowerCase() === ingredient.toLowerCase() ||
            dbIng.aliases?.some(
              (alias) => alias.toLowerCase() === ingredient.toLowerCase()
            )
        );

        return {
          name: ingredient,
          status: match?.status || 'unknown',
        };
      });

      setAnalyzedIngredients(analyzed);
    },
    [dbIngredients]
  );

  useEffect(() => {
    const checkPendingSaves = async () => {
      try {
        const pendingSaves = await recoverPendingSaves();
        if (pendingSaves.length > 0) {
          // Show recovery dialog
          const confirmed = window.confirm(
            'We found unsaved scans. Would you like to recover them?'
          );
          if (confirmed) {
            // Handle recovery
            for (const save of pendingSaves) {
              try {
                await saveScannedLabel(save);
                await clearPendingSave(save.id);
                toast.success('Recovered saved scan');
              } catch (error) {
                console.error('Failed to recover scan:', error);
              }
            }
          } else {
            // Clear pending saves if user doesn't want to recover
            for (const save of pendingSaves) {
              await clearPendingSave(save.id);
            }
          }
        }
      } catch (error) {
        console.error('Error checking pending saves:', error);
      }
    };

    checkPendingSaves();
  }, []);

  const handleSave = async () => {
    if (analyzedIngredients.length === 0) return;

    setIsSaving(true);
    const scannedLabel: ScannedLabel = {
      id: nanoid(),
      dateScanned: new Date().toISOString(),
      originalText: extractedText,
      ingredients: analyzedIngredients,
      imageData: imageFile ? await fileToBase64(imageFile) : undefined,
    };

    try {
      // Save to pending first
      await savePendingLabel(scannedLabel);

      // Attempt actual save
      await saveScannedLabel(scannedLabel);

      // Clear from pending after successful save
      await clearPendingSave(scannedLabel.id);

      toast.success('Label saved successfully');
      navigate('/');
    } catch (error) {
      console.error('Failed to save label:', error);
      toast.error("Failed to save label, but we'll try again later");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle navigation interrupts
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isProcessing || isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    [isProcessing, isSaving]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);

  const handleNext = () => {
    switch (currentStep) {
      case 'edit':
        if (analyzedIngredients.length === 0) {
          const ingredients = extractedText
            .split(',')
            .map((i) => i.trim())
            .filter(Boolean);
          if (ingredients.length === 0) {
            toast.error(
              'No ingredients detected. Please try again or add them manually.'
            );
            return;
          }
          analyzeIngredients(ingredients);
        }
        setCurrentStep('review');
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'edit':
        setCurrentStep('capture');
        setExtractedText('');
        setImageFile(null);
        break;
      case 'review':
        setCurrentStep('edit');
        break;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-6">
      {(['capture', 'edit', 'review'] as Step[]).map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === step
                ? 'bg-pastel-blue text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
          {index < 2 && (
            <div
              className={`w-12 h-1 ${
                index < ['capture', 'edit', 'review'].indexOf(currentStep)
                  ? 'bg-pastel-blue'
                  : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const getProductSafety = () => {
    if (analyzedIngredients.length === 0) return null;

    const hasUnsafe = analyzedIngredients.some((i) => i.status === 'unsafe');
    const hasCaution = analyzedIngredients.some((i) => i.status === 'caution');
    const hasUnknown = analyzedIngredients.some((i) => i.status === 'unknown');

    if (hasUnsafe) return 'unsafe';
    if (hasCaution || hasUnknown) return 'caution';
    return 'safe';
  };

  const renderStep = () => {
    const safety = getProductSafety();

    switch (currentStep) {
      case 'capture':
        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <h3 className="text-lg font-medium text-center">
              Capture Ingredients Label
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                className="w-full bg-pastel-blue/20 text-gray-800 hover:bg-pastel-blue/30 h-32"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="mr-2 h-8 w-8" />
                Take Photo
              </Button>
              <div className="relative h-32">
                <Button
                  className="w-full h-full"
                  variant="outline"
                  onClick={() =>
                    document.getElementById('file-upload')?.click()
                  }
                >
                  <Upload className="mr-2 h-8 w-8" />
                  Upload Image
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-center">
              Review & Edit Ingredients
            </h3>
            {imageUrl && ocrResult && (
              <OcrDebugView
                imageUrl={imageUrl}
                regions={ocrResult.regions}
                ingredients={ocrResult.ingredients}
              />
            )}
            <EditableIngredientList
              initialText={extractedText}
              onUpdate={analyzeIngredients}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium">Analysis Results</h3>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full 
                ${
                  safety === 'safe'
                    ? 'bg-green-100 text-green-800'
                    : safety === 'unsafe'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {safety === 'safe' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Safe to Consume
                  </>
                ) : safety === 'unsafe' ? (
                  <>
                    <XCircle className="h-5 w-5" /> Not Safe
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5" /> Use Caution
                  </>
                )}
              </div>
            </div>

            {imageFile && (
              <div className="relative w-full h-48 md:h-64 bg-white rounded-lg p-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Label"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <Card className="bg-white/50 backdrop-blur-sm">
              <ScrollArea className="h-[400px] rounded-md p-4">
                <div className="space-y-3">
                  {analyzedIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-white"
                    >
                      <span className="text-gray-800 font-medium">
                        {ingredient.name}
                      </span>
                      <Badge
                        variant={
                          ingredient.status === 'safe'
                            ? 'success'
                            : ingredient.status === 'unsafe'
                            ? 'destructive'
                            : ingredient.status === 'caution'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {ingredient.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-24"
              >
                Close
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-pastel-blue/20 text-gray-800 hover:bg-pastel-blue/30 w-24"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="min-h-screen bg-pastel-blue/20">
        <div className="fixed top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="container mx-auto px-4 py-12">
          {renderStepIndicator()}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            {isProcessing ? (
              <Loading messages={ocrLoadingMessages} />
            ) : (
              renderStep()
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ScanLabel;
