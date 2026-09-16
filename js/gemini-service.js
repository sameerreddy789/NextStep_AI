// @ts-check
import { UIUtils } from './ui-utils.js';

/**
 * @typedef {import('./app-state.js').UserProfile} UserProfile
 */

/**
 * Gemini AI Service
 * Handles AI-powered resume analysis, interview questions, and feedback.
 * Optimized with few-shot prompting and modern ES2023 patterns.
 */
class GeminiService {
    #proxyUrl = '/api/gemini';
    #defaultModel = 'gemini-3.1-flash-lite';
    #forceDirectApi = false;

    constructor() {
        console.log('[GeminiService] ✅ Initialized (Modern Class with Local Fallback)');
    }

    /**
     * Discover client-side API keys from window.ENV if present
     * @private
     */
    #getClientApiKeys() {
        const keys = [];
        if (typeof window !== 'undefined' && window.ENV) {
            if (window.ENV.VITE_GEMINI_API_KEY) keys.push(window.ENV.VITE_GEMINI_API_KEY);
            if (window.ENV.GEMINI_API_KEY) keys.push(window.ENV.GEMINI_API_KEY);
            for (let i = 1; i <= 4; i++) {
                const k = window.ENV[`VITE_GEMINI_API_KEY_${i}`];
                if (k) keys.push(k);
            }
        }
        return [...new Set(keys.filter(k => k && typeof k === 'string' && !k.startsWith('YOUR_')))];
    }

    /**
     * Check if service is available
     */
    isAvailable() {
        return true; 
    }

    /**
     * Internal request handler with exponential backoff, AbortSignal support,
     * and automatic fallback from /api/gemini (serverless) to direct Google API (local dev).
     * @private
     */
    async #request(prompt, { fileData = null, retries = 3, delay = 1000, onProgress = null, signal = null, keyIndex = 0 } = {}) {
        if (onProgress) {
            onProgress({ stage: 'starting', message: 'Connecting to AI service...' });
        }

        try {
            const parts = [];
            if (fileData) {
                parts.push({
                    inline_data: {
                        mime_type: fileData.mimeType,
                        data: fileData.base64
                    }
                });
            }
            parts.push({ text: prompt });

            if (onProgress) {
                onProgress({ stage: 'uploading', message: fileData ? 'Uploading file to AI...' : 'Sending request...' });
            }

            const clientKeys = this.#getClientApiKeys();
            let useDirect = this.#forceDirectApi || false;
            let response = null;

            // Try proxy first if not forced direct
            if (!useDirect) {
                try {
                    response = await fetch(this.#proxyUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts }],
                            model: this.#defaultModel
                        }),
                        signal
                    });

                    // If proxy endpoint is 404 (local Vite dev server), switch to direct Google API
                    if (response.status === 404 && clientKeys.length > 0) {
                        console.log('[GeminiService] 🔄 /api/gemini returned 404 (local dev). Switching to direct Gemini API with local key.');
                        this.#forceDirectApi = true;
                        useDirect = true;
                    }
                } catch (err) {
                    if (err.name === 'AbortError') throw err;
                    if (clientKeys.length > 0) {
                        console.log('[GeminiService] 🔄 Proxy connection failed. Switching to direct Gemini API.');
                        this.#forceDirectApi = true;
                        useDirect = true;
                    } else {
                        throw err;
                    }
                }
            }

            // Direct Google API Fallback
            if (useDirect) {
                if (clientKeys.length === 0) {
                    throw new Error('AI service configuration missing. Please add your Gemini API key in env-config.js.');
                }
                const currentKey = clientKeys[keyIndex % clientKeys.length];
                const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.#defaultModel}:generateContent?key=${currentKey}`;

                response = await fetch(directUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 8192
                        }
                    }),
                    signal
                });
            }

            if (onProgress) {
                onProgress({ stage: 'processing', message: 'AI is thinking...' });
            }

            if (!response || !response.ok) {
                const errorBody = response ? await response.json().catch(() => ({})) : {};
                
                // Exponential Backoff for rate limits and key rotation
                if (response && (response.status === 429 || response.status === 503) && retries > 0) {
                    console.warn(`[GeminiService] ⏳ ${response.status} Error. Retrying in ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    return this.#request(prompt, { fileData, retries: retries - 1, delay: delay * 2, onProgress, signal, keyIndex: keyIndex + 1 });
                }

                let message = 'AI service error. Please try again.';
                const rawMsg = errorBody.error?.message?.toLowerCase() || '';
                if (rawMsg.includes('api key')) message = 'API key issue. Check your env-config.js.';
                else if (rawMsg.includes('quota')) message = 'AI quota exceeded. Please try again later.';
                
                const err = new Error(message);
                // @ts-ignore
                if (response) err.status = response.status;
                throw err;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!text) throw new Error('AI returned an empty response.');

            if (onProgress) {
                onProgress({ stage: 'complete', message: 'Analysis complete!' });
            }

            return text;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[GeminiService] 🛑 Request cancelled');
                throw error;
            }
            console.error('[GeminiService] ❌ Request failed:', error);
            UIUtils.showToast(error.message, 'error');
            throw error;
        }
    }

    /**
     * Robust JSON Parser with Regex Recovery
     * @private
     */
    #parseJSON(text) {
        if (!text) return null;
        const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch {
            const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            try {
                return match ? JSON.parse(match[0]) : null;
            } catch {
                return null;
            }
        }
    }

    async #fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Advanced Resume Analysis with Multimodal Support
     */
    async analyzeResume(source, targetRole = 'sde', onProgress = null) {
        const isFile = source instanceof File;
        const base64 = isFile ? await this.#fileToBase64(source) : null;
        
        const prompt = `You are a Senior Technical Recruiter. Analyze the provided resume for a ${targetRole} role.
        
        CRITICAL INSTRUCTIONS:
        1. Extract EXACT technical skills and categorize them.
        2. Evaluate experience for impact (use metrics if available).
        3. Calculate a "Readiness Score" based on market demand for ${targetRole}.
        4. Provide actionable ATS optimization tips.

        Few-Shot Example Output:
        {
            "skills": { "present": ["React", "Node.js"], "partial": ["Docker"], "missing": ["Kubernetes"] },
            "atsScore": { "overall": 85, "suggestions": ["Quantify project impacts"] }
        }

        RESPOND ONLY WITH JSON.`;

        const requestOptions = {
            fileData: isFile ? { mimeType: source.type || 'application/pdf', base64 } : null,
            onProgress
        };

        const response = await this.#request(prompt, requestOptions);
        return this.#parseJSON(response);
    }

    /**
     * Adaptive Interview Question Generation
     */
    async generateQuestions(skills, role = 'sde', mode = 'mixed', count = 5) {
        const prompt = `Generate ${count} adaptive interview questions.
        Role: ${role}
        Candidate Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
        Difficulty: Based on skill depth.

        Structure each question with:
        - "type": "code" | "behavioral"
        - "text": The question
        - "tips": 3 guidance points for the candidate

        RESPOND ONLY WITH A JSON ARRAY.`;

        try {
            const response = await this.#request(prompt);
            return this.#parseJSON(response) || [];
        } catch {
            return [{ type: "behavioral", text: "Tell me about a challenging project.", tips: ["Use STAR method", "Focus on results"] }];
        }
    }

    /**
     * AI-Driven Answer Evaluation
     */
    async evaluateAnswer(question, answer) {
        const prompt = `Critique this candidate's response.
        Question: ${question.text}
        Answer: ${answer}

        Return JSON:
        {
            "score": 0-100,
            "feedback": "constructive critique",
            "strengths": ["..."],
            "improvements": ["..."]
        }`;

        const response = await this.#request(prompt);
        return this.#parseJSON(response);
    }
}

// Exports
export { GeminiService };
export const geminiService = new GeminiService();
export default geminiService;
// Legacy Support
window.GeminiService = geminiService;
