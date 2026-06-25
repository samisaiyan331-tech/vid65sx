


document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("id") || window.FORCE_POST_ID;
    if (videoId) {
        initPlayerPage(videoId);
    } else {
        // Redirect to homepage if share-target data is missing
        window.location.href = 'index.html';
    }
});

// Load assets and map descriptors to page
async function initPlayerPage(id) {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("JSON asset fetch error.");
        const database = await response.json();

        const currentPost = database.find(post => post.id === id);

        if (!currentPost) {
            // Unidentified ID catch
            window.location.href = 'index.html';
            return;
        }

        // Dynamically append Meta Tags for client search index bots
        document.title = `${currentPost.title} - VID65 Share`;
        document.getElementById("metaDesc").setAttribute("content", currentPost.description);
        document.getElementById("metaOgTitle").setAttribute("content", `${currentPost.title} - VID65 Share`);
        document.getElementById("metaOgDesc").setAttribute("content", currentPost.description);
        document.getElementById("metaOgImage").setAttribute("content", currentPost.thumbnail);
        const currentUrl = window.location.href;
        const ogUrlElem = document.getElementById("metaOgUrl");
        if (ogUrlElem) ogUrlElem.setAttribute("content", currentUrl);
        const twitterUrlElem = document.querySelector('meta[property="twitter:url"]');
        if (twitterUrlElem) twitterUrlElem.setAttribute("content", currentUrl);
        const canonicalLink = document.getElementById("linkCanonical");
        if (canonicalLink) canonicalLink.setAttribute("href", currentUrl);
        const imageSrcLink = document.getElementById("linkImageSrc");
        if (imageSrcLink) imageSrcLink.setAttribute("href", currentPost.thumbnail);
        const ogImageSecure = document.getElementById("metaOgImageSecure");
        if (ogImageSecure) ogImageSecure.setAttribute("content", currentPost.thumbnail);
        const ogImageAlt = document.getElementById("metaOgImageAlt");
        if (ogImageAlt) ogImageAlt.setAttribute("content", `Watch ${currentPost.title} on VID65 Share`);
        const ogVideoUrl = document.getElementById("metaOgVideoUrl");
        if (ogVideoUrl) ogVideoUrl.setAttribute("content", currentPost.videoUrl);
        const ogVideoSecure = document.getElementById("metaOgVideoSecureUrl");
        if (ogVideoSecure) ogVideoSecure.setAttribute("content", currentPost.videoUrl);
        const ogVideoType = document.getElementById("metaOgVideoType");
        if (ogVideoType) ogVideoType.setAttribute("content", "video/mp4");
        const twitterTitleElem = document.querySelector('meta[property="twitter:title"]');
        if (twitterTitleElem) twitterTitleElem.setAttribute("content", `${currentPost.title} - VID65 Share`);
        const twitterDescElem = document.querySelector('meta[property="twitter:description"]');
        if (twitterDescElem) twitterDescElem.setAttribute("content", currentPost.description);
        const twitterImageElem = document.querySelector('meta[property="twitter:image"]');
        if (twitterImageElem) twitterImageElem.setAttribute("content", currentPost.thumbnail);
        const twitterImageAltElem = document.querySelector('meta[property="twitter:image:alt"]');
        if (twitterImageAltElem) twitterImageAltElem.setAttribute("content", `Watch ${currentPost.title} on VID65 Share`);

        // Map Content Elements
        document.getElementById("videoTitle").textContent = currentPost.title;
        document.getElementById("videoDesc").textContent = currentPost.description;
        document.getElementById("videoCategory").textContent = currentPost.category;
        document.getElementById("videoDate").innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${currentPost.date || 'January 2025'}`;

        // Map Poster & video source
        document.getElementById("playerPoster").src = currentPost.thumbnail;
        const videoElement = document.getElementById("mainVideo");
        videoElement.src = currentPost.videoUrl;
        videoElement.poster = currentPost.thumbnail;

        // Render end-of-video suggestions
        renderEndSuggestions(database, currentPost.id);

        // Render Tag Pills
        const tagsContainer = document.getElementById("tagsContainer");
        if (tagsContainer && currentPost.tags) {
            tagsContainer.innerHTML = "";
            currentPost.tags.forEach(tag => {
                tagsContainer.innerHTML += `<span class="tag-item">#${tag}</span>`;
            });
        }

        setupCustomControls(videoElement);

    } catch (e) {
        console.error("Critical Player Initialization Error: ", e);
    }
}

