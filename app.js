(() => {
  const items = window.MENU_ITEMS;
  const pageSize = 6;
  const grid = document.getElementById("food-grid");
  const pageContainer = document.getElementById("menu-page");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("menu-search");
  const countLabel = document.getElementById("menu-count");
  const currentPageLabel = document.getElementById("current-page");
  const totalPagesLabel = document.getElementById("total-pages");
  const previousButton = document.getElementById("previous-page");
  const nextButton = document.getElementById("next-page");
  const categoryButtons = [...document.querySelectorAll(".category-button")];

  let activeCategory = "All";
  let currentPage = 0;
  let isAnimating = false;
  let animationTimeout;

  function getFilteredItems() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Vegetarian" && item.vegetarian) ||
        (activeCategory === "Non-vegetarian" && !item.vegetarian) ||
        item.categories.includes(activeCategory);
      const matchesSearch =
        !query ||
        `${item.name} ${item.description}`.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }

  function createCard(item) {
    const article = document.createElement("article");
    article.className = "food-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "food-image-wrap";

    const fallback = document.createElement("div");
    fallback.className = "image-fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = item.name.slice(0, 1);

    const image = document.createElement("img");
    image.className = "food-image";
    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    }, { once: true });

    fallback.hidden = true;
    imageWrap.append(fallback, image);

    const details = document.createElement("div");
    details.className = "food-details";

    const topLine = document.createElement("div");
    topLine.className = "food-topline";

    const name = document.createElement("h2");
    name.className = "food-name";
    name.textContent = item.name;
    topLine.append(name);

    if (item.needsNameConfirmation) {
      const confirmation = document.createElement("span");
      confirmation.className = "confirmation-tag";
      confirmation.textContent = "Confirm name";
      confirmation.title = "Please confirm this dish name";
      topLine.append(confirmation);
    }

    const description = document.createElement("p");
    description.className = "food-description";
    description.textContent = item.description;

    const bottomLine = document.createElement("div");
    bottomLine.className = "food-bottomline";

    const dietary = document.createElement("span");
    dietary.className = `dietary-tag ${item.vegetarian ? "is-veg" : "is-non-veg"}`;
    const dietaryDot = document.createElement("span");
    dietaryDot.className = "dietary-dot";
    dietaryDot.setAttribute("aria-hidden", "true");
    dietary.append(dietaryDot, item.vegetarian ? "Vegetarian" : "Non-vegetarian");

    const price = document.createElement("span");
    price.className = "food-price";
    price.textContent = item.price;
    bottomLine.append(dietary, price);

    details.append(topLine, description, bottomLine);
    article.append(imageWrap, details);
    return article;
  }

  function render(direction = "") {
    const filteredItems = getFilteredItems();
    const pageCount = Math.ceil(filteredItems.length / pageSize);
    currentPage = Math.min(currentPage, Math.max(pageCount - 1, 0));
    const start = currentPage * pageSize;
    const pageItems = filteredItems.slice(start, start + pageSize);

    grid.replaceChildren(...pageItems.map(createCard));
    grid.classList.remove("turn-next", "turn-previous");
    if (direction) {
      void grid.offsetWidth;
      grid.classList.add(direction === "next" ? "turn-next" : "turn-previous");
    }

    const showingStart = filteredItems.length ? start + 1 : 0;
    const showingEnd = Math.min(start + pageSize, filteredItems.length);
    countLabel.textContent = `${showingStart}–${showingEnd} of ${filteredItems.length} dishes`;
    currentPageLabel.textContent = String(currentPage + 1).padStart(2, "0");
    totalPagesLabel.textContent = String(Math.max(pageCount, 1)).padStart(2, "0");
    previousButton.disabled = currentPage === 0 || pageCount === 0;
    nextButton.disabled = pageCount === 0 || currentPage >= pageCount - 1;
    grid.hidden = pageItems.length === 0;
    emptyState.hidden = pageItems.length !== 0;

    syncHintButtons();
  }

  function changePage(direction) {
    if (isAnimating) return;
    const pageCount = Math.ceil(getFilteredItems().length / pageSize);
    const nextPage = currentPage + (direction === "next" ? 1 : -1);
    if (nextPage < 0 || nextPage >= pageCount) return;

    isAnimating = true;
    pageContainer.setAttribute("aria-busy", "true");
    currentPage = nextPage;
    render(direction);

    window.clearTimeout(animationTimeout);
    animationTimeout = window.setTimeout(() => {
      pageContainer.setAttribute("aria-busy", "false");
      isAnimating = false;
    }, 280);
  }

  function resetToFirstPage() {
    currentPage = 0;
    render();
  }

  searchInput.addEventListener("input", resetToFirstPage);

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      categoryButtons.forEach((categoryButton) => {
        const isActive = categoryButton === button;
        categoryButton.classList.toggle("is-active", isActive);
        categoryButton.setAttribute("aria-pressed", String(isActive));
      });
      resetToFirstPage();
    });
  });

  previousButton.addEventListener("click", () => changePage("previous"));
  nextButton.addEventListener("click", () => changePage("next"));

  function returnHome(event) {
    event.preventDefault();
    activeCategory = "All";
    searchInput.value = "";
    categoryButtons.forEach((button) => {
      const isActive = button.dataset.category === "All";
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    resetToFirstPage();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  document.getElementById("home-button").addEventListener("click", returnHome);
  document.getElementById("brand-home-button").addEventListener("click", returnHome);

  document.getElementById("clear-filters").addEventListener("click", () => {
    activeCategory = "All";
    searchInput.value = "";
    categoryButtons.forEach((button) => {
      const isActive = button.dataset.category === "All";
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    resetToFirstPage();
    searchInput.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  /* ============================================================
     SWIPE + HINT
     - Swipe left on the menu page  -> next page
     - Swipe right on the menu page -> previous page
     - Small hint popup (with left/right buttons) shown once,
       remembered via localStorage.
     ============================================================ */

  const HINT_STORAGE_KEY = "artex-menu-swipe-hint-dismissed";

  // ---- Swipe handling ----
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  const SWIPE_MIN_DISTANCE = 50;   // px of horizontal travel required
  const SWIPE_MAX_VERTICAL = 70;   // px vertical drift allowed

  pageContainer.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      touchActive = true;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  pageContainer.addEventListener(
    "touchend",
    (event) => {
      if (!touchActive) return;
      touchActive = false;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dy) > SWIPE_MAX_VERTICAL) return; // treat as vertical scroll

      if (dx < 0) {
        changePage("next");
      } else {
        changePage("previous");
      }
    },
    { passive: true }
  );

  // ---- Hint popup ----
  const hint = document.createElement("div");
  hint.setAttribute("role", "dialog");
  hint.setAttribute("aria-label", "Page navigation hint");
  hint.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    background: #fffdf8;
    border: 1px solid #e7dece;
    border-radius: 999px;
    box-shadow: 0 8px 22px rgba(75,50,31,0.14);
    font-family: "DM Sans", sans-serif;
    font-size: 11px;
    color: #6f5a49;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 220ms ease, transform 220ms ease;
  `;

  const hintText = document.createElement("span");
  hintText.textContent = "Swipe to turn pages";
  hintText.style.cssText = "white-space: nowrap;";

  function makeHintButton(symbol, label, direction) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    btn.textContent = symbol;
    btn.style.cssText = `
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      border: 1px solid #e0d3c2;
      border-radius: 50%;
      background: #f7f1e7;
      color: #a94724;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    `;
    btn.addEventListener("click", () => changePage(direction));
    return btn;
  }

  const hintPrev = makeHintButton("‹", "Previous page", "previous");
  const hintNext = makeHintButton("›", "Next page", "next");

  const hintClose = document.createElement("button");
  hintClose.type = "button";
  hintClose.setAttribute("aria-label", "Dismiss hint");
  hintClose.textContent = "×";
  hintClose.style.cssText = `
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    margin-left: 2px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #b4a496;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  `;

  hint.append(hintPrev, hintText, hintNext, hintClose);

  function showHint() {
    try {
      if (localStorage.getItem(HINT_STORAGE_KEY) === "1") return;
    } catch (e) {
      /* localStorage may be blocked; still show hint once per load */
    }
    document.body.append(hint);
    requestAnimationFrame(() => {
      hint.style.opacity = "1";
      hint.style.pointerEvents = "auto";
      hint.style.transform = "translateX(-50%) translateY(-4px)";
    });

    // Auto-hide after a while so it never blocks the menu.
    window.setTimeout(dismissHint, 8000);
  }

  function dismissHint() {
    hint.style.opacity = "0";
    hint.style.pointerEvents = "none";
    hint.style.transform = "translateX(-50%) translateY(6px)";
    try {
      localStorage.setItem(HINT_STORAGE_KEY, "1");
    } catch (e) {
      /* ignore */
    }
    window.setTimeout(() => hint.remove(), 240);
  }

  hintClose.addEventListener("click", dismissHint);

  // Keep hint arrows in sync with the same disabled state as the footer buttons.
  function syncHintButtons() {
    if (!hint.isConnected) return;
    hintPrev.disabled = previousButton.disabled;
    hintNext.disabled = nextButton.disabled;
    hintPrev.style.opacity = hintPrev.disabled ? "0.35" : "1";
    hintNext.style.opacity = hintNext.disabled ? "0.35" : "1";
  }

  render();
  showHint();
})();