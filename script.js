// =============================================
// DOM Elements
// =============================================
const body = document.body;
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('section');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const themeToggle = document.getElementById('theme-toggle');
const submitGameBtn = document.getElementById('submit-game-btn');
const colorOptions = document.querySelectorAll('.color-option');
const gameModal = document.getElementById('game-modal');
const submitModal = document.getElementById('submit-modal');
const successModal = document.getElementById('success-modal');
const closeButtons = document.querySelectorAll('.close');
const submitForm = document.getElementById('submit-form');
const closeSuccessBtn = document.querySelector('.close-success');
const announcementText = document.getElementById('announcement-text');

// Game grid containers
const hotGamesAll = document.getElementById('hot-games-all');
const newGamesAll = document.getElementById('new-games-all');
const favoritesGames = document.getElementById('favorites-games');
const searchResults = document.getElementById('search-results');
const noFavorites = document.getElementById('no-favorites');
const noResults = document.getElementById('no-results');

// Sort selects
const hotSort = document.getElementById('hot-sort');
const newSort = document.getElementById('new-sort');
const searchSort = document.getElementById('search-sort');

// Pagination elements
const hotPagination = document.getElementById('hot-pagination');
const newPagination = document.getElementById('new-pagination');
const searchPagination = document.getElementById('search-pagination');

// =============================================
// State Management
// =============================================
let games = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentAnnouncement = 0;
let currentPage = 1;
let itemsPerPage = 12;
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';
let parallaxEnabled = true;

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    fetchGames();
    setupEventListeners();
    setupParallax();
    setupTheme();
    setupAnnouncements();
});

// =============================================
// Data Fetching
// =============================================
function fetchGames() {
    fetch('config/index.json?nocache=' + Date.now())
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(index => {
            const gamePromises = index.games.map(gameFile =>
                fetch(`config/${gameFile}?nocache=` + Date.now())
                    .then(response => response.json())
                    .catch(error => {
                        console.error(`Error loading ${gameFile}:`, error);
                        return null;
                    })
            );
            return Promise.all(gamePromises);
        })
        .then(gamesData => {
            games = gamesData.filter(game => game !== null);
            renderAllGameSections();
        })
        .catch(error => {
            console.error('Error fetching games:', error);
            games = [];
            renderAllGameSections();
        });
}

// =============================================
// Event Listeners
// =============================================
function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            activateSection(section);
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    const viewAllButtons = document.querySelectorAll('.view-all');
    viewAllButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const section = button.getAttribute('data-section');
            activateSection(section);
            navLinks.forEach(navLink => {
                if (navLink.getAttribute('data-section') === section) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    searchButton.addEventListener('click', () => performSearch());
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    themeToggle.addEventListener('click', () => toggleTheme());

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            setColorTheme(theme);
            colorOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameModal.classList.remove('active');
            submitModal.classList.remove('active');
            successModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === gameModal) {
            gameModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (e.target === submitModal) {
            submitModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (e.target === successModal) {
            successModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    submitGameBtn.addEventListener('click', () => {
        submitModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    submitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitGameForm();
    });

    const closeSuccessButtons = document.querySelectorAll('.close-success');
    closeSuccessButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            successModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    if (hotSort) {
        hotSort.addEventListener('change', () => {
            currentSort = hotSort.value;
            currentPage = 1;
            renderGamesList(filterGames('hot'), hotGamesAll, hotPagination);
        });
    }

    if (newSort) {
        newSort.addEventListener('change', () => {
            currentSort = newSort.value;
            currentPage = 1;
            renderGamesList(filterGames('new'), newGamesAll, newPagination);
        });
    }

    if (searchSort) {
        searchSort.addEventListener('change', () => {
            currentSort = searchSort.value;
            currentPage = 1;
            renderSearchResults();
        });
    }
}

// =============================================
// Navigation & Section Management
// =============================================
function activateSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active-section');
    });

    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
        activeSection.classList.add('active-section');
    }

    const homeSections = ['home-section'];
    homeSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = sectionId === 'home' ? 'flex' : 'none';
        }
    });

    const homeGrids = [hotGamesAll];
    homeGrids.forEach(grid => {
        if (grid) {
            grid.style.display = sectionId === 'home' ? 'grid' : 'none';
        }
    });

    currentPage = 1;

    if (sectionId === 'hot') {
        renderGamesList(filterGames('hot'), hotGamesAll, hotPagination);
    } else if (sectionId === 'new') {
        renderGamesList(filterGames('new'), newGamesAll, newPagination);
    } else if (sectionId === 'favorites') {
        renderFavorites();
    }
}

