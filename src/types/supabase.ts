export interface Database {
  public: {
    Tables: {
      tourists: {
        Row: TouristRow;
        Insert: TouristInsert;
        Update: TouristUpdate;
      };
      eco_dive_ids: {
        Row: EcoDiveIDRow;
        Insert: EcoDiveIDInsert;
        Update: EcoDiveIDUpdate;
      };
      operator_applications: {
        Row: OperatorApplicationRow;
        Insert: OperatorApplicationInsert;
        Update: OperatorApplicationUpdate;
      };
      dive_pass_inventory: {
        Row: DivePassInventoryRow;
        Insert: DivePassInventoryInsert;
        Update: DivePassInventoryUpdate;
      };
      payment_transactions: {
        Row: PaymentTransactionRow;
        Insert: PaymentTransactionInsert;
        Update: PaymentTransactionUpdate;
      };
      dive_manifests: {
        Row: DiveManifestRow;
        Insert: DiveManifestInsert;
        Update: DiveManifestUpdate;
      };
      manifest_divers: {
        Row: ManifestDiverRow;
        Insert: ManifestDiverInsert;
        Update: ManifestDiverUpdate;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      dive_plan_requests: {
        Row: DivePlanRequestRow;
        Insert: DivePlanRequestInsert;
        Update: DivePlanRequestUpdate;
      };
      dive_plan_inputs: {
        Row: DivePlanInputRow;
        Insert: DivePlanInputInsert;
        Update: DivePlanInputUpdate;
      };
      announcements: {
        Row: AnnouncementRow;
        Insert: AnnouncementInsert;
        Update: AnnouncementUpdate;
      };
      dive_sites: {
        Row: DiveSiteRow;
        Insert: DiveSiteInsert;
        Update: DiveSiteUpdate;
      };
      tourist_favorites: {
        Row: TouristFavoriteRow;
        Insert: TouristFavoriteInsert;
        Update: TouristFavoriteUpdate;
      };
      establishments: {
        Row: EstablishmentRow;
        Insert: EstablishmentInsert;
        Update: EstablishmentUpdate;
      };
      pass_pricing: {
        Row: PassPricingRow;
        Insert: PassPricingInsert;
        Update: PassPricingUpdate;
      };
      payment_config: {
        Row: PaymentConfigRow;
        Insert: PaymentConfigInsert;
        Update: PaymentConfigUpdate;
      };
    };
    Views: {
      dive_profile_completion: {
        Row: DiveProfileCompletionView;
      };
      operator_pass_ledger: {
        Row: OperatorPassLedgerView;
      };
    };
  };
}

export interface TouristRow {
  id: string;
  email: string;
  full_name: string;
  contact_number: string | null;
  nationality: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  dive_pass_type: string | null;
  type_of_dive: string | null;
  certification_level: string | null;
  date_accredited: string | null;
  renewal_date: string | null;
  cert_upload_path: string | null;
  logbook_upload_path: string | null;
  business_permit_url: string | null;
  pcss_url: string | null;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

export type TouristInsert = Partial<TouristRow> & Pick<TouristRow, "id" | "email" | "full_name">;
export type TouristUpdate = Partial<TouristInsert>;

export interface NotificationRow {
  id: string;
  tourist_id: string;
  type: "eco_dive_activated" | "dive_plan_ready" | "operator_application_approved" | "operator_application_rejected" | "pass_purchase_verified";
  title: string;
  body: string;
  deep_link: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationInsert = Partial<NotificationRow> & Pick<NotificationRow, "tourist_id" | "type" | "title" | "body">;
export type NotificationUpdate = Partial<NotificationInsert>;

export interface EcoDiveIDRow {
  id: string;
  tourist_id: string;
  eco_id_number: string;
  status: "incomplete" | "complete" | "active" | "expired";
  activated_at: string | null;
  activated_by_manifest_id: string | null;
  created_at: string;
  updated_at?: string;
}

export type EcoDiveIDInsert = Partial<EcoDiveIDRow> & Pick<EcoDiveIDRow, "tourist_id" | "eco_id_number">;
export type EcoDiveIDUpdate = Partial<EcoDiveIDInsert>;

export interface OperatorApplicationRow {
  id: string;
  tourist_id: string;
  resort_name: string;
  resort_location: string;
  role: string;
  contact_number: string;
  facebook_url: string | null;
  website_url: string | null;
  business_permit_url: string | null;
  pcss_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export type OperatorApplicationInsert = Partial<OperatorApplicationRow> & Pick<OperatorApplicationRow, "tourist_id" | "resort_name" | "resort_location" | "role" | "contact_number">;
export type OperatorApplicationUpdate = Partial<OperatorApplicationInsert>;

export interface DivePassInventoryRow {
  id: string;
  operator_id: string;
  pass_type: "single" | "multi";
  pass_label: string;
  total_passes: number;
  remaining_passes: number;
  amount: number;
  created_at: string;
}

export type DivePassInventoryInsert = Partial<DivePassInventoryRow> & Pick<DivePassInventoryRow, "operator_id" | "pass_type" | "pass_label" | "total_passes" | "remaining_passes" | "amount">;
export type DivePassInventoryUpdate = Partial<DivePassInventoryInsert>;

export interface PaymentTransactionRow {
  id: string;
  operator_id: string;
  dive_pass_inventory_id: string;
  amount: number;
  reference_number: string;
  receipt_url: string | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
}

export type PaymentTransactionInsert = Partial<PaymentTransactionRow> & Pick<PaymentTransactionRow, "operator_id" | "dive_pass_inventory_id" | "amount" | "reference_number">;
export type PaymentTransactionUpdate = Partial<PaymentTransactionInsert>;

export interface DiveManifestRow {
  id: string;
  operator_id: string;
  dive_type: string;
  dive_mode: string;
  location: string;
  difficulty: string;
  boat_name: string;
  captain_name: string | null;
  max_divers: number;
  duty_of_care: boolean;
  status: "active" | "done";
  dive_date: string;
  created_at: string;
}

export type DiveManifestInsert = Partial<DiveManifestRow> & Pick<DiveManifestRow, "operator_id" | "dive_type" | "dive_mode" | "location" | "difficulty" | "boat_name">;
export type DiveManifestUpdate = Partial<DiveManifestInsert>;

export interface ManifestDiverRow {
  id: string;
  manifest_id: string;
  name: string;
  eco_id: string | null;
  tourist_id: string | null;
  is_walk_in: boolean;
  created_at: string;
}

export type ManifestDiverInsert = Partial<ManifestDiverRow> & Pick<ManifestDiverRow, "manifest_id" | "name">;
export type ManifestDiverUpdate = Partial<ManifestDiverInsert>;

export interface DivePlanRequestRow {
  id: string;
  tourist_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  divers: number;
  dive_type: string;
  budget: string | null;
  length_of_stay: string | null;
  created_at: string;
}

export type DivePlanRequestInsert = Partial<DivePlanRequestRow> & Pick<DivePlanRequestRow, "tourist_id" | "destination" | "start_date" | "end_date" | "divers" | "dive_type">;
export type DivePlanRequestUpdate = Partial<DivePlanRequestInsert>;

export interface DivePlanInputRow {
  id: string;
  tourist_id: string;
  budget: string | null;
  group_size: number | null;
  preferred_activities: string | null;
  length_of_stay: string | null;
  created_at: string;
}

export type DivePlanInputInsert = Pick<DivePlanInputRow, "tourist_id"> & Partial<Omit<DivePlanInputRow, "id" | "created_at">>;
export type DivePlanInputUpdate = Partial<DivePlanInputInsert>;

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  active: boolean;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export type AnnouncementInsert = Partial<AnnouncementRow> & Pick<AnnouncementRow, "title">;
export type AnnouncementUpdate = Partial<AnnouncementInsert>;

export interface DiveSiteRow {
  id: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  rating: string | null;
  image_url: string | null;
  created_at: string;
}

export type DiveSiteInsert = Partial<DiveSiteRow> & Pick<DiveSiteRow, "name">;
export type DiveSiteUpdate = Partial<DiveSiteInsert>;

export interface TouristFavoriteRow {
  id: string;
  tourist_id: string;
  dive_site_id: string;
  created_at: string;
}

export type TouristFavoriteInsert = Partial<TouristFavoriteRow> & Pick<TouristFavoriteRow, "tourist_id" | "dive_site_id">;
export type TouristFavoriteUpdate = Partial<TouristFavoriteInsert>;

export interface EstablishmentRow {
  id: string;
  name: string;
  location: string | null;
  accreditation: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  description: string | null;
  image_url: string | null;
  accredited: boolean;
  created_at: string;
}

export type EstablishmentInsert = Partial<EstablishmentRow> & Pick<EstablishmentRow, "name">;
export type EstablishmentUpdate = Partial<EstablishmentInsert>;

export interface DiveProfileCompletionView {
  tourist_id: string;
  completion_pct: number;
}

export interface OperatorPassLedgerView {
  operator_id: string;
  purchased_passes: number;
  consumed_passes: number;
  remaining_passes: number;
}

export interface PassPricingRow {
  id: string;
  label: string;
  passes: number;
  price: number;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export type PassPricingInsert = Partial<PassPricingRow> & Pick<PassPricingRow, "label" | "passes" | "price">;
export type PassPricingUpdate = Partial<PassPricingInsert>;

export interface PaymentConfigRow {
  id: string;
  account_name: string;
  account_number: string;
  qr_code_url: string | null;
  updated_at: string;
}

export type PaymentConfigInsert = Partial<PaymentConfigRow> & Pick<PaymentConfigRow, "account_name" | "account_number">;
export type PaymentConfigUpdate = Partial<PaymentConfigInsert>;
