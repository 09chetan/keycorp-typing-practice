/**
 * Gemini AI Dynamic Text Generator
 * Enables generating fresh corporate scenarios, emails, or technical paragraphs.
 */

class GeminiGenerator {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    localStorage.setItem('gemini_api_key', this.apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  /**
   * Generate corporate or technical typing practice text using Gemini or fallback generator
   */
  async generateText(topic = 'corporate', wordCount = 50) {
    if (!this.hasApiKey()) {
      return this.getFallbackGeneratedText(topic, wordCount);
    }

    try {
      const prompt = this.buildPrompt(topic, wordCount);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error("Empty response from Gemini API");
      }

      return this.cleanGeneratedText(generatedText);
    } catch (err) {
      console.warn("Gemini API call failed, using intelligent offline generator:", err);
      return this.getFallbackGeneratedText(topic, wordCount);
    }
  }

  buildPrompt(topic, wordCount) {
    let topicDesc = "corporate workplace communication, professional emails, project deliverables, and team collaboration";
    if (topic === "technical") {
      topicDesc = "software engineering, system architecture, database optimization, cloud computing, and DevOps best practices";
    } else if (topic === "spelling") {
      topicDesc = "commonly misspelled professional English words used naturally in workplace sentences";
    }

    return `Generate a clean, single-paragraph typing practice text about ${topicDesc}.
Requirements:
1. Target length: approximately ${wordCount} words.
2. Use professional corporate/technical vocabulary suitable for someone entering corporate life.
3. Plain text only. Do not include markdown, quotes, bullet points, headers, or special non-standard characters.
4. Normal punctuation (periods, commas, apostrophes) and clear sentence structures.`;
  }

  cleanGeneratedText(text) {
    return text
      .replace(/[*#`_~[\](){}]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
  }

  getFallbackGeneratedText(topic, wordCount) {
    const templates = {
      corporate: [
        "In our upcoming quarterly review, we will evaluate team deliverables, resource allocation, and key performance indicators to ensure strategic alignment across all departments. Stakeholders have emphasized the necessity for seamless cross-functional collaboration and transparent communication to mitigate potential project roadblocks.",
        "Effective email communication requires clarity, professionalism, and prompt acknowledgement of deliverables. When scheduling executive briefings, ensure all briefing materials and action items are distributed in advance so participants can align on strategic priorities efficiently.",
        "Our organization is committed to fostering continuous professional growth, operational efficiency, and scalable methodologies. By adopting proactive feedback loops and regular sprint retrospectives, we empower teams to deliver high-quality solutions consistently."
      ],
      technical: [
        "Modern microservice architectures leverage asynchronous messaging, container orchestration, and robust continuous integration pipelines to achieve high availability and fault tolerance. Engineering teams must prioritize database indexing and query optimization to reduce end-user latency.",
        "Implementing secure authentication protocols, distributed caching layers, and comprehensive observability metrics ensures that large-scale web applications maintain peak performance during sudden traffic surges.",
        "Refactoring legacy monolithic components into modular, decoupled services enhances code maintainability and accelerates deployment velocity while minimizing regressions across the continuous deployment pipeline."
      ],
      spelling: [
        "It is definitely necessary to accommodate the schedule for maintenance and separate the calendar deliverables to avoid any unnecessary embarrassment during the quarterly presentation.",
        "The committee reached a consensus that conscious communication, strict adherence to hierarchy, and indispensable perseverance guarantee a successful corporate career."
      ]
    };

    const list = templates[topic] || templates.corporate;
    const selected = list[Math.floor(Math.random() * list.length)];
    return selected;
  }
}

if (typeof window !== 'undefined') {
  window.geminiGenerator = new GeminiGenerator();
}
