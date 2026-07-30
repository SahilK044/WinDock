// Spotify Web API Integration with User Client ID 4409ab99d3a94b939de8791873011d4b

export const SPOTIFY_CLIENT_ID = '4409ab99d3a94b939de8791873011d4b';

class SpotifyService {
  constructor() {
    this.accessToken = localStorage.getItem('spotify_access_token') || null;
    this.tokenExpiry = localStorage.getItem('spotify_token_expiry') || 0;
  }

  // Generate OAuth PKCE authorization URL for user login if token missing
  getAuthUrl() {
    const redirectUri = encodeURIComponent(window.location.origin);
    const scopes = encodeURIComponent(
      'user-read-currently-playing user-read-playback-state user-modify-playback-state'
    );
    return `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}`;
  }

  // Parse token from hash fragment if redirected back
  checkTokenFromUrl() {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = params.get('expires_in');

      if (token) {
        this.accessToken = token;
        this.tokenExpiry = Date.now() + Number(expiresIn) * 1000;
        localStorage.setItem('spotify_access_token', token);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry);
        window.location.hash = '';
      }
    }
  }

  async getCurrentlyPlaying() {
    if (!this.accessToken || Date.now() > this.tokenExpiry) {
      return null;
    }

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (res.status === 204 || res.status > 400) return null;
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Spotify fetch error:', e);
      return null;
    }
  }

  async play() {
    if (!this.accessToken) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } catch (e) {}
  }

  async pause() {
    if (!this.accessToken) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } catch (e) {}
  }

  async next() {
    if (!this.accessToken) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } catch (e) {}
  }

  async previous() {
    if (!this.accessToken) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } catch (e) {}
  }

  async seek(positionMs) {
    if (!this.accessToken) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(positionMs)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } catch (e) {}
  }
}

export const spotifyService = new SpotifyService();
