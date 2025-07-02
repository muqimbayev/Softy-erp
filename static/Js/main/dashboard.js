// static/js/dashboard.js - Real API Only

document.addEventListener('DOMContentLoaded', function() {
    
    // Dashboard data
    let dashboardData = {
        stats: {
            totalIncome: 0,
            activeServices: 0,
            expiringSoon: 0,
            totalCompanies: 0
        },
        charts: {
            incomeData: [],
            servicesData: []
        }
    };
    
    // Initialize dashboard
    function initDashboard() {
        loadDashboardData();
        initQuickActions();
        initFilters();
        setupRefresh();
        
        console.log('📊 Dashboard initialized');
    }
    
    // Load dashboard data from server
    async function loadDashboardData() {
        try {
            showLoading();
            
            // Real API calls
            const [stats, chartData] = await Promise.all([
                fetchStats(),
                fetchChartData()
            ]);
            
            dashboardData.stats = stats;
            dashboardData.charts = chartData;
            
            updateDashboard();
            
        } catch (error) {
            console.error('Dashboard ma\'lumotlari yuklanmadi:', error);
            showToast('Ma\'lumotlar yuklanmadi', 'error');
            
            // Show empty state
            showEmptyState();
        } finally {
            hideLoading();
        }
    }
    
    // Real API calls
    async function fetchStats() {
        const response = await fetch('/api/dashboard/stats/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    async function fetchChartData() {
        const response = await fetch('/api/dashboard/chart-data/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    // Update dashboard elements
    function updateDashboard() {
        updateStats();
        initCharts();
    }
    
    // Update statistics cards
    function updateStats() {
        const stats = dashboardData.stats;
        
        // Animate numbers (Django response field names)
        animateNumber('totalIncome', 0, stats.total_income || 0, (val) => formatCurrency(val));
        animateNumber('activeServices', 0, stats.active_services || 0);
        animateNumber('expiringSoon', 0, stats.expiring_soon || 0);
        animateNumber('totalCompanies', 0, stats.total_companies || 0);
        
        // Monthly stats
        if (stats.monthly_income !== undefined) {
            animateNumber('monthlyIncome', 0, stats.monthly_income, (val) => formatCurrency(val));
        }
        
        if (stats.income_growth !== undefined) {
            const growthEl = document.getElementById('incomeGrowth');
            if (growthEl) {
                const growth = stats.income_growth;
                growthEl.textContent = growth > 0 ? `+${growth}%` : `${growth}%`;
                growthEl.className = growth > 0 ? 'text-success' : growth < 0 ? 'text-danger' : 'text-muted';
            }
        }
    }
    
    // Show empty state when no data
    function showEmptyState() {
        dashboardData.stats = {
            totalIncome: 0,
            activeServices: 0,
            expiringSoon: 0,
            totalCompanies: 0
        };
        
        updateStats();
        
        // Hide charts
        const incomeChart = document.getElementById('incomeChart');
        const servicesChart = document.getElementById('servicesChart');
        
        if (incomeChart) {
            incomeChart.style.display = 'none';
        }
        if (servicesChart) {
            servicesChart.style.display = 'none';
        }
    }
    
    // Animate number counting
    function animateNumber(elementId, start, end, formatter = null) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const duration = 1500; // 1.5 seconds
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * easeOut;
            
            const value = Math.floor(current);
            element.textContent = formatter ? formatter(value) : value;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }
    
    // Initialize charts
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js kutubxonasi yuklanmagan');
            return;
        }
        
        initIncomeChart();
        initServicesChart();
    }
    
    // Income chart
    function initIncomeChart() {
        const ctx = document.getElementById('incomeChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (window.incomeChartInstance) {
            window.incomeChartInstance.destroy();
        }
        
        const data = dashboardData.charts.income_data || [];
        
        if (data.length === 0) {
            ctx.style.display = 'none';
            return;
        }
        
        ctx.style.display = 'block';
        
        window.incomeChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.month),
                datasets: [{
                    label: 'Daromad (so\'m)',
                    data: data.map(item => item.amount),
                    borderColor: '#714B67',
                    backgroundColor: 'rgba(113, 75, 103, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#714B67',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#333333',
                        bodyColor: '#666666',
                        borderColor: '#e1e5e9',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f8f9fa'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Services chart
    function initServicesChart() {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (window.servicesChartInstance) {
            window.servicesChartInstance.destroy();
        }
        
        const data = dashboardData.charts.services_data || [];
        
        if (data.length === 0) {
            ctx.style.display = 'none';
            return;
        }
        
        ctx.style.display = 'block';
        
        window.servicesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.status),
                datasets: [{
                    data: data.map(item => item.count),
                    backgroundColor: data.map(item => item.color),
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#333333',
                        bodyColor: '#666666',
                        borderColor: '#e1e5e9',
                        borderWidth: 1
                    }
                }
            }
        });
    }
    
    // Quick actions
    function initQuickActions() {
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                handleQuickAction(action);
            });
        });
    }
    
    // Handle quick action clicks
    function handleQuickAction(action) {
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            
            switch (action) {
                case 'add-company':
                    window.location.href = '/companies/add/';
                    break;
                case 'add-service':
                    window.location.href = '/services/add/';
                    break;
                case 'add-income':
                    window.location.href = '/income/add/';
                    break;
                case 'send-notification':
                    window.location.href = '/notifications/send/';
                    break;
                case 'view-reports':
                    window.location.href = '/reports/';
                    break;
                case 'backup-data':
                    showToast('Ma\'lumot zaxirasi yaratilmoqda...', 'info');
                    break;
                default:
                    showToast('Tez orada qo\'shiladi', 'warning');
            }
        }, 500);
    }
    
    // Initialize filters
    function initFilters() {
        const incomeFilter = document.getElementById('incomeFilter');
        if (incomeFilter) {
            incomeFilter.addEventListener('change', function() {
                loadDashboardData(); // Reload with new filter
            });
        }
    }
    
    // Setup auto-refresh
    function setupRefresh() {
        // Refresh every 5 minutes
        setInterval(loadDashboardData, 5 * 60 * 1000);
        
        // Manual refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadDashboardData);
        }
    }
    
    // Helper function - CSRF token
    function getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
               document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }
    
    // Export functions
    window.dashboardFunctions = {
        loadDashboardData,
        updateDashboard,
        animateNumber
    };
    
    // Initialize
    initDashboard();
    
    console.log('📊 Dashboard.js - Real API only');
});