import axiosInstance from '@/api/axiosInstance';
import type { Itinerary, GenerateItineraryPayload } from '@/types';

export const itineraryService = {
  getAll: async (): Promise<Itinerary[]> => {
    const { data } = await axiosInstance.get('/itineraries');
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Itinerary> => {
    const { data } = await axiosInstance.get(`/itineraries/${id}`);
    return data.data ?? data;
  },

  getByShareToken: async (token: string): Promise<Itinerary> => {
    const { data } = await axiosInstance.get(`/share/${token}`);
    return data.data ?? data;
  },

  generate: async (payload: GenerateItineraryPayload): Promise<Itinerary> => {
    const { data } = await axiosInstance.post('/itineraries/generate', payload);
    const itinerary = data.data ?? data;

    if (!itinerary?._id) {
      console.error('[itineraryService] generate: _id missing in response. Full data:', data);
      throw new Error('Server response did not include a valid itinerary ID.');
    }

    return itinerary;
  },

  generateFromFile: async (formData: FormData): Promise<Itinerary> => {
    const { data } = await axiosInstance.post('/itineraries/generate-from-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Debug: log the raw response envelope so we can trace any shape mismatch
    console.log('[itineraryService] generateFromFile raw response.data:', data);

    const itinerary = data?.data ?? data;

    if (!itinerary?._id) {
      console.error('[itineraryService] generateFromFile: _id missing in response. Full data:', data);
      throw new Error('Server response did not include a valid itinerary ID.');
    }

    return itinerary;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/itineraries/${id}`);
  },

  togglePublic: async (id: string): Promise<Itinerary> => {
    const { data } = await axiosInstance.patch(`/itineraries/${id}/toggle-public`);
    return data.data ?? data;
  },
};
