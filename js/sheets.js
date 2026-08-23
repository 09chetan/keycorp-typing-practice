/**
 * Google Sheets and Local Daily History Manager
 * Syncs day-wise typing sessions with Google Sheets Apps Script Webhook
 * and maintains persistent offline local storage statistics.
 */

class SheetsSyncManager {
  constructor() {
    this.webhookUrl = localStorage.getItem('sheets_webhook_url') || '';
    this.storageKey = 'typing_practice_sessions_v1';
    this.mistakesKey = 'typing_mistakes_bank_v1';
  }

  setWebhookUrl(url) {
    this.webhookUrl = (url || '').trim();
    localStorage.setItem('sheets_webhook_url', this.webhookUrl);
  }

  getWebhookUrl() {
    return this.webhookUrl;
  }

  isConfigured() {
    return Boolean(this.webhookUrl && this.webhookUrl.startsWith('http'));
  }

  /**
   * Save a completed session both locally and to Google Sheets if configured
   */
  async recordSession(sessionData) {
    // 1. Ensure timestamp & formatted date
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const completeRecord = {
      id: 'session_' + Date.now(),
      date: formattedDate,
      time: formattedTime,
      timestamp: now.getTime(),
      mode: sessionData.mode || 'Time',
      durationSeconds: sessionData.durationSeconds || 60,
      category: sessionData.category || 'Corporate',
      wpm: sessionData.wpm || 0,
      netWpm: sessionData.netWpm || 0,
      accuracy: sessionData.accuracy || 0,
      totalChars: sessionData.totalChars || 0,
      correctChars: sessionData.correctChars || 0,
      errorChars: sessionData.errorChars || 0,
      wordsTyped: sessionData.wordsTyped || 0,
      misspelledWords: sessionData.misspelledWords || [],
      syncedToSheets: false
    };

    // 2. Save locally
    const sessions = this.getLocalSessions();
    sessions.unshift(completeRecord);
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));

    // 3. Update mistakes bank for spelling practice
    if (sessionData.misspelledWords && sessionData.misspelledWords.length > 0) {
      this.recordMistakes(sessionData.misspelledWords);
    }

    // 4. Automatically save to local Excel/CSV server backend
    try {
      await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeRecord)
      });
      completeRecord.savedToExcel = true;
    } catch (e) {
      console.log("Local Excel backend sync not reachable, cached locally.");
    }

    // 5. Send to Google Sheets if Webhook is available
    if (this.isConfigured()) {
      try {
        const response = await this.sendToGoogleSheets(completeRecord);
        if (response.success) {
          completeRecord.syncedToSheets = true;
          localStorage.setItem(this.storageKey, JSON.stringify(sessions));
        }
        return { success: true, synced: completeRecord.syncedToSheets, record: completeRecord };
      } catch (err) {
        console.warn("Could not sync to Google Sheets webhook:", err);
        return { success: true, synced: false, error: err.message, record: completeRecord };
      }
    }

    return { success: true, synced: false, record: completeRecord };
  }

  /**
   * Sends JSON payload to Google Apps Script Web App
   */
  async sendToGoogleSheets(record) {
    if (!this.isConfigured()) return { success: false, reason: "Not configured" };

    const payload = {
      date: record.date,
      time: record.time,
      mode: record.mode,
      duration: `${record.durationSeconds}s`,
      category: record.category,
      wpm: record.wpm,
      netWpm: record.netWpm,
      accuracy: `${record.accuracy}%`,
      wordsTyped: record.wordsTyped,
      errors: record.errorChars,
      misspelledWords: (record.misspelledWords && record.misspelledWords.length > 0) 
        ? record.misspelledWords.join(', ') 
        : 'None',
      sessionText: record.sessionText || '',
      wordsTypedList: record.wordsTypedList || record.sessionText || ''
    };

    try {
      // Using text/plain prevents browser CORS preflight OPTIONS rejection with Google Apps Script
      await fetch(this.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      return { success: true };
    } catch (e) {
      console.error("Failed to post to Google Sheets webhook:", e);
      throw e;
    }
  }

  /**
   * Retrieves all local sessions
   */
  getLocalSessions() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Get daily aggregated statistics
   */
  getDailyAggregates() {
    const sessions = this.getLocalSessions();
    const dailyMap = {};

    sessions.forEach(sess => {
      const date = sess.date;
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date: date,
          sessionsCount: 0,
          totalWords: 0,
          totalDuration: 0,
          sumWpm: 0,
          sumAccuracy: 0,
          misspelledWordsSet: new Set()
        };
      }

      dailyMap[date].sessionsCount += 1;
      dailyMap[date].totalWords += sess.wordsTyped || 0;
      dailyMap[date].totalDuration += sess.durationSeconds || 0;
      dailyMap[date].sumWpm += sess.wpm || 0;
      dailyMap[date].sumAccuracy += sess.accuracy || 0;

      if (sess.misspelledWords && Array.isArray(sess.misspelledWords)) {
        sess.misspelledWords.forEach(w => dailyMap[date].misspelledWordsSet.add(w));
      }
    });

    return Object.values(dailyMap).map(d => ({
      date: d.date,
      sessionsCount: d.sessionsCount,
      totalWords: d.totalWords,
      totalMinutes: (d.totalDuration / 60).toFixed(1),
      avgWpm: Math.round(d.sumWpm / d.sessionsCount),
      avgAccuracy: Math.round(d.sumAccuracy / d.sessionsCount),
      uniqueMistakes: Array.from(d.misspelledWordsSet)
    })).sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Mistake Bank management for spelling repetition drills
   */
  recordMistakes(words) {
    const bank = this.getMistakesBank();
    words.forEach(w => {
      const cleaned = w.toLowerCase().replace(/[^a-z-]/g, '');
      if (cleaned.length > 2) {
        bank[cleaned] = (bank[cleaned] || 0) + 1;
      }
    });
    localStorage.setItem(this.mistakesKey, JSON.stringify(bank));
  }

  getMistakesBank() {
    try {
      const data = localStorage.getItem(this.mistakesKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  clearMistakesBank() {
    localStorage.removeItem(this.mistakesKey);
  }

  /**
   * Export all sessions as CSV file
   */
  exportToCsv() {
    const sessions = this.getLocalSessions();
    if (sessions.length === 0) {
      alert("No practice sessions recorded yet.");
      return;
    }

    const headers = ["Date", "Time", "Category", "Mode", "Duration (sec)", "WPM", "Net WPM", "Accuracy (%)", "Words Typed", "Errors", "Misspelled Words"];
    const rows = sessions.map(s => [
      s.date,
      s.time,
      `"${s.category}"`,
      s.mode,
      s.durationSeconds,
      s.wpm,
      s.netWpm,
      s.accuracy,
      s.wordsTyped,
      s.errorChars,
      `"${(s.misspelledWords || []).join('; ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `typing_practice_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

if (typeof window !== 'undefined') {
  window.sheetsSync = new SheetsSyncManager();
}
