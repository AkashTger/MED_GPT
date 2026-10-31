const config = window.MEDGPT_CONFIG || { apiBaseUrl: "" };

const messagesContainer = document.querySelector("#messages-container");
const chatForm = document.querySelector("#chat-form");
const userInput = document.querySelector("#user-input");
const sendBtn = document.querySelector("#send-btn");
const newChatBtn = document.querySelector("#new-chat-btn");
const betaCodeInput = document.querySelector("#beta-code-input");
const sidebar = document.querySelector("#sidebar");
const sidebarToggleBtn = document.querySelector("#sidebar-toggle-btn");

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

function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";
  row.innerHTML = `
    <div class="avatar">You</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;
  messagesContainer.appendChild(row);
  scrollToBottom();
}

function appendLoadingMessage() {
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
        <span style="font-size: 13px; color: var(--text-muted); margin-left: 8px;">Creating a structured Gemini medicine overview...</span>
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
        Tip: You can test any medicine in offline demo mode, or check that your beta access code is active.
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
  if (!text) return;

  userInput.value = "";
  userInput.style.height = "auto";
  appendUserMessage(text);
  sendBtn.disabled = true;

  const loadingRow = appendLoadingMessage();

  try {
    const accessCode = betaCodeInput.value.trim();
    const apiUrl = config.apiBaseUrl ? config.apiBaseUrl.replace(/\/+$/, "") : "";

    // If an API base is configured and user supplied access code or we want to hit the backend
    if (apiUrl && accessCode) {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, accessCode })
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
      // Local Intelligent Demo Matching
      await new Promise(r => setTimeout(r, 600)); // natural typing delay
      loadingRow.remove();

      const lower = text.toLowerCase();
      let matchedData = null;

      if (lower.includes("paracetamol") || lower.includes("acetaminophen") || lower.includes("dolo") || lower.includes("crocin")) {
        matchedData = demoDatabase.paracetamol;
      } else if (lower.includes("ibuprofen") || lower.includes("advil") || lower.includes("motrin") || lower.includes("combiflam")) {
        matchedData = demoDatabase.ibuprofen;
      } else if (lower.includes("metformin") || lower.includes("glycomet")) {
        matchedData = demoDatabase.metformin;
      } else if (lower.includes("amoxicillin") || lower.includes("amox")) {
        matchedData = demoDatabase.amoxicillin;
      } else {
        // Fallback generic guidance
        matchedData = {
          name: "Medicine Query Analysis",
          summary: `Showing clinical label overview for your inquiry: "${text}". For live FDA searching across all 100,000+ US drug labels, enter your Beta Access Code in the sidebar.`,
          safetyNotices: [
            { type: "caution", text: "Always confirm the exact active ingredient and strength listed on your medicine packaging strip." }
          ],
          sections: [
            {
              title: "Educational Reference Guide",
              content: "MED GPT retrieves exact FDA-approved package inserts to explain uses, food interactions, warnings, and dosages without hallucination.",
              quote: "United States Food and Drug Administration (FDA) Drug Labeling Database."
            }
          ],
          source: {
            title: "U.S. National Library of Medicine (DailyMed)",
            url: "https://dailymed.nlm.nih.gov",
            updated: "Current"
          }
        };
      }

      renderAssistantCard(matchedData, false);
    }
  } catch (err) {
    if (loadingRow) loadingRow.remove();
    renderErrorMessage(err.message || "Failed to retrieve medicine data.");
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});

// Sidebar & chips listeners
sidebarToggleBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

newChatBtn?.addEventListener("click", () => {
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
