
import React from 'react';
import { AISearchTool } from './tools/AISearchTool';
import { AISolverTool } from './tools/AISolverTool';
import { AIDetectorTool } from './tools/AIDetectorTool';
import { WebSummaryTool } from './tools/WebSummaryTool';
import { YouTubeSummaryTool } from './tools/YouTubeSummaryTool';
import { ChatPDFTool } from './tools/ChatPDFTool';
import { MindMapTool } from './tools/MindMapTool';
import { WebChatTool } from './tools/WebChatTool';
import { FlashcardsTool } from './tools/FlashcardsTool';
import { VoiceTool } from './tools/VoiceTool';
import { LiveVoiceTool } from './tools/LiveVoiceTool';
import { PicThisTool } from './tools/PicThisTool';
import { MemoTool } from './tools/MemoTool';
import { CraftArtifactsTool } from './tools/CraftArtifactsTool';
import { CloneTool } from './tools/CloneTool';
import { BotsTool } from './tools/BotsTool';
import { MakeItMoreTool } from './tools/MakeItMoreTool';
import { HumanizeTool } from './tools/HumanizeTool';
import { RoastMasterTool } from './tools/RoastMasterTool';
import { EasyShoppingTool } from './tools/EasyShoppingTool';

interface ToolInterfaceProps {
  activeTool: string | null;
  onSendToChat: (message: string) => void;
}

export const ToolInterface: React.FC<ToolInterfaceProps> = ({ activeTool, onSendToChat }) => {
  const renderTool = () => {
    switch (activeTool) {
      case 'ai-search':
        return <AISearchTool onSendToChat={onSendToChat} />;
      case 'ai-solver':
        return <AISolverTool onSendToChat={onSendToChat} />;
      case 'ai-detector':
        return <AIDetectorTool onSendToChat={onSendToChat} />;
      case 'web-summary':
        return <WebSummaryTool onSendToChat={onSendToChat} />;
      case 'youtube-summary':
        return <YouTubeSummaryTool onSendToChat={onSendToChat} />;
      case 'chat-pdf':
        return <ChatPDFTool onSendToChat={onSendToChat} />;
      case 'mind-map':
        return <MindMapTool onSendToChat={onSendToChat} />;
      case 'web-chat':
        return <WebChatTool onSendToChat={onSendToChat} />;
      case 'flashcards':
        return <FlashcardsTool onSendToChat={onSendToChat} />;
      case 'voice':
        return <VoiceTool onSendToChat={onSendToChat} />;
      case 'live-voice':
        return <LiveVoiceTool onSendToChat={onSendToChat} />;
      case 'pic-this':
        return <PicThisTool onSendToChat={onSendToChat} />;
      case 'memo':
        return <MemoTool onSendToChat={onSendToChat} />;
      case 'craft-artifacts':
        return <CraftArtifactsTool onSendToChat={onSendToChat} />;
      case 'clone':
        return <CloneTool onSendToChat={onSendToChat} />;
      case 'bots':
        return <BotsTool onSendToChat={onSendToChat} />;
      case 'make-it-more':
        return <MakeItMoreTool onSendToChat={onSendToChat} />;
      case 'humanize':
        return <HumanizeTool onSendToChat={onSendToChat} />;
      case 'roast-master':
        return <RoastMasterTool onSendToChat={onSendToChat} />;
      case 'easy-shopping':
        return <EasyShoppingTool onSendToChat={onSendToChat} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-hidden">
      {renderTool()}
    </div>
  );
};