// Custom Player Controls and Spinner management
function setupCustomControls(video) {
    const wrapper = document.getElementById("playerWrapper");
    const posterOverlay = document.getElementById("posterOverlay");
    const playOverlayBtn = document.getElementById("overlayPlayBtn");
    const endSuggestedSection = document.getElementById("endSuggestedSection");
    const spinner = document.getElementById("loadingSpinner");
    const controls = document.getElementById("customControls");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const timelineContainer = document.getElementById("timelineContainer");
    const progressBar = document.getElementById("progressBar");
    const volumeBtn = document.getElementById("volumeBtn");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const curTimeLabel = document.getElementById("currentTime");
    const durLabel = document.getElementById("totalDuration");

    let isControlsActive = false;

    function startPlayer() {
        spinner.style.display = "flex";
        posterOverlay.style.display = "none";
        endSuggestedSection.classList.remove("visible");

        if (!video.src) return;
        video.load();

        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                spinner.style.display = "none";
                controls.style.display = "flex";
                isControlsActive = true;
                updatePlayPauseIcon(true);
            }).catch(error => {
                spinner.style.display = "none";
                posterOverlay.style.display = "flex";
                console.warn("Video playback was blocked or interrupted.", error);
            });
        }
    }

    playOverlayBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        startPlayer();
    });
    posterOverlay.addEventListener("click", (event) => {
        event.stopPropagation();
        startPlayer();
    });
    wrapper.addEventListener("click", () => {
        if (posterOverlay.style.display !== "none") {
            startPlayer();
        }
    });
    video.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!isControlsActive) {
            startPlayer();
        } else {
            togglePlayState();
        }
    });
    video.addEventListener("play", () => {
        updatePlayPauseIcon(true);
        hideEndSuggestions();
    });
    video.addEventListener("pause", () => updatePlayPauseIcon(false));
    video.addEventListener("ended", () => {
        posterOverlay.style.display = "flex";
        controls.style.display = "flex";
        isControlsActive = false;
        showEndSuggestions();
    });
    video.addEventListener("error", (event) => {
        spinner.style.display = "none";
        console.error("Video playback error", event, video.error);
    });
    video.addEventListener("loadeddata", () => {
        if (!isControlsActive) {
            spinner.style.display = "none";
        }
    });

    function showEndSuggestions() {
        endSuggestedSection.classList.add("visible");
    }

    function hideEndSuggestions() {
        endSuggestedSection.classList.remove("visible");
    }

    // Play Pause core toggle
    const togglePlayState = () => {
        if (!isControlsActive) return;
        if (video.paused) {
            video.play();
            updatePlayPauseIcon(true);
        } else {
            video.pause();
            updatePlayPauseIcon(false);
        }
    };

    playPauseBtn.addEventListener("click", togglePlayState);

    function updatePlayPauseIcon(isPlaying) {
        const icon = playPauseBtn.querySelector("i");
        if (isPlaying) {
            icon.className = "fa-solid fa-pause";
        } else {
            icon.className = "fa-solid fa-play";
        }
    }

    // Spinner handling for video buffering state
    video.addEventListener("waiting", () => {
        spinner.style.display = "flex";
    });

    video.addEventListener("playing", () => {
        spinner.style.display = "none";
    });

    // Time progress tracking
    video.addEventListener("timeupdate", () => {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
        curTimeLabel.textContent = formatTime(video.currentTime);
    });

    video.addEventListener("loadedmetadata", () => {
        durLabel.textContent = formatTime(video.duration);
    });

    // Seek interaction on bar
    timelineContainer.addEventListener("click", (e) => {
        const rect = timelineContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const targetFraction = clickX / width;
        video.currentTime = targetFraction * video.duration;
    });

    // Volume controllers (Simple Toggle Mute)
    volumeBtn.addEventListener("click", () => {
        const icon = volumeBtn.querySelector("i");
        if (video.muted) {
            video.muted = false;
            icon.className = "fa-solid fa-volume-high";
        } else {
            video.muted = true;
            icon.className = "fa-solid fa-volume-xmark";
        }
    });

    // Fullscreen controller
    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            if (wrapper.requestFullscreen) {
                wrapper.requestFullscreen();
            } else if (wrapper.webkitRequestFullscreen) { /* Safari */
                wrapper.webkitRequestFullscreen();
            } else if (wrapper.msRequestFullscreen) { /* IE11 */
                wrapper.msRequestFullscreen();
            }
            fullscreenBtn.querySelector("i").className = "fa-solid fa-compress";
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            fullscreenBtn.querySelector("i").className = "fa-solid fa-expand";
        }
    });

    // Time Parser format utility
    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const formattedMins = mins < 10 ? `0${mins}` : mins;
        const formattedSecs = secs < 10 ? `0${secs}` : secs;
        return `${formattedMins}:${formattedSecs}`;
    }
}

function renderEndSuggestions(database, currentId) {
    const container = document.getElementById("endSuggestedGrid");
    if (!container) return;

    const suggestions = database
        .filter(post => post.id !== currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    container.innerHTML = suggestions.map(post => `
        <div class="end-suggested-card" data-id="${post.id}">
            <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
            <div class="card-title">${post.title}</div>
            <div class="card-badge"><i class="fa-solid fa-clock"></i> ${post.category}</div>
        </div>
    `).join("");

    container.querySelectorAll(".end-suggested-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.dataset.id;
            window.location.href = `watch.html?id=${id}`;
        });
    });
}