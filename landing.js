document.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('click', () => {
        const song = card.dataset.song;
        window.location.href = `visualizer.html?song=${song}`;
    });
});