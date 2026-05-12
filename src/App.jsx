import React, { useState, useMemo } from 'react';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import PlaylistInput from './components/PlaylistInput';
import SummaryCard from './components/SummaryCard';

export default function App() {
  const [isFetchingPlaylist, setIsFetchingPlaylist] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');

  const getPlaylistVideos = httpsCallable(functions, 'getPlaylistVideos');
  const summarizeVideo = httpsCallable(functions, 'summarizeVideo');

  const handleSummarizePlaylist = async (url) => {
    setIsFetchingPlaylist(true);
    setError(null);
    setPlaylistVideos([]);
    setSummaries({});

    try {
      // 1. Fetch playlist videos
      const result = await getPlaylistVideos({ playlistUrl: url });
      const videos = result.data.videos;
      
      if (!videos || videos.length === 0) {
        throw new Error("No videos found in this playlist.");
      }

      setPlaylistVideos(videos);
      
      // Initialize summary statuses
      const initialSummaries = {};
      videos.forEach(v => {
        initialSummaries[v.videoId] = { status: 'idle', data: null };
      });
      setSummaries(initialSummaries);
      setIsFetchingPlaylist(false);

      // WE NO LONGER FIRE ALL REQUESTS AT ONCE DUE TO API RATE LIMITS!
      // Users will click "Summarize" on individual videos.

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process playlist. Please ensure the URL is correct and public.");
      setIsFetchingPlaylist(false);
    }
  };

  const handleSummarizeVideo = async (video) => {
    setSummaries(prev => ({
      ...prev,
      [video.videoId]: { status: 'loading', data: null }
    }));

    try {
      const sumResult = await summarizeVideo({ videoId: video.videoId, title: video.title });
      setSummaries(prev => ({
        ...prev,
        [video.videoId]: { 
          status: 'success', 
          data: sumResult.data 
        }
      }));
    } catch (err) {
      console.error(`Failed to summarize ${video.videoId}:`, err);
      setSummaries(prev => ({
        ...prev,
        [video.videoId]: { status: 'error', data: null }
      }));
    }
  };

  const sortedVideos = useMemo(() => {
    return [...playlistVideos].sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [playlistVideos, sortOrder]);

  return (
    <div className="app-container">
      <header>
        <h1>Auto<span>YT</span>Summarizer</h1>
        <p className="subtitle">
          Instantly generate concise, AI-powered summaries for every video in any public YouTube playlist.
        </p>
      </header>

      <main>
        <PlaylistInput onSubmit={handleSummarizePlaylist} isLoading={isFetchingPlaylist} />
        
        {error && (
          <div className="status-message" style={{ color: 'var(--yt-red)' }}>
            {error}
          </div>
        )}

        {isFetchingPlaylist && !error && (
          <div className="status-message">
            Fetching playlist details...
          </div>
        )}

        {playlistVideos.length > 0 && (
          <div className="results-container">
            <div className="controls-bar">
              <span className="results-count">{playlistVideos.length} videos found</span>
              <div className="sort-control">
                <label htmlFor="sort">Sort by:</label>
                <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            
            <div className="bento-grid">
              {sortedVideos.map((video) => (
                <SummaryCard 
                  key={video.videoId} 
                  video={video} 
                  summary={summaries[video.videoId]?.data}
                  status={summaries[video.videoId]?.status}
                  onSummarize={() => handleSummarizeVideo(video)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
