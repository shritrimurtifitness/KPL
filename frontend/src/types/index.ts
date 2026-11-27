export type CricketRole = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';

export type RegistrationStatus =
  | 'RESERVED'
  | 'PAYMENT_SUBMITTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface LeagueSettings {
  id: number;
  league_name: string;
  tournament_title: string;
  registration_fee: number;
  maximum_registrations: number;
  registration_open: boolean;
  registration_deadline: string | null;
  reservation_minutes: number;
  upi_id: string;
  upi_display_name: string;
  upi_qr_path: string | null;
  whatsapp_number: string;
  registration_prefix: string;
  registration_year: number;
  terms_and_conditions: string;
  registration_instructions: string;
  max_upload_size_mb: number;
  updated_at?: string;
}

export interface AvailabilityData {
  maximum_capacity: number;
  confirmed_count: number;
  payment_submitted_count: number;
  reserved_count: number;
  rejected_count: number;
  expired_count: number;
  occupied_count: number;
  available_slots: number;
  registration_open: boolean;
  registration_fee: number;
  registration_deadline: string | null;
  league_name: string;
  tournament_title: string;
}

export interface RegistrationSubmissionData {
  full_name: string;
  mobile: string;
  email?: string;
  age: number;
  city: string;
  cricket_role: string;
  batting_style?: string;
  bowling_style?: string;
  team_name?: string;
  emergency_contact?: string;
  photo_path?: string;
  terms_accepted: boolean;
}

export interface RegistrationResponse {
  id: string;
  registration_id: string;
  full_name: string;
  mobile: string;
  email?: string;
  age: number;
  city: string;
  cricket_role: string;
  batting_style?: string;
  bowling_style?: string;
  team_name?: string;
  photo_path?: string;
  photo_url?: string;
  status: RegistrationStatus;
  amount: number;
  reservation_expires_at: string;
  created_at: string;
}

export interface PublicRegistrationStatus {
  registration_id: string;
  full_name: string;
  city: string;
  cricket_role: string;
  photo_url?: string;
  status: RegistrationStatus;
  amount: number;
  created_at: string;
  reservation_expires_at?: string;
  payment_submitted: boolean;
  utr?: string;
  status_message: string;
  whatsapp_url?: string;
  upi_intent_url?: string;
}

export interface PendingPaymentItem {
  payment_id: string;
  registration_id: string;
  player_name: string;
  mobile: string;
  amount: number;
  utr: string;
  status: string;
  submitted_at: string;
  screenshot_url: string;
  player_photo_url?: string;
}

export interface DashboardStats {
  maximum_capacity: number;
  active_reservations: number;
  confirmed_registrations: number;
  pending_verifications: number;
  available_slots: number;
  rejected_registrations: number;
  expired_registrations: number;
  total_verified_collection: number;
  registration_open: boolean;
}

export interface AdminUser {
  admin_id: string;
  email: string;
  full_name: string;
  role: string;
}
