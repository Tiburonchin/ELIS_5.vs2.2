import { useState, useEffect, useCallback } from 'react';
import { evidenceService, type EvidenciaRow } from '../services/EvidenceService';

export type EstadoFiltro = 'todas' | 'pendiente' | 'vinculada';

export interface UseEvidencesResult {
  evidences: EvidenciaRow[];
  total: number;
  loading: boolean;
  error: Error | null;
  filtroEstado: EstadoFiltro;
  setFiltroEstado: (estado: EstadoFiltro) => void;
  refresh: () => Promise<void>;
  addEvidence: (evidence: EvidenciaRow) => void;
}

export function useEvidences(initialFiltro: EstadoFiltro = 'todas'): UseEvidencesResult {
  const [evidences, setEvidences] = useState<EvidenciaRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>(initialFiltro);

  const fetchEvidences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (filtroEstado === 'todas') {
        const { data, total: count } = await evidenceService.getAllPaginated(1, 100);
        setEvidences(data);
        setTotal(count);
      } else {
        const data = await evidenceService.getByEstado(filtroEstado);
        setEvidences(data);
        setTotal(data.length);
      }
    } catch (err: unknown) {
      console.error('[useEvidences] Error cargando evidencias:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    fetchEvidences();
  }, [fetchEvidences]);

  const addEvidence = useCallback((newEvidence: EvidenciaRow) => {
    setEvidences((prev) => {
      // Evitar duplicados en el estado local
      const filtered = prev.filter((item) => item.id !== newEvidence.id);
      return [newEvidence, ...filtered];
    });
    setTotal((prev) => prev + 1);
  }, []);

  return {
    evidences,
    total,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    refresh: fetchEvidences,
    addEvidence,
  };
}

export default useEvidences;
