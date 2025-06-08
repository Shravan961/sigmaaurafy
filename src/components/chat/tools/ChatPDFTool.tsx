
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Upload, MessageSquare, X } from 'lucide-react';
import { pdfService } from '@/services/pdfService';
import { memoryService } from '@/services/memoryService';
import { toast } from "sonner";

interface ChatPDFToolProps {
  onSendToChat: (message: string) => void;
}

export const ChatPDFTool: React.FC<ChatPDFToolProps> = ({ onSendToChat }) => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedDocId, setProcessedDocId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [conversationThreadId, setConversationThreadId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setTextInput('');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleTextProcess = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text to process');
      return;
    }

    setIsProcessing(true);
    try {
      const processedDoc = await pdfService.processText(textInput);
      setProcessedDocId(processedDoc.id);
      
      // Create conversation thread
      const threadId = memoryService.createThread('pdf_chat', `Text Document Chat`);
      setConversationThreadId(threadId);
      memoryService.activateThread(threadId);
      
      toast.success('Text processed successfully!');
      setShowConversation(true);
    } catch (error) {
      console.error('Text processing error:', error);
      toast.error('Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPDF = async () => {
    if (!file) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const processedDoc = await pdfService.processPDF(file);
      setProcessedDocId(processedDoc.id);
      
      // Create conversation thread
      const threadId = memoryService.createThread('pdf_chat', `PDF Chat: ${file.name}`);
      setConversationThreadId(threadId);
      memoryService.activateThread(threadId);
      
      onSendToChat(`📄 **PDF Processed Successfully**: ${file.name}\n\nDocument has been analyzed and chunked for intelligent Q&A. You can now ask questions about the content!`);
      toast.success('PDF processed successfully!');
      setShowConversation(true);
    } catch (error) {
      console.error('PDF processing error:', error);
      toast.error('Failed to process PDF. Please ensure it\'s a valid PDF file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !processedDocId) return;

    setIsAnswering(true);
    try {
      const answer = await pdfService.answerQuestion(processedDocId, question);
      
      const newConversation = { question: question.trim(), answer };
      setConversationHistory(prev => [...prev, newConversation]);
      
      // Save to memory and thread
      if (conversationThreadId) {
        memoryService.addToThread(conversationThreadId, {
          type: 'pdf_chat',
          title: `Q: ${question.trim()}`,
          content: `Q: ${question.trim()}\nA: ${answer}`,
          metadata: { 
            pdfName: file?.name || 'Text Document',
            documentId: processedDocId
          }
        });
      }
      
      setQuestion('');
    } catch (error) {
      console.error('Question answering error:', error);
      toast.error('Failed to answer question');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleCloseConversation = () => {
    setShowConversation(false);
    setConversationHistory([]);
    if (conversationThreadId) {
      memoryService.deactivateAllThreads();
    }
    setConversationThreadId(null);
    setProcessedDocId(null);
    setFile(null);
    setTextInput('');
    onSendToChat(`📄 **PDF Chat Session Ended**\n\nConversation history has been saved to memory. You can reference this chat later!`);
  };

  if (showConversation && processedDocId) {
    return (
      <div className="w-80 h-full flex flex-col bg-white border-l">
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-sm">PDF Chat</h3>
              <p className="text-xs text-gray-600">{file?.name || 'Text Document'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCloseConversation}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversationHistory.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ask questions about your document!</p>
            </div>
          ) : (
            conversationHistory.map((conv, index) => (
              <div key={index} className="space-y-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Q: {conv.question}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{conv.answer}</p>
                </div>
              </div>
            ))
          )}
          
          {isAnswering && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Analyzing document...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about the document..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAnswering}
              onKeyPress={(e) => e.key === 'Enter' && !isAnswering && handleAskQuestion()}
              className="text-sm"
            />
            <Button 
              onClick={handleAskQuestion} 
              disabled={!question.trim() || isAnswering}
              size="sm"
            >
              {isAnswering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This conversation is being saved to memory for future reference.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>Enhanced ChatPDF</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PDF Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload PDF Document</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label 
                htmlFor="pdf-upload" 
                className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload PDF'}
                </p>
              </label>
            </div>
            {file && (
              <Button 
                onClick={handleProcessPDF} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing PDF...
                  </>
                ) : (
                  'Process PDF'
                )}
              </Button>
            )}
          </div>

          {/* Text Input Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Or Paste Text Content</label>
            <Textarea
              placeholder="Paste large text blocks, articles, or documents here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isProcessing}
              rows={6}
              className="resize-none"
            />
            {textInput.trim() && (
              <Button 
                onClick={handleTextProcess} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing Text...
                  </>
                ) : (
                  'Process Text'
                )}
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Upload a PDF or paste text to start an intelligent conversation. The chat will open in the right panel with full memory integration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
