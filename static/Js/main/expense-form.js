// static/js/main/expense-form.js

class ExpenseForm {
    constructor() {
        this.init();
    }

    init() {
        console.log('ExpenseForm init started');
        this.initElements();
        this.bindEvents();
        this.initLucideIcons();
        this.loadCategoryTaxRates();
        this.calculateAmounts();
        console.log('ExpenseForm init completed');
        
        window.expenseFormInstance = this;
    }

    initElements() {
        console.log('Initializing elements...');
        
        // Form elements
        this.form = document.getElementById('expenseAddForm') || document.getElementById('expenseEditForm');
        this.saveBtn = document.getElementById('saveExpenseBtn') || document.getElementById('updateExpenseBtn');
        
        // Input elements
        this.amountInput = document.getElementById('id_amount');
        this.categorySelect = document.getElementById('id_category');
        this.dateInput = document.getElementById('id_date');
        this.paymentMethodSelect = document.getElementById('id_payment_method');
        this.descriptionTextarea = document.getElementById('id_description');
        
        // Calculation display elements
        this.baseAmountDisplay = document.getElementById('baseAmount');
        this.taxAmountDisplay = document.getElementById('taxAmount');  
        this.totalAmountDisplay = document.getElementById('totalAmount');
        this.taxRateDisplay = document.getElementById('taxRate');
        this.categoryTaxInfo = document.getElementById('categoryTaxInfo');
        
        console.log('Elements found:', {
            form: !!this.form,
            amountInput: !!this.amountInput,
            categorySelect: !!this.categorySelect,
            displays: {
                baseAmount: !!this.baseAmountDisplay,
                taxAmount: !!this.taxAmountDisplay,
                totalAmount: !!this.totalAmountDisplay,
                taxRate: !!this.taxRateDisplay
            }
        });
        
        // Category tax rates storage
        this.categoryTaxRates = {};
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

        // Category change
        if (this.categorySelect) {
            this.categorySelect.addEventListener('change', () => {
                this.handleCategoryChange();
            });
        }

        // Date validation
        if (this.dateInput) {
            this.dateInput.addEventListener('change', () => {
                this.validateDate();
            });
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }

        this.bindValidationEvents();
    }

