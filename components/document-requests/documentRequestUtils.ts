export interface TemplateDocument {
  id: string;
  name: string;
  required: boolean;
  rename: boolean;
  allowMultiple: boolean;
}

export interface RequestTemplate {
  id: string;
  subject: string;
  destination: string;
  toEmail: string;
  message: string;
  createdOn: string;
  expires: string;
  documents: TemplateDocument[];
}

export interface TemplatePayload {
  template_name: string;
  destination: string;
  to_email: string;
  message: string;
  expires: string;
  items: {
    document_title_requested: string;
    required: boolean;
    rename: boolean;
    allow_multiple: boolean;
  }[];
}

export interface RequestPayload {
  subject: string;
  recipient_email: string;
  message: string;
  items: {
    document_title_requested: string;
    is_required: boolean;
  }[];
}

export const newDocument = (): TemplateDocument => ({
  id: crypto.randomUUID(),
  name: "",
  required: true,
  rename: false,
  allowMultiple: false,
});

export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

export const text = (value: unknown) =>
  value == null ? "" : String(value);

export function normalizeTemplate(value: unknown): RequestTemplate {
  const t = record(value);
  const rows = t["documents"] || t["items"];

  return {
    id: text(t["id"]),
    subject: text(t["subject"] || t["template_name"]),
    destination: text(t["destination"]),
    toEmail: text(t["toEmail"] || t["to_email"]),
    message: text(t["message"]),
    createdOn: text(t["createdOn"] || t["created_on"]),
    expires: text(t["expires"] || "No expiry"),

    documents: Array.isArray(rows)
      ? rows.map((value, index) => {
          const d = record(value);

          return {
            id: text(d["id"] || `document-${index}`),

            name: text(
              d["name"] ||
                d["document_name"] ||
                d["document_title_requested"],
            ),

            required: Boolean(
              d["required"] ?? d["is_required"] ?? true,
            ),

            rename: Boolean(d["rename"] ?? false),

            allowMultiple: Boolean(
              d["allowMultiple"] ??
                d["allow_multiple"] ??
                false,
            ),
          };
        })
      : [],
  };
}

export function prettyDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}