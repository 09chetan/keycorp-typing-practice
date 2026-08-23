# KeyCorp - Corporate & Technical Typing Practice & Spelling Mastery

A modern, high-performance web application designed specifically for professionals entering the corporate world to master typing speed, technical vocabulary, and accurate spelling memory.

---

## ✨ Features

- ⏱️ **Preset Timers**: 60s, 90s, 120s, and 5 Minutes (300s).
- 💼 **Targeted Word Collections**:
  - **Corporate Vocabulary**: Deliverables, stakeholders, bandwidth, feasibility, compliance, remuneration, etc.
  - **Technical & IT Vocabulary**: Microservices, polymorphism, asynchronous, kubernetes, idempotence, latency, etc.
  - **Corporate Sentences & Email Snippets**: Full workplace sentences to practice realistic workflow typing.
  - **Tricky Spellings Drill**: Common tricky English words (*accommodate*, *maintenance*, *separate*, *liaison*, *privilege*, *definitely*).
  - **Gemini AI Generator**: On-demand dynamic corporate scenario generation.
- 🎯 **Spelling Mistake Vault**: Automatically captures mistyped words across all sessions and lets you run dedicated practice sessions on your weak words.
- 📊 **Daily History & Analytics**: Aggregates sessions day-wise (Average WPM, Accuracy, Total Words, Session counts).
- 📈 **Google Sheets Sync**: Auto-logs every practice session to your private Google Sheet in real-time.
- 🌙 **Modern Design & Sound**: Dark/Light mode, smooth caret animation, mechanical keypress sound feedback, and CSV data export.

---

## 🚀 Quick Setup & Usage

### 1. Launching Locally
Open `index.html` directly in your browser or run a simple local web server:

```powershell
python -m http.server 8000
```
Then visit: `http://localhost:8000`

---

## 📊 Google Sheets Sync Setup (1-Minute Guide)

To have your daily practice sessions automatically sync to your personal Google Sheet:

1. Create a new Google Sheet (e.g. named **"Typing Practice Log"**).
2. Go to **Extensions ➔ Apps Script**.
3. Replace any code with this snippet:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date", 
      "Time", 
      "Category", 
      "Mode", 
      "Duration", 
      "WPM", 
      "Net WPM", 
      "Accuracy", 
      "Words Typed", 
      "Errors", 
      "Misspelled Words",
      "Session Paragraph"
    ]);
  }
  
  sheet.appendRow([
    data.date, 
    data.time, 
    data.category, 
    data.mode, 
    data.duration, 
    data.wpm, 
    data.netWpm, 
    data.accuracy, 
    data.wordsTyped, 
    data.errors, 
    data.misspelledWords,
    data.sessionText
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy ➔ New deployment**.
5. Select type: **Web app**.
6. Configuration:
   - **Execute as**: *Me*
   - **Who has access**: *Anyone*
7. Click **Deploy**, authorize permissions, and copy the **Web app URL**.
8. In KeyCorp, click **⚙️ Settings**, paste the URL into the **Google Sheets Webhook URL** field, and click **Save Settings**.
9. Click **🧪 Test Google Sheets Sync** to verify!

---

## ⌨️ Keyboard Shortcuts

- `Tab` : Quickly restart the current test with fresh words.
- `Escape` : Close any open modal / return to typing arena.
- `Backspace` : Correct mistyped characters.
