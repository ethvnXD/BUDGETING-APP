const STORAGE_KEY = "myBudgetDataV1";

const defaults = {
  paychecks: [],
  bills: [],
  goals: []
};

let budget = loadBudget();
let currentEntryType = "paycheck";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const entryDialog = document.getElementById("entryDialog");
const entryForm = document.getElementById("entryForm");
const formFields = document.getElementById("formFields");
const dialogTitle = document.getElementById("dialogTitle");
const dialogEyebrow = document.getElementById("dialogEyebrow");
const payrollDialog = document.getElementById("payrollDialog");
const providerMessage = document.getElementById("providerMessage");
const payrollStatus = document.getElementById("payrollStatus");

function loadBudget() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      paychecks: Array.isArray(saved?.paychecks) ? saved.paychecks : [],
      bills: Array.isArray(saved?.bills) ? saved.bills : [],
      goals: Array.isArray(saved?.goals) ? saved.goals : []
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveBudget() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  render();
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function isThisMonth(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue + "T12:00:00");
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function safeNumber(value) {
  const parsed = Number(String(value).replace(/[$,]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  if (!value) return "No date";
  const d = new Date(value + "T12:00:00");
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function render() {
  renderSummary();
  renderPaychecks();
  renderBills();
  renderGoals();
}

function renderSummary() {
  const monthPaychecks = budget.paychecks.filter(item => isThisMonth(item.date));
  const monthBills = budget.bills.filter(item => isThisMonth(item.dueDate));
  const income = monthPaychecks.reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const bills = monthBills.reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const savings = budget.goals.reduce((sum, item) => sum + safeNumber(item.saved), 0);

  document.getElementById("incomeTotal").textContent = money.format(income);
  document.getElementById("billTotal").textContent = money.format(bills);
  document.getElementById("availableTotal").textContent = money.format(income - bills);
  document.getElementById("savingsTotal").textContent = money.format(savings);
  document.getElementById("paycheckCount").textContent = `${monthPaychecks.length} paycheck${monthPaychecks.length === 1 ? "" : "s"} this month`;
  document.getElementById("billCount").textContent = `${monthBills.length} bill${monthBills.length === 1 ? "" : "s"} this month`;
  document.getElementById("goalCount").textContent = `${budget.goals.length} active goal${budget.goals.length === 1 ? "" : "s"}`;
}

function getEmptyState() {
  return document.getElementById("emptyTemplate").content.cloneNode(true);
}

function renderPaychecks() {
  const list = document.getElementById("paycheckList");
  list.innerHTML = "";

  const items = [...budget.paychecks].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  if (!items.length) {
    list.append(getEmptyState());
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div class="row-main">
        <strong>${escapeHtml(item.source || "Paycheck")}</strong>
        <span>${formatDate(item.date)}${item.note ? " · " + escapeHtml(item.note) : ""}</span>
      </div>
      <div class="row-amount">${money.format(safeNumber(item.amount))}</div>
      <div class="row-actions">
        <button class="small-action" type="button" data-action="delete-paycheck" data-id="${item.id}">Delete</button>
      </div>`;
    list.append(row);
  }
}

function renderBills() {
  const list = document.getElementById("billList");
  list.innerHTML = "";

  const items = [...budget.bills].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  if (!items.length) {
    list.append(getEmptyState());
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "list-row" + (item.paid ? " bill-paid" : "");
    row.innerHTML = `
      <div class="row-main">
        <strong>${escapeHtml(item.name || "Bill")}</strong>
        <span>Due ${formatDate(item.dueDate)}${item.group ? " · " + escapeHtml(item.group) : ""}</span>
      </div>
      <div class="row-amount">${money.format(safeNumber(item.amount))}</div>
      <div class="row-actions">
        <button class="small-action" type="button" data-action="toggle-bill" data-id="${item.id}">${item.paid ? "Undo" : "Paid"}</button>
        <button class="small-action" type="button" data-action="delete-bill" data-id="${item.id}">Delete</button>
      </div>`;
    list.append(row);
  }
}

function renderGoals() {
  const list = document.getElementById("goalList");
  list.innerHTML = "";

  if (!budget.goals.length) {
    list.append(getEmptyState());
    return;
  }

  for (const item of budget.goals) {
    const target = Math.max(safeNumber(item.target), 0);
    const saved = Math.max(safeNumber(item.saved), 0);
    const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML = `
      <div class="goal-top">
        <div>
          <strong>${escapeHtml(item.name || "Savings goal")}</strong>
          <span>${money.format(saved)} of ${money.format(target)}</span>
        </div>
        <button class="small-action" type="button" data-action="delete-goal" data-id="${item.id}">Delete</button>
      </div>
      <div class="progress-track" aria-label="${percent}% complete">
        <div class="progress-bar" style="width:${percent}%"></div>
      </div>`;
    list.append(card);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openEntry(type) {
  currentEntryType = type;

  if (type === "paycheck") {
    dialogEyebrow.textContent = "Income";
    dialogTitle.textContent = "Add paycheck";
    formFields.innerHTML = `
      <div class="form-grid">
        <div class="field full">
          <label for="source">Employer or source</label>
          <input id="source" name="source" placeholder="Example: Vehlo" required>
        </div>
        <div class="field">
          <label for="amount">Take-home amount</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0.00" required>
        </div>
        <div class="field">
          <label for="date">Pay date</label>
          <input id="date" name="date" type="date" required>
        </div>
        <div class="field full">
          <label for="note">Note (optional)</label>
          <input id="note" name="note" placeholder="Regular paycheck, overtime, bonus...">
        </div>
      </div>`;
  }

  if (type === "bill") {
    dialogEyebrow.textContent = "Expenses";
    dialogTitle.textContent = "Add bill";
    formFields.innerHTML = `
      <div class="form-grid">
        <div class="field full">
          <label for="name">Bill name</label>
          <input id="name" name="name" placeholder="Car payment, insurance, phone..." required>
        </div>
        <div class="field">
          <label for="amount">Amount</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0.00" required>
        </div>
        <div class="field">
          <label for="dueDate">Due date</label>
          <input id="dueDate" name="dueDate" type="date" required>
        </div>
        <div class="field full">
          <label for="group">Paycheck group (optional)</label>
          <input id="group" name="group" placeholder="Example: First paycheck">
        </div>
      </div>`;
  }

  if (type === "goal") {
    dialogEyebrow.textContent = "Savings";
    dialogTitle.textContent = "Add savings goal";
    formFields.innerHTML = `
      <div class="form-grid">
        <div class="field full">
          <label for="name">Goal name</label>
          <input id="name" name="name" placeholder="Emergency fund, vacation, car..." required>
        </div>
        <div class="field">
          <label for="target">Target amount</label>
          <input id="target" name="target" type="number" min="0" step="0.01" placeholder="0.00" required>
        </div>
        <div class="field">
          <label for="saved">Already saved</label>
          <input id="saved" name="saved" type="number" min="0" step="0.01" value="0">
        </div>
      </div>`;
  }

  entryDialog.showModal();
}

entryForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(entryForm).entries());

  if (currentEntryType === "paycheck") {
    budget.paychecks.push({
      id: uid(),
      source: data.source.trim(),
      amount: safeNumber(data.amount),
      date: data.date,
      note: data.note.trim()
    });
  }

  if (currentEntryType === "bill") {
    budget.bills.push({
      id: uid(),
      name: data.name.trim(),
      amount: safeNumber(data.amount),
      dueDate: data.dueDate,
      group: data.group.trim(),
      paid: false
    });
  }

  if (currentEntryType === "goal") {
    budget.goals.push({
      id: uid(),
      name: data.name.trim(),
      target: safeNumber(data.target),
      saved: safeNumber(data.saved)
    });
  }

  entryDialog.close();
  entryForm.reset();
  saveBudget();
});

document.getElementById("cancelDialog").addEventListener("click", () => entryDialog.close());
document.getElementById("addPaycheckButton").addEventListener("click", () => openEntry("paycheck"));
document.getElementById("addPaycheckInline").addEventListener("click", () => openEntry("paycheck"));
document.getElementById("addBillButton").addEventListener("click", () => openEntry("bill"));
document.getElementById("addGoalButton").addEventListener("click", () => openEntry("goal"));

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "delete-paycheck") {
    budget.paychecks = budget.paychecks.filter(item => item.id !== id);
  } else if (action === "delete-bill") {
    budget.bills = budget.bills.filter(item => item.id !== id);
  } else if (action === "toggle-bill") {
    const item = budget.bills.find(item => item.id === id);
    if (item) item.paid = !item.paid;
  } else if (action === "delete-goal") {
    budget.goals = budget.goals.filter(item => item.id !== id);
  }

  saveBudget();
});

document.getElementById("linkPayrollButton").addEventListener("click", () => {
  providerMessage.hidden = true;
  payrollDialog.showModal();
});

document.getElementById("providerGrid").addEventListener("click", event => {
  const provider = event.target.closest("[data-provider]")?.dataset.provider;
  if (!provider) return;

  providerMessage.hidden = false;
  providerMessage.innerHTML = `
    <strong>${escapeHtml(provider)} is ready for a secure connector.</strong><br>
    The browser-only version cannot safely hold payroll API secrets or employer login credentials. For now, export a pay history CSV from ${escapeHtml(provider)} and use <em>Import CSV</em>. A direct connection can be added later through an approved payroll aggregation API and private backend.
  `;
});

document.getElementById("csvInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = parseCsv(text);
    let added = 0;

    for (const row of rows) {
      const normalized = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [normalizeHeading(key), value])
      );

      const date = findValue(normalized, ["paydate", "checkdate", "paymentdate", "date"]);
      const amount = findValue(normalized, ["netpay", "netamount", "takehome", "takehomepay", "amount"]);
      const source = findValue(normalized, ["employer", "company", "source", "employername"]) || "Imported paycheck";
      const note = findValue(normalized, ["description", "type", "paytype"]) || "Imported from payroll CSV";

      if (!date || !amount) continue;

      const cleanDate = normalizeDate(date);
      if (!cleanDate) continue;

      budget.paychecks.push({
        id: uid(),
        source: String(source).trim(),
        amount: safeNumber(amount),
        date: cleanDate,
        note: String(note).trim()
      });
      added++;
    }

    if (!added) {
      payrollStatus.textContent = "No paychecks were imported. Make sure the file has pay date and net pay columns.";
      return;
    }

    payrollStatus.textContent = `Imported ${added} paycheck${added === 1 ? "" : "s"}.`;
    saveBudget();
  } catch {
    payrollStatus.textContent = "That CSV could not be read. Try exporting it again from your payroll app.";
  } finally {
    event.target.value = "";
  }
});

function normalizeHeading(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && String(row[key]).trim() !== "") return row[key];
  }
  return "";
}

function normalizeDate(value) {
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some(cell => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some(cell => cell.trim() !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(cell => cell.trim());
  return rows.slice(1).map(cells =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}

document.getElementById("exportButton").addEventListener("click", exportBackup);

function exportBackup() {
  const blob = new Blob([JSON.stringify(budget, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-budget-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.getElementById("importButton").addEventListener("click", () => {
  document.getElementById("backupInput").click();
});

document.getElementById("backupInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.paychecks) || !Array.isArray(parsed.bills) || !Array.isArray(parsed.goals)) {
      throw new Error("Invalid backup");
    }
    budget = parsed;
    saveBudget();
    alert("Backup restored.");
  } catch {
    alert("That file does not look like a My Budget backup.");
  } finally {
    event.target.value = "";
  }
});

document.getElementById("clearButton").addEventListener("click", () => {
  if (!confirm("Clear every paycheck, bill, and savings goal from this browser?")) return;
  budget = structuredClone(defaults);
  saveBudget();
});

render();
