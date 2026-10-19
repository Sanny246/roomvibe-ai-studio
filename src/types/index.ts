/**
 * RoomVibe Core Types
 */

export type FurnitureCategory = 'all' | 'seating' | 'tables' | 'storage' | 'beds' | 'lighting' | 'decor';

export interface RoomDimensions {
  width: number;  // in meters (e.g. 4.8)
  length: number; // in meters (e.g. 3.8)
  height: number; // in meters (e.g. 2.8)
}

export interface Room {
  id: string;
  name: string;
  dimensions: RoomDimensions;
  wallColor: string;
  floorColor: string;
  floorTextureType: 'wood_light' | 'wood_natural' | 'tile_cream';
  hasWindow: boolean;
  windowWall: 'back' | 'right' | 'left';
  isAIEstimated: boolean;
  confidence: 'high' | 'medium' | 'estimated';
  detectedFeatures: string[];
  spatialAnalysis?: string;
}

export interface Furniture {
  id: string;
  name: string;
  category: FurnitureCategory;
  dimensions: {
    width: number;  // X (meters)
    depth: number;  // Z (meters)
    height: number; // Y (meters)
  };
  description: string;
  modelType: string;
  defaultColor: string;
  material: 'linen' | 'wood' | 'metal' | 'glass' | 'rattan' | 'ceramic' | 'fabric';
  tags: string[];
  thumbnailColor: string;
}

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  name: string;
  category: FurnitureCategory;
  modelType: string;
  position: [number, number, number]; // [x, y, z]
  rotation: number; // in radians around Y
  scale: [number, number, number]; // [sx, sy, sz]
  customColor?: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
}

export interface UploadedPhoto {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'ready' | 'error';
}

export interface AIRoomAnalysisResult {
  roomType: string;
  confidence: 'high' | 'medium' | 'estimated';
  isAIEstimated: boolean;
  dimensions: RoomDimensions;
  colorPalette: {
    wall: string;
    floor: string;
    accent: string;
  };
  detectedFeatures: string[];
  structuralElements: {
    hasWindow: boolean;
    windowWall: 'back' | 'right' | 'left';
    flooringType: 'wood_light' | 'tile_cream' | 'wood_warm';
  };
  spatialAnalysis: string;
  suggestedFurnitures: Array<{
    name: string;
    category: FurnitureCategory;
    reason: string;
  }>;
}

export interface DesignProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  room: Room;
  placedFurnitures: PlacedFurniture[];
  notes?: string;
}
