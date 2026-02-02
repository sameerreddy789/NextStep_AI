// ===== Firebase Error Handler =====

/**
 * Converts Firebase error codes to user-friendly messages
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
function getFriendlyFirebaseError(error) {
    const errorCode = error.code || '';

    // Authentication Errors
    const authErrors = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/user-not-found': 'No account found with this email. Please sign up first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid login credentials. Please check and try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
        'auth/cancelled-popup-request': 'Only one sign-in popup allowed at a time.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
        'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
    };

    // Firestore Errors
    const firestoreErrors = {
        'permission-denied': 'You don\'t have permission to perform this action.',
        'not-found': 'The requested data was not found.',
        'already-exists': 'This data already exists.',
        'failed-precondition': 'Operation failed. Please try again.',
        'aborted': 'Operation was cancelled. Please try again.',
        'out-of-range': 'Invalid value provided.',
        'unauthenticated': 'Please sign in to continue.',
        'unavailable': 'Service temporarily unavailable. Please try again later.',
        'deadline-exceeded': 'Request timed out. Please check your connection and try again.',
    };

    // Storage Errors
    const storageErrors = {
        'storage/unauthorized': 'You don\'t have permission to upload files.',
        'storage/canceled': 'Upload was cancelled.',
        'storage/unknown': 'An unknown error occurred during upload.',
        'storage/object-not-found': 'File not found.',
        'storage/quota-exceeded': 'Storage quota exceeded.',
        'storage/unauthenticated': 'Please sign in to upload files.',
        'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again.',
        'storage/invalid-checksum': 'File upload verification failed. Please try again.',
    };

    // Check error code against all categories
    if (authErrors[errorCode]) {
        return authErrors[errorCode];
    }
    if (firestoreErrors[errorCode]) {
        return firestoreErrors[errorCode];
    }
    if (storageErrors[errorCode]) {
        return storageErrors[errorCode];
    }

    // Generic network/connection errors
    if (errorCode.includes('network') || error.message?.includes('network')) {
        return 'Network error. Please check your internet connection and try again.';
    }

    // Default fallback
    return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Shows user-friendly error toast for Firebase errors
 * @param {Error} error - Firebase error object
 * @param {string} fallbackMessage - Optional fallback message
 */
function handleFirebaseError(error, fallbackMessage = 'An error occurred') {
    console.error('Firebase Error:', error);

    const friendlyMessage = getFriendlyFirebaseError(error);

    // Use UIUtils if available, otherwise fallback to alert
    if (typeof UIUtils !== 'undefined' && UIUtils.showToast) {
        UIUtils.showToast(friendlyMessage, 'error', 4000);
    } else {
        alert(friendlyMessage);
    }
}

/**
 * Shows success message with toast
 * @param {string} message - Success message
 */
function showSuccess(message) {
    if (typeof UIUtils !== 'undefined' && UIUtils.showToast) {
        UIUtils.showToast(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Shows info message with toast
 * @param {string} message - Info message
 */
function showInfo(message) {
    if (typeof UIUtils !== 'undefined' && UIUtils.showToast) {
        UIUtils.showToast(message, 'info');
    } else {
        alert(message);
    }
}

/**
 * Shows warning message with toast
 * @param {string} message - Warning message
 */
function showWarning(message) {
    if (typeof UIUtils !== 'undefined' && UIUtils.showToast) {
        UIUtils.showToast(message, 'warning');
    } else {
        alert(message);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FirebaseErrorHandler = {
        getFriendlyFirebaseError,
        handleFirebaseError,
        showSuccess,
        showInfo,
        showWarning
    };
}
