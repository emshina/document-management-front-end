const DOCUMENT_REQUEST_STYLES = `
.dr-app {
  --dr-background: oklch(0.984 0.003 160);
  --dr-surface: oklch(1 0 0);
  --dr-text: oklch(0.16 0.007 160);
  --dr-subtle: oklch(0.37 0.01 160);
  --dr-primary: oklch(0.43 0.095 166);
  --dr-on-primary: oklch(1 0 0);
  --dr-tint: oklch(0.958 0.018 163);
  --dr-border: oklch(0.89 0.008 160);
  --dr-input-border: oklch(0.8 0.009 160);
  --dr-error: oklch(0.48 0.19 25);
  --dr-error-tint: oklch(0.97 0.015 25);

  font-family: 'DM Sans', Arial, sans-serif;
  background: var(--dr-background);
  color: var(--dr-text);
  min-height: 100vh;
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: 0;
}

.dr-app * {
  box-sizing: border-box;
}

.dr-app button,
.dr-app input,
.dr-app textarea {
  font: inherit;
}

.dr-app svg {
  flex-shrink: 0;
}

.dr-app h1,
.dr-app h2,
.dr-app h3,
.dr-app p {
  margin: 0;
}

.dr-topbar {
  height: 76px;
  border-bottom: 1px solid var(--dr-border);
  background: var(--dr-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
}

.dr-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--dr-text);
  font-size: 24px;
  font-weight: 750;
}

.dr-brand-accent {
  color: var(--dr-primary);
}

.dr-brand-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 39px;
  background: var(--dr-primary);
  color: var(--dr-on-primary);
  border-radius: 7px;
}

.dr-topbar-right,
.dr-workspace {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dr-topbar-right {
  gap: 23px;
}

.dr-workspace {
  font-weight: 550;
}

.dr-topbar-divider {
  height: 25px;
  width: 1px;
  background: var(--dr-border);
}

.dr-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--dr-tint);
  color: var(--dr-primary);
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--dr-border);
}

.dr-shell {
  max-width: 1232px;
  margin: 0 auto;
  padding: 27px 48px 0;
}

.dr-breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--dr-subtle);
  flex-wrap: wrap;
}

.dr-breadcrumb .dr-button {
  font-size: 12px;
  padding: 0;
  min-height: auto;
  color: var(--dr-subtle);
}

.dr-current {
  color: var(--dr-text);
  font-weight: 550;
}

.dr-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 32px 0 30px;
}

.dr-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  font-weight: 700;
  color: var(--dr-primary);
  letter-spacing: 1.3px;
  margin-bottom: 8px;
}

.dr-heading h1 {
  font-family: 'Manrope', Arial, sans-serif;
  font-size: 30px;
  line-height: 1.3;
  font-weight: 750;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.dr-heading p {
  color: var(--dr-subtle);
  margin-top: 8px;
  font-size: 13px;
}

.dr-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  min-height: 39px;
  padding: 8px 15px;
  border-radius: 5px;
  font-weight: 600 !important;
  font-size: 12px !important;
  line-height: 1.5;
  cursor: pointer;
  transition: background .16s, border-color .16s;
  color: var(--dr-text);
  background: transparent;
}

.dr-button--secondary {
  border-color: var(--dr-border);
  background: var(--dr-surface);
}

.dr-button--secondary:hover,
.dr-button--ghost:hover,
.dr-button--icon:hover {
  background: var(--dr-tint);
  border-color: var(--dr-border);
}

.dr-button--primary {
  background: var(--dr-primary);
  color: var(--dr-on-primary);
  border-color: var(--dr-primary);
}

.dr-button--primary:hover {
  background: color-mix(
    in oklch,
    var(--dr-primary),
    var(--dr-text) 15%
  );
}

.dr-button--icon {
  width: 30px;
  height: 30px;
  min-height: 30px;
  padding: 0;
}

.dr-button:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.dr-button:focus-visible,
.dr-app input:focus-visible,
.dr-app textarea:focus-visible {
  outline: 2px solid var(--dr-primary);
  outline-offset: 3px;
}

.dr-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 30px;
  align-items: start;
}

.dr-main {
  background: var(--dr-surface);
  border: 1px solid var(--dr-border);
  border-radius: 7px;
  overflow: hidden;
}

.dr-section {
  padding: 25px 27px;
}

.dr-section + .dr-section {
  border-top: 1px solid var(--dr-border);
}

.dr-section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 23px;
}

.dr-section h2,
.dr-list h2 {
  font-size: 14px;
  font-weight: 700;
}

.dr-section-number {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--dr-primary);
  background: var(--dr-tint);
  border-radius: 4px;
}

.dr-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 20px;
}

.dr-span-two {
  grid-column: 1 / -1;
}

.dr-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.dr-field > span {
  font-size: 12px;
  font-weight: 650;
}

.dr-field b {
  color: var(--dr-primary);
}

.dr-app input:not([type=checkbox]),
.dr-app textarea {
  border: 1px solid var(--dr-input-border);
  color: var(--dr-text);
  background: var(--dr-surface);
  padding: 10px 12px;
  border-radius: 5px;
  width: 100%;
  font-size: 12px;
  outline: none;
  min-width: 0;
}

.dr-app input::placeholder,
.dr-app textarea::placeholder {
  color: var(--dr-subtle);
  opacity: 1;
}

.dr-app textarea {
  resize: vertical;
  min-height: 88px;
}

.dr-input-icon {
  position: relative;
}

.dr-input-icon > svg {
  position: absolute;
  left: 12px;
  top: 12px;
  color: var(--dr-subtle);
}

.dr-input-icon input {
  padding-left: 37px !important;
}

.dr-count {
  display: inline-grid;
  place-items: center;
  background: var(--dr-tint);
  color: var(--dr-primary);
  height: 21px;
  min-width: 23px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 650;
  border-radius: 4px;
}

.dr-add-top {
  margin-left: auto;
  padding: 0;
  min-height: 24px;
  color: var(--dr-primary);
}

.dr-document-list {
  border: 1px solid var(--dr-border);
  border-radius: 5px;
  overflow: hidden;
}

.dr-document {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 13px 16px 8px;
  background: var(--dr-surface);
}

.dr-document + .dr-document {
  border-top: 1px solid var(--dr-border);
}

.dr-reorder {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dr-reorder .dr-button {
  width: 19px;
  height: 20px;
  min-height: 20px;
  color: var(--dr-subtle);
}

.dr-upload-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--dr-primary);
  padding: 0 3px;
}

.dr-file-number {
  font-size: 9px;
  font-weight: 600;
  color: var(--dr-subtle);
}

.dr-document-content {
  flex: 1;
  min-width: 0;
}

.dr-document-top {
  display: flex;
  align-items: center;
  gap: 13px;
}

.dr-document-top > input {
  flex: 1;
  font-weight: 550;
  height: 36px;
}

.dr-document-options {
  display: flex;
  gap: 13px;
}

.dr-document-options label,
.dr-multiple {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dr-text);
  cursor: pointer;
  white-space: nowrap;
}

.dr-app input[type=checkbox]:not(.dr-switch) {
  accent-color: var(--dr-primary);
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.dr-multiple {
  margin-top: 10px;
}

.dr-remove {
  color: var(--dr-subtle);
  flex-shrink: 0;
}

.dr-remove:hover {
  color: var(--dr-error);
  background: var(--dr-error-tint);
}

.dr-add-document {
  margin-top: 15px;
  width: 100%;
  border: 1px dashed var(--dr-input-border);
  background: var(--dr-background);
  color: var(--dr-primary);
  height: 40px;
}

.dr-add-document:hover {
  background: var(--dr-tint);
}

.dr-expiration {
  padding-top: 22px;
  padding-bottom: 24px;
}

.dr-expiration .dr-section-heading {
  margin-bottom: 17px;
}

.dr-expiration-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dr-switch-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  cursor: pointer;
}

.dr-switch {
  appearance: none;
  position: relative;
  width: 32px;
  height: 18px;
  background: var(--dr-input-border);
  border-radius: 20px;
  cursor: pointer;
  margin: 0;
  transition: background .2s;
  flex-shrink: 0;
}

.dr-switch:before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  left: 2px;
  top: 2px;
  background: var(--dr-surface);
  border-radius: 50%;
  transition: transform .2s;
}

.dr-switch:checked {
  background: var(--dr-primary);
}

.dr-switch:checked:before {
  transform: translateX(14px);
}

.dr-no-expiry {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dr-subtle);
}

.dr-days {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.dr-days input {
  width: 58px !important;
  padding: 5px 8px !important;
}

.dr-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--dr-border);
  padding: 19px 27px;
  background: var(--dr-background);
}

.dr-form-footer > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--dr-subtle);
}

.dr-form-footer > div {
  display: flex;
  gap: 9px;
}

.dr-summary {
  background: var(--dr-surface);
  border: 1px solid var(--dr-border);
  border-radius: 7px;
  overflow: hidden;
}

.dr-summary-title {
  padding: 23px 22px 0;
}

.dr-summary-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: var(--dr-tint);
  border-radius: 7px;
  color: var(--dr-primary);
  margin-bottom: 14px;
}

.dr-summary h2 {
  font-size: 14px;
  font-weight: 700;
}

.dr-summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 22px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--dr-border);
}

.dr-summary-stats > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dr-summary-stats > div + div {
  padding-left: 23px;
  border-left: 1px solid var(--dr-border);
}

.dr-summary-stats strong {
  font-size: 27px;
  line-height: 1.2;
  font-weight: 650;
}

.dr-summary-stats span {
  font-size: 11px;
  color: var(--dr-subtle);
}

.dr-summary-items {
  display: flex;
  flex-direction: column;
  gap: 23px;
  padding: 0 22px 25px;
}

.dr-summary-items > div {
  display: flex;
  gap: 10px;
}

.dr-summary-items svg {
  color: var(--dr-subtle);
  margin-top: 2px;
}

.dr-summary-items > div > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dr-summary-items span {
  font-size: 10px;
  color: var(--dr-subtle);
}

.dr-summary-items strong {
  font-size: 12px;
  font-weight: 550;
  overflow-wrap: anywhere;
  line-height: 1.6;
}

.dr-summary-bottom {
  padding: 13px 22px;
  background: var(--dr-tint);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dr-primary);
  font-size: 10px;
}

.dr-page-footer {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 23px 0 25px;
  font-size: 10px;
  color: var(--dr-subtle);
}

.dr-page-footer > span:last-child {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dr-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 15px;
  border: 1px solid var(--dr-border);
  border-radius: 5px;
  background: var(--dr-tint);
  margin-bottom: 20px;
  color: var(--dr-primary);
}

.dr-notice > span {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dr-notice--error {
  color: var(--dr-error);
  background: var(--dr-error-tint);
}

.dr-list {
  background: var(--dr-surface);
  border: 1px solid var(--dr-border);
  border-radius: 7px;
  overflow: hidden;
}

.dr-list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 23px;
}

.dr-list-toolbar h2 {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dr-search {
  position: relative;
  width: 260px;
}

.dr-search svg {
  position: absolute;
  left: 12px;
  top: 11px;
  color: var(--dr-subtle);
}

.dr-search input {
  padding-left: 38px !important;
}

.dr-table-scroll {
  overflow-x: auto;
}

.dr-app table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;
}

.dr-app th {
  background: var(--dr-background);
  padding: 13px 20px;
  font-size: 11px;
  font-weight: 650;
  border-block: 1px solid var(--dr-border);
}

.dr-app td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--dr-border);
}

.dr-app tr:last-child td {
  border-bottom: 0;
}

.dr-template-link {
  padding: 0;
  text-align: left;
  justify-content: start;
}

.dr-file-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 36px;
  background: var(--dr-tint);
  color: var(--dr-primary);
  border-radius: 5px;
  flex-shrink: 0;
}

.dr-expiry {
  display: flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

.dr-empty {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.dr-empty > svg {
  color: var(--dr-primary);
}

.dr-empty h3 {
  font-size: 16px;
}

.dr-detail-fields {
  display: grid;
  gap: 22px;
}

.dr-detail-fields span {
  font-size: 11px;
  color: var(--dr-subtle);
}

.dr-detail-fields p {
  font-size: 13px;
  margin-top: 6px;
}

.dr-message {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.dr-document-readonly {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.dr-document-readonly strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.dr-required,
.dr-optional {
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--dr-tint);
  color: var(--dr-primary);
}

.dr-optional {
  background: var(--dr-background);
  color: var(--dr-subtle);
}

.dr-document-meta {
  display: flex;
  gap: 13px;
  margin-top: 6px;
  font-size: 10px;
  color: var(--dr-subtle);
}

.dr-document-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dr-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.dr-spin {
  animation: dr-spin 1s linear infinite;
}

@keyframes dr-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .dr-topbar {
    padding-inline: 30px;
  }

  .dr-shell {
    padding-inline: 30px;
  }

  .dr-editor {
    grid-template-columns: minmax(0, 1fr) 255px;
    gap: 20px;
  }

  .dr-document-top {
    flex-wrap: wrap;
    gap: 8px;
  }

  .dr-document-top > input {
    flex-basis: 100%;
  }

  .dr-multiple {
    margin-top: 8px;
  }

  .dr-section {
    padding-inline: 22px;
  }
}

@media (max-width: 760px) {
  .dr-topbar {
    padding-inline: 20px;
    height: 65px;
  }

  .dr-workspace {
    display: none;
  }

  .dr-topbar-divider {
    display: none;
  }

  .dr-shell {
    padding: 20px 18px 0;
  }

  .dr-heading {
    flex-direction: column;
    align-items: start;
    margin-block: 24px;
    gap: 16px;
  }

  .dr-heading h1 {
    font-size: 26px;
  }

  .dr-editor {
    grid-template-columns: minmax(0, 1fr);
  }

  .dr-summary {
    display: none;
  }

  .dr-section {
    padding: 21px 18px;
  }

  .dr-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .dr-span-two {
    grid-column: auto;
  }

  .dr-document {
    gap: 7px;
    padding-inline: 5px;
  }

  .dr-upload-icon {
    padding: 0;
  }

  .dr-upload-icon svg {
    width: 22px;
  }

  .dr-document-options {
    gap: 12px;
  }

  .dr-document-top {
    flex-wrap: wrap;
  }

  .dr-multiple {
    white-space: normal;
  }

  .dr-form-footer {
    padding: 18px;
  }

  .dr-form-footer > span {
    display: none;
  }

  .dr-form-footer > div {
    margin-left: auto;
  }

  .dr-expiration-controls {
    flex-wrap: wrap;
  }

  .dr-section-heading {
    gap: 7px;
  }

  .dr-add-top {
    font-size: 10px !important;
    gap: 3px;
  }

  .dr-section h2 {
    font-size: 13px;
  }

  .dr-list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .dr-search {
    width: 100%;
  }

  .dr-page-footer {
    font-size: 9px;
    flex-wrap: wrap;
  }

  .dr-breadcrumb {
    gap: 8px;
    font-size: 11px;
  }

  .dr-document-readonly {
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dr-app *,
  .dr-app *:before {
    transition: none !important;
    animation: none !important;
  }
}
`;

export default DOCUMENT_REQUEST_STYLES;