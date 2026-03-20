export type ScanMode = 'ranking' | 'hidden-gems' | 'trending';

export type BoundingBox = {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
};

export type DetectedItem = {
  product_id: string;
  name: string;
  description: string;
  category: string;
  rank: number;
  aura_level: number;
  bounding_box: BoundingBox;
};

export type ScanResponse = {
  detected_items: DetectedItem[];
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type ProductDetail = {
  product_id: string;
  name: string;
  description: string;
  category: string;
  rank: number;
  aura_level: number;
};
