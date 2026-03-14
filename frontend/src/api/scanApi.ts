import type { ScanResponse, ProductDetail, ApiError } from '../types/scan';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function postScanRanking(imageFile: File): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${BASE_URL}/scan/ranking`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const response = await fetch(`${BASE_URL}/products/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
}
