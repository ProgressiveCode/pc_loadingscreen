'use strict';

(() => {
    const CONFIG = window.LoadingScreenConfig || {};

    const TEXT = CONFIG.text || {};

    const BACKGROUND = CONFIG.background || {};

    const BRAND = CONFIG.brand || {};

    const $ = (id) => document.getElementById(id);

    const timers = new Set();

    let isClosed = false;

    let progressValue = 0;

    let lastProgressAt = Date.now();

    let activeChapter = 0;

    let returnFocusElement = null;

    const startTime = Date.now();

    const previewMode = new URLSearchParams(window.location.search).get('preview') === '1';

    function setText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent = String(value ?? '');
        }
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function clamp(value, minimum, maximum, fallback = minimum) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(maximum, Math.max(minimum, number));
    }

    function addTimer(timerId) {
        timers.add(timerId);
        
        return timerId;
    }

    function clearTimers() {
        timers.forEach((timerId) => {
            window.clearInterval(timerId);
            
            window.clearTimeout(timerId);
        });

        timers.clear();
    }

    function readPreference(key, fallback) {
        try {
            const value = window.localStorage.getItem(`pc_loadingscreen_${key}`);
            
            return value === null ? fallback : value;
        } catch (_error) {
            return fallback;
        }
    }

    function savePreference(key, value) {
        try {
            window.localStorage.setItem(`pc_loadingscreen_${key}`, String(value));
        } catch (_error) {
        }
    }

    function applyBranding() {
        const accent = /^#[0-9a-f]{6}$/i.test(CONFIG.accent)
            ? CONFIG.accent
            : '#d8b780';

        document.documentElement.style.setProperty('--gold', accent);

        setText('brand', BRAND.name || 'YOUR SERVER');
        
        setText('subtitle', BRAND.subtitle || 'ROLEPLAY COMMUNITY');
        
        setText('seal', BRAND.initials || 'PC');
        
        setText('heading-a', asArray(CONFIG.headline)[0] || 'Every stranger.');
        
        setText('heading-b', asArray(CONFIG.headline)[1] || 'A new story.');
        
        setText('introduction', CONFIG.introduction || 'Your next chapter starts here.');
        
        setText('ticket-label', TEXT.ticket || 'FRONTIER PASSAGE');
        
        setText('destination', BRAND.destination || BRAND.name || 'A new beginning');
        
        setText('status', TEXT.waiting || 'Preparing your arrival');
        
        setText('detail', TEXT.progressWaiting || 'Waiting for loading data');

        if (BACKGROUND.image) {
            $('landscape').style.backgroundImage = `url(${JSON.stringify(BACKGROUND.image)})`;
        }

        if (BRAND.logo) {
            const logo = $('logo');
            
            const seal = $('seal');

            logo.addEventListener('error', () => {
                logo.hidden = true;
                
                seal.hidden = false;
            }, { once: true });

            logo.src = BRAND.logo;

            logo.hidden = false;

            seal.hidden = true;
        }

        applyHandoverData();

        buildCommunityLinks();
    }

    function applyHandoverData() {
        let handoverRoot = window.nuiHandoverData || {};

        if (typeof handoverRoot === 'string') {
            try {
                handoverRoot = JSON.parse(handoverRoot);
            } catch (_error) {
                handoverRoot = {};
            }
        }

        if (!handoverRoot || typeof handoverRoot !== 'object') {
            handoverRoot = {};
        }

        const handover = {
            ...handoverRoot,
            ...(handoverRoot.pc_loading && typeof handoverRoot.pc_loading === 'object'
                ? handoverRoot.pc_loading
                : {}),
        };

        const passengerName = typeof handover.name === 'string' && handover.name.trim()
            ? handover.name.trim().slice(0, 80)
            
            : (TEXT.traveller || 'Traveller');

        setText('passenger', passengerName);

        const population = Number(handover.population);
        
        const capacity = Number(handover.capacity);

        if (Number.isFinite(population) && Number.isFinite(capacity) && capacity > 0) {
            const populationElement = $('population');
            
            const label = document.createTextNode('AT CONNECTION');
            
            const value = document.createElement('strong');

            value.textContent = `${population} / ${capacity}`;
            
            populationElement.replaceChildren(label, value);
            
            populationElement.hidden = false;
        }
    }

    function buildCommunityLinks() {
        const container = $('links');
        container.replaceChildren();

        asArray(CONFIG.links).forEach((link) => {
            if (!link || typeof link.url !== 'string' || !link.url.trim()) {
                return;
            }

            try {
                const url = new URL(link.url);

                if (url.protocol !== 'https:') {
                    return;
                }

                const anchor = document.createElement('a');

                anchor.textContent = String(link.label || 'Open link');
                anchor.href = url.href;
                anchor.style.cursor = 'pointer';

                anchor.addEventListener('click', (event) => {
                    event.preventDefault();

                    if (typeof window.invokeNative === 'function') {
                        window.invokeNative('openUrl', url.href);
                    } else {
                        console.error('[Progressive Code] invokeNative is unavailable.');
                    }
                });

                container.append(anchor);

            } catch (_error) {
            }
        });
    }

    function closePanel() {
        $('dialog-layer').hidden = true;

        if (returnFocusElement?.isConnected) {
            returnFocusElement.focus();
        }
    }

    function openPanel(panelKey, sourceButton) {
        const entries = asArray(CONFIG[panelKey]);

        if (entries.length === 0) {
            return;
        }

        returnFocusElement = sourceButton || null;
        
        setText('dialog-title', TEXT[panelKey] || panelKey);

        const content = $('dialog-content');
        
        content.replaceChildren();

        entries.forEach((entry) => {
            if (!entry || typeof entry !== 'object') {
                return;
            }

            const article = document.createElement('article');
            
            const heading = document.createElement('h3');
            
            const paragraph = document.createElement('p');

            article.className = 'journal-entry';
            
            heading.textContent = String(entry.title || '');
            
            paragraph.textContent = String(entry.text || '');

            article.append(heading, paragraph);
            
            content.append(article);
        });

        $('dialog-layer').hidden = false;
        
        $('dialog-close').focus();
    }

    function bindInformationPanels() {
        document.querySelectorAll('[data-panel]').forEach((button) => {
            const panelKey = button.dataset.panel;
            
            const entries = asArray(CONFIG[panelKey]);

            button.hidden = entries.length === 0;

            if (button.closest('nav')) {
                button.textContent = TEXT[panelKey] || button.textContent;
            }

            button.addEventListener('click', () => openPanel(panelKey, button));
        });

        $('dialog-close').addEventListener('click', closePanel);

        $('dialog-layer').addEventListener('click', (event) => {
            if (event.target === $('dialog-layer')) {
                closePanel();
            }
        });
    }

    function handleDialogKeyboard(event) {
        if ($('dialog-layer').hidden) {
            return false;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            
            closePanel();
            
            return true;
        }

        if (event.key === 'Tab') {
            const focusable = Array.from(
                $('dialog-layer').querySelectorAll(
                    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            ).filter(element => !element.hidden);

            if (focusable.length === 0) {
                event.preventDefault();

                return true;
            }

            const first = focusable[0];

            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();

                last.focus();      
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();

                first.focus();
            }
        }

        return true;
    }

    const chapters = asArray(CONFIG.slides).filter((chapter) => (
        chapter && typeof chapter === 'object'
    ));

    function showChapter(index) {
        if (chapters.length === 0) {
            document.querySelector('.dispatch').hidden = true;
            
            return;
        }

        activeChapter = (index + chapters.length) % chapters.length;
        
        const chapter = chapters[activeChapter];

        setText(
            'chapter-number',
            
            `${String(activeChapter + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`
        );
        
        setText('chapter-label', chapter.label || '');
        
        setText('chapter-title', chapter.title || '');
        
        setText('chapter-text', chapter.text || '');
    }

    function bindChapters() {
        const previousButton = $('previous');
        
        const nextButton = $('next');

        previousButton.addEventListener('click', () => showChapter(activeChapter - 1));
        
        nextButton.addEventListener('click', () => showChapter(activeChapter + 1));

        previousButton.disabled = chapters.length < 2;
        
        nextButton.disabled = chapters.length < 2;

        showChapter(0);
    }

    const film = $('film');

    function setMotionReduced(reduced) {
        document.body.classList.toggle('reduced', reduced);
        
        $('motion').setAttribute('aria-pressed', String(reduced));
        
        $('motion').textContent = reduced ? 'Enable motion' : 'Reduce motion';

        if (reduced) {
            film.pause();
            
            return;
        }

        if (BACKGROUND.video) {
            film.hidden = false;
            
            film.play().catch(() => {
                film.hidden = true;
            });
        }
    }

    function bindMotionControls() {
        const systemPrefersReducedMotion = window.matchMedia
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false;
        
        const defaultReduced = BACKGROUND.motion === false || systemPrefersReducedMotion;
        
        const savedReduced = readPreference('reduced', String(defaultReduced)) === 'true';

        $('motion').addEventListener('click', () => {
            const shouldReduce = !document.body.classList.contains('reduced');
            
            savePreference('reduced', shouldReduce);
            
            setMotionReduced(shouldReduce);
        });

        if (BACKGROUND.video) {
            film.addEventListener('error', () => {
                film.hidden = true;
            }, { once: true });

            film.src = BACKGROUND.video;
        }

        setMotionReduced(savedReduced);

        if (!BACKGROUND.video || savedReduced) {
            return;
        }

        film.hidden = false;
        
        film.play().catch(() => {
            film.hidden = true;
        });
    }

    const audioController = window.LoadingScreenAudio?.create(CONFIG.music || {}, {
        player: $('audio-player'),
        
        audio: $('music'),
        
        playButton: $('audio-toggle'),
        
        previousButton: $('track-previous'),
        
        nextButton: $('track-next'),
        
        trackSelect: $('track-select'),
        
        trackArtist: $('artist'),
        
        volumeSlider: $('volume'),
    }) || { stop() {} };

    document.addEventListener('keydown', (event) => {
        if (handleDialogKeyboard(event)) {
            return;
        }

        const activeTag = document.activeElement?.tagName;
        
        const isInteractive = ['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA'].includes(activeTag);

        if (event.code === 'Space' && !isInteractive && !isClosed) {
            event.preventDefault();
            
            audioController.toggle?.();
        }
    });

    function setProgress(nextValue) {
        if (isClosed || typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
            return;
        }

        progressValue = Math.max(progressValue, clamp(nextValue, 0, 1, 0));
        
        lastProgressAt = Date.now();

        const percentage = Math.floor(progressValue * 100);
        
        const completed = progressValue >= 1;

        setText('percent', percentage);
        
        setText('status', completed
            ? (TEXT.finalising || 'Finalising your connection')
            
            : (TEXT.loading || 'Loading the frontier'));
        
        setText('detail', completed
            ? (TEXT.progressComplete || 'Waiting for the game session')
            
            : (TEXT.progressReceiving || 'Receiving world and resource data'));

        $('progress').setAttribute('aria-valuenow', String(percentage));
        
        $('fill').style.width = `${percentage}%`;
        
        $('marker').style.left = `${percentage}%`;
    }

    function handleLoadingMessage(event) {
        const message = event.data;

        if (!message || typeof message !== 'object' || isClosed) {
            return;
        }

        if (message.eventName === 'loadProgress') {
            setProgress(message.loadFraction);
            
            return;
        }

        if (message.eventName === 'pc:status' && typeof message.text === 'string') {
            setText('status', message.text.slice(0, 160));
            
            return;
        }

        if (message.eventName === 'pc:close') {
            finishLoadingScreen(message.fadeMs);
        }
    }

    const rotateEverySeconds = clamp(CONFIG.rotateSeconds, 0, 120, 12);
    
    let nextChapterAt = rotateEverySeconds;

    function updateElapsedTime() {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        const minutes = Math.floor(elapsedSeconds / 60);
        
        const seconds = elapsedSeconds % 60;

        setText(
            'elapsed',
            
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );

        if (
            rotateEverySeconds > 0
            
            && chapters.length > 1
            
            && !document.hidden
            
            && elapsedSeconds >= nextChapterAt
        ) {
            showChapter(activeChapter + 1);
            
            nextChapterAt = elapsedSeconds + rotateEverySeconds;
        }

        if (Date.now() - lastProgressAt > 25000 && progressValue < 1) {
            setText('detail', TEXT.slow || 'Still connecting. Larger resource downloads can take a little longer.');
        }
    }

    addTimer(window.setInterval(updateElapsedTime, 1000));

    function finishLoadingScreen(fadeValue) {
        if (isClosed) {
            return;
        }

        isClosed = true;
        
        clearTimers();
        
        closePanel();
        
        audioController.stop();

        film.pause();
        
        setText('status', TEXT.welcome || 'Welcome to the frontier');

        const fadeMs = clamp(fadeValue, 0, 3000, 900);
        
        $('experience').style.setProperty('--fade', `${fadeMs}ms`);
        
        $('experience').classList.add('exiting');

        addTimer(window.setTimeout(() => {
            $('experience').hidden = true;

            film.removeAttribute('src');
            
            $('music').removeAttribute('src');
            
            film.load();
            
            $('music').load();
        }, fadeMs + 50));
    }

    function cleanup() {
        clearTimers();
        
        audioController.stop();
        
        film.pause();
    }

    window.addEventListener('message', handleLoadingMessage);
    
    window.addEventListener('pagehide', cleanup, { once: true });

    if (previewMode) {
        $('preview-badge').hidden = false;

        let demoProgress = 0;

        addTimer(window.setInterval(() => {
            demoProgress = Math.min(1, demoProgress + 0.025);

            setProgress(demoProgress);
        }, 800));
    }

    applyBranding();

    bindInformationPanels();

    bindChapters();

    bindMotionControls();
})();