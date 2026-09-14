document.addEventListener("DOMContentLoaded", () => {
    // Floating Toast Notification System (with deduplication guard)
    let lastToastMessage = "";
    let lastToastTime = 0;
    window.showToast = (message, type = "info") => {
        const now = Date.now();
        if (message === lastToastMessage && (now - lastToastTime < 2500)) {
            return; // Suppress duplicate identical toast message
        }
        lastToastMessage = message;
        lastToastTime = now;

        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        const icon = type === "success" ? "✓" : (type === "error" ? "⚠" : "ℹ");
        toast.innerHTML = `<span style="font-weight: bold; color: inherit;">${icon}</span> <span style="color: #f8fafc; font-weight: 500;">${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            toast.style.opacity = "0";
            toast.style.transform = "translateX(30px)";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };

    // Theme Management
    const currentTheme = localStorage.getItem("detector-theme") || "dark";
    if (window.applyTheme) {
        window.applyTheme(currentTheme);
    } else {
        document.documentElement.setAttribute("data-theme", currentTheme);
    }

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle && window.toggleTheme) {
        // Handled cleanly via unified handler in auth.js
    } else if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
            const nextTheme = activeTheme === "dark" ? "light" : "dark";
            if (window.applyTheme) {
                window.applyTheme(nextTheme);
            } else {
                document.documentElement.setAttribute("data-theme", nextTheme);
                localStorage.setItem("detector-theme", nextTheme);
            }
        });
    }

    // Modality Configurations & Vector / Emoji Icons
    const MODALITY_MAP = {
        audio: { icon: "🎙️", label: "Audio Modality", accept: ".wav,.mp3,.ogg" },
        image: { icon: "🖼️", label: "Image Modality", accept: ".jpg,.jpeg,.png,.webp" },
        video: { icon: "🎥", label: "Video Modality", accept: ".mp4,.avi,.mov" },
        text: { icon: "📝", label: "Text Modality", accept: ".txt" },
        all: { icon: "⚡", label: "All Modalities", accept: ".mp4,.avi,.mov,.jpg,.jpeg,.png,.webp,.wav,.mp3,.ogg,.txt" }
    };
    let activeSelectedModality = "all";

    // Tab Navigation
    const navLinks = document.querySelectorAll(".nav-link");
    const tabContents = document.querySelectorAll(".tab-content");

    window.switchTab = (tabId) => {
        // Requirement 3: Clear uploaded file on page / tab change
        if (tabId !== "upload-tab" && window.clearUploadedFile) {
            window.clearUploadedFile();
        }

        navLinks.forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
        tabContents.forEach(tab => {
            if (tab.id === tabId) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    };

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            const targetTab = link.dataset.tab;
            window.switchTab(targetTab);
            if (targetTab === "history-tab") {
                window.loadHistory();
            }
        });
    });

    // Hero Webcam CTA
    const heroWebcamBtn = document.getElementById("heroWebcamBtn");
    if (heroWebcamBtn) {
        heroWebcamBtn.addEventListener("click", () => {
            window.switchTab("webcam-tab");
        });
    }

    // Modality Hover Icon Updater (Consistent across Audio, Image, Video, Text)
    window.applyModalityHoverIcon = (modalityKey) => {
        const config = MODALITY_MAP[modalityKey] || MODALITY_MAP.all;
        const icon = config.icon;
        const label = config.label;

        // 1. Update selected file pill attribute & hover elements
        const selectedFileInfo = document.getElementById("selectedFileInfo");
        if (selectedFileInfo) {
            selectedFileInfo.setAttribute("data-modality", modalityKey);
        }
        const filePillModalityIcon = document.getElementById("filePillModalityIcon");
        if (filePillModalityIcon) {
            filePillModalityIcon.textContent = icon;
        }
        const fileModalityHoverIcon = document.getElementById("fileModalityHoverIcon");
        if (fileModalityHoverIcon) {
            fileModalityHoverIcon.textContent = icon;
        }
        const fileModalityHoverLabel = document.getElementById("fileModalityHoverLabel");
        if (fileModalityHoverLabel) {
            fileModalityHoverLabel.textContent = label;
        }

        // 2. Update Image Preview Overlay
        const previewModalityHoverIcon = document.getElementById("previewModalityHoverIcon");
        if (previewModalityHoverIcon) {
            previewModalityHoverIcon.textContent = (modalityKey === "all" ? "🖼️" : icon);
        }
        const previewModalityHoverText = document.getElementById("previewModalityHoverText");
        if (previewModalityHoverText) {
            previewModalityHoverText.textContent = (modalityKey === "all" ? "Image Modality" : label);
        }

        // 3. Update Video Preview Overlay
        const videoModalityHoverIcon = document.getElementById("videoModalityHoverIcon");
        if (videoModalityHoverIcon) {
            videoModalityHoverIcon.textContent = (modalityKey === "all" ? "🎥" : icon);
        }
        const videoModalityHoverText = document.getElementById("videoModalityHoverText");
        if (videoModalityHoverText) {
            videoModalityHoverText.textContent = (modalityKey === "all" ? "Video Modality" : label);
        }

        // 4. Update Audio Preview Overlay
        const audioModalityHoverIcon = document.getElementById("audioModalityHoverIcon");
        if (audioModalityHoverIcon) {
            audioModalityHoverIcon.textContent = (modalityKey === "all" ? "🎙️" : icon);
        }
        const audioModalityHoverText = document.getElementById("audioModalityHoverText");
        if (audioModalityHoverText) {
            audioModalityHoverText.textContent = (modalityKey === "all" ? "Audio Modality" : label);
        }
    };

    // File Drag & Drop Handling
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const selectedFileInfo = document.getElementById("selectedFileInfo");
    const selectedFileName = document.getElementById("selectedFileName");
    const selectedFileSize = document.getElementById("selectedFileSize");
    const clearFileBtn = document.getElementById("clearFileBtn");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreviewThumb = document.getElementById("imagePreviewThumb");
    const imagePreviewDims = document.getElementById("imagePreviewDims");
    const imagePreviewFormat = document.getElementById("imagePreviewFormat");
    const textPromptInput = document.getElementById("textPromptInput");
    const charCounter = document.getElementById("charCounter");
    const startAnalysisBtn = document.getElementById("startAnalysisBtn");

    let currentFile = null;

    // Clear Uploaded File Function
    window.clearUploadedFile = () => {
        currentFile = null;
        if (fileInput) fileInput.value = "";
        if (selectedFileInfo) {
            selectedFileInfo.classList.add("hidden");
            selectedFileInfo.removeAttribute("data-modality");
        }
        if (selectedFileName) selectedFileName.textContent = "";
        if (selectedFileSize) selectedFileSize.textContent = "";

        // Hide and clear image preview
        if (imagePreviewContainer) {
            imagePreviewContainer.classList.add("hidden");
        }
        if (imagePreviewThumb) {
            imagePreviewThumb.src = "";
        }

        // Hide and clear video preview
        const videoPreviewContainer = document.getElementById("videoPreviewContainer");
        const videoPreviewPlayer = document.getElementById("videoPreviewPlayer");
        if (videoPreviewContainer) {
            videoPreviewContainer.classList.add("hidden");
        }
        if (videoPreviewPlayer) {
            try {
                videoPreviewPlayer.pause();
                videoPreviewPlayer.removeAttribute("src");
                videoPreviewPlayer.load();
            } catch (e) {}
        }

        // Hide and clear audio preview
        const audioPreviewContainer = document.getElementById("audioPreviewContainer");
        const audioPreviewPlayer = document.getElementById("audioPreviewPlayer");
        if (audioPreviewContainer) {
            audioPreviewContainer.classList.add("hidden");
        }
        if (audioPreviewPlayer) {
            try {
                audioPreviewPlayer.pause();
                audioPreviewPlayer.removeAttribute("src");
                audioPreviewPlayer.load();
            } catch (e) {}
        }

        // Clear text prompt input & character counter
        if (textPromptInput) {
            textPromptInput.value = "";
        }
        if (charCounter) {
            charCounter.textContent = "0 characters";
        }

        // Reset dropzone styles
        if (dropZone) {
            dropZone.classList.remove("dragover");
        }
    };

    dropZone.addEventListener("click", (e) => {
        if (e.target !== clearFileBtn && !clearFileBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function detectModalityFromFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext)) {
            return "image";
        }
        if (file.type.startsWith("video/") || ["mp4", "avi", "mov"].includes(ext)) {
            return "video";
        }
        if (file.type.startsWith("audio/") || ["wav", "mp3", "ogg"].includes(ext)) {
            return "audio";
        }
        if (file.type.startsWith("text/") || ["txt"].includes(ext)) {
            return "text";
        }
        return "all";
    }

    function handleFileSelection(file) {
        if (file.size > 200 * 1024 * 1024) {
            window.showToast("File exceeds maximum allowed size of 200 MB", "error");
            return;
        }
        currentFile = file;
        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = formatBytes(file.size);
        selectedFileInfo.classList.remove("hidden");

        const ext = file.name.split('.').pop().toLowerCase();
        const fileModality = detectModalityFromFile(file);

        // If user selected a specific modality, that takes priority; otherwise use file modality
        const effectiveModality = (activeSelectedModality !== "all") ? activeSelectedModality : fileModality;
        window.applyModalityHoverIcon(effectiveModality);

        const isImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext);
        const isVideo = file.type.startsWith("video/") || ["mp4", "avi", "mov"].includes(ext);
        const isAudio = file.type.startsWith("audio/") || ["wav", "mp3", "ogg"].includes(ext);

        const videoPreviewContainer = document.getElementById("videoPreviewContainer");
        const videoPreviewPlayer = document.getElementById("videoPreviewPlayer");
        const videoPreviewFormat = document.getElementById("videoPreviewFormat");
        const audioPreviewContainer = document.getElementById("audioPreviewContainer");
        const audioPreviewPlayer = document.getElementById("audioPreviewPlayer");

        // Hide all previews first
        if (imagePreviewContainer) imagePreviewContainer.classList.add("hidden");
        if (videoPreviewContainer) videoPreviewContainer.classList.add("hidden");
        if (audioPreviewContainer) audioPreviewContainer.classList.add("hidden");

        if (isImage && imagePreviewContainer && imagePreviewThumb) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (imagePreviewDims) imagePreviewDims.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                    if (imagePreviewFormat) imagePreviewFormat.textContent = ext.toUpperCase();
                };
                img.src = e.target.result;
                imagePreviewThumb.src = e.target.result;
                imagePreviewContainer.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        } else if (isVideo && videoPreviewContainer && videoPreviewPlayer) {
            const videoUrl = URL.createObjectURL(file);
            videoPreviewPlayer.src = videoUrl;
            if (videoPreviewFormat) videoPreviewFormat.textContent = ext.toUpperCase();
            videoPreviewContainer.classList.remove("hidden");
        } else if (isAudio && audioPreviewContainer && audioPreviewPlayer) {
            const audioUrl = URL.createObjectURL(file);
            audioPreviewPlayer.src = audioUrl;
            audioPreviewContainer.classList.remove("hidden");
        }

        window.showToast(`Selected: ${file.name}`, "info");
    }

    clearFileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.clearUploadedFile();
    });

    // Character Counter for Text Prompt
    textPromptInput.addEventListener("input", () => {
        charCounter.textContent = `${textPromptInput.value.length} characters`;
    });

    // Modality Pill Selector
    const modePills = document.querySelectorAll(".mode-pill");
    modePills.forEach(pill => {
        pill.addEventListener("click", () => {
            modePills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            const mode = pill.dataset.mode || "all";
            activeSelectedModality = mode;
            const config = MODALITY_MAP[mode] || MODALITY_MAP.all;

            if (mode === "text") {
                dropZone.classList.add("hidden");
            } else {
                dropZone.classList.remove("hidden");
            }

            if (config.accept) {
                fileInput.accept = config.accept;
            }

            // Immediately update modality hover icons for the selected modality
            window.applyModalityHoverIcon(mode);
        });
    });

    // Run Multimodal Analysis
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressPercentage = document.getElementById("progressPercentage");
    const progressStatusText = document.getElementById("progressStatusText");

    startAnalysisBtn.addEventListener("click", async () => {
        // Enforce Guest Mode 2-analysis quota limit
        if (window.isGuestLimitReached && window.isGuestLimitReached()) {
            window.showGuestLimitModal(false);
            return;
        }

        const textContent = textPromptInput.value.trim();
        if (!currentFile && !textContent) {
            window.showToast("Please provide a media file or text content to begin analysis.", "error");
            return;
        }

        const formData = new FormData();
        if (currentFile) {
            formData.append("file", currentFile);
        }
        if (textContent) {
            formData.append("text_input", textContent);
        }

        // Show progress UI with skeleton loader
        progressContainer.classList.remove("hidden");
        startAnalysisBtn.disabled = true;
        progressBar.style.width = "20%";
        progressPercentage.textContent = "20%";
        progressStatusText.textContent = "Uploading media and demuxing audio/visual streams...";

        let simProgress = 20;
        const progressTimer = setInterval(() => {
            if (simProgress < 85) {
                simProgress += 10;
                progressBar.style.width = `${simProgress}%`;
                progressPercentage.textContent = `${simProgress}%`;
                if (simProgress === 40) progressStatusText.textContent = "Running motion-adaptive frame sampling & face quality filtering...";
                if (simProgress === 60) progressStatusText.textContent = "Generating Test-Time Augmentation (TTA) Grad-CAM activations...";
                if (simProgress === 80) progressStatusText.textContent = "Executing VAD silence removal & cross-modal sync check...";
            }
        }, 350);

        // Prepare headers (including Auth token if available)
        const headers = {};
        const token = window.getAuthToken ? window.getAuthToken() : null;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const resp = await fetch("/api/analyze/upload", {
                method: "POST",
                headers: headers,
                body: formData
            });

            clearInterval(progressTimer);

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.detail || "Analysis request failed.");
            }

            progressBar.style.width = "100%";
            progressPercentage.textContent = "100%";
            progressStatusText.textContent = "Calibrating decision & generating report...";

            const analysisData = await resp.json();

            setTimeout(() => {
                progressContainer.classList.add("hidden");
                startAnalysisBtn.disabled = false;
                progressBar.style.width = "0%";

                window.showToast("Multimodal analysis completed.", "success");
                window.renderResults(analysisData);
                window.switchTab("results-tab");

                // Check and increment guest scan count
                if (window.isGuestMode && window.isGuestMode()) {
                    const count = window.incrementGuestScanCount();
                    if (count >= 2) {
                        setTimeout(() => {
                            window.showGuestLimitModal(true);
                        }, 1200);
                    }
                }
            }, 600);

        } catch (err) {
            clearInterval(progressTimer);
            progressContainer.classList.add("hidden");
            startAnalysisBtn.disabled = false;
            window.showToast(`Analysis failed: ${err.message}`, "error");
        }
    });

    document.getElementById("backToUploadBtn").addEventListener("click", () => {
        window.switchTab("upload-tab");
    });
});
