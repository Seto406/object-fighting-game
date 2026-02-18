# Deployment Guide

This game is a static HTML5 application and can be easily deployed to any static site hosting service like Netlify, Vercel, or GitHub Pages.

## Deploying to Netlify (Recommended)

### Method 1: Drag and Drop (No Git required)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag the entire project folder onto the page.
3. Your game will be live in seconds!

### Method 2: Git Integration
1. Push this repository to GitHub.
2. Log in to [Netlify](https://app.netlify.com/).
3. Click "New site from Git".
4. Select your repository.
5. In the build settings:
   - **Base directory:** (leave empty)
   - **Publish directory:** `.` (root)
6. Click "Deploy site".

## Local Development

To run the game locally, you can use any simple HTTP server. For example with Python:

```bash
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.
