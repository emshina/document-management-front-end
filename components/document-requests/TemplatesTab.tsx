"use client";

import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Folder,
  LayoutTemplate,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import { apiCall } from "../../lib/api";
import { useTenant } from "@/hooks/useTenant";

import DOCUMENT_REQUEST_STYLES from "./documentRequestStyles";

import {
  newDocument,
  normalizeTemplate,
  prettyDate,
  record,
  type RequestPayload,
  type RequestTemplate,
  type TemplateDocument,
  type TemplatePayload,
} from "./documentRequestUtils";

interface Props {
  initialTemplates?: RequestTemplate[];
  loadTemplates?: () => Promise<unknown>;
  saveTemplate?: (payload: TemplatePayload) => Promise<unknown>;
  sendRequest?: (payload: RequestPayload) => Promise<unknown>;
  primaryColor?: string;
}

function Action({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "icon";
}) {
  return (
    <button
      {...props}
      className={`dr-button dr-button--${variant} ${className}`}
    />
  );
}

function TemplatesAndRequestsModule({
  initialTemplates = [],
  loadTemplates,
  saveTemplate,
  sendRequest,
  primaryColor,
}: Props) {
  const [view, setView] = useState<
    "create" | "list" | "detail" | "request"
  >("create");

  const [templates, setTemplates] =
    useState<RequestTemplate[]>(initialTemplates);

  const [selected, setSelected] =
    useState<RequestTemplate | null>(null);

  const [subject, setSubject] = useState("");
  const [toEmail, setToEmail] = useState("");

  const [destination, setDestination] = useState(
    "CDL Holding Group / General Vault",
  );

  const [message, setMessage] = useState("");

  const [timeframeEnabled, setTimeframeEnabled] =
    useState(false);

  const [days, setDays] = useState("3");

  const [documents, setDocuments] = useState<TemplateDocument[]>([
    {
      id: "cv",
      name: "Curriculum Vitae",
      required: true,
      rename: true,
      allowMultiple: false,
    },
    {
      id: "shif",
      name: "SHIF",
      required: true,
      rename: true,
      allowMultiple: false,
    },
    {
      id: "nssf",
      name: "NSSF",
      required: true,
      rename: true,
      allowMultiple: false,
    },
    {
      id: "id",
      name: "National ID",
      required: true,
      rename: true,
      allowMultiple: false,
    },
  ]);

  const [requestSubject, setRequestSubject] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [requestDocuments, setRequestDocuments] =
    useState<TemplateDocument[]>([]);

  const [query, setQuery] = useState("");

  const [busy, setBusy] = useState(false);

  const [loading, setLoading] =
    useState(Boolean(loadTemplates));

  const [notice, setNotice] = useState<{
    error: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loadTemplates) return;

    let active = true;

    loadTemplates()
      .then((data) => {
        const rows = Array.isArray(data)
          ? data
          : record(data)["results"];

        if (active) {
          setTemplates(
            Array.isArray(rows)
              ? rows.map(normalizeTemplate)
              : [],
          );
        }
      })
      .catch((error) => {
        if (active) {
          setNotice({
            error: true,
            text:
              error instanceof Error
                ? error.message
                : "Unable to load templates. Please try again.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadTemplates]);

  const reset = () => {
    setSubject("");
    setToEmail("");
    setMessage("");
    setTimeframeEnabled(false);
    setDays("3");
    setDestination(
      "CDL Holding Group / General Vault",
    );

    setDocuments([newDocument()]);
    setNotice(null);
    setSelected(null);
    setView("create");
  };

  const update = (
    id: string,
    change: Partial<TemplateDocument>,
  ) => {
    setDocuments((rows) =>
      rows.map((row) =>
        row.id === id
          ? { ...row, ...change }
          : row,
      ),
    );
  };

  const move = (
    index: number,
    direction: number,
  ) => {
    setDocuments((rows) => {
      const next = index + direction;

      if (
        next < 0 ||
        next >= rows.length
      ) {
        return rows;
      }

      const result = [...rows];

      const current = result[index];
      const target = result[next];

      if (!current || !target) {
        return rows;
      }

      result[index] = target;
      result[next] = current;

      return result;
    });
  };

  const useTemplate = (
    template: RequestTemplate,
  ) => {
    setSelected(template);

    setRequestSubject(template.subject);
    setRequestEmail(template.toEmail);
    setRequestMessage(template.message);

    setRequestDocuments(
      template.documents.map((doc) => ({
        ...doc,
      })),
    );

    setNotice(null);
    setView("request");
  };

  const save = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!documents.length) {
      setNotice({
        error: true,
        text:
          "Add at least one document to your template.",
      });

      return;
    }

    const payload: TemplatePayload = {
      template_name: subject.trim(),
      destination,
      to_email: toEmail.trim(),
      message,

      expires: timeframeEnabled
        ? `${days} days`
        : "No expiry",

      items: documents.map((doc) => ({
        document_title_requested:
          doc.name.trim(),

        required: doc.required,
        rename: doc.rename,
        allow_multiple: doc.allowMultiple,
      })),
    };

    setBusy(true);
    setNotice(null);

    try {
      const result = saveTemplate
        ? await saveTemplate(payload)
        : {
            id: crypto.randomUUID(),
            ...payload,
            created_on:
              new Date().toISOString(),
          };

      const saved =
        normalizeTemplate(result);

      const fallback =
        normalizeTemplate({
          ...payload,
          id: saved.id,
          created_on: saved.createdOn,
        });

      const merged = {
        ...fallback,
        ...saved,

        subject:
          saved.subject ||
          fallback.subject,

        destination:
          saved.destination ||
          fallback.destination,

        toEmail:
          saved.toEmail ||
          fallback.toEmail,

        message:
          saved.message ||
          fallback.message,

        documents:
          saved.documents.length
            ? saved.documents
            : fallback.documents,
      };

      setTemplates((rows) => [
        merged,
        ...rows,
      ]);

      setView("list");

      setNotice({
        error: false,
        text: saveTemplate
          ? "Template saved successfully."
          : "Template saved for this preview.",
      });
    } catch (error) {
      setNotice({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : "Template could not be saved. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const send = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!sendRequest) {
      setNotice({
        error: true,
        text:
          "Sending is not connected in this preview. Use the supplied page with your existing API.",
      });

      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      await sendRequest({
        subject:
          requestSubject.trim(),

        recipient_email:
          requestEmail.trim(),

        message: requestMessage,

        items: requestDocuments.map(
          (doc) => ({
            document_title_requested:
              doc.name,

            is_required:
              doc.required,
          }),
        ),
      });

      setView("list");

      setNotice({
        error: false,
        text:
          "Document request sent successfully.",
      });
    } catch (error) {
      setNotice({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : "Request could not be sent. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const activeRows =
    view === "request"
      ? requestDocuments
      : view === "detail"
        ? selected?.documents || []
        : documents;

  const titles = {
    create: "Create request template",
    list: "Request templates",
    detail:
      selected?.subject ||
      "Template details",
    request: "New document request",
  };

  const filtered = templates.filter(
    (template) =>
      `${template.subject} ${template.toEmail}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div
      className="dr-app"
      style={
        primaryColor
          ? ({
              "--dr-primary":
                primaryColor,
            } as CSSProperties)
          : undefined
      }
    >
      <style>
        {DOCUMENT_REQUEST_STYLES}
      </style>

      <div className="dr-shell">

        {/* BREADCRUMB */}

        <nav
          className="dr-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Folder size={15} />

          <span>
            Document requests
          </span>

          <span>/</span>

          <Action
            variant="ghost"
            onClick={() => {
              setView("list");
              setNotice(null);
            }}
          >
            Templates
          </Action>

          {view !== "list" && (
            <>
              <span>/</span>

              <span className="dr-current">
                {view === "create"
                  ? "Create template"
                  : view === "request"
                    ? "New request"
                    : "Template details"}
              </span>
            </>
          )}
        </nav>

        {/* HEADER */}

        <div className="dr-heading">
          <div>
            <div className="dr-eyebrow">
              <LayoutTemplate size={14} />
              DOCUMENT REQUESTS
            </div>

            <h1>
              {titles[view]}
            </h1>

            <p>
              {view === "create"
                ? "The right documents. One simple request."
                : view === "list"
                  ? "Your document requests, ready when you are."
                  : view === "request"
                    ? "A personal message. A complete set of documents."
                    : selected?.destination}
            </p>
          </div>

          {view === "list" ? (
            <Action
              variant="primary"
              onClick={reset}
            >
              <Plus size={17} />
              New template
            </Action>
          ) : (
            <Action
              variant="secondary"
              onClick={() => {
                setView("list");
                setNotice(null);
              }}
            >
              <ArrowLeft size={16} />
              Back to templates
            </Action>
          )}
        </div>

        {/* NOTICE */}

        {notice && (
          <div
            role={
              notice.error
                ? "alert"
                : "status"
            }
            className={`dr-notice ${
              notice.error
                ? "dr-notice--error"
                : ""
            }`}
          >
            <span>
              {notice.error ? (
                <ShieldCheck
                  size={18}
                />
              ) : (
                <CheckCheck
                  size={18}
                />
              )}

              {notice.text}
            </span>

            <Action
              variant="icon"
              aria-label="Dismiss notification"
              onClick={() =>
                setNotice(null)
              }
            >
              <X size={16} />
            </Action>
          </div>
        )}

        {/* TEMPLATE LIST */}

        {view === "list" ? (
          <section className="dr-list">

            <div className="dr-list-toolbar">
              <h2>
                All templates{" "}
                <span className="dr-count">
                  {templates.length}
                </span>
              </h2>

              <label className="dr-search">
                <Search size={17} />

                <input
                  aria-label="Search templates"
                  placeholder="Search templates…"
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            {loading ? (
              <div className="dr-empty">
                <Loader2 className="dr-spin" />
                Loading templates…
              </div>
            ) : filtered.length ? (
              <div className="dr-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Template subject
                      </th>

                      <th>
                        Recipient
                      </th>

                      <th>
                        Created on
                      </th>

                      <th>
                        Expires
                      </th>

                      <th>
                        <span className="dr-sr-only">
                          Open template
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map(
                      (template) => (
                        <tr
                          key={
                            template.id
                          }
                        >
                          <td>
                            <Action
                              variant="ghost"
                              className="dr-template-link"
                              onClick={() => {
                                setSelected(
                                  template,
                                );

                                setView(
                                  "detail",
                                );

                                setNotice(
                                  null,
                                );
                              }}
                            >
                              <span className="dr-file-icon">
                                <LayoutTemplate
                                  size={19}
                                />
                              </span>

                              {
                                template.subject
                              }
                            </Action>
                          </td>

                          <td>
                            {template.toEmail ||
                              "Not specified"}
                          </td>

                          <td>
                            {prettyDate(
                              template.createdOn,
                            )}
                          </td>

                          <td>
                            <span className="dr-expiry">
                              <Clock3
                                size={14}
                              />

                              {
                                template.expires
                              }
                            </span>
                          </td>

                          <td>
                            <Action
                              variant="icon"
                              aria-label={`Open ${template.subject}`}
                              onClick={() => {
                                setSelected(
                                  template,
                                );

                                setView(
                                  "detail",
                                );
                              }}
                            >
                              <ArrowRight
                                size={17}
                              />
                            </Action>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dr-empty">
                <LayoutTemplate
                  size={35}
                />

                <h3>
                  {query
                    ? "No matching templates"
                    : "No templates yet"}
                </h3>

                {!query && (
                  <Action
                    variant="primary"
                    onClick={reset}
                  >
                    <Plus size={16} />
                    Create template
                  </Action>
                )}
              </div>
            )}
          </section>
        ) : (
          <form
            onSubmit={
              view === "create"
                ? save
                : send
            }
            className="dr-editor"
          >
            <div className="dr-main">

              {/* TEMPLATE DETAILS */}

              <section className="dr-section">

                <div className="dr-section-heading">
                  <span className="dr-section-number">
                    01
                  </span>

                  <h2>
                    {view === "request"
                      ? "Request details"
                      : "Template details"}
                  </h2>
                </div>

                {view === "detail" &&
                selected ? (
                  <div className="dr-detail-fields">

                    <div>
                      <span>
                        Recipient
                      </span>

                      <p>
                        {selected.toEmail ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <span>
                        Destination
                      </span>

                      <p>
                        {selected.destination ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <span>
                        Message
                      </span>

                      <p className="dr-message">
                        {selected.message ||
                          "No default message"}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="dr-fields">

                    <label className="dr-field dr-span-two">
                      <span>
                        {view === "request"
                          ? "Request subject"
                          : "Template subject"}{" "}
                        <b>*</b>
                      </span>

                      <input
                        required
                        placeholder="e.g. Employee onboarding documents"
                        value={
                          view ===
                          "request"
                            ? requestSubject
                            : subject
                        }
                        onChange={(event) =>
                          view ===
                          "request"
                            ? setRequestSubject(
                                event.target.value,
                              )
                            : setSubject(
                                event.target.value,
                              )
                        }
                      />
                    </label>

                    <label className="dr-field">
                      <span>
                        {view === "request"
                          ? "Recipient email"
                          : "Default recipient"}{" "}
                        {view ===
                          "request" && (
                          <b>*</b>
                        )}
                      </span>

                      <div className="dr-input-icon">
                        <Mail
                          size={17}
                        />

                        <input
                          type="email"
                          required={
                            view ===
                            "request"
                          }
                          placeholder="recipient@company.com"
                          value={
                            view ===
                            "request"
                              ? requestEmail
                              : toEmail
                          }
                          onChange={(event) =>
                            view ===
                            "request"
                              ? setRequestEmail(
                                  event.target.value,
                                )
                              : setToEmail(
                                  event.target.value,
                                )
                          }
                        />
                      </div>
                    </label>

                    <label className="dr-field">
                      <span>
                        Destination
                      </span>

                      <div className="dr-input-icon">
                        <Folder
                          size={17}
                        />

                        <input
                          aria-label="Destination"
                          readOnly={
                            view ===
                            "request"
                          }
                          value={
                            view ===
                            "request"
                              ? selected?.destination ||
                                ""
                              : destination
                          }
                          onChange={(event) =>
                            setDestination(
                              event.target
                                .value,
                            )
                          }
                        />
                      </div>
                    </label>

                    <label className="dr-field dr-span-two">
                      <span>
                        {view === "request"
                          ? "Message"
                          : "Default message"}
                      </span>

                      <textarea
                        rows={3}
                        placeholder="Hi, please share the documents listed below. Thank you!"
                        value={
                          view ===
                          "request"
                            ? requestMessage
                            : message
                        }
                        onChange={(event) =>
                          view ===
                          "request"
                            ? setRequestMessage(
                                event.target.value,
                              )
                            : setMessage(
                                event.target.value,
                              )
                        }
                      />
                    </label>

                  </div>
                )}
              </section>

              {/* DOCUMENTS */}

              <section className="dr-section dr-documents">

                <div className="dr-section-heading">

                  <span className="dr-section-number">
                    02
                  </span>

                  <h2>
                    Documents to request
                  </h2>

                  <span className="dr-count">
                    {activeRows.length}
                  </span>

                  {view === "create" && (
                    <Action
                      type="button"
                      variant="ghost"
                      className="dr-add-top"
                      onClick={() =>
                        setDocuments(
                          (rows) => [
                            ...rows,
                            newDocument(),
                          ],
                        )
                      }
                    >
                      <Plus size={16} />
                      Add document
                    </Action>
                  )}
                </div>

                <div className="dr-document-list">

                  {activeRows.map(
                    (doc, index) => (
                      <div
                        className="dr-document"
                        key={doc.id}
                      >

                        {view === "create" && (
                          <div className="dr-reorder">

                            <Action
                              type="button"
                              variant="icon"
                              aria-label={`Move ${
                                doc.name ||
                                `document ${
                                  index + 1
                                }`
                              } up`}
                              title="Move up"
                              disabled={
                                index === 0
                              }
                              onClick={() =>
                                move(
                                  index,
                                  -1,
                                )
                              }
                            >
                              <ChevronUp
                                size={14}
                              />
                            </Action>

                            <Action
                              type="button"
                              variant="icon"
                              aria-label={`Move ${
                                doc.name ||
                                `document ${
                                  index + 1
                                }`
                              } down`}
                              title="Move down"
                              disabled={
                                index ===
                                documents.length -
                                  1
                              }
                              onClick={() =>
                                move(
                                  index,
                                  1,
                                )
                              }
                            >
                              <ChevronDown
                                size={14}
                              />
                            </Action>

                          </div>
                        )}

                        <div className="dr-upload-icon">

                          <Upload
                            size={25}
                            strokeWidth={1.7}
                          />

                          <span className="dr-file-number">
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>

                        </div>

                        <div className="dr-document-content">

                          {view === "create" ? (
                            <>
                              <div className="dr-document-top">

                                <input
                                  aria-label={`Document ${
                                    index + 1
                                  } name`}
                                  required
                                  placeholder="Document name"
                                  value={
                                    doc.name
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    update(
                                      doc.id,
                                      {
                                        name:
                                          event
                                            .target
                                            .value,
                                      },
                                    )
                                  }
                                />

                                <div className="dr-document-options">

                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={
                                        doc.required
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        update(
                                          doc.id,
                                          {
                                            required:
                                              event
                                                .target
                                                .checked,
                                          },
                                        )
                                      }
                                    />

                                    Required
                                  </label>

                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={
                                        doc.rename
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        update(
                                          doc.id,
                                          {
                                            rename:
                                              event
                                                .target
                                                .checked,
                                          },
                                        )
                                      }
                                    />

                                    Rename
                                  </label>

                                </div>
                              </div>

                              <label className="dr-multiple">

                                <input
                                  type="checkbox"
                                  checked={
                                    doc.allowMultiple
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    update(
                                      doc.id,
                                      {
                                        allowMultiple:
                                          event
                                            .target
                                            .checked,
                                      },
                                    )
                                  }
                                />

                                Allow multiple file uploads

                              </label>
                            </>
                          ) : (
                            <>
                              <div className="dr-document-readonly">

                                <strong>
                                  {doc.name}
                                </strong>

                                <span
                                  className={
                                    doc.required
                                      ? "dr-required"
                                      : "dr-optional"
                                  }
                                >
                                  {doc.required
                                    ? "Required"
                                    : "Optional"}
                                </span>

                              </div>

                              <div className="dr-document-meta">

                                {doc.rename && (
                                  <span>
                                    <Copy
                                      size={
                                        13
                                      }
                                    />

                                    Rename enabled
                                  </span>
                                )}

                                <span>
                                  {doc.allowMultiple
                                    ? "Multiple files"
                                    : "Single file"}
                                </span>

                              </div>
                            </>
                          )}

                        </div>

                        {view === "create" && (
                          <Action
                            type="button"
                            variant="icon"
                            className="dr-remove"
                            aria-label={`Remove ${
                              doc.name ||
                              `document ${
                                index + 1
                              }`
                            }`}
                            title="Remove document"
                            onClick={() =>
                              setDocuments(
                                (rows) =>
                                  rows.filter(
                                    (row) =>
                                      row.id !==
                                      doc.id,
                                  ),
                              )
                            }
                          >
                            <X size={17} />
                          </Action>
                        )}

                      </div>
                    ),
                  )}

                </div>

                {view === "create" && (
                  <Action
                    type="button"
                    className="dr-add-document"
                    onClick={() =>
                      setDocuments(
                        (rows) => [
                          ...rows,
                          newDocument(),
                        ],
                      )
                    }
                  >
                    <Plus size={17} />
                    Add another document
                  </Action>
                )}

              </section>

              {/* EXPIRATION */}

              {view === "create" && (
                <section className="dr-section dr-expiration">

                  <div className="dr-section-heading">

                    <span className="dr-section-number">
                      03
                    </span>

                    <h2>
                      Request expiration
                    </h2>

                  </div>

                  <div className="dr-expiration-controls">

                    <label className="dr-switch-label">

                      <input
                        className="dr-switch"
                        type="checkbox"
                        checked={
                          timeframeEnabled
                        }
                        onChange={(event) =>
                          setTimeframeEnabled(
                            event.target
                              .checked,
                          )
                        }
                      />

                      <span>
                        Set a response deadline
                      </span>

                    </label>

                    {timeframeEnabled ? (
                      <label className="dr-days">
                        Expires after{" "}

                        <input
                          aria-label="Expiration days"
                          type="number"
                          required
                          min="1"
                          step="1"
                          value={days}
                          onChange={(event) =>
                            setDays(
                              event.target
                                .value,
                            )
                          }
                        />

                        {" "}days
                      </label>
                    ) : (
                      <span className="dr-no-expiry">
                        <Clock3
                          size={15}
                        />

                        No expiry
                      </span>
                    )}

                  </div>
                </section>
              )}

              {/* FOOTER */}

              <footer className="dr-form-footer">

                <span>
                  <ShieldCheck
                    size={15}
                  />

                  {view === "create"
                    ? "Reusable template"
                    : "Secure document request"}
                </span>

                <div>

                  <Action
                    type="button"
                    onClick={() => {
                      setView("list");
                      setNotice(null);
                    }}
                  >
                    {view === "detail"
                      ? "Back"
                      : "Cancel"}
                  </Action>

                  {view === "detail" &&
                  selected ? (
                    <Action
                      type="button"
                      variant="primary"
                      onClick={() =>
                        useTemplate(
                          selected,
                        )
                      }
                    >
                      <Send size={16} />
                      Use template
                    </Action>
                  ) : (
                    <Action
                      type="submit"
                      variant="primary"
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2
                          size={17}
                          className="dr-spin"
                        />
                      ) : view ===
                        "create" ? (
                        <Save
                          size={17}
                        />
                      ) : (
                        <Send
                          size={17}
                        />
                      )}

                      {busy
                        ? "Please wait…"
                        : view ===
                            "create"
                          ? "Save template"
                          : "Send request"}
                    </Action>
                  )}

                </div>
              </footer>

            </div>

            {/* SUMMARY */}

            <aside className="dr-summary">

              <div className="dr-summary-title">

                <span className="dr-summary-icon">
                  <LayoutTemplate
                    size={22}
                  />
                </span>

                <h2>
                  {view === "request"
                    ? "Request summary"
                    : "Template overview"}
                </h2>

              </div>

              <div className="dr-summary-stats">

                <div>
                  <strong>
                    {activeRows.length}
                  </strong>

                  <span>
                    Documents
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      activeRows.filter(
                        (d) =>
                          d.required,
                      ).length
                    }
                  </strong>

                  <span>
                    Required
                  </span>
                </div>

              </div>

              <div className="dr-summary-items">

                <div>
                  <Folder
                    size={17}
                  />

                  <div>
                    <span>
                      Destination
                    </span>

                    <strong>
                      {view === "create"
                        ? destination
                        : selected?.destination ||
                          "Not specified"}
                    </strong>
                  </div>
                </div>

                <div>
                  <Clock3
                    size={17}
                  />

                  <div>
                    <span>
                      Response deadline
                    </span>

                    <strong>
                      {view === "create"
                        ? timeframeEnabled
                          ? `${
                              days ||
                              "0"
                            } days after sending`
                          : "No expiry"
                        : selected?.expires ||
                          "No expiry"}
                    </strong>
                  </div>
                </div>

                <div>
                  <Mail
                    size={17}
                  />

                  <div>
                    <span>
                      Recipient
                    </span>

                    <strong>
                      {(view === "create"
                        ? toEmail
                        : view ===
                            "request"
                          ? requestEmail
                          : selected?.toEmail) ||
                        "Not specified"}
                    </strong>
                  </div>
                </div>

              </div>

              <div className="dr-summary-bottom">

                <Check size={16} />

                <span>
                  {
                    activeRows.filter(
                      (d) =>
                        d.allowMultiple,
                    ).length
                  }{" "}
                  multiple-file documents
                </span>

              </div>

            </aside>
          </form>
        )}

        <div className="dr-page-footer">
          <span>
            Lymton Techn
          </span>

          <span>
            <ShieldCheck
              size={13}
            />

            Document management,
            simplified.
          </span>
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   API
========================================================= */

const loadTemplatesFromApi =
  () =>
    apiCall(
      "/v1/document-requests/templates/",
      {
        requiresAuth: true,
      },
    );

const saveTemplateToApi = (
  payload: TemplatePayload,
) =>
  apiCall(
    "/v1/document-requests/templates/",
    {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(payload),
    },
  );

const sendRequestToApi = (
  payload: RequestPayload,
) =>
  apiCall(
    "/v1/document-requests/requests/",
    {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(payload),
    },
  );

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TemplatesTab() {
  const { primaryColor } =
    useTenant();

  return (
    <TemplatesAndRequestsModule
      primaryColor={primaryColor}
      loadTemplates={
        loadTemplatesFromApi
      }
      saveTemplate={
        saveTemplateToApi
      }
      sendRequest={
        sendRequestToApi
      }
    />
  );
}