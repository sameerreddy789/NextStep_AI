import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                auth: resolve(__dirname, 'auth.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                feedback: resolve(__dirname, 'feedback.html'),
                interview: resolve(__dirname, 'interview.html'),
                onboarding: resolve(__dirname, 'onboarding.html'),
                profile: resolve(__dirname, 'profile.html'),
                resume: resolve(__dirname, 'resume.html'),
                roadmap: resolve(__dirname, 'roadmap.html'),
                skillGap: resolve(__dirname, 'skill-gap.html'),
                notFound: resolve(__dirname, '404.html'),
            },
        },
    },
});
