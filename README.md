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

The service selector preserves the service and residential/commercial context when opening Contact. The quote request form requires a name, phone number, service street address, city, state, ZIP code and project details. Apartment or suite is optional. It validates customer details and prepares an **email draft**, with a copy option; the phone and full service address are included in the draft. It never claims that a request has been sent or that an appointment is confirmed. Delivery happens only when the visitor sends from their email application; no customer inquiry is stored by this app.

Default contact details were verified against Texcold's existing public website: `(281) 223-6761`, `texcold@hotmail.com`. The existing website was read only. Replace these centrally using Railway variables:

| Variable | Purpose |
| --- | --- |
| `CONTACT_PHONE` | E.164 dial link |
| `CONTACT_PHONE_DISPLAY` | Visible phone label |
| `CONTACT_EMAIL` | Current or future business email and draft recipient |
| `PREVIEW_PASSWORD` | Private staging access; required |

## Later integrations

Business email does not block this version: change `CONTACT_EMAIL` when ready. A future server-side contact delivery adapter should validate requests and return an actual delivery result before the interface claims submission.

The existing optional AI endpoint is isolated in `lib/assistant.js`; `/api/chat` returns `AI_NOT_CONFIGURED` while `OPENAI_API_KEY` is absent. No simulated AI assistant is shown. When ready, configure the API key server-side, review the assistant's instructions and add an explicit accessible chat interface. No API secret is shipped to the browser.

## Validation

`npm test` checks every page in English and Spanish, internal links and anchors, all gallery assets, authenticated access, incorrect credentials, tampered cookies, protected image URLs, omitted password behavior and the unconfigured AI endpoint. Browser checks cover desktop navigation, a 390px mobile layout, menu behavior, selector recommendations, request preselection, draft generation/copying and gallery filtering/lightbox controls.

## Service page review — November 2026

Each service page now includes navigation within the page, tailored benefits and scope, residential/commercial contact options with the property preselected, a three-step explanation, relevant Texcold project photos and FAQs. Generator inquiries remain sales inquiries with an illustrative image. The private preview login preserves the requested service page and language; return destinations are restricted to this site.

The equipment-and-materials photograph with the yellow truck has been removed from the active gallery and commercial page at the owner’s request. Its full image and thumbnail are no longer deployed.
