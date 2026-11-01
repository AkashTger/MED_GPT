const config = window.MEDGPT_CONFIG || { apiBaseUrl: "" };

const messagesContainer = document.querySelector("#messages-container");
const chatForm = document.querySelector("#chat-form");
const userInput = document.querySelector("#user-input");
const sendBtn = document.querySelector("#send-btn");
const newChatBtn = document.querySelector("#new-chat-btn");
const sidebar = document.querySelector("#sidebar");
const sidebarToggleBtn = document.querySelector("#sidebar-toggle-btn");
const attachmentInput = document.querySelector("#attachment-input");
const attachmentPreview = document.querySelector("#attachment-preview");
const allowedAttachmentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"]);
const maxAttachmentBytes = 4 * 1024 * 1024;
let selectedAttachment = null;
let selectedAttachmentUrl = "";

// Mock knowledge base for instant rich demo responses when no API key/code is configured
const demoDatabase = {
  paracetamol: {
    name: "Paracetamol (Acetaminophen) 650 mg",
    summary: "Paracetamol is an analgesic (pain reliever) and antipyretic (fever reducer) used to treat mild to moderate pain and reduce body temperature.",
    safetyNotices: [
      { type: "urgent", text: "Severe Liver Warning: Exceeding 4,000 mg in 24 hours or combining with alcohol can cause acute liver failure." },
      { type: "caution", text: "Do not take with other cold/cough or pain medications that also contain paracetamol or acetaminophen." }
    ],
    sections: [
      {
        title: "Indications & Uses",
        content: "Relieves minor aches and pains due to headache, muscle aches, backache, toothache, arthritis, and common colds; temporarily reduces fever.",
        quote: "Temporarily relieves minor aches and pains due to: the common cold, headache, backache, minor pain of arthritis, toothache, muscular aches, premenstrual and menstrual cramps; temporarily reduces fever."
      },
      {
        title: "How to Take & Food Guidance",
        content: "Take with a full glass of water. It can be taken with or without food. Taking it with food may help if you experience mild stomach discomfort.",
        quote: "Adults and children 12 years and over: take 1 to 2 tablets every 4 to 6 hours as needed. Do not exceed 6 tablets in 24 hours. May be administered without regard to meals."
      },
      {
        title: "Side Effects & Adverse Reactions",
        content: "Generally well tolerated at therapeutic doses. Rare adverse reactions include rash, nausea, or serious hypersensitivity reactions.",
        quote: "Adverse events from acetaminophen are rare when used as directed. Severe cutaneous adverse reactions, such as acute generalized exanthematous pustulosis, may occur."
      },
      {
        title: "Precautions & Warnings",
        content: "Liver disease patients and individuals consuming 3 or more alcoholic drinks daily must consult a physician before using.",
        quote: "Liver warning: This product contains acetaminophen. Severe liver damage may occur if you take more than 4,000 mg in 24 hours, with other drugs containing acetaminophen, or 3 or more alcoholic drinks every day."
      }
    ],
    source: {
      title: "DailyMed: Acetaminophen Tablet (US FDA Label Reference)",
      url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a01e4bb2-e7f0-4a8b-b8c7-43c22ffbe567",
      updated: "2024-08-15"
    }
  },
  ibuprofen: {
    name: "Ibuprofen 400 mg Tablet",
    summary: "Ibuprofen is a Nonsteroidal Anti-inflammatory Drug (NSAID) used to relieve pain, reduce inflammation, and lower fever.",
    safetyNotices: [
      { type: "urgent", text: "Stomach Bleeding Warning: NSAIDs may cause severe stomach bleeding. Risk is higher in patients over 60, those taking blood thinners, or when taken with alcohol." },
      { type: "caution", text: "Cardiovascular Warning: NSAIDs cause an increased risk of serious cardiovascular thrombotic events, including myocardial infarction and stroke." }
    ],
    sections: [
      {
        title: "Indications & Uses",
        content: "Indicated for relief of mild to moderate pain including headache, migraine, toothache, muscular pain, menstrual pain, and reduction of fever.",
        quote: "For relief of signs and symptoms of rheumatoid arthritis and osteoarthritis, and for mild to moderate pain."
      },
      {
        title: "Food Guidance & Administration",
        content: "Always take with food, milk, or a full glass of water to reduce gastrointestinal irritation and stomach upset.",
        quote: "If gastrointestinal upset occurs, ibuprofen may be taken with meals or with milk."
      },
      {
        title: "Side Effects",
        content: "Common side effects include indigestion, heartburn, nausea, dizziness, and mild abdominal discomfort.",
        quote: "Most frequent adverse reactions to ibuprofen are gastrointestinal: nausea, epigastric pain, heartburn, and diarrhea."
      }
    ],
    source: {
      title: "DailyMed: Ibuprofen Tablet (US FDA Label Reference)",
      url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=80509a56-427c-4735-a50e-11005ef05634",
      updated: "2024-05-10"
    }
  },
  metformin: {
    name: "Metformin Hydrochloride 500 mg Tablet",
    summary: "Metformin is an oral biguanide antihyperglycemic medication prescribed as first-line therapy to manage blood sugar in patients with type 2 diabetes mellitus.",
    safetyNotices: [
      { type: "urgent", text: "Boxed Warning: Lactic Acidosis: Rare but fatal accumulation of lactic acid in patients with renal impairment, sepsis, or acute congestive heart failure." }
    ],
    sections: [
      {
        title: "Mechanism of Action",
        content: "Decreases hepatic glucose production, decreases intestinal glucose absorption, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.",
        quote: "Metformin decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake."
      },
      {
        title: "How to Take",
        content: "Take with meals to minimize gastrointestinal disturbances. Swallow whole; do not crush or chew extended-release forms.",
        quote: "Dosage must be individualized. Metformin should be taken with meals, starting at a low dose with gradual dose escalation."
      },
      {
        title: "Side Effects",
        content: "Common early side effects include diarrhea, nausea, vomiting, flatulence, abdominal discomfort, and metallic taste.",
        quote: "Gastrointestinal symptoms (diarrhea, nausea, vomiting, flatulence) are the most common reactions and occur in approximately 30% of patients."
      }
    ],
    source: {
      title: "DailyMed: Metformin Hydrochloride Tablet (US FDA Label Reference)",
      url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=29b9f0ff-1913-4c91-9e22-e37a28ff745d",
      updated: "2024-02-28"
    }
  },
  amoxicillin: {
    name: "Amoxicillin 500 mg Capsule",
    summary: "Amoxicillin is a penicillin-class antibacterial medication used to treat bacterial infections of the ear, nose, throat, skin, and respiratory tract.",
    safetyNotices: [
      { type: "urgent", text: "Anaphylaxis / Penicillin Allergy Warning: Serious and occasionally fatal hypersensitivity (anaphylactic) reactions have been reported in patients on penicillin therapy." }
    ],
    sections: [
      {
        title: "Uses & Indications",
        content: "Prescribed solely for bacterial infections (such as ear infections, bronchitis, pneumonia, and UTI). It is not effective against viral infections like flu or cold.",
        quote: "Amoxicillin is indicated in the treatment of infections due to susceptible strains of designated microorganisms."
      },
      {
        title: "Food Guidance",
        content: "May be taken without regard to meals. Taking with a meal may decrease possible stomach upset.",
        quote: "May be taken with or without food. Complete the full prescribed course of treatment even if symptoms disappear."
      },
      {
        title: "Side Effects",
        content: "Common reactions include mild diarrhea, nausea, skin rash, or vomiting. Contact a doctor if severe watery diarrhea occurs.",
        quote: "Adverse events include nausea, vomiting, diarrhea, and hypersensitivity reactions (rash, urticaria)."
      }
    ],
    source: {
      title: "DailyMed: Amoxicillin Capsule (US FDA Label Reference)",
      url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b9c4505f-f3e0-47b2-bd54-7f12e5a7b6cf",
      updated: "2024-07-02"
    }
  }
};

