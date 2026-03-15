export type ProfileRole = 'admin' | 'user';
export type CarType = 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved';

export interface Profile {
  id: string;
  role: ProfileRole;
  is_verified: boolean;
  is_premium: boolean;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  created_at: string;
}

export interface Car {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  car_type: CarType;
  location_city: string;
  location_detail: string | null;
  daily_rate_zwl: number;
  image_urls: string[];
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface CarAvailability {
  id: string;
  car_id: string;
  available_date: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_amount_zwl: number;
  created_at: string;
  updated_at: string;
  car?: Car;
  renter?: Profile;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export const CAR_TYPES: CarType[] = ['sedan', 'suv', 'hatchback', 'pickup', 'van', 'other'];
