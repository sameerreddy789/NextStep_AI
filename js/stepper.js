/**
 * Stepper UI Component - Vanilla JS
 * Animated step indicator with sliding content transitions
 */

class Stepper {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#stepper-container',
            initialStep: options.initialStep || 1,
            steps: options.steps || [],
            backButtonText: options.backButtonText || 'Back',
            nextButtonText: options.nextButtonText || 'Continue',
            completeButtonText: options.completeButtonText || 'Complete',
            onStepChange: options.onStepChange || (() => { }),
            onComplete: options.onComplete || (() => { }),
            accentColor: options.accentColor || '#6366f1',
            ...options
        };

        this.currentStep = this.options.initialStep;
        this.totalSteps = this.options.steps.length;
        this.direction = 0;
        this.isCompleted = false;

        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.updateUI();
    }

    render() {
        const container = document.querySelector(this.options.containerSelector);
        if (!container) return;

        const { steps, accentColor } = this.options;

        container.innerHTML = `
            <div class="stepper-outer">
                <div class="stepper-box" style="--accent: ${accentColor}">
                    <!-- Left Side: Step Indicators -->
                    <div class="stepper-indicators">
                        ${steps.map((_, i) => `
                            <div class="step-indicator" data-step="${i + 1}">
                                <div class="step-indicator-circle">
                                    <span class="step-number">${i + 1}</span>
                                    <svg class="check-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    <div class="active-dot"></div>
                                </div>
                            </div>
                            ${i < steps.length - 1 ? '<div class="step-connector"><div class="step-connector-fill"></div></div>' : ''}
                        `).join('')}
                    </div>

                    <!-- Right Side: Content and Footer -->
                    <div class="stepper-right">
                        <!-- Step Content -->
                        <div class="stepper-content">
                            ${steps.map((step, i) => `
                                <div class="step-panel" data-panel="${i + 1}">
                                    <div class="step-panel-icon">${step.icon}</div>
                                    <div class="step-panel-text">
                                        <h3 class="step-panel-title">${step.title}</h3>
                                        <p class="step-panel-desc">${step.description}</p>
                                        ${step.detail ? `<p class="step-panel-detail">${step.detail}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Completed State -->
                        <div class="stepper-completed">
                            <div class="completed-icon">✅</div>
                            <h3>All Steps Complete!</h3>
                            <p>You're ready to accelerate your career.</p>
                            <a href="auth.html" class="stepper-cta-btn">Get Started Free</a>
                        </div>

                        <!-- Footer -->
                        <div class="stepper-footer">
                            <button class="stepper-back-btn">${this.options.backButtonText}</button>
                            <button class="stepper-next-btn">${this.options.nextButtonText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Step indicator clicks
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                const step = parseInt(indicator.dataset.step);
                if (step !== this.currentStep && !this.isCompleted) {
                    this.direction = step > this.currentStep ? 1 : -1;
                    this.goToStep(step);
                }
            });
        });

        // Back button
        const backBtn = document.querySelector('.stepper-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handleBack());
        }

        // Next button
        const nextBtn = document.querySelector('.stepper-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNext());
        }
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.direction = -1;
            this.goToStep(this.currentStep - 1);
        }
    }

    handleNext() {
        if (this.currentStep < this.totalSteps) {
            this.direction = 1;
            this.goToStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    goToStep(step) {
        this.currentStep = step;
        this.options.onStepChange(step);
        this.updateUI();
    }

    complete() {
        this.isCompleted = true;
        this.options.onComplete();
        this.updateUI();
    }

    updateUI() {
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            const step = parseInt(indicator.dataset.step);
            indicator.classList.remove('active', 'complete', 'inactive');

            if (step === this.currentStep && !this.isCompleted) {
                indicator.classList.add('active');
            } else if (step < this.currentStep || this.isCompleted) {
                indicator.classList.add('complete');
            } else {
                indicator.classList.add('inactive');
            }
        });

        // Update connectors
        document.querySelectorAll('.step-connector').forEach((connector, i) => {
            const fill = connector.querySelector('.step-connector-fill');
            if (i + 1 < this.currentStep || this.isCompleted) {
                fill.style.width = '100%';
            } else {
                fill.style.width = '0';
            }
        });

        // Update content panels
        document.querySelectorAll('.step-panel').forEach(panel => {
            const step = parseInt(panel.dataset.panel);
            panel.classList.remove('active', 'slide-left', 'slide-right');

            if (step === this.currentStep && !this.isCompleted) {
                panel.classList.add('active');
            } else if (step < this.currentStep) {
                panel.classList.add('slide-left');
            } else {
                panel.classList.add('slide-right');
            }
        });

        // Show/hide completed state
        const completedDiv = document.querySelector('.stepper-completed');
        const contentDiv = document.querySelector('.stepper-content');
        const footer = document.querySelector('.stepper-footer');

        if (this.isCompleted) {
            completedDiv.classList.add('visible');
            contentDiv.style.display = 'none';
            footer.style.display = 'none';
        } else {
            completedDiv.classList.remove('visible');
            contentDiv.style.display = 'block';
            footer.style.display = 'flex';
        }

        // Update footer buttons
        const backBtn = document.querySelector('.stepper-back-btn');
        const nextBtn = document.querySelector('.stepper-next-btn');

        if (backBtn) {
            backBtn.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            nextBtn.textContent = this.currentStep === this.totalSteps
                ? this.options.completeButtonText
                : this.options.nextButtonText;
        }
    }
}

// Auto-initialize for landing page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stepper-container')) {
        new Stepper({
            containerSelector: '#stepper-container',
            initialStep: 1,
            steps: [
                {
                    icon: '📄',
                    title: 'Resume Analysis',
                    description: 'AI extracts your skills and calculates your ATS compatibility score.',
                    detail: 'Upload your resume and get instant feedback in 2 minutes.'
                },
                {
                    icon: '🎤',
                    title: 'Mock Interview',
                    description: 'Practice with adaptive AI questions tailored to your target role.',
                    detail: 'Complete a 15-30 minute realistic interview session.'
                },
                {
                    icon: '🗺️',
                    title: 'Your Roadmap',
                    description: 'Get a personalized week-by-week learning plan with curated resources.',
                    detail: 'Track your progress and build momentum toward your goal.'
                }
            ],
            accentColor: '#6366f1',
            onStepChange: (step) => console.log('Step changed:', step),
            onComplete: () => console.log('All steps completed!')
        });
    }
});
