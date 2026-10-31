const config = window.MEDGPT_CONFIG || { apiBaseUrl: "" };

const form = document.querySelector("#lookup-form");
const formMessage = document.querySelector("#form-message");
const emptyResult = document.querySelector("#empty-result");
const resultCard = document.querySelector("#result-card");
const resultStatus = document.querySelector("#result-status");
const resultTitle = document.querySelector("#result-title");
const resultSubtitle = document.querySelector("#result-subtitle");
const safetyNotices = document.querySelector("#safety-notices");
const resultSections = document.querySelector("#result-sections");
const resultSources = document.querySelector("#result-sources");
const submitButton = form.querySelector('button[type="submit"]');

const sampleResult = {
  status: "demo",
  medicine: {
    displayName: "Paracetamol 650 mg tablet",
    activeIngredient: "Paracetamol",
    confidenceNote: "Sample educational result. Confirm your own package before use.",
  },
  safetyNotices: [
    { severity: "important", message: "Avoid taking more than one medicine containing paracetamol at the same time." },
    { severity: "urgent", message: "Seek urgent care for a suspected overdose, even if you feel well." },
  ],
  sections: [
    { id: "what_it_is", title: "What it is", content: "Paracetamol is a pain-relieving and fever-reducing medicine." },
    { id: "uses", title: "What it is used for", content: "It is commonly used for mild to moderate pain and fever." },
    { id: "how_it_works", title: "How it works", content: "It acts in the body and brain to reduce pain signals and lower fever." },
    { id: "how_to_take", title: "When to take it", content: "Follow the package or clinician’s directions. Do not use this example as a personal dose." },
    { id: "food", title: "Food guidance", content: "It can generally be taken with or without food. Check your own product label." },
    { id: "dosage", title: "Dosage", content: "Dose and daily limits vary by person and product. A clinician or pharmacist should advise children, pregnancy, liver disease, or regular alcohol use." },
    { id: "side_effects", title: "Side effects", content: "Side effects are uncommon at recommended amounts. Serious skin reactions or allergic symptoms need prompt medical attention." },
    { id: "precautions", title: "Precautions", content: "Check all cold, flu, and pain medicines for the same ingredient to prevent accidental duplication." },
  ],
  sources: [{ title: "Sample only — use a verified label for a real lookup", url: "https://dailymed.nlm.nih.gov/" }],
};

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function addTextElement(parent, tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function renderResult(data) {
  emptyResult.hidden = true;
  resultCard.hidden = false;
  resultStatus.textContent = data.status === "demo" ? "Sample preview · not a live lookup" : data.status === "source_backed" ? "AI summary with label evidence" : "Needs confirmation";
  resultTitle.textContent = data.medicine?.displayName || "Medicine details";
  resultSubtitle.textContent = data.medicine?.confidenceNote || "Confirm package details before using this information.";

  clearNode(safetyNotices);
  for (const notice of data.safetyNotices || []) {
    addTextElement(safetyNotices, "div", notice.message, `notice ${notice.severity === "urgent" ? "urgent" : ""}`);
  }

  clearNode(resultSections);
  for (const section of data.sections || []) {
    const sectionElement = document.createElement("section");
    sectionElement.className = "result-section";
    sectionElement.id = `section-${section.id}`;
    addTextElement(sectionElement, "h3", section.title);
    addTextElement(sectionElement, "p", section.content);
    if (section.quote) {
      const details = document.createElement('details');
      addTextElement(details, 'summary', section.verbatim ? 'Exact label excerpt' : 'View supporting label text');
      addTextElement(details, 'blockquote', section.quote);
      sectionElement.appendChild(details);
    }
    resultSections.appendChild(sectionElement);
  }

  clearNode(resultSources);
  for (const [field, text] of Object.entries(data.labelWarnings || {})) {
    const details = document.createElement('details');
    addTextElement(details, 'summary', `Full label: ${field.replaceAll('_', ' ')}`);
    addTextElement(details, 'p', text);
    safetyNotices.appendChild(details);
  }
  for (const source of data.sources || []) {
    let url;
    try { url = new URL(source.url); } catch { continue; }
    if (url.protocol !== 'https:' || !['dailymed.nlm.nih.gov', 'open.fda.gov'].includes(url.hostname)) continue;
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.title + (source.updated ? ` · Label date ${source.updated}` : '');
    resultSources.appendChild(link);
  }
  resultTitle.setAttribute('tabindex', '-1');
  resultTitle.focus({ preventScroll: true });
  document.querySelector("#result-region").scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: "start" });
}

function showClarification(message) {
  renderResult({
    status: "needs_confirmation",
    medicine: { displayName: "More package details needed", confidenceNote: message },
    safetyNotices: [{ severity: "important", message: "MED GPT does not guess a medicine’s composition from a brand name." }],
    sections: [],
    sources: [],
  });
}

async function submitLookup(event) {
  event.preventDefault();
  formMessage.textContent = "";
  const formData = new FormData(form);
  const request = Object.fromEntries(formData.entries());
  request.confirmedIngredient = formData.get("confirmedIngredient") === "on";

  if (!form.checkValidity() || !request.confirmedIngredient) {
    form.reportValidity();
    formMessage.textContent = "Please complete the required fields and confirm the package details.";
    return;
  }
  if (!config.apiBaseUrl) {
    formMessage.textContent = "Live lookup is not available yet. You can explore the sample preview.";
    return;
  }

  submitButton.disabled = true;
  document.querySelector('#sample-button').disabled = true;
  resultCard.hidden = true;
  emptyResult.hidden = false;
  form.setAttribute('aria-busy', 'true');
  submitButton.textContent = "Checking label sources…";
  try {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/api/lookup`, {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    if (data.status === "needs_confirmation" || data.status === "unsupported") {
      showClarification(data.message || "Please verify the active ingredient, strength, and dosage form from the package.");
    } else if (data.status === 'source_backed' && Array.isArray(data.sections) && data.medicine) {
      renderResult(data);
    } else {
      throw new Error('The service returned an unsupported response. Please try again.');
    }
  } catch (error) {
    formMessage.textContent = error.message || "Unable to create a medicine summary right now.";
  } finally {
    submitButton.disabled = false;
    document.querySelector('#sample-button').disabled = false;
    form.removeAttribute('aria-busy');
    submitButton.textContent = "Create medicine summary";
  }
}

form.addEventListener("submit", submitLookup);
document.querySelector("#sample-button").addEventListener("click", () => renderResult(sampleResult));
document.querySelector("#new-search-button").addEventListener("click", () => {
  resultCard.hidden = true;
  emptyResult.hidden = false;
  document.querySelector("#medicine-name").focus();
});