function initWelcomeMessage() {
  messagesContainer.innerHTML = `
    <div class="message-row assistant">
      <div class="avatar">M</div>
      <div class="bubble">
        <div class="bot-header">
          <span class="bot-title">MED GPT Assistant</span>
          <span class="badge-source">Gemini structured overview</span>
        </div>
        <p class="bot-summary">
          Hello! I am your clinical medicine information assistant. Ask me questions about active ingredients, strengths, uses, food guidance, side effects, or precautions.
        </p>
        <p class="bot-summary" style="margin-top: 8px; font-size: 13px; color: var(--text-muted);">
          <em>Example: "What is Paracetamol 650 mg used for, and can I take it with food?" or "Tell me about Metformin 500 mg side effects."</em>
        </p>
      </div>
    </div>
  `;
}

function attachmentKind(file) {
  if (!file) return "file";
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "PDF";
  return "text file";
}

function updateAttachmentPreview() {
  if (!attachmentPreview) return;
  if (!selectedAttachment) {
    attachmentPreview.hidden = true;
    attachmentPreview.innerHTML = "";
    return;
  }
  const thumbnail = selectedAttachment.type.startsWith("image/") && selectedAttachmentUrl
    ? `<img src="${escapeHtml(selectedAttachmentUrl)}" alt="Selected medicine image preview" />`
    : `<span class="attachment-file-icon" aria-hidden="true">FILE</span>`;
  attachmentPreview.hidden = false;
  attachmentPreview.innerHTML = `
    ${thumbnail}
    <div class="attachment-preview-copy">
      <strong>${escapeHtml(selectedAttachment.name)}</strong>
      <span>${escapeHtml(attachmentKind(selectedAttachment))} · ${Math.ceil(selectedAttachment.size / 1024)} KB</span>
    </div>
    <button type="button" class="attachment-remove" id="attachment-remove" aria-label="Remove attachment">Remove</button>
  `;
  document.querySelector("#attachment-remove")?.addEventListener("click", clearAttachment);
}

