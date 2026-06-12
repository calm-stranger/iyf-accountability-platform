export type Role = "student" | "admin";
export type OccupationType = "student" | "working" | "other";
export type ChallengeStatus = "draft" | "active" | "completed" | "archived";
export type ParticipantStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone?: string;
  address?: string;
  occupation?: OccupationType;
  academic_institution?: string;
  academic_year?: string;
  academic_course?: string;
  date_of_birth?: string;
  chanting_rounds?: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  details?: string;
  criteria?: string;
  audience: string;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  form_fields: FormField[];
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "mcq" | "yesno" | "textarea";
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  status: ParticipantStatus;
  admin_message?: string;
  joined_at: string;
  profiles?: Profile;
  challenges?: Challenge;
}

export interface DailyReport {
  id: string;
  challenge_id: string;
  user_id: string;
  answers: Record<string, string | number>;
  submitted_at: string;
  report_date: string;
  profiles?: Profile;
  challenges?: Challenge;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  challenge_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface WordOfDay {
  id: string;
  content: string;
  verse_reference?: string;
  posted_by: string;
  active_date: string;
  created_at: string;
}
