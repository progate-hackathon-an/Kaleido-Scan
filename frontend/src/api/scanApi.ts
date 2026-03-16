import type { ScanResponse, ProductDetail, ApiError, ScanMode } from '../types/scan';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const SCAN_ENDPOINTS: Record<ScanMode, string> = {
  ranking: '/scan/ranking',
  'hidden-gems': '/scan/hidden-gems',
  trending: '/scan/trending',
};

export async function postScan(imageFile: File, mode: ScanMode): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${BASE_URL}${SCAN_ENDPOINTS[mode]}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
}

// backward compat — existing tests mock this function
export async function postScanRanking(imageFile: File): Promise<ScanResponse> {
  return postScan(imageFile, 'ranking');
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const response = await fetch(`${BASE_URL}/products/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
}
