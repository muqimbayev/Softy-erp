// static/js/main/income-form.js

class IncomeForm {
    constructor() {
        this.init();
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.initLucideIcons();
        this.calculateAmounts();
    }

    initElements() {
        // Form elements
        this.form = document.getElementById('incomeAddForm');
        this.saveBtn = document.getElementById('saveIncomeBtn');
        
        // Input elements
        this.amountInput = document.getElementById('id_amount');
        this.statusSelect = document.getElementById('id_status');
        this.paymentMethodSelect = document.getElementById('id_payment_method');
        this.paymentDateInput = document.getElementById('id_payment_date');
        this.notesTextarea = document.getElementById('id_notes');
        
        // Group elements
        this.paymentMethodGroup = document.getElementById('paymentMethodGroup');
        this.paymentDateGroup = document.getElementById('paymentDateGroup');
        this.calculationSection = document.getElementById('calculationSection');
        
        // Calculation display elements
        this.totalAmountDisplay = document.getElementById('totalAmount');
    }

    bindEvents() {
        // Amount input
        if (this.amountInput) {
            this.amountInput.addEventListener('input', () => {
                this.calculateAmounts();
                this.validateAmount();
            });
            
            this.amountInput.addEventListener('blur', () => {
                this.formatAmount(this.amountInput);
            });
        }

        // Status change
        if (this.statusSelect) {
            this.statusSelect.addEventListener('change', () => {
                this.handleStatusChange();
            });
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }

        // Real-time validation
        this.bindValidationEvents();
    }

