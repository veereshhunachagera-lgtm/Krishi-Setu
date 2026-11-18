import type {
  AgriServiceProvider,
  BookingRequestStatus,
  DirectoryResponse,
  EquipmentBookingRequest,
  EquipmentCatalogResponse,
  EquipmentListing,
  SoilLabsResponse,
} from '../types/agriServices';
import { apiRequest } from './apiClient';

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim()) qs.set(k, v.trim());
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const agriServicesService = {
  getSoilLabs(params: { state?: string; district?: string; q?: string } = {}) {
    return apiRequest<SoilLabsResponse>(`/api/v1/agri-services/soil-labs${buildQuery(params)}`);
  },

  getDirectory(params: { serviceType?: string; state?: string; district?: string; q?: string } = {}) {
    return apiRequest<DirectoryResponse>(`/api/v1/agri-services/directory${buildQuery(params)}`);
  },

  getEquipment(params: { category?: string; state?: string; district?: string; q?: string } = {}) {
    return apiRequest<EquipmentCatalogResponse>(`/api/v1/agri-services/equipment${buildQuery(params)}`);
  },

  getMyBookings() {
    return apiRequest<EquipmentBookingRequest[]>('/api/v1/agri-services/equipment/bookings');
  },

  createBookingRequest(payload: {
    equipmentId: string;
    requestedDate: string;
    durationValue: number;
    durationUnit: 'HOURS' | 'ACRES' | 'DAYS';
    contactPhone: string;
    notes?: string;
  }) {
    return apiRequest<EquipmentBookingRequest>('/api/v1/agri-services/equipment/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelMyBooking(id: string) {
    return apiRequest<EquipmentBookingRequest>(`/api/v1/agri-services/equipment/bookings/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  // Admin Service Directory & Booking Request endpoints
  listProvidersAdmin() {
    return apiRequest<AgriServiceProvider[]>('/api/v1/admin/services/providers');
  },

  createProviderAdmin(payload: Record<string, unknown>) {
    return apiRequest<AgriServiceProvider>('/api/v1/admin/services/providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteProviderAdmin(id: string) {
    return apiRequest<void>(`/api/v1/admin/services/providers/${id}`, {
      method: 'DELETE',
    });
  },

  listEquipmentAdmin() {
    return apiRequest<EquipmentListing[]>('/api/v1/admin/services/equipment');
  },

  createEquipmentAdmin(payload: Record<string, unknown>) {
    return apiRequest<EquipmentListing>('/api/v1/admin/services/equipment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteEquipmentAdmin(id: string) {
    return apiRequest<void>(`/api/v1/admin/services/equipment/${id}`, {
      method: 'DELETE',
    });
  },

  listBookingsAdmin() {
    return apiRequest<EquipmentBookingRequest[]>('/api/v1/admin/services/bookings');
  },

  updateBookingStatusAdmin(id: string, payload: { status: BookingRequestStatus; adminNote?: string }) {
    return apiRequest<EquipmentBookingRequest>(`/api/v1/admin/services/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
