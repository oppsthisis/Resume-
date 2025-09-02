"use strict";

// Global application state
const appState = {
  template: "classic",
  theme: "theme-blue",
  personal: {
    fullName: "Your Name",
    title: "Your Title",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  },
  skills: [],
  experiences: [], // { id, role, company, start, end, description }
  education: [], // { id, degree, school, year, description }
};

// Utilities
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function setHiddenByContent(element, content) {
  if (!element) return;
  const isEmpty = !content || (Array.isArray(content) && content.length === 0);
  element.hidden = isEmpty;
}

function sanitize(text) {
  return String(text || "").trim();
}

// DOM references
const refs = {
  // Controls
  templateSelect: document.getElementById("templateSelect"),
  themeSelect: document.getElementById("themeSelect"),
  downloadPdfBtn: document.getElementById("downloadPdfBtn"),

  // Personal inputs
  inputName: document.getElementById("inputName"),
  inputTitle: document.getElementById("inputTitle"),
  inputEmail: document.getElementById("inputEmail"),
  inputPhone: document.getElementById("inputPhone"),
  inputLocation: document.getElementById("inputLocation"),
  inputWebsite: document.getElementById("inputWebsite"),
  inputSummary: document.getElementById("inputSummary"),

  // Skills
  inputSkill: document.getElementById("inputSkill"),
  skillsList: document.getElementById("skillsList"),
  skillsChips: document.getElementById("skillsChips"),
  clearSkillsBtn: document.getElementById("clearSkillsBtn"),

  // Experience/Education forms
  addExperienceBtn: document.getElementById("addExperienceBtn"),
  experienceForms: document.getElementById("experienceForms"),
  addEducationBtn: document.getElementById("addEducationBtn"),
  educationForms: document.getElementById("educationForms"),

  // Preview root
  previewRoot: document.getElementById("resumePreviewRoot"),
  pvName: document.getElementById("pvName"),
  pvTitle: document.getElementById("pvTitle"),
  pvContacts: document.getElementById("pvContacts"),
  pvSummaryWrap: document.getElementById("pvSummaryWrap"),
  pvSummary: document.getElementById("pvSummary"),
  pvSkillsWrap: document.getElementById("pvSkillsWrap"),
  pvSkills: document.getElementById("pvSkills"),
  pvExperienceWrap: document.getElementById("pvExperienceWrap"),
  pvExperience: document.getElementById("pvExperience"),
  pvEducationWrap: document.getElementById("pvEducationWrap"),
  pvEducation: document.getElementById("pvEducation"),
};

// Skills suggestions
const popularSkills = [
  "JavaScript",
  "TypeScript",
  "HTML5",
  "CSS3",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "REST APIs",
  "GraphQL",
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Figma",
  "UI/UX",
  "Tailwind CSS",
  "Redux",
  "Jest",
  "Cypress",
  "Agile/Scrum",
];

function populateSkillSuggestions() {
  refs.skillsList.innerHTML = popularSkills
    .map((s) => `<option value="${s}"></option>`) // safe content
    .join("");
}

function addSkillFromInput() {
  const value = sanitize(refs.inputSkill.value);
  if (!value) return;
  if (!appState.skills.includes(value)) {
    appState.skills.push(value);
    renderSkillsChips();
    renderPreview();
  }
  refs.inputSkill.value = "";
}

function removeSkill(value) {
  appState.skills = appState.skills.filter((s) => s !== value);
  renderSkillsChips();
  renderPreview();
}

function renderSkillsChips() {
  refs.skillsChips.innerHTML = appState.skills
    .map(
      (s) => `
      <span class="chip" data-skill="${s}">
        <span>${s}</span>
        <button class="remove" aria-label="Remove ${s}" data-remove-skill="${s}">×</button>
      </span>`
    )
    .join("");
}

// Experience/Education form builders
function buildExperienceFormItem(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "form-card";
  wrapper.dataset.id = item.id;
  wrapper.innerHTML = `
    <div class="form-row">
      <label>
        <span>Role</span>
        <input type="text" data-field="role" value="${item.role || ""}" placeholder="e.g., Frontend Engineer" />
      </label>
      <label>
        <span>Company</span>
        <input type="text" data-field="company" value="${item.company || ""}" placeholder="e.g., Acme Inc." />
      </label>
    </div>
    <div class="form-row">
      <label>
        <span>Start</span>
        <input type="text" data-field="start" value="${item.start || ""}" placeholder="Jan 2022" />
      </label>
      <label>
        <span>End</span>
        <input type="text" data-field="end" value="${item.end || "Present"}" placeholder="Present" />
      </label>
    </div>
    <label>
      <span>Description</span>
      <textarea rows="3" data-field="description" placeholder="Key achievements & responsibilities">${item.description || ""}</textarea>
    </label>
    <div class="section-actions">
      <button data-action="remove" class="ghost">Remove</button>
    </div>
  `;
  return wrapper;
}