    bindValidationEvents() {
        const inputs = [this.amountInput, this.statusSelect];
        
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            }
        });
    }

    initLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    calculateAmounts() {
        const amount = parseFloat(this.amountInput?.value || 0);
        
        // Update display
        if (this.totalAmountDisplay) {
            this.totalAmountDisplay.textContent = this.formatCurrency(amount);
        }
    }

    formatAmount(input) {
        if (input.value) {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                input.value = value.toFixed(2);
            }
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount) + ' so\'m';
    }

    handleStatusChange() {
        const status = this.statusSelect?.value;
        
        // Show/hide payment method and date based on status
        const needsPaymentDetails = ['received', 'unpaid', 'partial'].includes(status);
        
        // Toggle required attributes and visibility
        this.togglePaymentFields(needsPaymentDetails);
        
        // Show status-specific messages
        if (status === 'pending') {
            this.showStatusWarning('Kutilayotgan to\'lovlar umumiy daromadga hisoblanmaydi');
        } else if (status === 'cancelled') {
            this.showStatusWarning('Bekor qilingan to\'lovlar hisobga olinmaydi');
        } else if (status === 'received') {
            this.showStatusSuccess('To\'lov qabul qilingan holat tanlandi');
        }
    }

    togglePaymentFields(required) {
        const conditionalFields = [
            { element: this.paymentMethodSelect, group: this.paymentMethodGroup },
            { element: this.paymentDateSelect, group: this.paymentDateGroup }
        ];
        
        conditionalFields.forEach(({ element, group }) => {
            if (element && group) {
                const requiredSpan = group.querySelector('.conditional-required');
                
                if (required) {
                    element.setAttribute('required', 'required');
                    group.style.opacity = '1';
                    group.style.pointerEvents = 'auto';
                    if (requiredSpan) requiredSpan.style.display = 'inline';
                } else {
                    element.removeAttribute('required');
                    element.value = '';
                    group.style.opacity = '0.5';
                    group.style.pointerEvents = 'none';
                    if (requiredSpan) requiredSpan.style.display = 'none';
                    this.clearFieldError(element);
                }
            }
        });
    }

    showStatusWarning(message) {
        this.removeStatusMessage();
        
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning status-message';
        warningDiv.innerHTML = `
            <i data-lucide="alert-triangle"></i>
            ${message}
        `;
        
        this.statusSelect.parentNode.appendChild(warningDiv);
        this.initLucideIcons();
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeStatusMessage();
        }, 5000);
    }

    showStatusSuccess(message) {
        this.removeStatusMessage();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success status-message';
        successDiv.innerHTML = `
            <i data-lucide="check-circle"></i>
            ${message}
        `;
        
        this.statusSelect.parentNode.appendChild(successDiv);
        this.initLucideIcons();
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            this.removeStatusMessage();
        }, 3000);
    }

    removeStatusMessage() {
        const existingMessage = document.querySelector('.status-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    validateAmount() {
        const amount = parseFloat(this.amountInput?.value || 0);
        
        if (amount <= 0) {
            this.showFieldError(this.amountInput, 'Miqdor 0 dan katta bo\'lishi kerak');
            return false;
        } else {
            this.clearFieldError(this.amountInput);
            return true;
        }
    }

    validateTaxes() {
        // Remove this method since we don't have taxes anymore
        return true;
    }

    validateField(field) {
        if (!field.value.trim() && field.hasAttribute('required')) {
            this.showFieldError(field, 'Bu maydon majburiy');
            return false;
        } else {
            this.clearFieldError(field);
            return true;
        }
    }

    validateForm() {
        let isValid = true;
        
        // Validate amount
        if (!this.validateAmount()) {
            isValid = false;
        }
        
        // Validate status
        if (!this.statusSelect?.value) {
            this.showFieldError(this.statusSelect, 'To\'lov holatini tanlang');
            isValid = false;
        }
        
        // Validate conditional fields based on status
        const status = this.statusSelect?.value;
        const needsPaymentDetails = ['received', 'unpaid', 'partial'].includes(status);
        
        if (needsPaymentDetails) {
            if (!this.paymentMethodSelect?.value) {
                this.showFieldError(this.paymentMethodSelect, 'Bu holat uchun to\'lov usuli majburiy');
                isValid = false;
            }
            
            if (!this.paymentDateInput?.value) {
                this.showFieldError(this.paymentDateInput, 'Bu holat uchun to\'lov sanasi majburiy');
                isValid = false;
            }
            
            // Validate payment date (not in future for received payments)
            if (this.paymentDateInput?.value && status === 'received') {
                const paymentDate = new Date(this.paymentDateInput.value);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                
                if (paymentDate > today) {
                    this.showFieldError(this.paymentDateInput, 'Qabul qilingan to\'lov sanasi kelajakda bo\'lishi mumkin emas');
                    isValid = false;
                }
            }
        }
        
        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    showError(message) {
        // Create or update error alert
        let errorAlert = document.querySelector('.alert-danger');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger';
            this.form.insertBefore(errorAlert, this.form.firstChild);
        }
        
        errorAlert.innerHTML = `
            <i data-lucide="alert-circle"></i>
            ${message}
        `;
        
        this.initLucideIcons();
        
        // Scroll to error
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showSuccess(message) {
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.innerHTML = `
            <i data-lucide="check-circle"></i>
            ${message}
        `;
        
        this.form.insertBefore(successAlert, this.form.firstChild);
        this.initLucideIcons();
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            if (successAlert.parentNode) {
                successAlert.remove();
            }
        }, 5000);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
            return;
        }
        
        this.submitForm();
    }

    async submitForm() {
        const submitBtn = this.saveBtn;
        const btnText = submitBtn.querySelector('span');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        btnText.textContent = 'Saqlanmoqda...';
        btnLoader.style.display = 'block';
        
        try {
            // Create FormData object
            const formData = new FormData(this.form);
            
            const response = await fetch(this.form.action || window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            if (response.ok) {
                const responseText = await response.text();
                
                // Check if response contains success message or redirect
                if (responseText.includes('muvaffaqiyatli qo\'shildi') || response.redirected) {
                    this.showSuccess('Daromad muvaffaqiyatli qo\'shildi!');
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        if (response.redirected) {
                            window.location.href = response.url;
                        } else {
                            // Extract service ID from URL and redirect to service detail
                            const serviceId = this.getServiceIdFromUrl();
                            if (serviceId) {
                                window.location.href = `/services/${serviceId}/`;
                            } else {
                                window.location.href = '/services/';
                            }
                        }
                    }, 1500);
                    return;
                }
                
                // If not redirected, show error
                this.showError('Daromad qo\'shishda xatolik yuz berdi');
                
            } else {
                this.showError('Server xatosi. Iltimos, qayta urinib ko\'ring');
            }
            
        } catch (error) {
            console.error('Submit error:', error);
            this.showError('Tarmoq xatosi. Iltimos, qayta urinib ko\'ring');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            btnText.textContent = 'Daromadni saqlash';
            btnLoader.style.display = 'none';
        }
    }

    getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    getServiceIdFromUrl() {
        // Extract service ID from URL like /services/15/income/add/
        const pathParts = window.location.pathname.split('/');
        const serviceIndex = pathParts.indexOf('services');
        if (serviceIndex !== -1 && pathParts[serviceIndex + 1]) {
            return pathParts[serviceIndex + 1];
        }
        return null;
    }

    // Auto-save functionality (optional)
    initAutoSave() {
        let autoSaveTimeout;
        
        const formInputs = this.form.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    this.saveDraft();
                }, 2000);
            });
        });
    }

    saveDraft() {
        const formData = new FormData(this.form);
        const draftData = {};
        
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        const serviceId = this.getServiceIdFromUrl();
        const draftKey = `income_add_draft_${serviceId}`;
        
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        this.showDraftSaved();
    }

    loadDraft() {
        const serviceId = this.getServiceIdFromUrl();
        const draftKey = `income_add_draft_${serviceId}`;
        const draftData = localStorage.getItem(draftKey);
        
        if (draftData) {
            try {
                const data = JSON.parse(draftData);
                
                Object.keys(data).forEach(key => {
                    const input = this.form.querySelector(`[name="${key}"]`);
                    if (input && input.type !== 'hidden') {
                        input.value = data[key];
                    }
                });
                
                this.calculateAmounts();
                this.showDraftLoaded();
            } catch (e) {
                console.error('Error loading draft:', e);
            }
        }
    }

    clearDraft() {
        const serviceId = this.getServiceIdFromUrl();
        const draftKey = `income_add_draft_${serviceId}`;
        localStorage.removeItem(draftKey);
    }

    showDraftSaved() {
        const indicator = document.createElement('div');
        indicator.className = 'draft-saved show';
        indicator.innerHTML = `
            <i data-lucide="save"></i>
            Qoralama saqlandi
        `;
        
        document.body.appendChild(indicator);
        this.initLucideIcons();
        
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }, 2000);
    }

    showDraftLoaded() {
        this.showSuccess('Oldingi qoralama yuklandi');
    }

    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat('uz-UZ').format(num);
    }

    validatePositiveNumber(value) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    }

    // Keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.validateForm()) {
                    this.submitForm();
                }
            }
            
            // Ctrl/Cmd + Enter to save
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.validateForm()) {
                    this.submitForm();
                }
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const incomeForm = new IncomeForm();
    
    // Initialize auto-save if needed
    // incomeForm.initAutoSave();
    
    // Load draft if available
    // incomeForm.loadDraft();
    
    // Initialize keyboard shortcuts
    incomeForm.initKeyboardShortcuts();
});

// Export for global access if needed
window.IncomeForm = IncomeForm;