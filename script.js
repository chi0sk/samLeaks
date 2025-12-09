// =============================================
// Configuration & State
// =============================================
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1436848769948713000/BJ8zUadkr-ZLclXYdtGqHniu1etrrXKI4XTZkwquVOIr7DgoM6eAEAYXB57qZUQSjE0H';
const CATEGORIES = ['All', 'Simulator', 'Obby', 'RPG', 'Tycoon', 'Horror', 'Fighting', 'Other'];

let state = {
    games: [],
    currentPage: 1,
    itemsPerPage: 12,
    currentSection: 'home',
    filters: {
        category: 'All',
        dateFrom: null,
        dateTo: null,
        minDownloads: null,
        sortBy: 'trending',
        searchQuery: ''
    },
    keyboardIndex: -1,
    recentlyViewed: []
};

// =============================================
// Storage Helper Functions
// =============================================
async function getFromStorage(key) {
    try {
        const result = await window.storage.get(key, true);
        return result ? JSON.parse(result.value) : null;
    } catch (e) {
        return null;
    }
}

async function setToStorage(key, value) {
    try {
        await window.storage.set(key, JSON.stringify(value), true);
        return true;
    } catch (e) {
        console.error('Storage error:', e);
        return false;
    }
}

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
    await fetchGames();
    setupEventListeners();
    setupKeyboardNavigation();
    setupTheme();
    setupAnnouncements();
    renderCategoryFilter();
    renderAllSections();
    await loadRecentlyViewed();
});

// =============================================
// Data Fetching
// =============================================
async function fetchGames() {
    try {
        const response = await fetch('config/index.json?nocache=' + Date.now());
        if (!response.ok) throw new Error('Failed to fetch game index');
        
        const index = await response.json();
        const gamePromises = index.games.map(async gameFile => {
            try {
                const response = await fetch(`config/${gameFile}?nocache=` + Date.now());
                const game = await response.json();
                
                // Load ratings and comments from storage
                const ratings = await getFromStorage(`ratings_${game.id}`);
                const comments = await getFromStorage(`comments_${game.id}`);
                
                game.rating = ratings?.average || 0;
                game.ratingCount = ratings?.count || 0;
                game.comments = comments || [];
                game.category = game.category || 'Other';
                
                return game;
            } catch (error) {
                console.error(`Error loading ${gameFile}:`, error);
                return null;
            }
        });
        
        state.games = (await Promise.all(gamePromises)).filter(game => game !== null);
        renderAllSections();
    } catch (error) {
        console.error('Error fetching games:', error);
        state.games = [];
        showError('Failed to load games. Please refresh the page.');
    }
}

// =============================================
// Event Listeners Setup
// =============================================
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            activateSection(section);
            resetPagination();
        });
    });

    // Search
    document.getElementById('search-button').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Filters
    document.getElementById('date-from').addEventListener('change', applyFilters);
    document.getElementById('date-to').addEventListener('change', applyFilters);
    document.getElementById('downloads-filter').addEventListener('change', applyFilters);
    document.getElementById('sort-by').addEventListener('change', applyFilters);

    // Theme
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Color themes
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            setColorTheme(theme);
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    // Modals
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Submit form
    document.getElementById('submit-game-btn').addEventListener('click', () => {
        document.getElementById('submit-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('submit-form').addEventListener('submit', submitGame);

    // Success modal close buttons
    document.querySelectorAll('.close-success').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('success-modal').classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// =============================================
// Keyboard Navigation
// =============================================
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const modal = document.querySelector('.modal.active');
        if (modal) {
            if (e.key === 'Escape') {
                closeModals();
            }
            return;
        }

        const cards = Array.from(document.querySelectorAll('#games-grid .game-card'));
        if (cards.length === 0) return;

        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                state.keyboardIndex = Math.min(state.keyboardIndex + 1, cards.length - 1);
                highlightCard(cards);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                state.keyboardIndex = Math.max(state.keyboardIndex - 1, 0);
                highlightCard(cards);
                break;
            case 'Enter':
                e.preventDefault();
                if (state.keyboardIndex >= 0 && cards[state.keyboardIndex]) {
                    cards[state.keyboardIndex].click();
                }
                break;
        }
    });
}

