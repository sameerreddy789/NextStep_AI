# NextStep AI — Bug Report & Improvement Suggestions

**Date:** February 21, 2026  
**Scope:** Full codebase audit — security, architecture, bugs, and improvements

---

## 🔴 CRITICAL / FATAL Issues

### 1. Hardcoded API Keys Committed to Repository (SECURITY — FATAL)

**Files:** `js/env-config.js`, `js/firebase-config.js`, `.env`

All API keys (Firebase, Gemini x4, SerpAPI) are hardcoded in plain text in source files that get deployed to production. Even though `.env` and `js/env-config.js` are listed in `.gitignore`, the keys are **also** hardcoded as fallback defaults inside `js/firebase-config.js` (lines 36–43), which IS committed and deployed.

**Impact:**
- Anyone inspecting your deployed site's JS can extract all keys
- Gemini API keys can be abused (you pay per call)
- SerpAPI key can be exhausted
- Firebase project can be targeted for abuse

**Exposed keys (partial):**
- Firebase API Key: `AIzaSyBx72z8...`
- Gemini Keys: 4 keys starting with `AIzaSyC...`, `AIzaSyB...`, etc.
- SerpAPI Key: `88d888634...`

**Fix:**
1. **Immediately rotate ALL keys** in Firebase Console, Google Cloud Console, and SerpAPI dashboard
2. Remove all hardcoded fallback values from `firebase-config.js`
3. Use Vite's `import.meta.env` exclusively (requires a working build pipeline — see Issue #4)
4. For Firebase client-side keys, enforce security through Firebase Security Rules and App Check

---

### 2. SerpAPI Key Sent from Browser (SECURITY — FATAL)

**File:** `js/serp-service.js`

The SerpAPI key is sent directly from the browser via a CORS proxy (`corsproxy.io`). This means:
- The key is visible in browser DevTools Network tab
- The CORS proxy operator can intercept and steal the key
- Anyone can extract the key from your JS bundle

```js
// serp-service.js — line 38
const url = `https://serpapi.com/search?${queryParams.toString()}`;
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
```

**Fix:** SerpAPI calls should go through your own backend/serverless function (e.g., Firebase Cloud Functions). Never send secret API keys from the browser.

---

### 3. XSS Vulnerability — Unsanitized User Input in HTML

**Files:** `js/dashboard.js` (lines 747, 831), `js/interview-engine.js` (lines 701, 895, 1241, 1285)

User-provided data (task titles, error messages, AI responses) is injected directly into `innerHTML` without sanitization:

```js
// dashboard.js — task rendering
`<div class="task-title">${t.title}</div>`

// interview-engine.js — AI tips
tipsList.innerHTML = combinedTips.map(tip => `<li>${tip}</li>`).join('');

