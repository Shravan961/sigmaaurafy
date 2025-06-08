
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Bot, Plus, Trash2, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
}

interface MindMapVisualProps {
  topic: string;
  nodes: MindMapNode[];
  onExtend?: () => void;
  onCreateBot?: (node: MindMapNode) => void;
  interactive?: boolean;
  onUpdateNode?: (nodeId: string, newText: string) => void;
  onAddChild?: (parentId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const MindMapVisual: React.FC<MindMapVisualProps> = ({
  topic,
  nodes,
  onExtend,
  onCreateBot,
  interactive = false,
  onUpdateNode,
  onAddChild,
  onDeleteNode
}) => {
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleEditStart = (node: MindMapNode) => {
    setEditingNode(node.id);
    setEditText(node.text);
  };

  const handleEditSave = (nodeId: string) => {
    if (onUpdateNode) {
      onUpdateNode(nodeId, editText);
    }
    setEditingNode(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingNode(null);
    setEditText('');
  };

  const renderNode = (node: MindMapNode, parentX: number, parentY: number, angle: number, distance: number) => {
    const x = parentX + Math.cos(angle) * distance;
    const y = parentY + Math.sin(angle) * distance;

    return (
      <g key={node.id}>
        {/* Connection line */}
        <line
          x1={parentX}
          y1={parentY}
          x2={x}
          y2={y}
          stroke="#e2e8f0"
          strokeWidth="2"
          className="opacity-60"
        />
        
        {/* Node circle */}
        <circle
          cx={x}
          cy={y}
          r={node.level === 1 ? "40" : "25"}
          className={`${node.color.split(' ')[0]} fill-current stroke-white stroke-2 transition-all duration-200 hover:scale-110`}
        />
        
        {/* Node text */}
        {editingNode === node.id ? (
          <foreignObject x={x - 50} y={y - 10} width="100" height="20">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEditSave(node.id)}
              onBlur={() => handleEditSave(node.id)}
              className="text-xs text-center"
              autoFocus
            />
          </foreignObject>
        ) : (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`${node.color.split(' ')[1]} text-xs font-medium fill-current pointer-events-none`}
            style={{ fontSize: node.level === 1 ? '11px' : '9px' }}
          >
            {node.text.length > 12 ? `${node.text.substring(0, 12)}...` : node.text}
          </text>
        )}

        {/* Interactive controls */}
        {interactive && (
          <g className="opacity-0 hover:opacity-100 transition-opacity">
            <circle cx={x + 30} cy={y - 30} r="12" className="fill-blue-500 stroke-white stroke-1" />
            <Edit3 
              x={x + 26} 
              y={y - 34} 
              width="8" 
              height="8" 
              className="fill-white cursor-pointer" 
              onClick={() => handleEditStart(node)}
            />
            
            <circle cx={x + 30} cy={y} r="12" className="fill-green-500 stroke-white stroke-1" />
            <Plus 
              x={x + 26} 
              y={y - 4} 
              width="8" 
              height="8" 
              className="fill-white cursor-pointer" 
              onClick={() => onAddChild && onAddChild(node.id)}
            />
            
            <circle cx={x + 30} cy={y + 30} r="12" className="fill-red-500 stroke-white stroke-1" />
            <Trash2 
              x={x + 26} 
              y={y + 26} 
              width="8" 
              height="8" 
              className="fill-white cursor-pointer" 
              onClick={() => onDeleteNode && onDeleteNode(node.id)}
            />
          </g>
        )}

        {/* Render children */}
        {node.children.map((child, index) => {
          const childAngle = angle + (index - (node.children.length - 1) / 2) * 0.8;
          return renderNode(child, x, y, childAngle, 100);
        })}
      </g>
    );
  };

  const centerX = 400;
  const centerY = 300;

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg backdrop-blur-sm">
          {topic}
        </h3>
        <div className="flex gap-2">
          {onExtend && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExtend}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          )}
        </div>
      </div>

      {/* SVG Mind Map */}
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Central topic */}
        <circle
          cx={centerX}
          cy={centerY}
          r="60"
          className="fill-indigo-500 stroke-white stroke-4"
        />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-sm font-bold"
        >
          {topic.length > 15 ? `${topic.substring(0, 15)}...` : topic}
        </text>

        {/* Main nodes */}
        {nodes.map((node, index) => {
          const angle = (index / nodes.length) * 2 * Math.PI;
          return renderNode(node, centerX, centerY, angle, 150);
        })}
      </svg>

      {/* Bot creation buttons */}
      {onCreateBot && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {nodes.slice(0, 3).map((node) => (
              <Button
                key={node.id}
                variant="outline"
                size="sm"
                onClick={() => onCreateBot(node)}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
              >
                <Bot className="h-3 w-3 mr-1" />
                Create {node.text} Bot
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {interactive && (
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300">
          <p><strong>Interactive Mode:</strong> Hover over nodes to see edit controls</p>
          <p>Blue: Edit • Green: Add Child • Red: Delete</p>
        </div>
      )}
    </div>
  );
};
