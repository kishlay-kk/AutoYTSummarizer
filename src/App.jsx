import React, { useState, useMemo, useEffect } from 'react';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import SummaryCard from './components/SummaryCard';
import { ArrowLeft, PlaySquare } from 'lucide-react';
import './App.css';

export default function App() {
  const [playlists, setPlaylists] = useState([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [isFetchingPlaylistVideos, setIsFetchingPlaylistVideos] = useState(false);
  const [summaries, setSummaries] = useState({}); // { videoId: { shortSummary: '', status: 'success', longSummary: null } }
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');

  const getChannelPlaylists = httpsCallable(functions, 'getChannelPlaylists');
  const getPlaylistVideos = httpsCallable(functions, 'getPlaylistVideos');
  const batchShortSummaries = httpsCallable(functions, 'batchShortSummaries');
  const summarizeVideo = httpsCallable(functions, 'summarizeVideo');

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await getChannelPlaylists();
        setPlaylists(res.data.playlists || []);
      } catch (err) {
        console.error("Failed to load playlists:", err);
        setError("Failed to load playlists. Check API key and channel ID.");
      } finally {
        setIsFetchingPlaylists(false);
      }
    };
    fetchPlaylists();
  }, []);

  const handleSelectPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistVideos([]);
    setSummaries({});
    setError(null);
    setIsFetchingPlaylistVideos(true);

    try {
      const res = await getPlaylistVideos({ playlistUrl: `https://www.youtube.com/playlist?list=${playlist.playlistId}` });
      const videos = res.data.videos || [];
      setPlaylistVideos(videos);
      
      const initialSummaries = {};
      videos.forEach(v => {
        initialSummaries[v.videoId] = { status: 'loading', shortSummary: null, longSummary: null };
      });
      setSummaries(initialSummaries);
      setIsFetchingPlaylistVideos(false);

      if (videos.length > 0) {
        // Fetch short summaries in batch
        try {
          const batchRes = await batchShortSummaries({ videos: videos.map(v => ({ videoId: v.videoId, title: v.title })) });
          const shortMap = batchRes.data || {};
          
          setSummaries(prev => {
            const next = { ...prev };
            videos.forEach(v => {
              if (shortMap[v.videoId]) {
                next[v.videoId] = { ...next[v.videoId], status: 'idle', shortSummary: shortMap[v.videoId] };
              } else {
                next[v.videoId] = { ...next[v.videoId], status: 'error' };
              }
            });
            return next;
          });
        } catch (batchErr) {
          console.error("Batch summary failed:", batchErr);
          setSummaries(prev => {
             const next = { ...prev };
             videos.forEach(v => { next[v.videoId] = { ...next[v.videoId], status: 'error' }; });
             return next;
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process playlist.");
      setIsFetchingPlaylistVideos(false);
    }
  };

  const handleSummarizeVideo = async (video) => {
    // This now fetches the LONG summary
    setSummaries(prev => ({
      ...prev,
      [video.videoId]: { ...prev[video.videoId], status: 'loading_long' }
    }));

    try {
      const sumResult = await summarizeVideo({ videoId: video.videoId, title: video.title });
      setSummaries(prev => ({
        ...prev,
        [video.videoId]: { 
          ...prev[video.videoId],
          status: 'success_long', 
          longSummary: sumResult.data.longSummary 
        }
      }));
    } catch (err) {
      console.error(`Failed to fetch long summary ${video.videoId}:`, err);
      // Revert status so user can retry generating long summary
      setSummaries(prev => ({
        ...prev,
        [video.videoId]: { ...prev[video.videoId], status: 'error_long' }
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
          Instantly generate concise, AI-powered summaries for every video in your YouTube playlists.
        </p>
      </header>

      <main>
        {error && (
          <div className="status-message" style={{ color: 'var(--yt-red)' }}>
            {error}
          </div>
        )}

        {!selectedPlaylist ? (
          <div className="dashboard">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Your Playlists</h2>
            {isFetchingPlaylists ? (
              <div className="status-message">
                <div className="loader-pulse"></div> Loading playlists...
              </div>
            ) : playlists.length > 0 ? (
              <div className="bento-grid">
                {playlists.map(pl => (
                  <div key={pl.playlistId} className="bento-card clickable" onClick={() => handleSelectPlaylist(pl)}>
                    <div className="thumbnail-container" style={{ width: '100%', height: '140px', marginBottom: '1rem' }}>
                       {pl.thumbnail ? <img src={pl.thumbnail} alt={pl.title} /> : <PlaySquare size={48} color="var(--yt-red)" />}
                    </div>
                    <h3 className="video-title">{pl.title}</h3>
                    <div className="video-meta">{pl.itemCount} videos</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="status-message">No playlists found.</div>
            )}
          </div>
        ) : (
          <div className="playlist-view">
            <button className="back-btn" onClick={() => setSelectedPlaylist(null)}>
              <ArrowLeft size={16} /> Back to Playlists
            </button>
            <h2 style={{ margin: '1.5rem 0', fontSize: '1.5rem' }}>{selectedPlaylist.title}</h2>
            
            {isFetchingPlaylistVideos && (
               <div className="status-message">
                 <div className="loader-pulse"></div> Loading videos...
               </div>
            )}

            {playlistVideos.length > 0 && (
              <div className="results-container">
                <div className="controls-bar">
                  <span className="results-count">{playlistVideos.length} videos</span>
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
                      summaryData={summaries[video.videoId] || {}}
                      onSummarize={() => handleSummarizeVideo(video)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
