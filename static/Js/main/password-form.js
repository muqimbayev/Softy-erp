// static/js/main/password-form.js

document.addEventListener('DOMContentLoaded', function() {
    initPasswordForm();
    console.log('🔑 Password form initialized');
});

function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    const password1 = document.querySelector('[name="new_password1"]');
    const password2 = document.querySelector('[name="new_password2"]');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!form || !password1 || !password2) return;
    
    // Password strength checker
    password1.addEventListener('input', function() {
        checkPasswordStrength(this.value);
        checkPasswordMatch();
    });
    
    // Password match checker
    password2.addEventListener('input', function() {
        checkPasswordMatch();
    });
    
    // Password toggle functionality
    initPasswordToggle();
    
    // Form submission with loading
    form.addEventListener('submit', function(e) {
        if (!validatePasswords()) {
            e.preventDefault();
            return;
        }
        
        showLoadingState();
    });
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    // Remove all strength classes
    strengthFill.className = 'strength-fill';
    
    if (password.length === 0) {
        strengthText.textContent = 'Parol kuchini aniqlash...';
        return;
    }
    
    if (strength.score <= 1) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Zaif parol';
        strengthText.style.color = '#d63031';
    } else if (strength.score === 2) {
        strengthFill.classList.add('fair');
        strengthText.textContent = 'O\'rtacha parol';
        strengthText.style.color = '#fdcb6e';
    } else if (strength.score === 3) {
        strengthFill.classList.add('good');
        strengthText.textContent = 'Yaxshi parol';
        strengthText.style.color = '#00b894';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Kuchli parol';
        strengthText.style.color = '#00b894';
    }
    
    // Show strength requirements
    if (strength.score < 3) {
        showPasswordRequirements(strength);
    }
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password)
    };
    
    // Length check (worth 2 points)
    if (checks.length) score += 2;
    
    // Character variety checks (1 point each)
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.numbers) score++;
    if (checks.symbols) score++;
    
    // Bonus for very long passwords
    if (password.length >= 12) score++;
    
    return {
        score: Math.min(score, 4),
        checks: checks
    };
}

// Show password requirements
function showPasswordRequirements(strength) {
    const requirements = [];
    
    if (!strength.checks.length) {
        requirements.push('Kamida 8 ta belgi');
    }
    if (!strength.checks.uppercase) {
        requirements.push('Katta harf');
    }
    if (!strength.checks.numbers) {
        requirements.push('Raqam');
    }
    if (!strength.checks.symbols) {
        requirements.push('Maxsus belgi');
    }
    
    if (requirements.length > 0) {
        const strengthText = document.getElementById('strengthText');
        strengthText.textContent += ` (Kerak: ${requirements.join(', ')})`;
    }
}

// Check password match
function checkPasswordMatch() {
    const password1 = document.querySelector('[name="new_password1"]');
    const password2 = document.querySelector('[name="new_password2"]');
    const matchIndicator = document.getElementById('passwordMatch');
    
    if (!password1 || !password2 || !matchIndicator) return;
    
    if (password2.value.length === 0) {
        matchIndicator.style.display = 'none';
        return;
    }
    
    if (password1.value === password2.value && password2.value.length > 0) {
        matchIndicator.style.display = 'flex';
        matchIndicator.style.color = '#00b894';
        matchIndicator.innerHTML = '<i data-lucide="check-circle"></i><span>Parollar mos keladi</span>';
    } else {
        matchIndicator.style.display = 'flex';
        matchIndicator.style.color = '#d63031';
        matchIndicator.innerHTML = '<i data-lucide="x-circle"></i><span>Parollar mos kelmaydi</span>';
    }
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Password toggle functionality
function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }
            
            // Re-initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    });
}

// Validate passwords before submission
function validatePasswords() {
    const password1 = document.querySelector('[name="new_password1"]');
    const password2 = document.querySelector('[name="new_password2"]');
    
    if (!password1 || !password2) return false;
    
    // Check if passwords match
    if (password1.value !== password2.value) {
        showToast('Parollar mos kelmaydi!', 'error');
        return false;
    }
    
    // Check password strength
    const strength = calculatePasswordStrength(password1.value);
    if (strength.score < 2) {
        showToast('Parol juda zaif. Kuchliroq parol kiriting.', 'warning');
        return false;
    }
    
    return true;
}

