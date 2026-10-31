# MED GPT

A static medicine-information interface with a Cloudflare Worker API. The frontend is HTML, CSS and JavaScript; no npm install is needed to preview it. The Worker retrieves a matching US label through openFDA, uses Google Gemini to organize it, and links the exact label on DailyMed.

## Start on your computer

Install Node.js 22 or newer, then open a terminal in this project folder:

```powershell
node scripts/serve.mjs
```

Open http://127.0.0.1:4173 and choose **View a sample**. The sample is clearly labelled and makes no API call. Live lookup requires the account setup below. No login or credential is saved in browser storage.

```powershell
node --test worker/test/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs dist
```

The build copies only public frontend assets into `dist/`. Tests use fake credentials and mocked provider responses, so they do not spend API credits.

## What this beta supports

- English information for a user-confirmed single ingredient, strength in mg/mcg/g, and oral tablet or capsule.
- Paracetamol is normalized to the US name acetaminophen.
- Matching requires the ingredient, strength, oral route and form. Combination products and detected modified-release products are excluded.
- An unsupported search asks for clarification; it does not substitute another strength.
- Uses and mechanism may be explained by AI with evidence quotes. Administration, food, dosage, side effects and precautions are exact excerpts checked against the returned label.
- Full retrieved warning sections are available in expandable panels, alongside a specific source link and label date.
- A source match is not proof of the Indian brand formulation, clinical approval, or independent semantic validation of an AI paraphrase. User confirmation is not authoritative brand verification. This beta requires pharmacist/clinical review before broader medical use.
- No diagnosis, personal dose calculation, patient history, uploads, or treatment selection.

The search examines at most 25 newest generic-label results. It can miss a matching product; unsupported is an expected result, not permission to guess. Some prescription labels lack the fields needed for strict matching and are deliberately unsupported. Source outages and incomplete/refused AI responses produce an error without showing partial advice.

## Deploy step by step

### Easiest option: attach keys through GitHub

For the prepared repository, open https://github.com/AkashTger/MED_GPT/settings/secrets/actions and add these **repository secrets**:

| Secret name | What to enter |
| --- | --- |
| CLOUDFLARE_API_TOKEN | A Cloudflare API token scoped to deploy Workers in your account (not your Gemini key or global Cloudflare key). |
| CLOUDFLARE_ACCOUNT_ID | Your Cloudflare account ID from the dashboard. |
| GEMINI_API_KEY | Your Google AI Studio Gemini API key. |
| GEMINI_MODEL | `gemini-2.5-flash-lite` (the prepared free-tier model choice). |
| BETA_ACCESS_CODES | Long random private tester access codes, separated by commas. |

Then open **Actions → Deploy Cloudflare API → Run workflow**. The workflow creates the quota store and attaches the Gemini and beta-code secrets to the Worker. Copy the workers.dev URL from the deployment output.

Add that URL under **Settings → Secrets and variables → Actions → Variables**, named **MEDGPT_API_URL**. Enable **Settings → Pages → GitHub Actions**, then run the Pages deployment workflow. The expected site address is https://akashtger.github.io/MED_GPT/ after successful deployment.

Do not paste secret values into chat or commit them in files. The CLI steps below are an alternative; you do not need both routes.

### 1. GitHub

Create a repository, upload this project (including `.github`), and use the `main` branch. In **Settings → Pages**, select **GitHub Actions**. The included workflow tests the backend, builds `dist/`, and publishes the frontend. You can initially publish it in sample mode without any API account.

Do not upload `.dev.vars`, `.env`, access codes, API keys, or your local dependencies.

### 2. Cloudflare

Create your own account at https://dash.cloudflare.com/sign-up. No custom domain is needed.

In `worker/wrangler.toml`, change `ALLOWED_ORIGIN` to your GitHub Pages origin, such as `https://yourusername.github.io`. Do not include the repository path.

From the project folder:

```powershell
cd worker
npx wrangler login
npx wrangler deploy
```

The first npx command may ask to download Wrangler. Complete Cloudflare login yourself. Deployment creates the Worker and its SQLite Durable Object quota store from the configuration. **No KV namespace is needed.**

Note the resulting `https://med-gpt-api.YOUR-SUBDOMAIN.workers.dev` URL.

### 3. Google Gemini and beta access

