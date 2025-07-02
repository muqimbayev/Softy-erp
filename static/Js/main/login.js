document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // Telefon raqamini formatlash funksiyasi
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');

    // "998" ni ajratib olish
    if (value.startsWith('998')) {
        value = value.slice(3);
    }

    // Maksimal 9 ta raqam
    if (value.length > 9) {
        value = value.slice(0, 9);
    }

    // Boshlanish
    let formatted = '+998';

    if (value.length > 0) {
        formatted += ' ' + value.slice(0, 2);
    }
    if (value.length > 2) {
        formatted += ' ' + value.slice(2, 5);
    }
    if (value.length > 5) {
        formatted += ' ' + value.slice(5, 7);
    }
    if (value.length > 7) {
        formatted += ' ' + value.slice(7, 9);
    }

    input.value = formatted;

    // Kursorni oxiriga qo'yish
    setTimeout(() => {
        input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
}


    // Telefon inputni formatlash va filtrlash
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            formatPhoneNumber(e.target);
        });

        phoneInput.addEventListener('keypress', function (e) {
            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
            if (!/\d/.test(e.key) && !allowedKeys.includes(e.key)) {
                e.preventDefault();
            }
        });

        // Focus bo‘lsa formatlash
        if (phoneInput.value) {
            formatPhoneNumber(phoneInput);
        }
        phoneInput.focus();
    }

    // Parolni ko‘rsatish / yashirish
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function () {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? '🙈' : '👁';
            this.setAttribute('aria-label', isPassword ? "Parolni yashirish" : "Parolni ko'rsatish");
        });
    }

    // Form yuborish tugmasi
    if (form) {
        form.addEventListener('submit', function (e) {
            if (submitBtn && btnText && btnLoader) {
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline';

                setTimeout(function () {
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline';
                    btnLoader.style.display = 'none';
                }, 10000);
            }
        });
    }

    // Auto-hide messages
    const messages = document.querySelectorAll('.message');
    messages.forEach(function (message) {
        setTimeout(function () {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            setTimeout(function () {
                if (message.parentNode) {
                    message.remove();
                }
            }, 300);
        }, 5000);
    });

    // Floating words (Softy, CRM va h.k.)
    function createFloatingWord() {
        const container = document.querySelector('.floating-text');
        if (!container) return;

        const words = ['Softy', 'CRM', 'ERP', 'Business', 'System'];
        const word = document.createElement('div');
        word.className = 'floating-word';
        word.textContent = words[Math.floor(Math.random() * words.length)];
        word.style.left = Math.random() * 100 + '%';
        word.style.fontSize = (16 + Math.random() * 8) + 'px';
        word.style.animationDuration = (12 + Math.random() * 8) + 's';

        container.appendChild(word);

        setTimeout(() => {
            if (word.parentNode) {
                word.remove();
            }
        }, 20000);
    }

    setInterval(createFloatingWord, 4000);
});
