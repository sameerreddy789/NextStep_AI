// ATS Score Display Script
// Add this to resume.html after readiness stat update

// Update ATS Score with animation
setTimeout(() => {
    document.getElementById('ats-score').textContent = atsResult.overall + '%';
    document.getElementById('ats-progress').style.width = atsResult.overall + '%';
    document.getElementById('keyword-score').textContent = atsResult.keyword + '%';
    document.getElementById('keyword-progress').style.width = atsResult.keyword + '%';
    document.getElementById('experience-score').textContent = atsResult.experience + '%';
    document.getElementById('experience-progress').style.width = atsResult.experience + '%';
    document.getElementById('format-score').textContent = atsResult.format + '%';
    document.getElementById('format-progress').style.width = atsResult.format + '%';

    // Update ATS badge
    const badge = document.getElementById('ats-badge');
    if (atsResult.overall >= 80) {
        badge.textContent = 'Excellent';
        badge.style.background = 'var(--accent-green)';
    } else if (atsResult.overall >= 60) {
        badge.textContent = 'Good';
        badge.style.background = 'var(--accent-primary)';
    } else if (atsResult.overall >= 40) {
        badge.textContent = 'Fair';
        badge.style.background = 'var(--accent-gold)';
    } else {
        badge.textContent = 'Needs Improvement';
        badge.style.background = 'var(--accent-red)';
    }

    // Display suggestions
    const suggestionsList = document.getElementById('ats-suggestions');
    suggestionsList.innerHTML = atsResult.suggestions.map(s => `<li>${s}</li>`).join('');
}, 300);