// =============================================
// Game Rendering Functions
// =============================================
function renderAllGameSections() {
    renderGamesList(filterGames('hot'), hotGamesAll, hotPagination);
    renderGamesList(filterGames('new'), newGamesAll, newPagination);
    renderFavorites();
}

function renderFavorites() {
    const favoriteGames = games.filter(game => favorites.includes(game.id));
    if (favoriteGames.length === 0) {
        noFavorites.classList.remove('hidden');
        favoritesGames.innerHTML = '';
    } else {
        noFavorites.classList.add('hidden');
        renderGamesGrid(favoriteGames, favoritesGames);
    }
}

function renderGamesGrid(gamesArray, container) {
    container.innerHTML = '';
    gamesArray.forEach(game => {
        const card = createGameCard(game);
        container.appendChild(card);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('data-id', game.id);

    const cardStyle = document.createElement('style');
    cardStyle.textContent = `
        .game-card[data-id="${game.id}"]::before {
            background-image: url('${game.image}');
        }
    `;
    document.head.appendChild(cardStyle);

    const isFavorite = favorites.includes(game.id);
    const favoriteClass = isFavorite ? 'fas' : 'far';

    const content = document.createElement('div');
    content.className = 'game-card-content';
    content.innerHTML = `
        <h3 class="game-card-title">${game.title}</h3>
        <div class="game-card-actions">
            <span class="price-tag ${game.price === 0 ? 'free' : ''}">${game.price === 0 ? 'Free' : '$' + game.price}</span>
            <button class="favorite-btn" data-id="${game.id}">
                <i class="${favoriteClass} fa-heart"></i>
            </button>
        </div>
    `;

    card.appendChild(content);

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.favorite-btn')) {
            openGameModal(game);
        }
    });

    const favoriteBtn = content.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(game.id);
        const icon = favoriteBtn.querySelector('i');
        if (favorites.includes(game.id)) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });

    return card;
}

