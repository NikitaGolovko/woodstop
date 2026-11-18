export type Env = {
  ASSETS: Fetcher;
  INBOX_DB?: D1Database;
  APP_ORIGIN?: string;
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_USER_IDS?: string;
  LOCAL_DEVELOPMENT?: string;
};

export type Content = { latitude: number; longitude: number; name: string; description: string; price: number | null;
  currency: string | null; priceUnit: string | null; paymentMethods: string | null; hours: string | null; accessNotes: string | null };
export type PhotoInput = { id: string; contentType: string; base64: string };
export type SubmissionRow = { id: string; user_id: string; content_json: string; content_hash: string; status: string;
  rejection_reason: string | null; approved_slug: string | null; revision: number; created_at: string; updated_at: string; source_id: string | null };
