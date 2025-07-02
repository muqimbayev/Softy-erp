// static/js/main/employee-add.js - Fixed Version

document.addEventListener('DOMContentLoaded', function() {
    initEmployeeAddForm();
    console.log('➕ Employee add form initialized');
});

function initEmployeeAddForm() {
    const form = document.getElementById('employeeAddForm');
    const password1 = document.querySelector('[name="password1"]');
    const password2 = document.querySelector('[name="password2"]');
    const phoneInput = document.querySelector('[name="phone_number"]');
    const dateInput = document.querySelector('[name="hire_date"]');
    
    if (!form) return;
    
    // Password features
    if (password1 && password2) {
        initPasswordFeatures(password1, password2);
    }
    
    // Phone validation and formatting
    if (phoneInput) {
        initPhoneValidation(phoneInput);
    }
    
    // Date validation
    if (dateInput) {
        initDateValidation(dateInput);
    }
    
    // Form submission
    form.addEventListener('submit', function(e) {
        if (!validateAddForm()) {
            e.preventDefault();
            return;
        }
        showLoadingState();
    });
    
    // Password toggle
    initPasswordToggle();
}

// Password features
function initPasswordFeatures(password1, password2) {
    // Password strength
    password1.addEventListener('input', function() {
        checkPasswordStrength(this.value);
        checkPasswordMatch();
    });
    
    // Password match
    password2.addEventListener('input', function() {
        checkPasswordMatch();
    });
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    // Remove all classes
    strengthFill.className = 'strength-fill';
    
    if (password.length === 0) {
        strengthText.textContent = 'Parol kuchini aniqlash...';
        strengthText.style.color = '#636e72';
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
    
    if (checks.length) score += 2;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.numbers) score++;
    if (checks.symbols) score++;
    if (password.length >= 12) score++;
    
    return {
        score: Math.min(score, 4),
        checks: checks
    };
}

// Check password match
function checkPasswordMatch() {
    const password1 = document.querySelector('[name="password1"]');
    const password2 = document.querySelector('[name="password2"]');
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

// Password toggle
function initPasswordToggle() {
    const passwordContainers = document.querySelectorAll('.password-input-container');
    
    passwordContainers.forEach(container => {
        const input = container.querySelector('input[type="password"], input[type="text"]');
        const toggleBtn = container.querySelector('.password-toggle-btn');
        
        if (input && toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.setAttribute('data-lucide', 'eye-off');
                } else {
                    input.type = 'password';
                    icon.setAttribute('data-lucide', 'eye');
                }
                
                if (window.lucide) {
                    lucide.createIcons();
                }
            });
        }
    });
}

// Phone validation and formatting
function initPhoneValidation(phoneInput) {
    let timeoutId;
    
    phoneInput.addEventListener('input', function() {
        formatPhoneNumber(this);
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            validatePhoneNumber(this.value);
        }, 500);
    });
    
    phoneInput.addEventListener('keydown', function(e) {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
}

// Validate phone number
function validatePhoneNumber(phone) {
    const input = document.querySelector('[name="phone_number"]');
    const container = input.closest('.form-group');
    
    // Remove existing validation
    const existingValidation = container.querySelector('.phone-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    if (phone.length === 0) return;
    
    const validation = document.createElement('div');
    validation.className = 'phone-validation';
    
    // Check phone format
    const cleanPhone = phone.replace(/\s/g, '');
    const isValid = /^\+998\d{9}$/.test(cleanPhone);
    
    if (isValid) {
        validation.className += ' valid';
        validation.innerHTML = '<i data-lucide="check-circle"></i><span>Telefon raqam to\'g\'ri</span>';
        validation.style.color = '#00b894';
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        validation.className += ' invalid';
        validation.innerHTML = '<i data-lucide="x-circle"></i><span>To\'liq telefon raqam kiriting: +998901234567</span>';
        validation.style.color = '#d63031';
        input.classList.remove('success');
        input.classList.add('error');
    }
    
    container.appendChild(validation);
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Format phone number
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('998')) {
        value = '+' + value;
    } else if (value.startsWith('8')) {
        value = '+99' + value;
    } else if (!value.startsWith('+998') && value.length > 0) {
        value = '+998' + value;
    }
    
    // Limit length
    if (value.length > 13) {
        value = value.slice(0, 13);
    }
    
    input.value = value;
}

// Date validation
function initDateValidation(dateInput) {
    dateInput.addEventListener('change', function() {
        validateHireDate(this.value);
    });
    
    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('max', today);
}

// Validate hire date
function validateHireDate(dateValue) {
    const input = document.querySelector('[name="hire_date"]');
    const container = input.closest('.form-group');
    
    // Remove existing validation
    const existingValidation = container.querySelector('.date-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    if (!dateValue) return;
    
    const validation = document.createElement('div');
    validation.className = 'date-validation';
    
    const selectedDate = new Date(dateValue);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate <= today) {
        validation.className += ' valid';
        validation.innerHTML = '<i data-lucide="check-circle"></i><span>Sana to\'g\'ri</span>';
        validation.style.color = '#00b894';
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        validation.className += ' invalid';
        validation.innerHTML = '<i data-lucide="x-circle"></i><span>Sana kelajakda bo\'lishi mumkin emas</span>';
        validation.style.color = '#d63031';
        input.classList.remove('success');
        input.classList.add('error');
    }
    
    container.appendChild(validation);
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Form validation
function validateAddForm() {
    const phone = document.querySelector('[name="phone_number"]').value;
    const password1 = document.querySelector('[name="password1"]').value;
    const password2 = document.querySelector('[name="password2"]').value;
    const firstName = document.querySelector('[name="first_name"]').value;
    const lastName = document.querySelector('[name="last_name"]').value;
    const hireDate = document.querySelector('[name="hire_date"]').value;
    
    // Required fields
    if (!phone || !password1 || !password2 || !firstName || !lastName || !hireDate) {
        showToast('Barcha majburiy maydonlarni to\'ldiring!', 'error');
        return false;
    }
    
    // Phone number validation
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+998\d{9}$/.test(cleanPhone)) {
        showToast('Telefon raqam noto\'g\'ri formatda!', 'error');
        return false;
    }
    
    // Date validation
    const selectedDate = new Date(hireDate);
    const today = new Date();
    if (selectedDate > today) {
        showToast('Ishga kirgan sana kelajakda bo\'lishi mumkin emas!', 'error');
        return false;
    }
    
    // Password match
    if (password1 !== password2) {
        showToast('Parollar mos kelmaydi!', 'error');
        return false;
    }
    
    // Password strength
    const strength = calculatePasswordStrength(password1);
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
        btnText.textContent = 'Qo\'shilmoqda...';
        btnLoader.style.display = 'block';
    }
}

console.log('📝 Employee add form JavaScript loaded successfully');