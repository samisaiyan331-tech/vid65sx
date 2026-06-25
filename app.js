/**
 * VID65 Share - Main Application Script
 * Handle listings, pagination, ad injection, category filters, and search.
 */

const CONFIG = {
    jsonUrl: 'data.json',
    itemsPerPage: 30,
    adInterval: 5,
    visitedStorageKey: 'vid65_visited_posts'
};

let allPostsData = [];

// Get Simulated or Client Ad HTML Code
function getAdCardHTML() {
    return `
        
    `;
}

// Global DOM Helper
document.addEventListener("DOMContentLoaded", () => {
    initHeaderMenu();
    initGlobalSearch();
    loadApplicationRouter();
});

// Mobile menu drawer toggle logic
function initHeaderMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("open");
        });

        // Close menu on click outside
        document.addEventListener("click", (e) => {
            if (!navMenu.contains(e.target) && e.target !== menuToggle) {
                navMenu.classList.remove("open");
            }
        });
    }
}

// Setup search bars across pages
function initGlobalSearch() {
    const bindSearch = (inputFieldId, buttonId) => {
        const input = document.getElementById(inputFieldId);
        const button = document.getElementById(buttonId);

        if (input && button) {
            const handleSearch = () => {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
                }
            };
            button.addEventListener("click", handleSearch);
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") handleSearch();
            });
        }
    };

    bindSearch("searchInput", "searchButton");
    bindSearch("mobileSearchInput", "searchButton"); // Bind search inside drawer menu
    bindSearch("watchSearchInput", "watchSearchButton");
}

// Router to identify target action based on current webpage
async function loadApplicationRouter() {
    try {
        const response = await fetch(CONFIG.jsonUrl);
        if (!response.ok) throw new Error("Failed to load database ledger.");
        allPostsData = await response.json();

        const currentPath = window.location.pathname;

        if (currentPath.includes("watch.html")) {
            // Suggested videos generator logic inside Watch page
            renderSuggestedSection();
        } else if (currentPath.includes("sitemap.html")) {
            // Visual Dynamic Sitemap Generator
            renderSitemapIndex();
        } else if (currentPath.includes("about.html") || currentPath.includes("contact.html")) {
            // Static pages - No grid processing needed
        } else {
            // Default: Target index.html or root page
            initMainGridRouter();
        }
    } catch (error) {
        console.error("Initialization Error: ", error);
    }
}

// Read parameters and render Main Homepage Feed Grid
function initMainGridRouter() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryQuery = urlParams.get("cat");
    const searchQuery = urlParams.get("search");
    const pageQuery = parseInt(urlParams.get("page")) || 1;

    let filteredPosts = [...allPostsData];

    // Apply active filters
    if (categoryQuery && categoryQuery !== "all") {
        filteredPosts = filteredPosts.filter(post => post.category === categoryQuery);
        updateActiveCategoryBtn(categoryQuery);
        document.getElementById("pageTitle").textContent = `Category: ${categoryQuery.toUpperCase()}`;
    } else if (searchQuery) {
        const queryClean = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(queryClean) || 
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(queryClean)))
        );
        document.getElementById("pageTitle").textContent = `Search results for: "${searchQuery}"`;
    } else {
        updateActiveCategoryBtn("all");
    }

    // Connect and setup interactive click filters from Horizontal menu
    setupInteractiveCategoryControls();

    renderGridItemsWithAds(filteredPosts, pageQuery);
}

// Category bar styling synchronization
function updateActiveCategoryBtn(activeCategory) {
    const buttons = document.querySelectorAll(".category-btn");
    buttons.forEach(btn => {
        if (btn.getAttribute("data-category") === activeCategory) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// Set URL dynamically on Horizontal Filter clicks
function setupInteractiveCategoryControls() {
    const buttons = document.querySelectorAll(".category-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const cat = btn.getAttribute("data-category");
            window.location.href = `index.html?cat=${cat}`;
        });
    });
}

// Visited posts tracking helpers
function getVisitedPosts() {
    return JSON.parse(localStorage.getItem(CONFIG.visitedStorageKey)) || [];
}

function markPostAsVisited(postId) {
    let visited = getVisitedPosts();
    if (!visited.includes(postId)) {
        visited.push(postId);
        localStorage.setItem(CONFIG.visitedStorageKey, JSON.stringify(visited));
    }
}

