
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface AIDetectorToolProps {
  onSendToChat: (message: string) => void;
}

export const AIDetectorTool: React.FC<AIDetectorToolProps> = ({ onSendToChat }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    confidence: string;
    factors: string[];
  } | null>(null);

  const analyzeText = (text: string) => {
    // Simple AI detection algorithm based on various factors
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let aiScore = 0;
    const factors: string[] = [];
    
    // 1. Check for repetitive patterns
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    });
    
    const repetitiveWords = Object.values(wordFreq).filter(freq => freq > 3).length;
    if (repetitiveWords > words.length * 0.1) {
      aiScore += 15;
      factors.push('High word repetition');
    }
    
    // 2. Check sentence length consistency
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    if (variance < 10) {
      aiScore += 20;
      factors.push('Uniform sentence structure');
    }
    
    // 3. Check for common AI phrases
    const aiPhrases = [
      'it\'s important to note', 'however', 'furthermore', 'in conclusion',
      'additionally', 'moreover', 'on the other hand', 'nevertheless'
    ];
    
    const foundPhrases = aiPhrases.filter(phrase => text.toLowerCase().includes(phrase));
    if (foundPhrases.length > 2) {
      aiScore += 25;
      factors.push('Common AI transition phrases');
    }
    
    // 4. Check for perfect grammar (low error rate)
    const grammarErrors = text.match(/\b(their|there|they're)\b/gi)?.length || 0;
    if (grammarErrors === 0 && words.length > 50) {
      aiScore += 10;
      factors.push('Suspiciously perfect grammar');
    }
    
    // 5. Check for lack of personal pronouns
    const personalPronouns = text.match(/\b(i|me|my|mine|myself)\b/gi)?.length || 0;
    if (personalPronouns === 0 && words.length > 30) {
      aiScore += 15;
      factors.push('Lack of personal pronouns');
    }
    
    // 6. Check for overly formal language
    const formalWords = ['utilize', 'facilitate', 'implement', 'comprehensive', 'substantial'];
    const formalCount = formalWords.filter(word => text.toLowerCase().includes(word)).length;
    if (formalCount > 2) {
      aiScore += 15;
      factors.push('Overly formal vocabulary');
    }
    
    // Ensure score doesn't exceed 100
    aiScore = Math.min(aiScore, 100);
    
    let confidence = 'Low';
    if (aiScore > 70) confidence = 'Very High';
    else if (aiScore > 50) confidence = 'High';
    else if (aiScore > 30) confidence = 'Medium';
    
    return { score: aiScore, confidence, factors };
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis time
    setTimeout(() => {
      const analysis = analyzeText(text);
      setResult(analysis);
      
      const factorsList = analysis.factors.length > 0 
        ? '\n\n**Detected factors:**\n• ' + analysis.factors.join('\n• ')
        : '\n\n**Detected factors:** None significant';
      
      onSendToChat(
        `🤖 **AI Detection Analysis:**\n\n` +
        `**AI Probability:** ${analysis.score}%\n` +
        `**Confidence:** ${analysis.confidence}\n` +
        `**Assessment:** ${analysis.score > 50 ? 'Likely AI-generated' : 'Likely human-written'}` +
        factorsList
      );
      
      setIsAnalyzing(false);
      toast.success('Analysis complete');
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-red-600';
    if (score > 50) return 'text-orange-600';
    if (score > 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-500" />
            <span>AI Detector</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste text here to analyze for AI-generated content..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isAnalyzing}
            rows={6}
          />
          
          <Button 
            onClick={handleAnalyze} 
            disabled={!text.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Analyze Text
              </>
            )}
          </Button>
          
          {result && (
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">AI Probability:</span>
                  <span className={`font-bold text-lg ${getScoreColor(result.score)}`}>
                    {result.score}%
                  </span>
                </div>
                <Progress value={result.score} className="h-2" />
                <div className="text-sm">
                  <p><strong>Confidence:</strong> {result.confidence}</p>
                  <p><strong>Assessment:</strong> {result.score > 50 ? 'Likely AI-generated' : 'Likely human-written'}</p>
                </div>
                {result.factors.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Detected factors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.factors.map((factor, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Analyze text for AI-generated content patterns
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
