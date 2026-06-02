import { useState, useEffect } from 'react';
import { itineraryService } from '@/services/itineraryService';
import type { Itinerary } from '@/types';

export function useItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await itineraryService.getAll();
      setItineraries(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load itineraries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const remove = async (id: string) => {
    await itineraryService.delete(id);
    setItineraries((prev) => prev.filter((i) => i._id !== id));
  };

  return { itineraries, isLoading, error, refetch: fetchAll, remove };
}
