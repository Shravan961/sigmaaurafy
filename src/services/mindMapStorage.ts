
import { generateId } from '@/utils/helpers';

export interface SavedMindMap {
  id: string;
  topic: string;
  nodes: any[];
  createdAt: string;
  lastModified: string;
}

class MindMapStorage {
  private storageKey = 'savedMindMaps';

  private getMindMaps(): SavedMindMap[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading mind maps:', error);
      return [];
    }
  }

  private saveMindMaps(mindMaps: SavedMindMap[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(mindMaps));
    } catch (error) {
      console.error('Error saving mind maps:', error);
    }
  }

  saveMindMap(topic: string, nodes: any[]): SavedMindMap {
    const mindMaps = this.getMindMaps();
    const now = new Date().toISOString();
    
    const newMindMap: SavedMindMap = {
      id: generateId(),
      topic,
      nodes,
      createdAt: now,
      lastModified: now
    };

    mindMaps.unshift(newMindMap); // Add to beginning
    this.saveMindMaps(mindMaps);
    
    return newMindMap;
  }

  getAllMindMaps(): SavedMindMap[] {
    return this.getMindMaps();
  }

  getMindMapById(id: string): SavedMindMap | null {
    const mindMaps = this.getMindMaps();
    return mindMaps.find(map => map.id === id) || null;
  }

  updateMindMap(id: string, updates: Partial<SavedMindMap>): void {
    const mindMaps = this.getMindMaps();
    const index = mindMaps.findIndex(map => map.id === id);
    
    if (index !== -1) {
      mindMaps[index] = {
        ...mindMaps[index],
        ...updates,
        lastModified: new Date().toISOString()
      };
      this.saveMindMaps(mindMaps);
    }
  }

  deleteMindMap(id: string): void {
    const mindMaps = this.getMindMaps();
    const filtered = mindMaps.filter(map => map.id !== id);
    this.saveMindMaps(filtered);
  }
}

export const mindMapStorage = new MindMapStorage();