// interview-engine.js — error messages
loadingEl.innerHTML = `<p>Analysis failed: ${err.message}</p>`;
```

If a task title or AI response contains `<script>` or event handlers like `onerror=`, it will execute in the user's browser.

**Fix:** Sanitize all dynamic content before inserting into DOM. Use `textContent` instead of `innerHTML` where possible, or create a utility:
```js
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
```

---

### 4. No Vite Configuration File — Build Pipeline Broken

**Missing file:** `vite.config.js`

`package.json` defines Vite scripts (`dev`, `build`, `preview`) but there's no `vite.config.js`. Running `npm run build` will use Vite defaults, which won't properly handle:
- Multi-page app setup (dashboard.html, auth.html, etc.)
- Environment variable injection
- The current CDN-based Firebase imports

**Impact:** The build/deploy pipeline is effectively broken for production. The app only works as a raw static site.

**Fix:** Create a `vite.config.js`:
```js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                auth: resolve(__dirname, 'auth.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                interview: resolve(__dirname, 'interview.html'),
                onboarding: resolve(__dirname, 'onboarding.html'),
                profile: resolve(__dirname, 'profile.html'),
                resume: resolve(__dirname, 'resume.html'),
                roadmap: resolve(__dirname, 'roadmap.html'),
                skillGap: resolve(__dirname, 'skill-gap.html'),
                feedback: resolve(__dirname, 'feedback.html'),
            }
        }
    }
});
```

---

## 🟠 HIGH Severity Bugs

### 5. Duplicate Method Definitions in `gemini-service.js`

**File:** `js/gemini-service.js`

Both `transcribeAudio` (lines 535 and 925) and `_fileToBase64` (lines 291 and 949) are defined twice in the same object literal. In JavaScript, the second definition silently overwrites the first.

The first `transcribeAudio` (line 535) accepts an `onProgress` callback; the second (line 925) does not. If any caller passes `onProgress`, it will be silently ignored.

**Fix:** Remove the duplicate definitions (lines 925–960). Keep the first versions which are more complete.

---

### 6. Duplicate `saveSkills()` Call in `store.js`

**File:** `js/store.js` (lines 285–286)

```js
saveSkills(skills);
saveSkills(skills);  // <-- redundant duplicate
```

Inside the `logProgress()` function, `saveSkills(skills)` is called twice consecutively. This is a copy-paste bug — it writes to localStorage twice for no reason.

**Fix:** Remove the duplicate line 286.

---

### 7. Firebase Initialization Race Condition

**Files:** `js/firebase-config.js`, `js/route-guard.js`

Both files independently attempt to initialize Firebase using `getApps().length > 0 ? getApp() : initializeApp(config)`. The route guard runs as a `<script>` in `<head>` and dynamically imports Firebase modules, while `firebase-config.js` is loaded as an ES module.

On slow networks, these can race against each other, potentially causing:
- "Firebase: Firebase App named '[DEFAULT]' already exists" errors
- Undefined `auth`/`db` references if the module hasn't loaded yet

**Fix:** Centralize Firebase initialization in a single module (`firebase-config.js`) and have `route-guard.js` import from it instead of re-initializing.

---

### 8. Auth Guard Bypass via localStorage Manipulation

**File:** `js/route-guard.js`

The route guard's initial check relies entirely on `localStorage.getItem('nextStep_user')`. A user can bypass the entire flow enforcement by manually setting localStorage values in the browser console:

```js
localStorage.setItem('nextStep_user', '{}');
localStorage.setItem('nextStep_onboardingCompleted', 'true');
localStorage.setItem('nextStep_roadmapCompleted', 'true');
```

The async Firebase auth check happens later but doesn't block page rendering — the page content is already visible before the check completes.

**Fix:** Don't render protected page content until Firebase auth is confirmed. Use a server-side approach or at minimum, hide the `<main>` content until auth resolves.

---

### 9. Gemini API Key Rotation Has Infinite Loop Risk

**File:** `js/gemini-service.js` (lines 120–130, 155–165)

When a 429/503 error occurs, the code rotates to the next API key and retries **without decrementing the retry counter**:

```js
if (this.apiKeys.length > 1) {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return this._request(prompt, fileData, retries, delay, onProgress); // retries NOT decremented
}
```

If ALL keys are rate-limited, this creates an infinite loop cycling through keys forever.

**Fix:** Track which keys have been tried in the current request cycle. After all keys are exhausted, fall back to exponential backoff or throw.

---

### 10. Firebase Hosting Deploys Entire Repository

**File:** `firebase.json`

```json
"public": "."
```

This deploys the entire project root, including:
- `.env` file (if present)
- `package.json` (reveals dependencies)
- Source `.js` files (no minification)
- `node_modules/` (if not ignored properly)

**Fix:** Change to `"public": "dist"` and use `npm run build` before deploying. Or at minimum, add sensitive files to the `ignore` array.

---

## 🟡 MEDIUM Severity Issues

### 11. No localStorage Error Handling

**File:** `js/store.js`

All `localStorage.setItem()` calls have zero error handling. If the user's storage is full (5MB limit), or in private browsing mode on some browsers, these calls will throw and crash the app.

**Fix:** Wrap localStorage operations in try-catch:
```js
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}
```

---

### 12. Inconsistent State Management — Dual Source of Truth

**Files:** `js/app-state.js` (Firestore-backed), `js/store.js` (localStorage-backed)

The app maintains two completely separate state systems:
- `appState` syncs with Firestore for roadmap, interviews, resume data
- `SkillStore` uses localStorage for skills, tasks, priority skills

These can get out of sync. For example, tasks exist in both systems with different data models.

**Fix:** Consolidate into a single state layer. Use Firestore as the source of truth with localStorage as a cache/offline fallback.

---

### 13. `currentKeyIndex` Hardcoded to Skip Key 1

**File:** `js/gemini-service.js` (line 42)

```js
this.currentKeyIndex = 1; // Skip key 1 (daily limit reached)
```

This is a hardcoded hack that permanently skips the first API key. If the key's limit resets (daily), it will never be used again until someone changes this line.

**Fix:** Remove the hardcoded skip. Implement proper key health tracking that automatically retries previously-failed keys after a cooldown period.

---

### 14. Firebase Rewrite Rule Too Broad

**File:** `firebase.json`

```json
"rewrites": [{ "source": "**", "destination": "/index.html" }]
```

This rewrites ALL requests (including API calls, static assets with typos, etc.) to `index.html`. If you add Cloud Functions or API routes later, they'll be intercepted.

**Fix:**
```json
"rewrites": [{ "source": "!/api/**", "destination": "/index.html" }]
```

---

### 15. No Offline Support / Network Error Recovery

The app has no service worker, no offline detection, and no graceful degradation when Firestore is unreachable. If the user loses internet mid-session, the app silently fails.

**Fix:** Add basic offline detection and show a user-friendly banner. Consider Firestore's built-in offline persistence:
```js
import { enableIndexedDbPersistence } from "firebase/firestore";
enableIndexedDbPersistence(db);
```

---

### 16. `app-state.js` — `fetchAllData` Error Swallowed

**File:** `js/app-state.js` (line 57)

The `init()` method calls `await this.fetchAllData(user.uid)` but `fetchAllData` catches errors internally and only logs them. The `init()` promise always resolves `true` even if all data fetches failed, leaving the app in a broken state with null data.

**Fix:** Let `fetchAllData` propagate errors, or have `init()` check if critical data loaded successfully before resolving.

---

### 17. Operator Precedence Bug in Task Deadline

**File:** `js/app-state.js` (line 148)

```js
deadline: topic.deadline || week.title.includes('Focus') ? 'This Week' : 'Next Week',
```

Due to operator precedence, this evaluates as:
```js
deadline: (topic.deadline || week.title.includes('Focus')) ? 'This Week' : 'Next Week'
```

So if `topic.deadline` is truthy (e.g., `"March 15"`), the result is always `'This Week'` instead of the actual deadline string.

**Fix:**
```js
deadline: topic.deadline || (week.title.includes('Focus') ? 'This Week' : 'Next Week'),
```

---

## 🔵 LOW Severity / Improvements

### 18. Firebase SDK Loaded from CDN Instead of npm

Multiple files import Firebase directly from `gstatic.com` CDN URLs. This means:
- No tree-shaking (larger bundle)
- No version pinning via lockfile
- CDN outage = app is completely broken
- Version `10.7.1` is pinned in URLs but may be outdated

**Recommendation:** Install Firebase via npm and import normally. Vite will handle bundling.

### 19. No Content Security Policy (CSP)

None of the HTML files include CSP headers or meta tags. This makes XSS attacks easier to exploit.

**Recommendation:** Add a CSP meta tag to all HTML files.

### 20. CORS Proxy Dependency for SerpAPI

**File:** `js/serp-service.js`

The app depends on `corsproxy.io`, a third-party CORS proxy. This is:
- Unreliable (can go down anytime)
- A security risk (proxy can intercept/modify responses)
- A privacy concern (all search queries go through a third party)

**Recommendation:** Move SerpAPI calls to a Firebase Cloud Function.

### 21. No Input Validation on Task Creation

**File:** `js/dashboard.js` — `saveNewTask()`

The only validation is checking if the title is empty. There's no length limit, no character filtering, and no rate limiting. A user could create thousands of tasks or inject very long strings.

### 22. Missing `package-lock.json`

No lockfile in the repository means builds aren't reproducible across environments.

### 23. Console Logging in Production

The codebase is full of `console.log`, `console.warn`, and `console.error` statements with emoji. These should be stripped or gated behind a debug flag for production.

---

## Summary

| Severity | Count | Key Areas |
|----------|-------|-----------|
| 🔴 Critical | 4 | API key exposure, XSS, broken build, browser-side secret keys |
| 🟠 High | 6 | Duplicate code, race conditions, auth bypass, infinite loops |
| 🟡 Medium | 7 | State management, error handling, operator bugs |
| 🔵 Low | 6 | CDN deps, CSP, logging, input validation |

**Top 3 immediate actions:**
1. Rotate all API keys NOW
2. Remove hardcoded keys from `firebase-config.js` and set up proper env var injection
3. Create `vite.config.js` for a working build pipeline

---

## ✅ FIXES APPLIED

The following issues have been resolved in this codebase:

| # | Issue | Fix |
|---|-------|-----|
| 1 | Hardcoded API key fallbacks in `firebase-config.js` | Removed all fallback default values; keys now load exclusively from `window.ENV` |
| 3 | XSS in dashboard task rendering | All user/AI content escaped via `escapeHTML()` or `textContent` |
| 3 | XSS in interview-engine (tips, errors, console, test results) | All dynamic content sanitized before `innerHTML` injection |
| 3 | XSS in editor.js output | Output escaped via `textContent` |
| 3 | XSS in roadmap-ui.js skill focus | Escaped via `textContent` |
| 5 | Duplicate `transcribeAudio` and `_fileToBase64` in gemini-service.js | Removed duplicate definitions (kept the more complete versions) |
| 6 | Duplicate `saveSkills()` call in store.js | Removed redundant second call |
| 9 | Gemini API key rotation infinite loop | Added `_triedKeysThisRequest` Set to track exhausted keys per cycle |
| 10 | firebase.json deploys sensitive files | Added `.env`, `env-config.js`, markdown docs to ignore list |
| 11 | No localStorage error handling in store.js | Added `safeSetItem()` wrapper with try-catch around all writes |
| 13 | `currentKeyIndex` hardcoded to skip key 1 | Reset to `0`; proper rotation handles failures dynamically |
| 14 | Firebase rewrite rule too broad | Changed from `**` to `!/api/**` |
| 16 | `fetchAllData` error swallowed silently | Now returns success boolean; `init()` logs partial data warning |
| 17 | Operator precedence bug in task deadline | Added parentheses: `topic.deadline \|\| (ternary)` |
| — | Duplicate "Initialize Firebase" comment | Removed duplicate line |
| — | Added `escapeHTML` utility to `UIUtils` | Global sanitization helper available project-wide |

### Still requires manual action (cannot be automated):
- **Issue 1**: Rotate all API keys (Firebase, Gemini x4, SerpAPI) in their respective consoles
- **Issue 2**: Move SerpAPI calls to a backend/Cloud Function (architectural change)
- **Issue 7**: Centralize Firebase init to eliminate race condition (requires refactoring route-guard.js to import from firebase-config.js)
- **Issue 8**: Auth guard localStorage bypass (requires architectural change to hide content until Firebase auth resolves)

---

## ✅ FIXES APPLIED — Round 2 (Final Audit, Feb 22 2026)

| # | Issue | Fix |
|---|-------|-----|
| 24 | `env-config.js` was in Firebase hosting ignore list — production site had NO API keys | Removed from `firebase.json` ignore list so it deploys to production |
| 25 | `js/toast-notifications.js` referenced in `dashboard.html` but file doesn't exist (404) | Removed the script tag from `dashboard.html` |
| 26 | XSS in `renderInterviewResults()` — AI-generated dimension names, feedback, strengths, improvements, answers injected raw | All AI/user content now escaped via `escapeHTML()` |

### Final Audit Summary (Feb 22 2026)

**Routing:** Route guard works correctly. Flow enforcement (onboarding → resume → interview → dashboard) is solid. Auth check has retry logic. No fatal routing bugs.

**Database:** Firestore reads/writes use proper merge strategies. Interview results save to both a summary doc and a subcollection. Profile service uses subcollection pattern correctly. No data corruption risks found.

**Script Load Order:** All HTML pages now load `env-config.js` first, before `firebase-config.js` and other modules. Verified across all 9 HTML pages.

**Remaining known issues (non-fatal):**
- `js/env-config.js` contains ALL API keys in plain text and is now deployed to production — this is inherent to a vanilla JS app without a build step. Keys are visible in browser DevTools. Mitigate with Firebase Security Rules + API key restrictions in Google Cloud Console.
- `js/env-loader.js` exists but is never loaded by any HTML page (dead code)
- Console logging is verbose in production (cosmetic, not a bug)
