document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.getElementById('hero-typewriter');
    if (!textElement) return;

    const phrases = [
        "Start Getting Hired.",
        "Start Mastering Skills.",
        "Start Crushing Interviews."
    ];

    // Initialize state
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let isDeleting = true;

    // Initial delay before first delete action
    setTimeout(type, 2000);

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex);
            charIndex--;

            if (charIndex < 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(type, 500); // Slight pause before typing next
                return;
            }

            setTimeout(type, 30 + Math.random() * 30);
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === currentPhrase.length) {
                isDeleting = true;
                setTimeout(type, 2000); // Wait at end of sentence
                return;
            }

            setTimeout(type, 80 + Math.random() * 50);
        }
    }
});
