/**
 * Main Application Controller
 * Handles UI interactions, modal controls, settings management,
 * spelling drills, and session flow.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const textContainer = document.getElementById("typing-text");
  const hiddenInput = document.getElementById("hidden-input");
  const typingArena = document.getElementById("typing-arena");
  const restartBtn = document.getElementById("btn-restart");
  const themeToggleBtn = document.getElementById("btn-theme-toggle");
  const soundToggleBtn = document.getElementById("btn-sound-toggle");
  const historyBtn = document.getElementById("btn-history");
  const settingsBtn = document.getElementById("btn-settings");
  const mistakesBtn = document.getElementById("btn-mistakes");
  const sheetsStatusBadge = document.getElementById("sheets-status-badge");

  // Stat displays
  const timerDisplay = document.getElementById("stat-timer");
  const wpmDisplay = document.getElementById("stat-wpm");
  const accDisplay = document.getElementById("stat-acc");
  const errorsDisplay = document.getElementById("stat-errors");

  // Hint bar
  const spellingHintBar = document.getElementById("spelling-hint-bar");
  const spellingHintText = document.getElementById("spelling-hint-text");

  // Modals
  const resultsModal = document.getElementById("results-modal");
  const historyModal = document.getElementById("history-modal");
  const settingsModal = document.getElementById("settings-modal");
  const mistakesModal = document.getElementById("mistakes-modal");
  const closeButtons = document.querySelectorAll(".btn-close-modal");

  // State
  let currentCategory = "corporate"; // corporate, technical, tricky, sentences, ai
  let currentDuration = 60; // 60, 90, 120, 300
  let isSpellingDrill = false;
  let currentPracticeMode = "time"; // time, drill, mistake_practice

  // Initialize Typing Engine
  const engine = new TypingEngine({
    textContainer: textContainer,
    hiddenInput: hiddenInput,
    onProgress: (data) => {
      if (engine.isTimeBased) {
        timerDisplay.textContent = `${data.remaining}s`;
      } else {
        timerDisplay.textContent = `${Math.round(data.elapsed)}s`;
      }
      wpmDisplay.textContent = data.stats.wpm;
      accDisplay.textContent = `${data.stats.accuracy}%`;
      errorsDisplay.textContent = data.stats.errorChars;
    },
    onFinish: async (stats) => {
      showResultsModal(stats);
    },
    onMistake: (data) => {
      // Optional visual/shake feedback
    }
  });

  // -------------------------------------------------------------
  // Theme & Settings Init
  // -------------------------------------------------------------
  const savedTheme = localStorage.getItem("app_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  updateSheetsBadge();

  // -------------------------------------------------------------
  // Text Loading Logic
  // -------------------------------------------------------------
  async function loadNewPracticeText() {
    engine.duration = currentDuration;
    engine.isTimeBased = !isSpellingDrill;
    timerDisplay.textContent = engine.isTimeBased ? `${currentDuration}s` : "0s";
    wpmDisplay.textContent = "0";
    accDisplay.textContent = "100%";
    errorsDisplay.textContent = "0";

    spellingHintBar.classList.add("hidden");

    let text = "";

    if (currentPracticeMode === "mistake_practice") {
      const mistakes = Object.keys(sheetsSync.getMistakesBank());
      if (mistakes.length > 0) {
        text = mistakes.slice(0, 30).join(" ");
        spellingHintBar.classList.remove("hidden");
        spellingHintText.textContent = "Focus drill: Practicing your past mistyped words.";
      } else {
        alert("No mistakes stored in your vault! Switching back to Corporate mode.");
        currentPracticeMode = "time";
        currentCategory = "corporate";
        text = getPracticeText("corporate", 50);
      }
    } else if (currentCategory === "ai") {
      textContainer.innerHTML = '<div style="color: var(--text-muted); font-style: italic;">Generating dynamic scenario...</div>';
      text = await geminiGenerator.generateText("corporate", 45);
    } else if (currentCategory === "tricky") {
      text = getPracticeText("tricky", 35);
      spellingHintBar.classList.remove("hidden");
      spellingHintText.textContent = "Spelling Drill: Pay close attention to double letters and silent vowels.";
    } else {
      text = getPracticeText(currentCategory, currentDuration >= 120 ? 80 : 50);
    }

    engine.setText(text);
    focusTypingArena();
  }

  function focusTypingArena() {
    hiddenInput.focus();
  }

  // -------------------------------------------------------------
  // Event Listeners for Typing Input
  // -------------------------------------------------------------
  typingArena.addEventListener("click", () => {
    focusTypingArena();
  });

  window.addEventListener("keydown", (e) => {
    // Shortcuts
    if (e.key === "Tab" && !isModalOpen()) {
      e.preventDefault();
      loadNewPracticeText();
      return;
    }
    if (e.key === "Escape") {
      closeAllModals();
      return;
    }

    // Ignore keyboard events when user is typing inside modal inputs
    if (e.target.tagName === "INPUT" && e.target.id !== "hidden-input") {
      return;
    }

    if (isModalOpen()) return;

    hiddenInput.focus();

    if (e.key === "Backspace") {
      e.preventDefault();
      engine.handleInput(null, true);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      engine.handleInput(e.key, false);
    }
  });

  restartBtn.addEventListener("click", () => {
    loadNewPracticeText();
  });

  // -------------------------------------------------------------
  // Category & Timer Selection Controls
  // -------------------------------------------------------------
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      currentPracticeMode = currentCategory === "tricky" ? "drill" : "time";
      loadNewPracticeText();
    });
  });

  document.querySelectorAll(".timer-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".timer-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentDuration = parseInt(btn.dataset.time, 10);
      loadNewPracticeText();
    });
  });

  // -------------------------------------------------------------
  // Header Actions & Modals
  // -------------------------------------------------------------
  if (sheetsStatusBadge) {
    sheetsStatusBadge.addEventListener("click", () => {
      loadSettingsIntoModal();
      openModal(settingsModal);
    });
  }

  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("app_theme", next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML = theme === "dark" ? "🌙" : "☀️";
  }

  soundToggleBtn.addEventListener("click", () => {
    engine.soundEnabled = !engine.soundEnabled;
    soundToggleBtn.innerHTML = engine.soundEnabled ? "🔊" : "🔇";
  });

  historyBtn.addEventListener("click", () => {
    renderHistoryModal();
    openModal(historyModal);
  });

  settingsBtn.addEventListener("click", () => {
    loadSettingsIntoModal();
    openModal(settingsModal);
  });

  mistakesBtn.addEventListener("click", () => {
    renderMistakesModal();
    openModal(mistakesModal);
  });

  closeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      closeAllModals();
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  function isModalOpen() {
    return document.querySelector(".modal-overlay.active") !== null;
  }

  function openModal(modal) {
    modal.classList.add("active");
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    focusTypingArena();
  }

  // -------------------------------------------------------------
  // Results & Session Logging
  // -------------------------------------------------------------
  async function showResultsModal(stats) {
    document.getElementById("res-wpm").textContent = stats.wpm;
    document.getElementById("res-accuracy").textContent = `${stats.accuracy}%`;
    document.getElementById("res-chars").textContent = `${stats.correctChars}/${stats.totalChars}`;
    document.getElementById("res-errors").textContent = stats.errorChars;

    const mistakeContainer = document.getElementById("res-mistakes-container");
    const mistakeList = document.getElementById("res-mistakes-list");
    mistakeList.innerHTML = "";

    if (stats.misspelledWords && stats.misspelledWords.length > 0) {
      mistakeContainer.style.display = "block";
      stats.misspelledWords.forEach(word => {
        const tag = document.createElement("span");
        tag.className = "word-tag";
        tag.textContent = word;
        mistakeList.appendChild(tag);
      });
    } else {
      mistakeContainer.style.display = "none";
    }

    const syncStatus = document.getElementById("res-sync-status");
    syncStatus.innerHTML = `<span>Google Sheets Sync:</span> <span style="color: var(--text-muted);">Syncing...</span>`;

    openModal(resultsModal);

    // Record session
    const sessionRecord = {
      mode: isSpellingDrill ? "Spelling Drill" : `${currentDuration}s Test`,
      durationSeconds: currentDuration,
      category: currentCategory.toUpperCase(),
      wpm: stats.wpm,
      netWpm: stats.netWpm,
      accuracy: stats.accuracy,
      totalChars: stats.totalChars,
      correctChars: stats.correctChars,
      errorChars: stats.errorChars,
      wordsTyped: stats.wordsTyped,
      wordsTypedList: stats.wordsTypedList || stats.sessionText || '',
      misspelledWords: stats.misspelledWords,
      sessionText: stats.sessionText || engine.targetText
    };

    const recordResult = await sheetsSync.recordSession(sessionRecord);

    if (recordResult.synced) {
      syncStatus.innerHTML = `<span>Google Sheets Sync:</span> <span style="color: var(--success); font-weight: 600;">✓ Synced to Sheet</span>`;
    } else if (sheetsSync.isConfigured()) {
      syncStatus.innerHTML = `<span>Google Sheets Sync:</span> <span style="color: var(--warning); font-weight: 600;">Saved locally (Webhook pending)</span>`;
    } else {
      syncStatus.innerHTML = `<span>Google Sheets Sync:</span> <span style="color: var(--text-muted);">Saved locally (Sheets unlinked)</span>`;
    }
  }

  document.getElementById("btn-res-repeat").addEventListener("click", () => {
    closeAllModals();
    loadNewPracticeText();
  });

  document.getElementById("btn-res-drill-mistakes").addEventListener("click", () => {
    closeAllModals();
    currentPracticeMode = "mistake_practice";
    loadNewPracticeText();
  });

  // -------------------------------------------------------------
  // History & Statistics Modal
  // -------------------------------------------------------------
  function renderHistoryModal() {
    const dailyAggregates = sheetsSync.getDailyAggregates();
    const historyBody = document.getElementById("history-table-body");
    const emptyState = document.getElementById("history-empty");
    historyBody.innerHTML = "";

    if (dailyAggregates.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    dailyAggregates.forEach(day => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight: 600; color: var(--text-primary);">${day.date}</td>
        <td>${day.sessionsCount} sessions</td>
        <td><strong style="color: var(--accent-primary);">${day.avgWpm}</strong> WPM</td>
        <td>${day.avgAccuracy}%</td>
        <td>${day.totalWords} words</td>
        <td>${day.uniqueMistakes.length > 0 ? day.uniqueMistakes.slice(0, 3).join(', ') + (day.uniqueMistakes.length > 3 ? '...' : '') : '<span style="color: var(--success);">Clean</span>'}</td>
      `;
      historyBody.appendChild(row);
    });
  }

  document.getElementById("btn-export-csv").addEventListener("click", () => {
    sheetsSync.exportToCsv();
  });

  // -------------------------------------------------------------
  // Mistakes Vault Modal
  // -------------------------------------------------------------
  function renderMistakesModal() {
    const mistakes = sheetsSync.getMistakesBank();
    const list = document.getElementById("mistakes-vault-list");
    const empty = document.getElementById("mistakes-vault-empty");
    list.innerHTML = "";

    const entries = Object.entries(mistakes).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    entries.forEach(([word, count]) => {
      const tag = document.createElement("span");
      tag.className = "word-tag";
      tag.innerHTML = `${word} <small style="opacity: 0.7;">(${count}x)</small>`;
      list.appendChild(tag);
    });
  }

  document.getElementById("btn-drill-vault").addEventListener("click", () => {
    closeAllModals();
    currentPracticeMode = "mistake_practice";
    loadNewPracticeText();
  });

  document.getElementById("btn-clear-vault").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your mistake vault?")) {
      sheetsSync.clearMistakesBank();
      renderMistakesModal();
    }
  });

  // -------------------------------------------------------------
  // Settings & Sheets Webhook Config
  // -------------------------------------------------------------
  function loadSettingsIntoModal() {
    document.getElementById("input-sheets-webhook").value = sheetsSync.getWebhookUrl();
    document.getElementById("input-gemini-key").value = geminiGenerator.getApiKey();
  }

  document.getElementById("btn-save-settings").addEventListener("click", () => {
    const webhookUrl = document.getElementById("input-sheets-webhook").value.trim();
    const geminiKey = document.getElementById("input-gemini-key").value.trim();

    sheetsSync.setWebhookUrl(webhookUrl);
    geminiGenerator.setApiKey(geminiKey);

    updateSheetsBadge();
    alert("Settings saved successfully!");
    closeAllModals();
  });

  const copyScriptBtn = document.getElementById("btn-copy-script");
  if (copyScriptBtn) {
    copyScriptBtn.addEventListener("click", () => {
      const codeBlock = document.getElementById("script-code-block");
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
          copyScriptBtn.textContent = "✓ Copied!";
          setTimeout(() => { copyScriptBtn.textContent = "📋 Copy Script Code"; }, 2000);
        }).catch(() => {
          alert("Copied code to clipboard!");
        });
      }
    });
  }

  document.getElementById("btn-test-sheets").addEventListener("click", async () => {
    const webhookUrl = document.getElementById("input-sheets-webhook").value.trim();
    if (!webhookUrl) {
      alert("Please paste your Google Apps Script Webhook URL first.");
      return;
    }
    sheetsSync.setWebhookUrl(webhookUrl);

    try {
      const testResult = await sheetsSync.recordSession({
        mode: "Connection Test",
        durationSeconds: 1,
        category: "SETUP",
        wpm: 60,
        netWpm: 60,
        accuracy: 100,
        wordsTyped: 10,
        misspelledWords: []
      });
      alert("Test record sent! Check your Google Sheet to verify the new row.");
      updateSheetsBadge();
    } catch (err) {
      alert("Failed to send test record: " + err.message);
    }
  });

  function updateSheetsBadge() {
    if (!sheetsStatusBadge) return;
    if (sheetsSync.isConfigured()) {
      sheetsStatusBadge.className = "sheets-badge";
      sheetsStatusBadge.innerHTML = "● Google Sheets Active";
    } else {
      sheetsStatusBadge.className = "sheets-badge unlinked";
      sheetsStatusBadge.innerHTML = "○ Sheets Unlinked (Local Only)";
    }
  }

  // Initial Load
  loadNewPracticeText();
});
