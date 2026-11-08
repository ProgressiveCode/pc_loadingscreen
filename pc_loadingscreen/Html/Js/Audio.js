'use strict';

window.LoadingScreenAudio = (() => {
    const STORAGE_PREFIX = 'pc_loadingscreen_';

    function clamp(value, minimum, maximum, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(maximum, Math.max(minimum, number));
    }

    function readStorage(key, fallback) {
        try {
            const value = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return value === null ? fallback : value;
        } catch (_error) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(value));
        } catch (_error) {
        }
    }

    function normalizePlaylist(config) {
        const configuredTracks = Array.isArray(config.tracks)
            ? config.tracks
            : (config.src ? [{
                id: 'default-track',
                title: config.title || 'Background music',
                artist: config.artist || '',
                src: config.src,
            }] : []);

        const usedIds = new Set();

        return configuredTracks.reduce((tracks, item, index) => {
            if (!item || typeof item.src !== 'string' || !item.src.trim()) {
                return tracks;
            }

            const baseId = String(item.id || `track-${index + 1}`)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, '-') || `track-${index + 1}`;

            let id = baseId;
            let duplicateIndex = 2;

            while (usedIds.has(id)) {
                id = `${baseId}-${duplicateIndex}`;
                duplicateIndex += 1;
            }

            usedIds.add(id);
            tracks.push({
                id,
                title: String(item.title || `Track ${index + 1}`),
                artist: String(item.artist || ''),
                src: item.src.trim(),
            });

            return tracks;
        }, []);
    }

    function create(config, elements) {
        const player = elements.player;
        const audio = elements.audio;
        const playButton = elements.playButton;
        const previousButton = elements.previousButton;
        const nextButton = elements.nextButton;
        const trackSelect = elements.trackSelect;
        const trackArtist = elements.trackArtist;
        const volumeSlider = elements.volumeSlider;
        const playlist = normalizePlaylist(config || {});

        let activeIndex = 0;
        let isStopped = false;

        if (!player || !audio || config.enabled === false || playlist.length === 0) {
            if (player) {
                player.hidden = true;
            }

            return {
                stop() {},
            };
        }

        const rememberTrack = config.rememberSelection !== false;
        const rememberVolume = config.rememberVolume !== false;
        const defaultVolume = clamp(config.volume, 0, 1, 0.25);
        const savedVolume = rememberVolume
            ? readStorage('volume', String(defaultVolume))
            : defaultVolume;
        const initialVolume = clamp(savedVolume, 0, 1, defaultVolume);

        audio.preload = 'none';
        audio.loop = config.loop !== false;
        audio.volume = initialVolume;
        audio.setAttribute('aria-label', 'Loading screen background music');

        volumeSlider.value = String(initialVolume);

        // Build the selector directly from the configured playlist.
        trackSelect.replaceChildren();

        playlist.forEach((track) => {
            const option = document.createElement('option');
            option.value = track.id;
            option.textContent = track.title;
            trackSelect.append(option);
        });

        const configuredTrack = String(config.selectedTrack || config.startTrack || '');
        const rememberedTrack = rememberTrack ? readStorage('track', '') : '';
        const preferredTrack = playlist.findIndex(track => track.id === rememberedTrack) >= 0
            ? rememberedTrack
            : configuredTrack;
        const preferredIndex = playlist.findIndex(track => track.id === preferredTrack);

        activeIndex = preferredIndex >= 0 ? preferredIndex : 0;
        previousButton.disabled = playlist.length < 2;
        nextButton.disabled = playlist.length < 2;

        function updateTrackDetails() {
            const track = playlist[activeIndex];

            trackSelect.value = track.id;
            trackArtist.textContent = track.artist;
            playButton.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music');
            playButton.textContent = audio.paused ? '▶' : 'Ⅱ';
        }

        function persistTrack() {
            if (rememberTrack) {
                writeStorage('track', playlist[activeIndex].id);
            }
        }

        function setTrack(index, options = {}) {
            if (isStopped || playlist.length === 0) {
                return;
            }

            const wasPlaying = !audio.paused;
            const nextIndex = (index + playlist.length) % playlist.length;

            if (nextIndex === activeIndex && audio.src) {
                return;
            }

            activeIndex = nextIndex;
            audio.pause();
            audio.src = playlist[activeIndex].src;
            audio.load();

            persistTrack();
            updateTrackDetails();

            const shouldPlay = options.autoplay === true || (options.preservePlayback !== false && wasPlaying);

            if (shouldPlay) {
                audio.play().then(updateTrackDetails).catch(() => {
                    trackArtist.textContent = 'Autoplay blocked · press Play to start';
                    updateTrackDetailsAfterFailure();
                });
            }
        }

        function updateTrackDetailsAfterFailure() {
            playButton.textContent = '▶';
            playButton.setAttribute('aria-label', 'Play music');
        }

        async function togglePlayback() {
            if (isStopped) {
                return;
            }

            if (!audio.paused) {
                audio.pause();
                updateTrackDetails();
                return;
            }

            try {
                await audio.play();
                updateTrackDetails();
            } catch (_error) {
                trackArtist.textContent = 'Audio unavailable · check the configured file';
                updateTrackDetailsAfterFailure();
            }
        }

        playButton.addEventListener('click', togglePlayback);
        previousButton.addEventListener('click', () => setTrack(activeIndex - 1));
        nextButton.addEventListener('click', () => setTrack(activeIndex + 1));
        trackSelect.addEventListener('change', () => {
            const selectedIndex = playlist.findIndex(track => track.id === trackSelect.value);

            if (selectedIndex >= 0) {
                setTrack(selectedIndex);
            }
        });

        volumeSlider.addEventListener('input', () => {
            audio.volume = clamp(volumeSlider.value, 0, 1, defaultVolume);

            if (rememberVolume) {
                writeStorage('volume', audio.volume);
            }
        });

        audio.addEventListener('play', updateTrackDetails);
        audio.addEventListener('pause', updateTrackDetails);
        audio.addEventListener('ended', updateTrackDetails);
        audio.addEventListener('error', () => {
            if (!isStopped) {
                trackArtist.textContent = 'Audio unavailable · check the configured file';
                updateTrackDetailsAfterFailure();
            }
        });

        audio.src = playlist[activeIndex].src;
        updateTrackDetails();
        persistTrack();

        if (config.autoplay === true) {
            audio.play().then(updateTrackDetails).catch(() => {
                trackArtist.textContent = 'Autoplay blocked · press Play to start';
                updateTrackDetailsAfterFailure();
            });
        }

        return {
            toggle: togglePlayback,
            stop() {
                if (isStopped) {
                    return;
                }

                isStopped = true;
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
            },
        };
    }

    return { create };
})();