// Show loading state
function showLoadingState() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('span');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    if (submitBtn && btnText && btnLoader) {
        submitBtn.disabled = true;
        btnText.textContent = 'O\'zgartirilmoqda...';
        btnLoader.style.display = 'block';
    }
}

// Generate secure password (optional feature)
function generateSecurePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    const categories = [
        'abcdefghijklmnopqrstuvwxyz',     // lowercase
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',     // uppercase
        '0123456789',                     // numbers
        '!@#$%^&*'                       // symbols
    ];
    
    // Add one character from each category
    categories.forEach(category => {
        password += category.charAt(Math.floor(Math.random() * category.length));
    });
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Add generate password button (if needed)
function addGeneratePasswordButton() {
    const password1Container = document.querySelector('[name="new_password1"]').closest('.password-input-container');
    
    if (!password1Container) return;
    
    const generateBtn = document.createElement('button');
    generateBtn.type = 'button';
    generateBtn.className = 'generate-password-btn';
    generateBtn.innerHTML = '<i data-lucide="refresh-cw"></i>';
    generateBtn.title = 'Avtomatik parol yaratish';
    
    generateBtn.addEventListener('click', function() {
        const password1 = document.querySelector('[name="new_password1"]');
        const password2 = document.querySelector('[name="new_password2"]');
        
        const newPassword = generateSecurePassword();
        
        password1.value = newPassword;
        password2.value = newPassword;
        
        // Trigger events
        password1.dispatchEvent(new Event('input'));
        password2.dispatchEvent(new Event('input'));
        
        showToast('Avtomatik parol yaratildi!', 'success');
        
        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    });
    
    password1Container.appendChild(generateBtn);
}

// Real-time password validation
function initRealTimeValidation() {
    const password1 = document.querySelector('[name="new_password1"]');
    const password2 = document.querySelector('[name="new_password2"]');
    
    if (!password1 || !password2) return;
    
    // Add validation indicators
    [password1, password2].forEach(input => {
        input.addEventListener('input', function() {
            validatePasswordField(this);
        });
        
        input.addEventListener('blur', function() {
            validatePasswordField(this);
        });
    });
}

// Validate individual password field
function validatePasswordField(input) {
    const container = input.closest('.password-input-container');
    
    // Remove existing validation indicators
    const existingIndicator = container.querySelector('.validation-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (input.value.length === 0) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'validation-indicator';
    
    if (input.name === 'new_password1') {
        const strength = calculatePasswordStrength(input.value);
        if (strength.score >= 2) {
            indicator.className += ' valid';
            indicator.innerHTML = '<i data-lucide="check"></i>';
        } else {
            indicator.className += ' invalid';
            indicator.innerHTML = '<i data-lucide="x"></i>';
        }
    } else if (input.name === 'new_password2') {
        const password1 = document.querySelector('[name="new_password1"]');
        if (input.value === password1.value && input.value.length > 0) {
            indicator.className += ' valid';
            indicator.innerHTML = '<i data-lucide="check"></i>';
        } else {
            indicator.className += ' invalid';
            indicator.innerHTML = '<i data-lucide="x"></i>';
        }
    }
    
    container.appendChild(indicator);
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Keyboard shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('passwordForm');
            if (form) {
                form.submit();
            }
        }
        
        // Escape to cancel
        if (e.key === 'Escape') {
            const cancelBtn = document.querySelector('.btn-secondary-modern');
            if (cancelBtn) {
                cancelBtn.click();
            }
        }
    });
}

// Initialize all features
function initAdvancedFeatures() {
    initRealTimeValidation();
    initKeyboardShortcuts();
    
    // Uncomment if you want auto-generate password button
    // addGeneratePasswordButton();
}

// Call advanced features
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initAdvancedFeatures();
    }, 100);
});

console.log('🔑 Advanced password form features loaded');