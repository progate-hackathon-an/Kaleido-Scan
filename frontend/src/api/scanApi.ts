import type { ScanResponse, ProductDetail, ScanMode } from '../types/scan';

// ローカル: Vite プロキシ経由（空文字）、本番: VITE_API_URL 環境変数を使用
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const SCAN_ENDPOINTS: Record<ScanMode, string> = {
  ranking: '/scan/ranking',
  'hidden-gems': '/scan/hidden-gems',
  trending: '/scan/trending',
};

async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || '(empty body)'}`);
  }
}

export async function postScan(imageFile: File, mode: ScanMode): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  console.log(`[scanApi] POST ${BASE_URL}${SCAN_ENDPOINTS[mode]} (mode: ${mode})`);

  const response = await fetch(`${BASE_URL}${SCAN_ENDPOINTS[mode]}`, {
    method: 'POST',
    body: formData,
  });

  await throwIfNotOk(response);
  return response.json();
}

// backward compat — existing tests mock this function
export async function postScanRanking(imageFile: File): Promise<ScanResponse> {
  return postScan(imageFile, 'ranking');
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const response = await fetch(`${BASE_URL}/products/${id}`);
  await throwIfNotOk(response);
  return response.json();
}
