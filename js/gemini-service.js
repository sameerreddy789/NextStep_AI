/**
 * Gemini AI Service
 * Handles AI-powered resume analysis, interview questions, and feedback
 */

const GeminiService = {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',

    /**
     * Initialize the service with API key
     */
    init(apiKey) {
        this.apiKey = apiKey || window.ENV?.VITE_GEMINI_API_KEY || '';
        if (this.apiKey) {
            console.log('[GeminiService] ✅ Initialized with API key');
        } else {
            console.warn('[GeminiService] ⚠️ No API key found. Using demo data.');
        }
    },

    /**
     * Check if service is available
     */
    isAvailable() {
        return !!this.apiKey;
    },

    /**
     * Make API request to Gemini with optional file data
     */
    async _request(prompt, fileData = null) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        try {
            // Build parts array
            const parts = [];

            // Add file data if provided (for PDF analysis)
            if (fileData) {
                parts.push({
                    inline_data: {
                        mime_type: fileData.mimeType,
                        data: fileData.base64
                    }
                });
            }

            // Add text prompt
            parts.push({ text: prompt });

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 429) {
                    throw new Error('AI Rate Limit Exceeded (429). Please wait a few seconds and try again. Google Free Tier has limits on how fast you can scan resumes.');
                }
                throw new Error(error.error?.message || 'Gemini API request failed');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return text;
        } catch (error) {
            console.error('[GeminiService] ❌ API Error:', error);
            throw error;
        }
    },

    /**
     * Parse JSON from Gemini response (handles markdown code blocks and partial structures)
     */
    _parseJSON(text) {
        try {
            let cleaned = text.trim();
            // Remove markdown code blocks
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim();

            const parsed = JSON.parse(cleaned);

            // If it's an array (like for questions), return it directly
            if (Array.isArray(parsed)) return parsed;

            // If it's an object, ensure it's not null and has minimum fields for safety
            if (parsed && typeof parsed === 'object') {
                // If it looks like a resume analysis, add defaults
                if (parsed.skills || parsed.score) {
                    return {
                        skills: {
                            present: Array.isArray(parsed.skills?.present) ? parsed.skills.present : [],
                            partial: Array.isArray(parsed.skills?.partial) ? parsed.skills.partial : [],
                            missing: Array.isArray(parsed.skills?.missing) ? parsed.skills.missing : []
                        },
                        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
                        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
                        score: typeof parsed.score === 'number' ? parsed.score : 0,
                        coverage: typeof parsed.coverage === 'number' ? parsed.coverage : 0,
                        readiness: typeof parsed.readiness === 'number' ? parsed.readiness : 0,
                        ...parsed
                    };
                }
                return parsed;
            }
            return null;
        } catch (e) {
            console.error('[GeminiService] Failed to parse JSON:', e, 'Text:', text);
            return null;
        }
    },

    /**
     * Convert File to base64
     */
    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Analyze PDF file directly using Gemini's multimodal capability
     */
    async analyzePDF(file, targetRole = 'sde') {
        console.log('[GeminiService] 📄 Analyzing PDF:', file.name);

        const base64 = await this._fileToBase64(file);

        const prompt = `You are an expert resume analyzer. Analyze this PDF resume for a ${targetRole} role.

Respond with ONLY a JSON object (no markdown):
{
    "skills": {
        "present": ["skill1", "skill2"],
        "partial": ["skill3"],
        "missing": ["skill4", "skill5"]
    },
    "experience": [
        {"title": "Job Title", "company": "Company", "duration": "X years"}
    ],
    "projects": [
        {"name": "Project Name", "tech": "Technologies"}
    ],
    "score": 75,
    "coverage": 65,
    "readiness": 60,
    "atsScore": {
        "overall": 72,
        "keyword": 68,
        "experience": 75,
        "format": 80,
        "suggestions": ["suggestion1", "suggestion2"]
    }
}`;

        try {
            const response = await this._request(prompt, {
                mimeType: 'application/pdf',
                base64: base64
            });
            const parsed = this._parseJSON(response);

            if (parsed) {
                console.log('[GeminiService] ✅ PDF analysis complete');
                return parsed;
            } else {
                throw new Error('Failed to parse AI response');
            }
        } catch (error) {
            console.error('[GeminiService] ❌ PDF analysis failed:', error);
            throw error;
        }
    },

    /**
     * Analyze resume text
     */
    async analyzeResume(resumeText, targetRole = 'sde') {
        console.log('[GeminiService] 🔍 Analyzing resume text');

        const prompt = `You are an expert resume analyzer. Analyze this resume for a ${targetRole} role.

Resume Text:
${resumeText}

Respond with ONLY a JSON object (no markdown):
{
    "skills": {
        "present": ["skill1", "skill2"],
        "partial": ["skill3"],
        "missing": ["skill4", "skill5"]
    },
    "experience": [
        {"title": "Job Title", "company": "Company", "duration": "X years"}
    ],
    "projects": [
        {"name": "Project Name", "tech": "Technologies"}
    ],
    "score": 75,
    "coverage": 65,
    "readiness": 60,
    "atsScore": {
        "overall": 72,
        "keyword": 68,
        "experience": 75,
        "format": 80,
        "suggestions": ["suggestion1", "suggestion2"]
    }
}`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed) {
                console.log('[GeminiService] ✅ Resume analysis complete');
                return parsed;
            }
            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('[GeminiService] ❌ Resume analysis failed:', error);
            throw error;
        }
    },

    /**
     * Generate interview questions
     */
    async generateQuestions(skills, role = 'sde', type = 'mixed', count = 8) {
        console.log('[GeminiService] 📝 Generating questions');

        const skillList = Array.isArray(skills) ? skills.join(', ') : skills;

        const prompt = `Generate ${count} interview questions for a ${role} position.

Candidate's Skills: ${skillList}
Type: ${type}

Respond with ONLY a JSON array (no markdown):
[
    {
        "type": "code",
        "category": "Data Structures",
        "text": "Write a function to reverse a linked list.",
        "difficulty": "medium",
        "timeLimit": 300,
        "tips": ["Consider edge cases like empty list", "Discuss time vs space complexity", "Try both iterative and recursive approaches"]
    },
    {
        "type": "text",
        "category": "Behavioral",
        "text": "Tell me about a challenging project.",
        "difficulty": "easy",
        "timeLimit": 120,
        "tips": ["Use the STAR method", "Focus on your specific actions", "Highlight the positive outcome"]
    }
]`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed && Array.isArray(parsed)) {
                console.log(`[GeminiService] ✅ Generated ${parsed.length} questions`);
                return parsed;
            }
            throw new Error('Failed to parse questions');
        } catch (error) {
            console.error('[GeminiService] ❌ Question generation failed:', error);
            throw error;
        }
    },

    /**
     * Evaluate an interview answer
     */
    async evaluateAnswer(question, answer) {
        console.log('[GeminiService] 📊 Evaluating answer');

        const prompt = `Evaluate this interview answer.

Question: ${question.text}
Category: ${question.category}

Answer: ${answer}

Evaluate this interview answer based on intended problem logic, approach, and reasoning.
Question: ${question.text} (${question.category})
Answer: ${answer}

Respond with ONLY a JSON object:
{
    "outcome": "Correct Answer" | "Incorrect Answer",
    "score": 0-100,
    "feedback": "Concise feedback on accuracy",
    "reasoning": "Brief analysis of the user's logic and approach",
    "strengths": ["..."],
    "improvements": ["..."]
}`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed) {
                console.log('[GeminiService] ✅ Answer evaluated:', parsed.score);
                return parsed;
            }
            throw new Error('Failed to parse evaluation');
        } catch (error) {
            console.error('[GeminiService] ❌ Evaluation failed:', error);
            throw error;
        }
    }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    GeminiService.init();
});

window.GeminiService = GeminiService;
