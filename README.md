# Visualizer Project Documentation

# Song Lyric Visualizer Project

A documentation of developing a song lyric visualizer, initially conceived as an interface for user interaction with *Isaiah*.

## Initial Development

1. Created a [p5 canvas](https://mickeykorea.github.io/visualizer/p5) as the foundation
- Required time-stamped lyric JSON file for visualization
- Utilized [Lyricstify](https://www.lyricsify.com/) for time-stamped lyrics and JSON conversion

## Technical Evolution

1. Migrated from P5.js to pure [JavaScript canvas](https://mickeykorea.github.io/visualizer/) for performance optimization

### Planned Features:

- **Spotify API Integration**
- Search functionality for songs
- Track ID retrieval via Spotify API endpoint
- **Lyricstify API Integration**
- Time-stamped lyric retrieval using track IDs
- **Visual Component**

## Implementation Challenges

### First Attempt: Direct API Integration

```jsx
const LYRICSTIFY_API = 'https://api.lyricstify.vercel.app/v1/lyrics';
```

**Issue:** CORS error prevented direct API access from local development server

### Second Attempt: CORS Proxy Solution

```jsx
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
```

**Issues:**

- Rate limiting resulted in 429 errors
- Retry logic and exponential backoff proved insufficient

## Technical Discovery

Investigation of Lyricstify GitHub revealed:

- Tool is primarily CLI-based
- Requires individual Spotify Developer credentials
- Local configuration necessary - incompatible with web app architecture

## Alternative Solutions Explored

### Local Server Approach

- Local Lyricstify implementation
- localhost:3000 API endpoint
- Limitation: GitHub Pages hosting incompatibility

### Backend Service Approach

- Separate backend service implementation
- Server-side API and authentication handling
- Drawback: Server maintenance requirements

## Key Learnings

The core challenge stems from Lyricstify's design as a personal CLI tool rather than a public web service. The API endpoint's rate limitations and browser access restrictions made direct integration unfeasible.
