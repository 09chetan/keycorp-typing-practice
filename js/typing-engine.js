/**
 * Typing Engine
 * Handles character rendering, input processing, live caret movement,
 * accurate WPM/accuracy computation, spelling error detection, and audio feedback.
 */

class TypingEngine {
  constructor(options = {}) {
    this.textContainer = options.textContainer;
    this.hiddenInput = options.hiddenInput;
    this.onProgress = options.onProgress || (() => {});
    this.onFinish = options.onFinish || (() => {});
    this.onMistake = options.onMistake || (() => {});

    this.targetText = "";
    this.words = [];
    this.charElements = [];
    this.currentIndex = 0;
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.duration = 60; // default 60s
    this.isTimeBased = true;
    this.hasStarted = false;
    this.isFinished = false;

    // Metrics tracking
    this.totalTypedChars = 0;
    this.correctTypedChars = 0;
    this.errorChars = 0;
    this.mistypedWordIndices = new Set();
    this.mistypedWordStrings = [];

    // Audio effects
    this.soundEnabled = true;
    this.audioCtx = null;

    this.initAudio();

    window.addEventListener("resize", () => {
      if (this.hasStarted && !this.isFinished) {
        this.positionCaret();
      }
    });
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.log("Web Audio not supported:", e);
    }
  }

  playKeySound(isError = false) {
    if (!this.soundEnabled || !this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    if (isError) {
      // Gentle error tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // Crisp mechanical click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  setText(text) {
    this.targetText = text.trim();
    this.words = this.targetText.split(" ");
    this.reset();
    this.renderText();
  }

  reset() {
    this.currentIndex = 0;
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.hasStarted = false;
    this.isFinished = false;
    this.totalTypedChars = 0;
    this.correctTypedChars = 0;
    this.errorChars = 0;
    this.mistypedWordIndices.clear();
    this.mistypedWordStrings = [];

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.hiddenInput) {
      this.hiddenInput.value = "";
    }
  }

  renderText() {
    if (!this.textContainer) return;
    this.textContainer.innerHTML = "";
    this.charElements = [];

    let globalCharIndex = 0;

    this.words.forEach((wordStr, wordIdx) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      wordSpan.dataset.wordIndex = wordIdx;
      wordSpan.dataset.wordText = wordStr;

      for (let i = 0; i < wordStr.length; i++) {
        const charSpan = document.createElement("span");
        charSpan.className = "letter";
        charSpan.textContent = wordStr[i];
        charSpan.dataset.charIndex = globalCharIndex;
        charSpan.dataset.expected = wordStr[i];
        wordSpan.appendChild(charSpan);
        this.charElements.push(charSpan);
        globalCharIndex++;
      }

      // Append space unless last word
      if (wordIdx < this.words.length - 1) {
        const spaceSpan = document.createElement("span");
        spaceSpan.className = "letter space";
        spaceSpan.innerHTML = "&nbsp;";
        spaceSpan.dataset.charIndex = globalCharIndex;
        spaceSpan.dataset.expected = " ";
        wordSpan.appendChild(spaceSpan);
        this.charElements.push(spaceSpan);
        globalCharIndex++;
      }

      this.textContainer.appendChild(wordSpan);
    });

    this.updateActiveWordAndCaret();
  }

  handleInput(key, isBackspace = false) {
    if (this.isFinished) return;

    if (!this.hasStarted) {
      this.start();
    }

    if (isBackspace) {
      this.handleBackspace();
      return;
    }

    if (this.currentIndex >= this.charElements.length) {
      this.finish();
      return;
    }

    const targetCharElem = this.charElements[this.currentIndex];
    const expectedChar = targetCharElem.dataset.expected;

    this.totalTypedChars++;

    if (key === expectedChar) {
      targetCharElem.classList.add("correct");
      targetCharElem.classList.remove("incorrect");
      this.correctTypedChars++;
      this.playKeySound(false);
    } else {
      targetCharElem.classList.add("incorrect");
      targetCharElem.classList.remove("correct");
      this.errorChars++;
      this.playKeySound(true);

      // Track the word containing this character error
      const parentWord = targetCharElem.closest(".word");
      if (parentWord) {
        const wordIdx = parseInt(parentWord.dataset.wordIndex, 10);
        this.mistypedWordIndices.add(wordIdx);
      }
      this.onMistake({ expected: expectedChar, actual: key });
    }

    this.currentIndex++;

    if (this.currentIndex >= this.charElements.length) {
      this.finish();
      return;
    }

    this.updateActiveWordAndCaret();
    this.calculateStats();
  }

  handleBackspace() {
    if (this.currentIndex <= 0) return;

    this.currentIndex--;
    const targetCharElem = this.charElements[this.currentIndex];
    targetCharElem.classList.remove("correct", "incorrect");

    this.updateActiveWordAndCaret();
    this.calculateStats();
  }

  updateActiveWordAndCaret() {
    // Remove old active classes
    const activeWords = this.textContainer.querySelectorAll(".word.active");
    activeWords.forEach(w => w.classList.remove("active"));

    if (this.currentIndex < this.charElements.length) {
      const currentCharElem = this.charElements[this.currentIndex];
      const parentWord = currentCharElem.closest(".word");
      if (parentWord) {
        parentWord.classList.add("active");
        
        // Auto scroll smoothly if caret moves down multiple lines
        const containerRect = this.textContainer.getBoundingClientRect();
        const elemRect = currentCharElem.getBoundingClientRect();
        if (elemRect.bottom > containerRect.bottom - 20 || elemRect.top < containerRect.top + 10) {
          currentCharElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    this.positionCaret();
  }

  positionCaret() {
    let caret = document.getElementById("typing-caret");
    if (!caret) {
      caret = document.createElement("div");
      caret.id = "typing-caret";
      caret.className = "typing-caret";
      this.textContainer.appendChild(caret);
    }

    if (!this.textContainer || this.charElements.length === 0) return;

    const containerRect = this.textContainer.getBoundingClientRect();

    if (this.currentIndex < this.charElements.length) {
      const charElem = this.charElements[this.currentIndex];
      const charRect = charElem.getBoundingClientRect();

      const left = charRect.left - containerRect.left + this.textContainer.scrollLeft;
      const top = charRect.top - containerRect.top + this.textContainer.scrollTop;

      caret.style.display = "block";
      caret.style.left = `${left}px`;
      caret.style.top = `${top}px`;
      caret.style.height = `${charRect.height || 28}px`;
    } else {
      // Position at end of last char
      const lastChar = this.charElements[this.charElements.length - 1];
      if (lastChar) {
        const lastRect = lastChar.getBoundingClientRect();
        const left = lastRect.right - containerRect.left + this.textContainer.scrollLeft;
        const top = lastRect.top - containerRect.top + this.textContainer.scrollTop;

        caret.style.display = "block";
        caret.style.left = `${left}px`;
        caret.style.top = `${top}px`;
        caret.style.height = `${lastRect.height || 28}px`;
      }
    }
  }

  start() {
    this.hasStarted = true;
    this.startTime = Date.now();

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = (Date.now() - this.startTime) / 1000;
      
      if (this.isTimeBased) {
        const remaining = Math.max(0, Math.ceil(this.duration - this.elapsedSeconds));
        this.onProgress({
          elapsed: this.elapsedSeconds,
          remaining: remaining,
          stats: this.calculateStats()
        });

        if (this.elapsedSeconds >= this.duration) {
          this.finish();
        }
      } else {
        this.onProgress({
          elapsed: this.elapsedSeconds,
          stats: this.calculateStats()
        });
      }
    }, 100);
  }

  finish() {
    if (this.isFinished) return;
    this.isFinished = true;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Identify exact misspelled words
    this.mistypedWordStrings = [];
    this.mistypedWordIndices.forEach(idx => {
      if (this.words[idx]) {
        this.mistypedWordStrings.push(this.words[idx]);
      }
    });

    const finalStats = this.calculateStats();
    this.onFinish(finalStats);
  }

  calculateStats() {
    const timeInMinutes = (this.elapsedSeconds || 1) / 60;
    
    // Standard typing formula: 1 word = 5 characters
    const rawWpm = Math.round((this.totalTypedChars / 5) / timeInMinutes) || 0;
    const netWpm = Math.max(0, Math.round(((this.correctTypedChars / 5) - (this.errorChars / 5)) / timeInMinutes)) || 0;
    const accuracy = this.totalTypedChars > 0 
      ? Math.max(0, Math.min(100, Math.round((this.correctTypedChars / this.totalTypedChars) * 100))) 
      : 100;
    
    const wordsTyped = Math.round(this.correctTypedChars / 5);
    const typedTextSlice = this.targetText.slice(0, Math.max(0, this.currentIndex));
    const typedWordsArray = typedTextSlice.trim().split(/\s+/).filter(w => w.length > 0);
    const wordsTypedListStr = typedWordsArray.length > 0 
      ? typedWordsArray.join(", ") 
      : (this.words.slice(0, Math.max(1, wordsTyped)).join(", "));

    return {
      wpm: netWpm || rawWpm,
      rawWpm: rawWpm,
      netWpm: netWpm,
      accuracy: accuracy,
      totalChars: this.totalTypedChars,
      correctChars: this.correctTypedChars,
      errorChars: this.errorChars,
      wordsTyped: wordsTyped,
      wordsTypedList: wordsTypedListStr,
      elapsedSeconds: Math.round(this.elapsedSeconds),
      misspelledWords: this.mistypedWordStrings,
      sessionText: this.targetText
    };
  }
}

if (typeof window !== 'undefined') {
  window.TypingEngine = TypingEngine;
}