function buildEducationFormItem(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "form-card";
  wrapper.dataset.id = item.id;
  wrapper.innerHTML = `
    <div class="form-row">
      <label>
        <span>Degree</span>
        <input type="text" data-field="degree" value="${item.degree || ""}" placeholder="e.g., BS Computer Science" />
      </label>
      <label>
        <span>School</span>
        <input type="text" data-field="school" value="${item.school || ""}" placeholder="e.g., FAST NUCES" />
      </label>
    </div>
    <div class="form-row">
      <label>
        <span>Year</span>
        <input type="text" data-field="year" value="${item.year || ""}" placeholder="2024" />
      </label>
      <label>
        <span>Details</span>
        <input type="text" data-field="description" value="${item.description || ""}" placeholder="Honors, GPA, etc." />
      </label>
    </div>
    <div class="section-actions">
      <button data-action="remove" class="ghost">Remove</button>
    </div>
  `;
  return wrapper;
}

function attachFormEvents(container, kind) {
  container.addEventListener("input", (e) => {
    const target = e.target;
    const wrapper = target.closest(".form-card");
    if (!wrapper) return;
    const id = wrapper.dataset.id;
    const field = target.getAttribute("data-field");
    if (!field) return;
    const list = kind === "experience" ? appState.experiences : appState.education;
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) {
      list[idx][field] = sanitize(target.value);
      renderPreview();
    }
  });

  container.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("button[data-action='remove']");
    if (removeBtn) {
      const card = removeBtn.closest(".form-card");
      const id = card?.dataset.id;
      if (!id) return;
      if (kind === "experience") {
        appState.experiences = appState.experiences.filter((x) => x.id !== id);
      } else {
        appState.education = appState.education.filter((x) => x.id !== id);
      }
      card.remove();
      renderPreview();
    }
  });
}

// Preview rendering
function renderPreview() {
  // Apply theme and template classes
  const root = refs.previewRoot;
  root.classList.remove("template-classic", "template-modern", "theme-blue", "theme-emerald", "theme-rose", "theme-amber", "theme-slate");
  root.classList.add(`template-${appState.template}`, appState.theme);

  // Personal
  refs.pvName.textContent = sanitize(appState.personal.fullName) || "Your Name";
  refs.pvTitle.textContent = sanitize(appState.personal.title) || "Your Title";

  const contacts = [];
  if (sanitize(appState.personal.email)) contacts.push(appState.personal.email);
  if (sanitize(appState.personal.phone)) contacts.push(appState.personal.phone);
  if (sanitize(appState.personal.location)) contacts.push(appState.personal.location);
  if (sanitize(appState.personal.website)) contacts.push(appState.personal.website);
  refs.pvContacts.innerHTML = contacts.map((c) => `<span>${c}</span>`).join("  ");

  // Summary
  refs.pvSummary.textContent = sanitize(appState.personal.summary);
  setHiddenByContent(refs.pvSummaryWrap, refs.pvSummary.textContent);

  // Skills
  refs.pvSkills.innerHTML = appState.skills.map((s) => `<li>${s}</li>`).join("");
  setHiddenByContent(refs.pvSkillsWrap, appState.skills);

  // Experience
  refs.pvExperience.innerHTML = appState.experiences
    .map((exp) => {
      const role = sanitize(exp.role);
      const company = sanitize(exp.company);
      const date = [sanitize(exp.start), sanitize(exp.end)].filter(Boolean).join(" — ");
      const description = sanitize(exp.description);
      return `
      <article class="timeline-item" draggable="true" data-id="${exp.id}">
        <h4>${role || "Role"} • ${company || "Company"}</h4>
        <div class="meta">${date}</div>
        <p>${description}</p>
      </article>`;
    })
    .join("");
  setHiddenByContent(refs.pvExperienceWrap, appState.experiences);

  // Education
  refs.pvEducation.innerHTML = appState.education
    .map((ed) => {
      const degree = sanitize(ed.degree);
      const school = sanitize(ed.school);
      const year = sanitize(ed.year);
      const description = sanitize(ed.description);
      return `
      <article class="timeline-item">
        <h4>${degree || "Degree"} • ${school || "School"}</h4>
        <div class="meta">${year}</div>
        <p>${description}</p>
      </article>`;
    })
    .join("");
  setHiddenByContent(refs.pvEducationWrap, appState.education);

  attachDragAndDropHandlers();
}

