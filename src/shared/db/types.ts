export type DogSize = 'small' | 'medium' | 'large';
export type DogStatus = 'available' | 'pending' | 'adopted';

export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  size: DogSize | null;
  photos: string[];
  description: string | null;
  source_provider: string;
  source_listing_id: string;
  status: DogStatus;
  shelter_name: string | null;
  shelter_contact: Record<string, unknown> | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdopterProfile {
  id: string;
  user_id: string;
  housing_type: string | null;
  has_yard: boolean | null;
  yard_fenced: boolean | null;
  work_schedule: string | null;
  household_members: Record<string, unknown> | null;
  pet_experience: string | null;
  references: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ShortlistEntry {
  id: string;
  user_id: string;
  dog_id: string;
  created_at: string;
}

export type ApplicationStatus = 'submitted' | 'no_response' | 'update_received';

export interface Application {
  id: string;
  user_id: string;
  dog_id: string;
  shelter_name: string | null;
  submitted_data: Record<string, unknown> | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}
