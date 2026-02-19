# Deployment Guide

This game is a static HTML5 application and can be easily deployed to any static site hosting service like Vercel, Netlify, or GitHub Pages.

## Deploying to Vercel (Recommended)

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel](https://vercel.com/).
3. Click "New Project".
4. Import your repository.
5. In the configuration:
   - **Framework Preset:** Other
   - **Root Directory:** (leave empty / root)
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty / root)
6. Click "Deploy".

## Local Development

To run the game locally, you can use any simple HTTP server. For example with Python:

```bash
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.