function highlightCard(cards) {
    cards.forEach((card, idx) => {
        card.classList.toggle('keyboard-focus', idx === state.keyboardIndex);
    });
    if (cards[state.keyboardIndex]) {
        cards[state.keyboardIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// =============================================
// Navigation & Section Management
// =============================================
function activateSection(sectionId) {
    state.currentSection = sectionId;
    
    document.querySelectorAll('main .section, main .active-section').forEach(section => {
        section.classList.remove('active-section');
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.classList.add('active-section');

        // Force grid reflow
        const grid = activeSection.querySelector('.games-grid');
        if (grid) {
            grid.style.display = 'none';
            void grid.offsetHeight;
            grid.style.display = 'grid';
        }
    }

    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetPagination() {
    state.currentPage = 1;
    state.keyboardIndex = -1;
}

// =============================================
// Category Filter
// =============================================
function renderCategoryFilter() {
    const container = document.getElementById('category-filter');
    container.innerHTML = CATEGORIES.map(cat => 
        `<button class="category-btn ${cat === state.filters.category ? 'active' : ''}" 
                onclick="filterByCategory('${cat}')">${cat}</button>`
    ).join('');
}

function filterByCategory(category) {
    state.filters.category = category;
    resetPagination();
    renderCategoryFilter();
    renderGames();
}

// =============================================
// Filtering & Sorting
// =============================================
function applyFilters() {
    state.filters.dateFrom = document.getElementById('date-from').value;
    state.filters.dateTo = document.getElementById('date-to').value;
    state.filters.minDownloads = document.getElementById('downloads-filter').value;
    state.filters.sortBy = document.getElementById('sort-by').value;
    resetPagination();
    renderGames();
}

function performSearch() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    if (!query) return;
    
    state.filters.searchQuery = query;
    resetPagination();
    renderGames();
}

function getFilteredGames() {
    let filtered = [...state.games];

    // Category filter
    if (state.filters.category !== 'All') {
        filtered = filtered.filter(g => g.category === state.filters.category);
    }

    // Date range filter
    if (state.filters.dateFrom) {
        filtered = filtered.filter(g => new Date(g.date_added) >= new Date(state.filters.dateFrom));
    }
    if (state.filters.dateTo) {
        filtered = filtered.filter(g => new Date(g.date_added) <= new Date(state.filters.dateTo));
    }

    // Downloads filter
    if (state.filters.minDownloads) {
        filtered = filtered.filter(g => g.downloads >= parseInt(state.filters.minDownloads));
    }

    // Search filter
    if (state.filters.searchQuery) {
        filtered = filtered.filter(g => 
            g.title.toLowerCase().includes(state.filters.searchQuery) ||
            g.description.toLowerCase().includes(state.filters.searchQuery) ||
            (g.category && g.category.toLowerCase().includes(state.filters.searchQuery))
        );
    }

    // Sorting
    switch(state.filters.sortBy) {
        case 'downloads':
            filtered.sort((a, b) => b.downloads - a.downloads);
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
            break;
        case 'rating':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'trending':
        default:
            filtered.sort((a, b) => {
                const aScore = a.downloads * (1 + (new Date(a.last_updated) - new Date('2025-01-01')) / (1000 * 60 * 60 * 24 * 365));
                const bScore = b.downloads * (1 + (new Date(b.last_updated) - new Date('2025-01-01')) / (1000 * 60 * 60 * 24 * 365));
                return bScore - aScore;
            });
    }

    return filtered;
}

// =============================================
// Rendering Functions
// =============================================
function renderAllSections() {
    renderGames();
    renderLeaderboards();
    renderRequests();
}

function renderGames() {
    const filtered = getFilteredGames();
    const grid = document.getElementById('games-grid');
    
    // Add this check (or ensure it stays)
    if (!grid) {
        console.error("Error: Element with ID 'games-grid' not found. Cannot render games.");
        return;
    }
    
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const paginated = filtered.slice(start, end);

    if (paginated.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No games found</h3><p>Try adjusting your filters</p></div>';
    } else {
        grid.innerHTML = '';
        paginated.forEach(game => {
            const card = createGameCard(game);
            grid.appendChild(card);
        });
    }

    renderPagination(filtered.length, document.getElementById('pagination'));
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const stars = '★'.repeat(Math.round(game.rating || 0)) + '☆'.repeat(5 - Math.round(game.rating || 0));
    
    // Set background image via style attribute
    card.style.backgroundImage = `url('${game.image}')`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';

    card.innerHTML = `
        <div class="game-card-content">
            <h3 class="game-card-title">${game.title}</h3>
            <div class="game-card-meta">
                <span class="game-tag">${game.category}</span>
                <span>${stars} (${game.ratingCount})</span>
            </div>
            <div class="game-card-actions">
                <span class="price-tag ${game.price === 0 ? 'free' : ''}">${game.price === 0 ? 'Free' : '$' + game.price}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openGameModal(game.id));
    
    return card;
}

function renderPagination(totalItems, container) {
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button ${state.currentPage === 1 ? 'disabled' : ''} onclick="changePage(-1)">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
        <span class="page-number">Page ${state.currentPage} of ${totalPages}</span>
        <button ${state.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(1)">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

function changePage(direction) {
    state.currentPage += direction;
    state.keyboardIndex = -1;
    renderGames();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// Game Modal
// =============================================
async function openGameModal(gameId) {
    const game = state.games.find(g => g.id === gameId);
    if (!game) return;

    // Track recently viewed
    await trackRecentlyViewed(gameId);

    const modal = document.getElementById('game-modal');
    const content = document.getElementById('modal-content');

    const comments = game.comments || [];
    const userRating = await getUserRating(gameId);

    content.innerHTML = `
        <div class="game-details">
            <div class="game-header">
                <h2 class="game-title">${game.title}</h2>
                <div class="game-meta">
                    <span><i class="fas fa-tag"></i> ${game.category}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(game.date_added).toLocaleDateString()}</span>
                    <span><i class="fas fa-download"></i> ${game.downloads.toLocaleString()} downloads</span>
                </div>
            </div>

            <div class="game-banner">
                <img src="${game.image}" alt="${game.title}">
            </div>

            <div class="game-rating">
                <div class="stars" data-game-id="${gameId}">
                    ${[1,2,3,4,5].map(n => 
                        `<span class="star ${n <= userRating ? 'active' : ''}" onclick="rateGame('${gameId}', ${n})">★</span>`
                    ).join('')}
                </div>
                <div class="rating-stats">
                    ${game.rating.toFixed(1)} / 5.0 (${game.ratingCount} ratings)
                </div>
            </div>

            <div class="game-description">
                <h3>Description</h3>
                <p>${game.description}</p>
            </div>

            <div class="download-analytics">
                <div class="stat-card">
                    <div class="stat-value">${game.downloads.toLocaleString()}</div>
                    <div class="stat-label">Total Downloads</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${game.rating.toFixed(1)}</div>
                    <div class="stat-label">Average Rating</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${game.ratingCount}</div>
                    <div class="stat-label">Reviews</div>
                </div>
            </div>

            <div class="comments-section">
                <h3>Comments (${comments.length})</h3>
                <div class="comment-form">
                    <input type="text" id="comment-input" placeholder="Add a comment..." maxlength="500">
                    <button class="primary-btn" onclick="addComment('${gameId}')">Post</button>
                </div>
                <div id="comments-list">
                    ${comments.slice(0, 10).map(c => `
                        <div class="comment">
                            <div class="comment-header">
                                <span class="comment-author">${escapeHtml(c.author)}</span>
                                <span class="comment-time">${new Date(c.time).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-text">${escapeHtml(c.text)}</div>
                        </div>
                    `).join('')}
                    ${comments.length === 0 ? '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>' : ''}
                </div>
            </div>

            <div class="download-section">
                <div class="download-price ${game.price === 0 ? 'free' : ''}">
                    ${game.price === 0 ? 'FREE' : '$' + game.price}
                </div>
                <a href="${game.download_link}" target="_blank" class="primary-btn" onclick="trackDownload('${gameId}')">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// =============================================
// Rating System
// =============================================
async function getUserRating(gameId) {
    const ratings = await getFromStorage(`user_rating_${gameId}`);
    return ratings || 0;
}

async function rateGame(gameId, rating) {
    // Save user's rating
    await setToStorage(`user_rating_${gameId}`, rating);

    // Get existing ratings data
    const ratingsData = await getFromStorage(`ratings_${gameId}`) || { total: 0, count: 0, average: 0 };
    
    // Update ratings
    ratingsData.total += rating;
    ratingsData.count += 1;
    ratingsData.average = ratingsData.total / ratingsData.count;
    
    await setToStorage(`ratings_${gameId}`, ratingsData);

    // Update game in state
    const game = state.games.find(g => g.id === gameId);
    if (game) {
        game.rating = ratingsData.average;
        game.ratingCount = ratingsData.count;
    }

    // Re-render modal
    await openGameModal(gameId);
}

// =============================================
// Comments System
// =============================================
async function addComment(gameId) {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;

    const comment = {
        author: `User${Math.floor(Math.random() * 10000)}`,
        text: text,
        time: new Date().toISOString()
    };

    const comments = await getFromStorage(`comments_${gameId}`) || [];
    comments.unshift(comment);
    await setToStorage(`comments_${gameId}`, comments);

    const game = state.games.find(g => g.id === gameId);
    if (game) {
        game.comments = comments;
    }

    input.value = '';
    await openGameModal(gameId);
}

// =============================================
// Recently Viewed Tracking
// =============================================
async function trackRecentlyViewed(gameId) {
    let recent = await getFromStorage('recently_viewed') || [];
    recent = recent.filter(id => id !== gameId);
    recent.unshift(gameId);
    recent = recent.slice(0, 10);
    await setToStorage('recently_viewed', recent);
    state.recentlyViewed = recent;
}

async function loadRecentlyViewed() {
    state.recentlyViewed = await getFromStorage('recently_viewed') || [];
}

// =============================================
// Download Tracking
// =============================================
function trackDownload(gameId) {
    // In production, this would update the backend
    console.log(`Download tracked for game: ${gameId}`);
}

// =============================================
// Leaderboards
// =============================================
function renderLeaderboards() {
    if (state.games.length === 0) return;

    // Most downloaded
    const byDownloads = [...state.games].sort((a, b) => b.downloads - a.downloads).slice(0, 6);
    const downloadsGrid = document.getElementById('leaderboard-downloads');
    downloadsGrid.innerHTML = '';
    byDownloads.forEach(game => {
        downloadsGrid.appendChild(createGameCard(game));
    });

    // Highest rated
    const byRating = [...state.games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
    const ratingGrid = document.getElementById('leaderboard-rating');
    ratingGrid.innerHTML = '';
    byRating.forEach(game => {
        ratingGrid.appendChild(createGameCard(game));
    });

    // Stats
    const totalDownloads = state.games.reduce((sum, g) => sum + g.downloads, 0);
    const avgRating = state.games.reduce((sum, g) => sum + (g.rating || 0), 0) / state.games.length;
    
    document.getElementById('total-games').textContent = state.games.length;
    document.getElementById('total-downloads').textContent = totalDownloads.toLocaleString();
    document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
}

// =============================================
// Requests System
// =============================================
async function submitRequest() {
    const input = document.getElementById('request-input');
    const text = input.value.trim();
    if (!text) return;

    const request = {
        text: text,
        votes: 0,
        time: new Date().toISOString(),
        id: Date.now()
    };

    const requests = await getFromStorage('game_requests') || [];
    requests.unshift(request);
    await setToStorage('game_requests', requests);

    input.value = '';
    renderRequests();
}

async function renderRequests() {
    const requests = await getFromStorage('game_requests') || [];
    const container = document.getElementById('requests-list');
    
    if (requests.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No requests yet. Be the first to suggest a game!</p></div>';
        return;
    }

    // Sort by votes
    requests.sort((a, b) => b.votes - a.votes);

    container.innerHTML = requests.slice(0, 20).map(req => `
        <div class="comment">
            <div class="comment-header">
                <span>${escapeHtml(req.text)}</span>
                <button class="primary-btn" onclick="voteRequest(${req.id})" style="padding: 5px 10px;">
                    <i class="fas fa-arrow-up"></i> ${req.votes}
                </button>
            </div>
            <div class="comment-time" style="margin-top: 5px; font-size: 0.8rem;">${new Date(req.time).toLocaleDateString()}</div>
        </div>
    `).join('');
}

async function voteRequest(requestId) {
    const requests = await getFromStorage('game_requests') || [];
    const request = requests.find(r => r.id === requestId);
    if (request) {
        request.votes += 1;
        await setToStorage('game_requests', requests);
        renderRequests();
    }
}

// =============================================
// Submit Game Form
// =============================================
async function submitGame(e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('game-title').value,
        description: document.getElementById('game-description').value,
        category: document.getElementById('game-category').value,
        image_url: document.getElementById('game-image').value,
        video_url: document.getElementById('game-video').value || 'N/A',
        submission_time: new Date().toISOString()
    };

    const file = document.getElementById('game-file').files[0];

    try {
        if (file) {
            const formDataToSend = new FormData();
            formDataToSend.append('payload_json', JSON.stringify({
                embeds: [{
                    title: '🎮 New Game Submission',
                    color: 0x7b68ee,
                    fields: [
                        { name: 'Title', value: formData.title, inline: true },
                        { name: 'Category', value: formData.category, inline: true },
                        { name: 'File Attached', value: '✅ Yes', inline: true },
                        { name: 'Description', value: formData.description },
                        { name: 'Image URL', value: formData.image_url },
                        { name: 'Video URL', value: formData.video_url }
                    ],
                    thumbnail: { url: formData.image_url },
                    timestamp: formData.submission_time,
                    footer: { text: 'Sam Leaks Submission System' }
                }]
            }));
            formDataToSend.append('file', file, file.name);
            await fetch(WEBHOOK_URL, { method: 'POST', body: formDataToSend });
        }
        
        document.getElementById('submit-modal').classList.remove('active');
        document.getElementById('success-modal').classList.add('active');
        document.getElementById('submit-form').reset();
    } catch (error) {
        console.error('Submission error:', error);
        alert('Submission failed. Please try again.');
    }
}

// =============================================
// Theme Management
// =============================================
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedColor = localStorage.getItem('colorTheme') || 'default';

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    setColorTheme(savedColor);
    document.querySelectorAll('.color-option').forEach(option => {
        if (option.getAttribute('data-theme') === savedColor) {
            option.classList.add('active');
        }
    });
}

function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    document.body.classList.toggle('light-mode');
    document.getElementById('theme-toggle').innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
}

function setColorTheme(theme) {
    document.body.classList.remove('theme-blue', 'theme-red', 'theme-green');
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('colorTheme', theme);
}

// =============================================
// Announcements
// =============================================
function setupAnnouncements() {
    const announcements = [
        'Welcome to Sam Leaks! Check out our newest additions.',
        'Join our Discord community for updates and support!',
        'New games added weekly - check back often!',
        'Rate and review your favorite games!'
    ];

    let currentIndex = 0;
    const announcementText = document.getElementById('announcement-text');

    if (announcementText) {
        setInterval(() => {
            currentIndex = (currentIndex + 1) % announcements.length;
            announcementText.style.opacity = 0;
            setTimeout(() => {
                announcementText.textContent = announcements[currentIndex];
                announcementText.style.opacity = 1;
            }, 500);
        }, 7000);
    }
}

// =============================================
// Utility Functions
// =============================================
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    console.error(message);
    // You could add a toast notification here
}

// Make functions globally accessible
window.openGameModal = openGameModal;
window.rateGame = rateGame;
window.addComment = addComment;
window.submitRequest = submitRequest;
window.voteRequest = voteRequest;
window.changePage = changePage;
window.filterByCategory = filterByCategory;
window.trackDownload = trackDownload;