    bindValidationEvents() {
        const inputs = [this.amountInput, this.categorySelect, this.dateInput];
        
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
        try {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            } else {
                console.warn('Lucide not available');
            }
        } catch (error) {
            console.warn('Lucide initialization error:', error);
        }
    }

    loadCategoryTaxRates() {
        console.log('Loading category tax rates...');
        
        if (window.categoryTaxRates) {
            this.categoryTaxRates = window.categoryTaxRates;
            console.log('Tax rates loaded from window:', this.categoryTaxRates);
        } else {
            console.warn('window.categoryTaxRates not found, trying to extract from options');
            
            if (this.categorySelect) {
                Array.from(this.categorySelect.options).forEach(option => {
                    if (option.value) {
                        let taxRate = option.getAttribute('data-tax-rate');
                        
                        if (!taxRate) {
                            const match = option.text.match(/\((\d+\.?\d*)%\)/);
                            taxRate = match ? match[1] : '0';
                        }
                        
                        this.categoryTaxRates[option.value] = parseFloat(taxRate) || 0;
                    }
                });
                console.log('Tax rates loaded from options:', this.categoryTaxRates);
            }
        }
        
        setTimeout(() => {
            if (this.categorySelect?.value) {
                this.handleCategoryChange();
            } else {
                this.calculateAmounts();
            }
        }, 100);
    }

    calculateAmounts() {
        if (!this.amountInput || !this.baseAmountDisplay || !this.taxAmountDisplay || !this.totalAmountDisplay || !this.taxRateDisplay) {
            console.warn('Required elements not found for calculation');
            return;
        }

        // Amount input'dagi qiymat asosiy miqdor (soliqsiz)
        const baseAmount = parseFloat(this.amountInput.value || 0);
        const selectedCategoryId = this.categorySelect?.value;
        
        console.log('Calculate amounts called:', {
            baseAmount,
            selectedCategoryId,
            categoryTaxRates: this.categoryTaxRates
        });
        
        // Get tax rate for selected category
        let taxRate = 0;
        if (selectedCategoryId && this.categoryTaxRates[selectedCategoryId] !== undefined) {
            taxRate = parseFloat(this.categoryTaxRates[selectedCategoryId]) || 0;
        }
        
        console.log('Tax rate found:', taxRate);
        
        // Calculate tax amount
        const taxAmount = (baseAmount * taxRate) / 100;
        const totalAmount = baseAmount + taxAmount;
        
        console.log('Calculated:', { baseAmount, taxRate, taxAmount, totalAmount });
        
        // Update displays
        this.baseAmountDisplay.textContent = this.formatCurrency(baseAmount);
        this.taxAmountDisplay.textContent = this.formatCurrency(taxAmount);
        this.totalAmountDisplay.textContent = this.formatCurrency(totalAmount);
        this.taxRateDisplay.textContent = taxRate.toFixed(1);
        
        console.log('Updated all displays');
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

    handleCategoryChange() {
        const categoryId = this.categorySelect?.value;
        
        if (categoryId) {
            const selectedOption = this.categorySelect.options[this.categorySelect.selectedIndex];
            const categoryName = selectedOption.text;
            const taxRate = this.categoryTaxRates[categoryId] || 0;
            
            console.log('Category changed:', { categoryId, categoryName, taxRate });
            
            if (this.categoryTaxInfo) {
                this.categoryTaxInfo.innerHTML = `Tanlangan: <strong>${categoryName}</strong> (Soliq: ${taxRate}%)`;
                this.categoryTaxInfo.style.color = '#28a745';
            }
            
            this.calculateAmounts();
            this.showCategorySuccess(`"${categoryName}" kategoriyasi tanlandi (Soliq: ${taxRate}%)`);
        } else {
            if (this.categoryTaxInfo) {
                this.categoryTaxInfo.innerHTML = 'Xarajat kategoriyasini tanlang';
                this.categoryTaxInfo.style.color = '#6c757d';
            }
            this.calculateAmounts();
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showError('Iltimos, barcha majburiy maydonlarni to\'g\'ri to\'ldiring');
            return;
        }
        
        // MUHIM: Amount fieldiga jami summani (soliq bilan) yozish
        this.updateAmountWithTax();
        
        this.submitForm();
    }

    updateAmountWithTax() {
        const baseAmount = parseFloat(this.amountInput.value || 0);
        const selectedCategoryId = this.categorySelect?.value;
        
        if (selectedCategoryId && this.categoryTaxRates[selectedCategoryId]) {
            const taxRate = parseFloat(this.categoryTaxRates[selectedCategoryId]) || 0;
            const taxAmount = (baseAmount * taxRate) / 100;
            const totalAmount = baseAmount + taxAmount;
            
            // Amount inputiga jami summani yozish
            this.amountInput.value = totalAmount.toFixed(2);
            
            console.log('Amount updated with tax:', {
                originalAmount: baseAmount,
                taxRate: taxRate,
                taxAmount: taxAmount,
                finalAmount: totalAmount
            });
        }
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
                
                if (responseText.includes('muvaffaqiyatli') || response.redirected) {
                    this.showSuccess('Xarajat muvaffaqiyatli saqlandi!');
                    
                    setTimeout(() => {
                        if (response.redirected) {
                            window.location.href = response.url;
                        } else {
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
                
                this.showError('Xarajat saqlashda xatolik yuz berdi');
                
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
            btnText.textContent = 'Xarajatni saqlash';
            btnLoader.style.display = 'none';
        }
    }

    showCategorySuccess(message) {
        this.removeCategoryMessage();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success category-message';
        successDiv.innerHTML = `
            <i data-lucide="check-circle"></i>
            ${message}
        `;
        
        this.categorySelect.parentNode.appendChild(successDiv);
        this.initLucideIcons();
        
        setTimeout(() => {
            this.removeCategoryMessage();
        }, 3000);
    }

    removeCategoryMessage() {
        const existingMessage = document.querySelector('.category-message');
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

    validateDate() {
        const dateValue = this.dateInput?.value;
        
        if (dateValue) {
            const expenseDate = new Date(dateValue);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            if (expenseDate > today) {
                this.showFieldError(this.dateInput, 'Xarajat sanasi kelajakda bo\'lishi mumkin emas');
                return false;
            } else {
                this.clearFieldError(this.dateInput);
                return true;
            }
        }
        
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

    validateCategory() {
        if (this.categorySelect && !this.categorySelect.value) {
            this.showFieldError(this.categorySelect, 'Kategoriya tanlash majburiy');
            return false;
        }
        return true;
    }

    validateForm() {
        let isValid = true;
        
        if (!this.validateAmount()) {
            isValid = false;
        }
        
        if (!this.validateCategory()) {
            isValid = false;
        }
        
        if (!this.validateDate()) {
            isValid = false;
        }
        
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
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
        
        setTimeout(() => {
            if (successAlert.parentNode) {
                successAlert.remove();
            }
        }, 5000);
    }

    getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    getServiceIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        const serviceIndex = pathParts.indexOf('services');
        if (serviceIndex !== -1 && pathParts[serviceIndex + 1]) {
            return pathParts[serviceIndex + 1];
        }
        return null;
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.validateForm()) {
                    this.handleFormSubmit(e);
                }
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing ExpenseForm...');
    console.log('Categories data check:', window.categoryTaxRates);
    
    const expenseForm = new ExpenseForm();
    expenseForm.initKeyboardShortcuts();
});

window.ExpenseForm = ExpenseForm;