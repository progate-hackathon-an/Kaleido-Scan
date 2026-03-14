import { useState } from 'react';
import type { ScanResponse } from '../types/scan';
import { postScanRanking } from '../api/scanApi';

export function useScan() {
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postScanRanking(file);
      setResult(response);
    } catch {
      setError('スキャンに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return { scan, result, isLoading, error };
}
