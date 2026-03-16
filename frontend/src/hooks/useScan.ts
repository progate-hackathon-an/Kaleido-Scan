import { useState } from 'react';
import type { ScanResponse, ScanMode } from '../types/scan';
import { postScan } from '../api/scanApi';

export function useScan() {
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (file: File, mode: ScanMode = 'ranking') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postScan(file, mode);
      console.log('[useScan] response:', response);
      setResult(response);
    } catch (e) {
      console.error('[useScan] error:', e);
      setError('スキャンに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { scan, result, isLoading, error, reset };
}