function clearAttachment() {
  if (selectedAttachmentUrl) URL.revokeObjectURL(selectedAttachmentUrl);
  selectedAttachmentUrl = "";
  selectedAttachment = null;
  if (attachmentInput) attachmentInput.value = "";
  updateAttachmentPreview();
}

function readAttachmentAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onload = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : "");
    };
    reader.readAsDataURL(file);
  });
}

function appendUserMessage(text, attachment) {
  const row = document.createElement("div");
  row.className = "message-row user";
  const message = text || `Attached ${attachmentKind(attachment)} for medicine information.`;
  const attachmentHtml = attachment ? `<div class="message-attachment">${escapeHtml(attachment.name)} <span>· ${escapeHtml(attachmentKind(attachment))}</span></div>` : "";
  row.innerHTML = `
    <div class="avatar">You</div>
    <div class="bubble">${attachmentHtml}${escapeHtml(message)}</div>
  `;
  messagesContainer.appendChild(row);
  scrollToBottom();
}

function appendLoadingMessage(hasAttachment = false) {
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.id = "loading-message";
  row.innerHTML = `
    <div class="avatar">M</div>
    <div class="bubble">
      <div class="typing-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <span style="font-size: 13px; color: var(--text-muted); margin-left: 8px;">${hasAttachment ? "Reviewing your attachment and creating a structured overview..." : "Creating a structured Gemini medicine overview..."}</span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(row);
  scrollToBottom();
  return row;
}

function renderAssistantCard(data, isLive = false) {
  const row = document.createElement("div");
  row.className = "message-row assistant";

  let safetyNoticesHtml = "";
  if (data.safetyNotices && data.safetyNotices.length > 0) {
    safetyNoticesHtml = data.safetyNotices.map(notice => {
      const cls = notice.severity === "urgent" || notice.type === "urgent" ? "urgent" : "caution";
      const icon = cls === "urgent" ? "🚨 Urgent Safety Notice: " : "⚠️ Caution: ";
      return `<div class="notice-box ${cls}"><strong>${icon}</strong>${escapeHtml(notice.message || notice.text)}</div>`;
    }).join("");
  }

  let sectionsHtml = "";
  if (data.sections && data.sections.length > 0) {
    sectionsHtml = `<div class="sections-grid">` + data.sections.map(s => {
      let quoteDetail = "";
      if (s.quote) {
        quoteDetail = `
          <details class="section-quote-details">
            <summary>Verified FDA Label Excerpt</summary>
            <blockquote>${escapeHtml(s.quote)}</blockquote>
          </details>
        `;
      }
      return `
        <div class="section-card">
          <h4>${escapeHtml(s.title)}</h4>
          <p>${escapeHtml(s.content)}</p>
          ${quoteDetail}
        </div>
      `;
    }).join("") + `</div>`;
  }

  let sourceHtml = "";
  if (data.source || (data.sources && data.sources[0])) {
    const src = data.source || data.sources[0];
    sourceHtml = `
      <div class="bot-footer">
        <span>Sourced from verified official US Label:</span>
        <a class="bot-source-link" href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(src.title)} ${src.updated ? `(${escapeHtml(src.updated)})` : ''} ↗
        </a>
      </div>
    `;
  }

  row.innerHTML = `
    <div class="avatar">M</div>
    <div class="bubble">
      <div class="bot-header">
        <span class="bot-title">${escapeHtml(data.name || data.medicine?.displayName || "Medicine Information")}</span>
        <span class="${isLive === 'general' ? 'badge-source' : isLive ? 'badge-source' : 'badge-demo'}">${isLive === 'general' ? 'Gemini educational overview' : isLive ? 'Verified label response' : 'Interactive Demo Preview'}</span>
      </div>
      <p class="bot-summary">${escapeHtml(data.summary || data.medicine?.confidenceNote || "")}</p>
      ${safetyNoticesHtml}
      ${sectionsHtml}
      ${sourceHtml}
    </div>
  `;

  messagesContainer.appendChild(row);
  scrollToBottom();
}

function renderStatusMessage(title, text) {
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.innerHTML = `
    <div class="avatar">M</div>
    <div class="bubble">
      <div class="bot-header">
        <span class="bot-title">${escapeHtml(title)}</span>
        <span class="badge-source">Live API response</span>
      </div>
      <div class="notice-box caution">${escapeHtml(text)}</div>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
        For a live label search, use the active ingredient, strength, and dosage form written on the package. MED GPT will not guess a brand composition.
      </p>
    </div>
  `;
  messagesContainer.appendChild(row);
  scrollToBottom();
}

function renderErrorMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.innerHTML = `
    <div class="avatar">M</div>
    <div class="bubble">
      <div class="notice-box urgent">
        <strong>Error: </strong>${escapeHtml(text)}
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
        Tip: Try again shortly. This public beta has a small daily usage limit.
      </p>
    </div>
  `;
  messagesContainer.appendChild(row);
  scrollToBottom();
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto-grow textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  const attachment = selectedAttachment;
  if (!text && !attachment) return;

  userInput.value = "";
  userInput.style.height = "auto";
  appendUserMessage(text, attachment);
  sendBtn.disabled = true;
  if (attachmentInput) attachmentInput.disabled = true;
  clearAttachment();

  const loadingRow = appendLoadingMessage(Boolean(attachment));

  try {
    const apiUrl = config.apiBaseUrl ? config.apiBaseUrl.replace(/\/+$/, "") : "";
    const message = text || "Please identify and explain the medicine shown in the attached file. State clearly if the medicine name, strength, or formulation cannot be read.";
    const attachmentPayload = attachment ? {
      name: attachment.name,
      mimeType: attachment.type,
      data: await readAttachmentAsBase64(attachment),
    } : undefined;

    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, ...(attachmentPayload ? { attachment: attachmentPayload } : {}) })
      });

      loadingRow.remove();
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server returned ${response.status}`);
      }

      const resData = await response.json();
      if (resData.status === "general") {
        renderAssistantCard(resData, "general");
      } else if (resData.status === "source_backed") {
        renderAssistantCard(resData, true);
      } else if (resData.status === "needs_confirmation") {
        renderStatusMessage("More package details needed", resData.message || "Confirm the active ingredient, strength, and dosage form on the package.");
      } else if (resData.status === "unsupported") {
        renderStatusMessage("This medicine is not supported", resData.message || "No matching supported label was found.");
      } else if (resData.status === "emergency") {
        renderStatusMessage("Emergency medical notice", resData.summary || "Seek immediate emergency clinical care or call emergency services.");
      } else {
        throw new Error("The service returned an unsupported response.");
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 600));
      loadingRow.remove();
      const lower = message.toLowerCase();
      const matchedData = lower.includes("paracetamol") || lower.includes("acetaminophen") || lower.includes("dolo") || lower.includes("crocin") ? demoDatabase.paracetamol
        : lower.includes("ibuprofen") || lower.includes("advil") || lower.includes("motrin") || lower.includes("combiflam") ? demoDatabase.ibuprofen
        : lower.includes("metformin") || lower.includes("glycomet") ? demoDatabase.metformin
        : lower.includes("amoxicillin") || lower.includes("amox") ? demoDatabase.amoxicillin
        : {
            name: "Medicine attachment received",
            summary: "Connect the live Gemini API to analyze an image or document. Always verify the active ingredient and strength on the package.",
            safetyNotices: [{ type: "caution", text: "A photo or document may be unclear. Confirm the medicine details with the packaging or a pharmacist." }],
            sections: [{ title: "Educational reference", content: "The live service can read a clear medicine photo, PDF, or text file and structure general medicine information." }]
          };
      renderAssistantCard(matchedData, false);
    }
  } catch (err) {
    if (loadingRow) loadingRow.remove();
    renderErrorMessage(err.message || "Failed to retrieve medicine data.");
  } finally {
    sendBtn.disabled = false;
    if (attachmentInput) attachmentInput.disabled = false;
    userInput.focus();
  }
});

attachmentInput?.addEventListener("change", () => {
  const file = attachmentInput.files?.[0];
  if (!file) return;
  if (!allowedAttachmentTypes.has(file.type) || file.size > maxAttachmentBytes) {
    clearAttachment();
    renderErrorMessage("Attach a JPG, PNG, WebP image, PDF, or text file up to 4 MB.");
    return;
  }
  if (selectedAttachmentUrl) URL.revokeObjectURL(selectedAttachmentUrl);
  selectedAttachment = file;
  selectedAttachmentUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
  updateAttachmentPreview();
});
attachmentInput?.addEventListener("click", () => { attachmentInput.value = ""; });

// Sidebar & chips listeners
sidebarToggleBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

newChatBtn?.addEventListener("click", () => {
  clearAttachment();
  initWelcomeMessage();
  userInput.focus();
});

document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.addEventListener("click", () => {
    userInput.value = btn.getAttribute("data-prompt");
    userInput.focus();
    userInput.dispatchEvent(new Event("input"));
    sidebar.classList.remove("open");
  });
});

// Initialize on page load
initWelcomeMessage();
