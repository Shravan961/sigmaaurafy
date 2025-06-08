
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Edit2, Search, Star, StarOff } from 'lucide-react';
import { generateId, formatTime } from '@/utils/helpers';

interface Memo {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  pinned?: boolean;
  tags?: string[];
}

interface MemoToolProps {
  onSendToChat: (message: string) => void;
}

export const MemoTool: React.FC<MemoToolProps> = ({ onSendToChat }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('aurafy_memos');
    if (stored) {
      setMemos(JSON.parse(stored));
    }
  }, []);

  const saveMemo = () => {
    if (!title.trim() || !content.trim()) return;

    const memo: Memo = {
      id: editingId || generateId(),
      title: title.trim(),
      content: content.trim(),
      timestamp: Date.now(),
    };

    let updatedMemos;
    if (editingId) {
      updatedMemos = memos.map(m => m.id === editingId ? { ...m, ...memo } : m);
    } else {
      updatedMemos = [memo, ...memos];
    }

    setMemos(updatedMemos);
    localStorage.setItem('aurafy_memos', JSON.stringify(updatedMemos));
    
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const deleteMemo = (id: string) => {
    const updatedMemos = memos.filter(m => m.id !== id);
    setMemos(updatedMemos);
    localStorage.setItem('aurafy_memos', JSON.stringify(updatedMemos));
  };

  const editMemo = (memo: Memo) => {
    setTitle(memo.title);
    setContent(memo.content);
    setEditingId(memo.id);
  };

  const togglePin = (id: string) => {
    const updatedMemos = memos.map(m => 
      m.id === id ? { ...m, pinned: !m.pinned } : m
    );
    setMemos(updatedMemos);
    localStorage.setItem('aurafy_memos', JSON.stringify(updatedMemos));
  };

  const filteredMemos = memos.filter(memo => 
    memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memo.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Sort by pinned first, then by timestamp
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.timestamp - a.timestamp;
  });

  const sendMemoToChat = (memo: Memo) => {
    onSendToChat(`Memo: ${memo.title}\n\n${memo.content}`);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Memo title..."
          className="mb-2"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your memo here..."
          rows={3}
        />
      </div>

      <Button 
        onClick={saveMemo} 
        disabled={!title.trim() || !content.trim()}
        className="w-full"
      >
        {editingId ? 'Update Memo' : 'Save Memo'}
      </Button>

      {editingId && (
        <Button 
          onClick={() => {
            setTitle('');
            setContent('');
            setEditingId(null);
          }}
          variant="outline"
          className="w-full"
        >
          Cancel Edit
        </Button>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">Your Memos ({memos.length})</h4>
        </div>
        
        {memos.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memos..."
              className="pl-10"
            />
          </div>
        )}

        {filteredMemos.length === 0 && memos.length > 0 && searchQuery && (
          <p className="text-gray-500 text-sm text-center py-4">No memos found for "{searchQuery}"</p>
        )}

        {filteredMemos.length === 0 && memos.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No memos yet</p>
        )}

        {filteredMemos.map(memo => (
          <Card key={memo.id} className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                onClick={() => sendMemoToChat(memo)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h5 className="font-medium text-sm">{memo.title}</h5>
                  {memo.pinned && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                  {memo.content.substring(0, 100)}{memo.content.length > 100 ? '...' : ''}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {formatTime(memo.timestamp)}
                </p>
              </div>
              <div className="flex flex-col space-y-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePin(memo.id)}
                  className="p-1 h-6 w-6"
                >
                  {memo.pinned ? 
                    <StarOff className="h-3 w-3" /> : 
                    <Star className="h-3 w-3" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editMemo(memo)}
                  className="p-1 h-6 w-6"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMemo(memo.id)}
                  className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
