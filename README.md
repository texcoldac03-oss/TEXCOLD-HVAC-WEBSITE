# Texcold A/C Services — staging website

This repository updates **TEXCOLD-HVAC-WEBSITE → staging → texcold-web** on Railway. It does not configure or deploy the existing texcoldhvacservice.com website or any NEXPRO ONE project.

The approved design is continued from `texcold_web_funcional.zip`: original Texcold logo, Houston skyline cover, blue/red palette, service cards and commercial focus. No externally loaded images or frontend packages are required.

## Run and verify

Node.js 20 or newer, with no package installation required:

```bash
npm run dev
npm test
```

`npm run dev` allows local preview. Production (`npm start`) requires `PREVIEW_PASSWORD` and fails closed when it is absent. A Railway environment cannot use the local preview bypass. `/health` is the deployment health endpoint.

Routes: `/`, `/maintenance`, `/service`, `/installation`, `/repair`, `/commercial`, `/generators`, `/our-work`, `/contact`. Add `?lang=es` for complete Spanish content. The local-only `/__qa/mobile` wrapper renders a 390px-wide viewport for responsive browser checks; it is unavailable on deployed staging.

## Photos and branding

`projects.json` contains **44 real Texcold photographs**, recovered from the latest approved website package, original project photographs and previous Texcold photo bundles. Repeated copies are consolidated, with larger original files preferred. The source collection includes commercial rooftops, equipment service and repairs, ductwork, mini-splits and residential work.

`public/assets/projects` holds a full image (up to 1600px) and a smaller gallery thumbnail for every photograph. All images have been decoded and checked; EXIF orientation is applied on export. The original logo and approved Houston cover are retained in `public/assets`. The generator image is explicitly labeled illustrative and is not represented as a completed Texcold project or product inventory.

## Private access

Set a strong `PREVIEW_PASSWORD` **only in the Railway staging service variables** before deploying. Never commit it. The login creates a signed, HttpOnly, SameSite=Lax session cookie (Secure on Railway) valid for 12 hours. Pages, JavaScript and project images require access. The public health endpoint, login artwork, CSS, favicon and deny-all robots file do not reveal the site content. Search indexing is disabled. “Lock preview” clears the browser cookie. Rotate `PREVIEW_PASSWORD` to invalidate existing sessions.

## Customer contact

The service selector preserves the service and residential/commercial context when opening Contact. The quote form requires a name, phone number, complete service address, project details and permission to contact the customer about that request. Apartment/suite and customer email are optional. Confirmed business hours appear alongside the contact details.

`POST /api/inquiries` validates all fields again on the server. The recipient is fixed by `CONTACT_EMAIL`; client-supplied recipients, CC and email headers are ignored. The endpoint requires a private preview session, same-origin JSON, a valid request UUID and consent, and applies a honeypot, body limits and rate limits. Resend idempotency keys protect same-request retries, including ambiguous network failures. No inquiry body or API credential is written to application logs or disk.

Direct sending becomes available **only when both `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` are configured**. The server submits plain-text email to Resend and returns a reference only after provider acceptance. Provider acceptance does not establish final inbox delivery or book an appointment. Failed or uncertain sends retain the customer’s details and offer email/call alternatives. Missing configuration keeps the existing email-draft flow available and explicitly says direct sending is not available. Never set synthetic/test credentials on Railway.

### Activate and verify delivery

1. Configure a Resend account and sending API key. Put the key in the **TEXCOLD-HVAC-WEBSITE / staging / texcold-web** Railway variable `RESEND_API_KEY`, never source code or a chat message.
2. Set `CONTACT_FROM_EMAIL` to the sender accepted by that account. For private testing, `Texcold Website <onboarding@resend.dev>` can send only to the email address associated with the Resend account; the account must therefore use `texcold@hotmail.com` for this destination. For launch, use a verified sender/domain configured by the domain administrator. This does not require replacing the website or creating a new business mailbox.
3. Keep `CONTACT_EMAIL=texcold@hotmail.com` unless the owner provides a different recipient. Updating the recipient alone will not authorize an unverified sender.
4. Submit one clearly labeled synthetic test on private staging. Check the provider’s accepted/delivered status **and actual receipt in the business inbox**. Confirm the phone and full address arrive, and reply-to uses the optional customer email.
5. Test failure handling and retries; verify the same request is not emailed twice. Do not advertise a working automatic contact flow until this live acceptance and inbox check pass.

Official reference: https://resend.com/docs/api-reference/emails/send-email and https://resend.com/docs/knowledge-base/403-error-resend-dev-domain.

Default contact details were verified against Texcold's existing public website: `(281) 223-6761`, `texcold@hotmail.com`. The existing website was read only. Replace these centrally using Railway variables:

| Variable | Purpose |
| --- | --- |
| `CONTACT_PHONE` | E.164 dial link |
| `CONTACT_PHONE_DISPLAY` | Visible phone label |
| `CONTACT_EMAIL` | Current/future quote recipient and email-draft destination |
| `RESEND_API_KEY` | Server-only sending credential; required for direct submission |
| `CONTACT_FROM_EMAIL` | Sender authorized by the email provider; required for direct submission |
| `PREVIEW_PASSWORD` | Private staging access; required |

## Later integrations

Business email can be added later by updating `CONTACT_EMAIL` and the verified sender when ready. The delivery adapter is isolated in `lib/inquiries.js`; it has no dependency on the future AI assistant.

The existing optional AI endpoint is isolated in `lib/assistant.js`; `/api/chat` returns `AI_NOT_CONFIGURED` while `OPENAI_API_KEY` is absent. No simulated AI assistant is shown. When ready, configure the API key server-side, review the assistant's instructions and add an explicit accessible chat interface. No API secret is shipped to the browser.

## Validation

`npm test` checks every page in English and Spanish, internal links and anchors, all gallery assets, authenticated access, incorrect credentials, tampered cookies, protected image URLs, omitted password behavior and the unconfigured AI endpoint. Browser checks cover desktop navigation, a 390px mobile layout, menu behavior, selector recommendations, request preselection, draft generation/copying and gallery filtering/lightbox controls. Inquiry tests additionally cover missing required data, recipient enforcement, consent, provider acceptance/failure/timeouts, idempotency, same-origin checks and unconfigured delivery. Live provider/inbox verification remains blocked until the owner connects sending credentials.

## Service page review — November 2026

Each service page now includes navigation within the page, tailored benefits and scope, residential/commercial contact options with the property preselected, a three-step explanation, relevant Texcold project photos and FAQs. Generator inquiries remain sales inquiries with an illustrative image. The private preview login preserves the requested service page and language; return destinations are restricted to this site.

The equipment-and-materials photograph with the yellow truck has been removed from the active gallery and commercial page at the owner’s request. Its full image and thumbnail are no longer deployed.

The bilingual About Us page (`/about`) presents the company history and quality commitments, with real Texcold project photographs and residential/commercial contact paths. The owner confirmed that Texcold began operations in 2022 and that his personal HVAC experience is eight years as of November 2026; these are presented separately.