// Drag and drop for experience items (preview side)
function attachDragAndDropHandlers() {
  const items = Array.from(refs.pvExperience.querySelectorAll("[draggable='true']"));
  let dragId = null;
  items.forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragId = el.dataset.id || null;
      e.dataTransfer?.setData("text/plain", dragId || "");
      e.dataTransfer?.setDragImage(el, 20, 20);
    });
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetId = el.dataset.id;
      const sourceId = dragId || e.dataTransfer?.getData("text/plain");
      if (!sourceId || !targetId || sourceId === targetId) return;
      reorderExperience(sourceId, targetId);
    });
  });
}

function reorderExperience(sourceId, targetId) {
  const list = appState.experiences.slice();
  const fromIndex = list.findIndex((x) => x.id === sourceId);
  const toIndex = list.findIndex((x) => x.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  appState.experiences = list;
  renderPreview();
}

// Event wiring
function wireControls() {
  refs.templateSelect.addEventListener("change", () => {
    appState.template = refs.templateSelect.value;
    renderPreview();
  });
  refs.themeSelect.addEventListener("change", () => {
    appState.theme = refs.themeSelect.value;
    renderPreview();
  });

  // Personal inputs
  refs.inputName.addEventListener("input", () => {
    appState.personal.fullName = sanitize(refs.inputName.value);
    renderPreview();
  });
  refs.inputTitle.addEventListener("input", () => {
    appState.personal.title = sanitize(refs.inputTitle.value);
    renderPreview();
  });
  refs.inputEmail.addEventListener("input", () => {
    appState.personal.email = sanitize(refs.inputEmail.value);
    renderPreview();
  });
  refs.inputPhone.addEventListener("input", () => {
    appState.personal.phone = sanitize(refs.inputPhone.value);
    renderPreview();
  });
  refs.inputLocation.addEventListener("input", () => {
    appState.personal.location = sanitize(refs.inputLocation.value);
    renderPreview();
  });
  refs.inputWebsite.addEventListener("input", () => {
    appState.personal.website = sanitize(refs.inputWebsite.value);
    renderPreview();
  });
  refs.inputSummary.addEventListener("input", () => {
    appState.personal.summary = sanitize(refs.inputSummary.value);
    renderPreview();
  });

  // Skills input
  refs.inputSkill.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkillFromInput();
    }
  });
  refs.skillsChips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-skill]");
    if (btn) removeSkill(String(btn.getAttribute("data-remove-skill")));
  });
  refs.clearSkillsBtn.addEventListener("click", () => {
    appState.skills = [];
    renderSkillsChips();
    renderPreview();
  });

  // Experience add
  refs.addExperienceBtn.addEventListener("click", () => {
    const item = { id: generateId("exp"), role: "", company: "", start: "", end: "Present", description: "" };
    appState.experiences.push(item);
    const node = buildExperienceFormItem(item);
    refs.experienceForms.appendChild(node);
    renderPreview();
  });

  // Education add
  refs.addEducationBtn.addEventListener("click", () => {
    const item = { id: generateId("edu"), degree: "", school: "", year: "", description: "" };
    appState.education.push(item);
    const node = buildEducationFormItem(item);
    refs.educationForms.appendChild(node);
    renderPreview();
  });

  // Attach delegated handlers for dynamic forms
  attachFormEvents(refs.experienceForms, "experience");
  attachFormEvents(refs.educationForms, "education");

  // PDF export
  refs.downloadPdfBtn.addEventListener("click", () => {
    const element = refs.previewRoot;
    const opt = {
      margin:       0,
      filename:     `${sanitize(appState.personal.fullName) || "resume"}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().from(element).set(opt).save();
  });
}

function init() {
  populateSkillSuggestions();
  wireControls();
  renderSkillsChips();
  renderPreview();
}

document.addEventListener("DOMContentLoaded", init);

