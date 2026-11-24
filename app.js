// =====================================================
// Recipe Finder - app.js
// API: TheMealDB (free, no API key)
// https://www.themealdb.com/api/json/v1/1/search.php?s=chicken
// =====================================================

const API_BASE = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

// Local Storage keys
const KEY_COOKBOOK = "rf_cookbook";
const KEY_LAST_SEARCH = "rf_lastSearch";
const KEY_THEME = "rf_theme";

// ---------- Selecting DOM elements ----------
const searchForm = document.querySelector("#searchForm");
const searchBox = document.querySelector("#searchBox");
const categoryFilter = document.querySelector("#categoryFilter");
const sortFilter = document.querySelector("#sortFilter");
const countText = document.querySelector("#countText");
const cookbookCount = document.querySelector("#cookbookCount");
const recipeList = document.querySelector("#recipeList");
const loadingState = document.querySelector("#loadingState");
const errorState = document.querySelector("#errorState");
const errorText = document.querySelector("#errorText");
const emptyState = document.querySelector("#emptyState");
const emptyText = document.querySelector("#emptyText");
const retryBtn = document.querySelector("#retryBtn");
const overlay = document.querySelector("#overlay");
const dialogContent = document.querySelector("#dialogContent");
const closeBtn = document.querySelector("#closeBtn");
const themeBtn = document.querySelector("#themeBtn");
const tabs = document.querySelectorAll(".tab");

// ---------- App state ----------
let searchResults = [];              // recipes from the API
let cookbook = readStorage(KEY_COOKBOOK, []); // saved recipes (full objects)
let currentView = "search";          // "search" or "cookbook"
let lastQuery = "";

// =====================================================
// Local Storage helpers
// =====================================================
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isSaved(id) {
  return cookbook.some((recipe) => recipe.idMeal === id);
}

// =====================================================
// Fetching data (fetch + async/await + try/catch)
// =====================================================
async function searchRecipes(query) {
  lastQuery = query;
  writeStorage(KEY_LAST_SEARCH, query);
  setUI("loading");

  try {
    const response = await fetch(API_BASE + encodeURIComponent(query));
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }
    const data = await response.json();
    searchResults = data.meals || []; // API gives null when nothing found
    setUI("done");
    render();
  } catch (err) {
    errorText.textContent =
      "Oops! We could not load recipes. Check your internet connection. (" + err.message + ")";
    setUI("error");
  }
}

// =====================================================
// Show / hide loading, error, empty states
// =====================================================
function setUI(state) {
  loadingState.classList.toggle("hidden", state !== "loading");
  errorState.classList.toggle("hidden", state !== "error");
  if (state !== "done") {
    emptyState.classList.add("hidden");
  }
  if (state === "loading" || state === "error") {
    recipeList.innerHTML = "";
    countText.textContent = "";
  }
}

// =====================================================
// Filtering + sorting
// =====================================================
function getRecipesToShow() {
  const source = currentView === "cookbook" ? cookbook : searchResults;
  const category = categoryFilter.value;

  const filtered = source.filter(
    (recipe) => category === "all" || recipe.strCategory === category
  );

  filtered.sort((a, b) =>
    sortFilter.value === "az"
      ? a.strMeal.localeCompare(b.strMeal)
      : b.strMeal.localeCompare(a.strMeal)
  );
  return filtered;
}

// Build the category dropdown from the recipes we currently have
function updateCategoryOptions() {
  const source = currentView === "cookbook" ? cookbook : searchResults;
  const previous = categoryFilter.value;
  const categories = [...new Set(source.map((r) => r.strCategory))].sort();

  categoryFilter.innerHTML = '<option value="all">All</option>';
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = categories.includes(previous) ? previous : "all";
}

// =====================================================
// Rendering (DOM manipulation)
// =====================================================
function render() {
  updateCategoryOptions();
  const list = getRecipesToShow();

  recipeList.innerHTML = "";
  cookbookCount.textContent = cookbook.length;

  if (list.length === 0) {
    emptyText.textContent =
      currentView === "cookbook"
        ? "Your cookbook is empty. Tap the heart on a recipe to save it here."
        : 'No recipes found for "' + lastQuery + '". Try another search.';
    emptyState.classList.remove("hidden");
    countText.textContent = "";
    return;
  }

  emptyState.classList.add("hidden");
  countText.textContent = list.length + " recipe(s)";
  list.forEach((recipe) => recipeList.appendChild(buildCard(recipe)));
}

function buildCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.dataset.id = recipe.idMeal;

  const img = document.createElement("img");
  img.src = recipe.strMealThumb;
  img.alt = recipe.strMeal;
  img.loading = "lazy";

  const saveBtn = document.createElement("button");
  saveBtn.className = "save-btn";
  saveBtn.dataset.id = recipe.idMeal;
  saveBtn.textContent = isSaved(recipe.idMeal) ? "❤️" : "🤍";

  const info = document.createElement("div");
  info.className = "info";

  const title = document.createElement("h3");
  title.textContent = recipe.strMeal;

  const catTag = document.createElement("span");
  catTag.className = "tag";
  catTag.textContent = recipe.strCategory;

  const areaTag = document.createElement("span");
  areaTag.className = "tag";
  areaTag.textContent = recipe.strArea;

  info.append(title, catTag, areaTag);
  card.append(img, saveBtn, info);
  return card;
}

// Get ingredient list from strIngredient1..20 and strMeasure1..20
function getIngredients(recipe) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const name = recipe["strIngredient" + i];
    const measure = recipe["strMeasure" + i];
    if (name && name.trim()) {
      items.push((measure || "").trim() + " " + name.trim());
    }
  }
  return items;
}

function openDialog(id) {
  const recipe =
    searchResults.find((r) => r.idMeal === id) ||
    cookbook.find((r) => r.idMeal === id);
  if (!recipe) return;

  dialogContent.innerHTML = "";

  const img = document.createElement("img");
  img.src = recipe.strMealThumb;
  img.alt = recipe.strMeal;

  const title = document.createElement("h2");
  title.textContent = recipe.strMeal;

  const tags = document.createElement("p");
  tags.innerHTML = "";
  [recipe.strCategory, recipe.strArea].forEach((text) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = text;
    tags.appendChild(span);
  });

  const ingHeading = document.createElement("h4");
  ingHeading.textContent = "Ingredients";

  const ul = document.createElement("ul");
  getIngredients(recipe).forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });

  const stepHeading = document.createElement("h4");
  stepHeading.textContent = "Instructions";

  const steps = document.createElement("p");
  steps.className = "steps";
  steps.textContent = recipe.strInstructions;

  dialogContent.append(img, title, tags, ingHeading, ul, stepHeading, steps);

  if (recipe.strYoutube) {
    const link = document.createElement("a");
    link.href = recipe.strYoutube;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "▶ Watch on YouTube";
    dialogContent.appendChild(link);
  }

  const saveBtn = document.createElement("button");
  saveBtn.className = "primary";
  saveBtn.style.display = "block";
  saveBtn.textContent = isSaved(recipe.idMeal)
    ? "Remove from Cookbook"
    : "Save to Cookbook";
  saveBtn.addEventListener("click", () => {
    toggleSave(recipe);
    openDialog(id); // refresh button text
  });
  dialogContent.appendChild(saveBtn);

  overlay.classList.remove("hidden");
}

function closeDialog() {
  overlay.classList.add("hidden");
}

// =====================================================
// Save / remove from cookbook
// =====================================================
function toggleSave(recipe) {
  if (isSaved(recipe.idMeal)) {
    cookbook = cookbook.filter((r) => r.idMeal !== recipe.idMeal);
  } else {
    cookbook.push(recipe);
  }
  writeStorage(KEY_COOKBOOK, cookbook);
  render();
}

// =====================================================
// Theme (dark mode) saved in Local Storage
// =====================================================
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}

// =====================================================
// Event listeners
// =====================================================
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchBox.value.trim();
  if (!query) return;
  switchView("search");
  searchRecipes(query);
});

categoryFilter.addEventListener("change", render);
sortFilter.addEventListener("change", render);

// Event delegation: one listener handles every card
recipeList.addEventListener("click", (event) => {
  const saveBtn = event.target.closest(".save-btn");
  if (saveBtn) {
    const id = saveBtn.dataset.id;
    const recipe =
      searchResults.find((r) => r.idMeal === id) ||
      cookbook.find((r) => r.idMeal === id);
    if (recipe) toggleSave(recipe);
    return;
  }
  const card = event.target.closest(".recipe-card");
  if (card) openDialog(card.dataset.id);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

function switchView(view) {
  currentView = view;
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  categoryFilter.value = "all";
  setUI("done");
  render();
}

closeBtn.addEventListener("click", closeDialog);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeDialog();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDialog();
});

themeBtn.addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(KEY_THEME, next);
  applyTheme(next);
});

retryBtn.addEventListener("click", () => searchRecipes(lastQuery || "chicken"));

// =====================================================
// Start the app
// =====================================================
applyTheme(localStorage.getItem(KEY_THEME) || "light");
cookbookCount.textContent = cookbook.length;

const startQuery = readStorage(KEY_LAST_SEARCH, "chicken");
searchBox.value = startQuery;
searchRecipes(startQuery);
