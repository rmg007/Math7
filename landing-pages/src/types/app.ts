export interface AppData {
  app_id: string;
  display_name: string;
  subdomain: string;
  grade_level: string;
  grade_number: number;
  subject_id: string;
  is_active: boolean;
  subjects?: {
    name: string;
    slug: string;
  } | null;
}

export interface SubjectData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  color_hex: string | null;
}