function renderGamesList(gamesArray, container, paginationContainer) {
    const sortedGames = sortGames(gamesArray, currentSort);
    const totalPages = Math.ceil(sortedGames.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentPageGames = sortedGames.slice(start, end);
    renderGamesGrid(currentPageGames, container);
    renderPagination(totalPages, paginationContainer);
}

function renderPagination(totalPages, container) {
    if (!container) return;
    container.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            if (container === hotPagination) {
                renderGamesList(filterGames('hot'), hotGamesAll, hotPagination);
            } else if (container === newPagination) {
                renderGamesList(filterGames('new'), newGamesAll, newPagination);
            } else if (container === searchPagination) {
                renderSearchResults();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-number';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            if (container === hotPagination) {
                renderGamesList(filterGames('hot'), hotGamesAll, hotPagination);
            } else if (container === newPagination) {
                renderGamesList(filterGames('new'), newGamesAll, newPagination);
            } else if (container === searchPagination) {
                renderSearchResults();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    container.appendChild(prevBtn);
    container.appendChild(pageInfo);
    container.appendChild(nextBtn);
}

// =============================================
// Game Modal
// =============================================
function openGameModal(game) {
    const modalContent = document.getElementById('modal-content');

    const addedDate = new Date(game.date_added).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const updatedDate = new Date(game.last_updated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let imagesHTML = '';
    if (game.images && game.images.length > 0) {
        imagesHTML = `
            <div class="game-gallery">
                <img src="${game.images[0]}" alt="${game.title}" class="game-banner-img">
                ${game.images.length > 1 ? '<div class="game-thumbnails">' +
                    game.images.map(img => `<img src="${img}" alt="${game.title}" class="thumbnail">`).join('') +
                    '</div>' : ''}
            </div>
        `;
    } else {
        imagesHTML = `
            <div class="game-banner">
                <img src="${game.image}" alt="${game.title}">
            </div>
        `;
    }

    let videoHTML = '';
    if (game.video) {
        videoHTML = `
            <div class="game-video">
                <iframe width="100%" height="315" src="${game.video}"
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media;
                    gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
    }

    let faqHTML = '';
    if (game.faq && game.faq.length > 0) {
        faqHTML = `
            <div class="game-faq">
                <h3>Frequently Asked Questions</h3>
                ${game.faq.map((item, index) => `
                    <div class="faq-item">
                        <div class="faq-question" data-faq="${index}">
                            ${item.question}
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer" id="faq-answer-${index}">
                            ${item.answer}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    modalContent.innerHTML = `
        <div class="game-details">
            <div class="game-header">
                <h2 class="game-title">${game.title}</h2>
                <div class="game-meta">
                    <span><i class="far fa-calendar-plus"></i> Added: ${addedDate}</span>
                    <span><i class="far fa-calendar-check"></i> Updated: ${updatedDate}</span>
                    <span><i class="fas fa-download"></i> Downloads: ${game.downloads.toLocaleString()}</span>
                </div>
            </div>
            ${imagesHTML}
            ${videoHTML}
            <div class="game-description">
                <h3>Description</h3>
                <p>${game.description}</p>
            </div>
            ${faqHTML}
            <div class="download-section">
                <div class="download-price ${game.price === 0 ? 'free' : ''}">
                    ${game.price === 0 ? 'FREE' : '$' + game.price}
                </div>
                <a href="${game.download_link}" target="_blank" class="primary-btn">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `;

    gameModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const faqQuestions = modalContent.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqId = question.getAttribute('data-faq');
            const answer = document.getElementById(`faq-answer-${faqId}`);
            answer.classList.toggle('active');
            const icon = question.querySelector('i');
            if (answer.classList.contains('active')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });

    const thumbnails = modalContent.querySelectorAll('.thumbnail');
    const mainImage = modalContent.querySelector('.game-banner-img');
    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
        thumbnails[0].classList.add('active');
    }
}

// =============================================
// Submit Game Form
// =============================================
function submitGameForm() {
    const title = document.getElementById('game-title').value;
    const description = document.getElementById('game-description').value;
    const imageUrl = document.getElementById('game-image').value;
    const videoUrl = document.getElementById('game-video').value;
    const gameFile = document.getElementById('game-file').files[0];

    const formData = {
        title,
        description,
        image_url: imageUrl,
        video_url: videoUrl || 'N/A',
        submission_time: new Date().toISOString()
    };

    sendToDiscordWebhook(formData, gameFile);
    submitModal.classList.remove('active');
    successModal.classList.add('active');
    submitForm.reset();
}

function sendToDiscordWebhook(formData, file) {
    const webhookUrl = 'https://discord.com/api/webhooks/1436848769948713000/BJ8zUadkr-ZLclXYdtGqHniu1etrrXKI4XTZkwquVOIr7DgoM6eAEAYXB57qZUQSjE0H';

    if (file) {
        const formDataToSend = new FormData();
        
        const payload = {
            embeds: [{
                title: '🎮 New Game Submission',
                color: 0x7b68ee,
                fields: [
                    { name: 'Title', value: formData.title, inline: true },
                    { name: 'Price', value: 'FREE', inline: true },
                    { name: 'File Uploaded', value: '✅ Yes (see attachment)', inline: true },
                    { name: 'Description', value: formData.description },
                    { name: 'Image URL', value: formData.image_url },
                    { name: 'Video URL', value: formData.video_url }
                ],
                thumbnail: { url: formData.image_url },
                timestamp: formData.submission_time,
                footer: { text: 'Sam Leaks Submission System' }
            }]
        };

        formDataToSend.append('payload_json', JSON.stringify(payload));
        formDataToSend.append('file', file, file.name);

        fetch(webhookUrl, {
            method: 'POST',
            body: formDataToSend
        }).catch(error => console.error('Error:', error));
    } else {
        const payload = {
            embeds: [{
                title: '🎮 New Game Submission',
                color: 0x7b68ee,
                fields: [
                    { name: 'Title', value: formData.title, inline: true },
                    { name: 'Price', value: 'FREE', inline: true },
                    { name: 'File Uploaded', value: '❌ No', inline: true },
                    { name: 'Description', value: formData.description },
                    { name: 'Image URL', value: formData.image_url },
                    { name: 'Video URL', value: formData.video_url }
                ],
                thumbnail: { url: formData.image_url },
                timestamp: formData.submission_time,
                footer: { text: 'Sam Leaks Submission System' }
            }]
        };

        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(error => console.error('Error:', error));
    }
}

// =============================================
// Search Functionality
// =============================================
function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query === '') return;

    searchQuery = query;
    currentPage = 1;
    currentSort = 'relevance';

    if (searchSort) searchSort.value = 'relevance';
    activateSection('search-results');
    navLinks.forEach(navLink => navLink.classList.remove('active'));
    renderSearchResults();
}

function renderSearchResults() {
    const results = searchGames(searchQuery);
    if (results.length === 0) {
        noResults.classList.remove('hidden');
        searchResults.innerHTML = '';
        searchPagination.innerHTML = '';
    } else {
        noResults.classList.add('hidden');
        renderGamesList(results, searchResults, searchPagination);
    }
}

function searchGames(query) {
    return games.filter(game => {
        const titleMatch = game.title.toLowerCase().includes(query);
        const descMatch = game.description.toLowerCase().includes(query);
        game.relevanceScore = 0;
        if (titleMatch) game.relevanceScore += 3;
        if (descMatch) game.relevanceScore += 1;
        return titleMatch || descMatch;
    });
}

// =============================================
// Filtering and Sorting
// =============================================
function filterGames(filter) {
    switch (filter) {
        case 'hot':
            return [...games].sort((a, b) => b.downloads - a.downloads);
        case 'new':
            return [...games].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
        case 'free':
            return games.filter(game => game.price === 0);
        case 'favorites':
            return games.filter(game => favorites.includes(game.id));
        default:
            return [...games];
    }
}

function sortGames(gamesArray, sort) {
    const sortedArray = [...gamesArray];
    switch (sort) {
        case 'newest':
            return sortedArray.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
        case 'oldest':
            return sortedArray.sort((a, b) => new Date(a.date_added) - new Date(b.date_added));
        case 'downloads':
            return sortedArray.sort((a, b) => b.downloads - a.downloads);
        case 'trending':
            return sortedArray.sort((a, b) => {
                const aScore = a.downloads * (1 + (new Date(a.last_updated) - new Date('2025-01-01')) / (1000 * 60 * 60 * 24 * 365));
                const bScore = b.downloads * (1 + (new Date(b.last_updated) - new Date('2025-01-01')) / (1000 * 60 * 60 * 24 * 365));
                return bScore - aScore;
            });
        case 'relevance':
            return sortedArray.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        default:
            return sortedArray;
    }
}

// =============================================
// Favorites Management
// =============================================
function toggleFavorite(gameId) {
    const index = favorites.indexOf(gameId);
    if (index === -1) {
        favorites.push(gameId);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    const favoritesSection = document.getElementById('favorites-section');
    if (favoritesSection && favoritesSection.classList.contains('active-section')) {
        renderFavorites();
    }
}

// =============================================
// Theme Management
// =============================================
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedColor = localStorage.getItem('colorTheme') || 'default';

    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    setColorTheme(savedColor);
    colorOptions.forEach(option => {
        if (option.getAttribute('data-theme') === savedColor) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

function toggleTheme() {
    const isLightMode = body.classList.contains('light-mode');
    if (isLightMode) {
        body.classList.remove('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'light');
    }
}

function setColorTheme(theme) {
    body.classList.remove('theme-blue', 'theme-red', 'theme-green');
    if (theme !== 'default') {
        body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('colorTheme', theme);
}

// =============================================
// Parallax Effect
// =============================================
function setupParallax() {
    if (!document.querySelector('.parallax-bg')) {
        const parallaxBg = document.createElement('div');
        parallaxBg.className = 'parallax-bg';

        for (let i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = 'parallax-item';
            parallaxBg.appendChild(item);
        }

        document.body.appendChild(parallaxBg);
    }

    document.addEventListener('mousemove', handleParallax);
}

function handleParallax(e) {
    if (!parallaxEnabled) return;

    const parallaxItems = document.querySelectorAll('.parallax-item');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const deltaX = (mouseX - centerX) / centerX;
    const deltaY = (mouseY - centerY) / centerY;

    parallaxItems.forEach((item, index) => {
        const factor = (index + 1) * 15;
        item.style.transform = `translate(${deltaX * factor}px, ${deltaY * factor}px)`;
    });
}

// =============================================
// Announcements Rotation
// =============================================
function setupAnnouncements() {
    const announcements = [
        'Welcome to Sam Leaks! Check out our newest additions.',
        'Join our Discord community for updates and support!',
        'New games added weekly - check back often!'
    ];

    if (announcementText) {
        announcementText.textContent = announcements[currentAnnouncement];
        setInterval(() => {
            currentAnnouncement = (currentAnnouncement + 1) % announcements.length;
            announcementText.style.opacity = 0;
            setTimeout(() => {
                announcementText.textContent = announcements[currentAnnouncement];
                announcementText.style.opacity = 1;
            }, 500);
        }, 7000);
    }

}



