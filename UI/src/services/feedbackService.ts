
import { toast } from "@/components/ui/use-toast";

interface FeedbackData {
  ingredientId: string;
  ingredientName: string;
  feedback: string;
}

export async function submitFeedback(data: FeedbackData): Promise<void> {
  try {
    // In a real app, this would be an API call
    // For now, we'll simulate an API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log the feedback (temporary solution)
    console.log("Feedback submitted:", data);
    
    toast({
      title: "Feedback submitted",
      description: "Thank you for your feedback! We'll review it shortly.",
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to submit feedback. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}