// Render dynamic listings with Ads injected every 5 posts
function renderGridItemsWithAds(postsList, currentPage) {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    container.innerHTML = "";

    if (postsList.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#aaa;">No video assets match your criteria.</p>`;
        document.getElementById("paginationContainer").innerHTML = "";
        return;
    }

    // Paginated Slices
    const startIndex = (currentPage - 1) * CONFIG.itemsPerPage;
    const endIndex = Math.min(startIndex + CONFIG.itemsPerPage, postsList.length);
    const paginatedItems = postsList.slice(startIndex, endIndex);

    const visitedList = getVisitedPosts();
    let displayHtml = "";

    // Iterate paginated array and inject Ads every 5th count
    paginatedItems.forEach((post, index) => {
        const isWatched = visitedList.includes(post.id) ? "watched" : "";
        
        // Truncate title to max 16 characters
        const cleanTitle = post.title.length > 16 ? post.title.substring(0, 16) + "..." : post.title;

        displayHtml += `
            <div class="video-card ${isWatched}" data-id="${post.id}">
                <div class="card-mini-title">${cleanTitle}</div>
                <div class="card-poster-wrapper">
                    <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
                    <div class="card-play-overlay">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
            </div>
        `;

        // Inject ad placeholder every 5 posts
        if ((index + 1) % CONFIG.adInterval === 0 && index !== paginatedItems.length - 1) {
            displayHtml += getAdCardHTML();
        }
    });

    container.innerHTML = displayHtml;

    // Attach click events to dynamic Video cards
    document.querySelectorAll(".video-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            markPostAsVisited(id);
            window.location.href = `watch.html?id=${id}`;
        });
    });

    renderPaginationControls(postsList.length, currentPage);
}

// Generate premium page navigation indicators
function renderPaginationControls(totalCount, currentPage) {
    const container = document.getElementById("paginationContainer");
    if (!container) return;

    container.innerHTML = "";
    const totalPages = Math.ceil(totalCount / CONFIG.itemsPerPage);
    if (totalPages <= 1) return;

    // Previous Button
    const prevDisabled = currentPage === 1 ? "disabled" : "";
    let html = `<button class="page-btn ${prevDisabled}" id="prevPageBtn"><i class="fa-solid fa-angle-left"></i> Prev</button>`;

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? "active" : "";
        html += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // Next Button
    const nextDisabled = currentPage === totalPages ? "disabled" : "";
    html += `<button class="page-btn ${nextDisabled}" id="nextPageBtn">Next <i class="fa-solid fa-angle-right"></i></button>`;

    container.innerHTML = html;

    // Listeners for triggers
    container.querySelectorAll(".page-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("disabled")) return;

            let targetPage = currentPage;
            if (btn.id === "prevPageBtn") targetPage = currentPage - 1;
            else if (btn.id === "nextPageBtn") targetPage = currentPage + 1;
            else targetPage = parseInt(btn.getAttribute("data-page"));

            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set("page", targetPage);
            window.location.href = `index.html?${urlParams.toString()}`;
        });
    });
}

// Render dynamic Suggested column for watch.html page
function renderSuggestedSection() {
    const container = document.getElementById("suggestedContainer");
    if (!container) return;

    container.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const activeVideoId = urlParams.get("id");

    // Filter current playing video to avoid loop suggestions
    let suggestions = allPostsData.filter(p => p.id !== activeVideoId);

    // Shuffle and pick 10 random posts
    suggestions.sort(() => 0.5 - Math.random());
    const randomTen = suggestions.slice(0, 10);

    const visitedList = getVisitedPosts();
    let displayHtml = "";

    randomTen.forEach((post, index) => {
        const isWatched = visitedList.includes(post.id) ? "watched" : "";
        const cleanTitle = post.title.length > 16 ? post.title.substring(0, 16) + "..." : post.title;

        displayHtml += `
            <div class="video-card ${isWatched}" data-id="${post.id}">
                <div class="card-mini-title">${cleanTitle}</div>
                <div class="card-poster-wrapper">
                    <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
                    <div class="card-play-overlay">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
            </div>
        `;

        // Inject ad spacer every 5 items in suggested list too
        if ((index + 1) % CONFIG.adInterval === 0 && index !== randomTen.length - 1) {
            displayHtml += getAdCardHTML();
        }
    });

    container.innerHTML = displayHtml;

    container.querySelectorAll(".video-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            markPostAsVisited(id);
            window.location.href = `watch.html?id=${id}`;
        });
    });
}

// Dynamic Client Index Map Population
function renderSitemapIndex() {
    const sitemapPostsContainer = document.getElementById("sitemapPosts");
    if (!sitemapPostsContainer) return;

    sitemapPostsContainer.innerHTML = "";
    let html = "";

    allPostsData.forEach(post => {
        html += `<a href="watch.html?id=${post.id}"><i class="fa-solid fa-video"></i> ${post.title}</a>`;
    });

    sitemapPostsContainer.innerHTML = html;
}