Create a Gemini API key in Google AI Studio. Set the model to `gemini-2.5-flash-lite`, which Google lists with a free tier. Free-tier availability and quotas depend on the project and region, so check Google AI Studio before deploying. Do not send symptoms, photos, patient history, names, or other personal health information: free-tier Gemini use may be used by Google to improve its products. This app sends only a confirmed ingredient and public label text to Gemini.

From the `worker` folder, run each command and paste the requested value into the private prompt:

```powershell
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GEMINI_MODEL
npx wrangler secret put BETA_ACCESS_CODES
```

For `BETA_ACCESS_CODES`, use long random private codes separated by commas. Give one to each tester. Do not put these values in GitHub or in chat. Secret updates apply to the deployed Worker.

Requests are capped transactionally at 10 per code/day, 10 per IP/day, and 50 total/day. Both successful and failed lookup attempts after confirmation consume quota. Limits reset at midnight UTC. Adjust the variables in `wrangler.toml` and redeploy if needed. This is a request cap, not a currency spending guarantee; also configure your provider's account budget controls.

### 4. Connect the website

In GitHub, open **Settings → Secrets and variables → Actions → Variables**. Add a repository variable named `MEDGPT_API_URL` containing the Worker URL. This URL is public, not a secret.

Run the Pages workflow again from **Actions → Deploy static site to GitHub Pages → Run workflow**. The build writes the public URL into the frontend configuration. Alternatively, set `apiBaseUrl` in `assets/config.js` and push.

### 5. Test the deployed integration

- Check that the sample works without a code.
- Test an invalid access code and an unsupported medicine.
- With a real beta code, test a confirmed single ingredient such as paracetamol, 500 mg, Tablet.
- Check the source link, source date, warning details and quoted evidence.
- Confirm that no API key appears in the browser or public repository.
- Have the returned medical information reviewed before sharing beyond the private beta.

## Local Worker development

Copy `worker/.dev.vars.example` to `worker/.dev.vars` and fill it privately. Set the local allowed origin using:

```powershell
cd worker
npx wrangler dev --var ALLOWED_ORIGIN:http://127.0.0.1:4173
```

For local testing only, set `assets/config.js` to the local Worker URL printed by Wrangler. Restore the production configuration before publishing. Live requests still incur provider usage.

## Architecture and privacy

Browser → Worker access check → transactional quota → matching openFDA label → structured Gemini response → evidence validation → result with DailyMed source.

The quota object stores a date, counts, hashed beta-code identifiers and salted hashes of IP addresses. It replaces counters on the first request of a new UTC day. It never stores medicine names or raw IP addresses. The app has no analytics, search history or browser credential storage. Cloudflare and Google still process requests under their own service policies. In particular, do not treat Gemini's free tier as a private-health-data service.

CORS restricts browser origins, but it is not authentication: the secret beta code is required independently. The backend does not log request bodies or provider responses. API responses use `Cache-Control: no-store`.

The data comes from openFDA; DailyMed is the linked original label view, not a second independent fact-checking API.

## Files

- `index.html`, `assets/`: static frontend.
- `worker/src/api.js`: maintained Worker entry.
- `worker/src/safety.js`: label matching and evidence checks.
- `worker/src/quota.js`: atomic request quotas.
- `worker/src/index.js`: compatibility export.
- `worker/test/`: mocked tests.
- `scripts/`: local preview and public-only build.
- `.github/workflows/`: test and Pages deployment.

## Troubleshooting

- **Live lookup unavailable:** configure the public Worker URL and rebuild Pages.
- **Service not configured:** add all three secrets and deploy the Durable Object binding.
- **Origin rejected:** use the exact site origin, without a trailing slash or repository path.
- **Unsupported:** verify the ingredient, strength, immediate-release form and spelling; coverage is limited.
- **Provider error:** inspect account model access/billing and provider status. No unvalidated response is shown.
- **Daily limit:** wait for midnight UTC or deliberately adjust quotas.
- **npm/npx missing:** install Node.js LTS with npm; local preview and tests need only Node itself.

## References

- https://open.fda.gov/apis/drug/label/
- https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

The code can be built and tested without account credentials. Publishing a live API requires your Cloudflare login, Gemini credentials, and GitHub deployment settings. A mocked test pass does not establish real provider compatibility or clinical correctness.
