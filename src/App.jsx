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
  
  const [allPlaylistVideos, setAllPlaylistVideos] = useState([]);
  const [playlistVideos, setPlaylistVideos] = useState([]); // Currently visible slice
  const [isFetchingPlaylistVideos, setIsFetchingPlaylistVideos] = useState(false);
  const [isBatchingSummaries, setIsBatchingSummaries] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Pagination state
  const ITEMS_PER_PAGE = 18;
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchAllVideos = async (playlist) => {
    setAllPlaylistVideos([]);
    setPlaylistVideos([]);
    setSummaries({});
    setError(null);
    setCurrentPage(1);
    setIsFetchingPlaylistVideos(true);

    try {
      const res = await getPlaylistVideos({ 
        playlistUrl: `https://www.youtube.com/playlist?list=${playlist.playlistId}`
      });
      
      const videos = res.data.videos || [];
      setAllPlaylistVideos(videos);
      setIsFetchingPlaylistVideos(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process playlist.");
      setIsFetchingPlaylistVideos(false);
    }
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    fetchAllVideos(playlist);
  };

  const sortedAllVideos = useMemo(() => {
    return [...allPlaylistVideos].sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [allPlaylistVideos, sortOrder]);

  const totalPages = Math.ceil(sortedAllVideos.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (sortedAllVideos.length === 0) return;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const visibleSlice = sortedAllVideos.slice(startIdx, endIdx);
    
    setPlaylistVideos(visibleSlice);

    // Check if we need to fetch batch summaries for this slice
    const unsummarized = visibleSlice.filter(v => !summaries[v.videoId]);
    
    if (unsummarized.length > 0) {
      const initialSummaries = {};
      unsummarized.forEach(v => {
        initialSummaries[v.videoId] = { status: 'loading', shortSummary: null, longSummary: null };
      });
      
      setSummaries(prev => ({ ...prev, ...initialSummaries }));
      setIsBatchingSummaries(true);

      batchShortSummaries({ videos: unsummarized.map(v => ({ videoId: v.videoId, title: v.title })) })
        .then(batchRes => {
          const shortMap = batchRes.data || {};
          setSummaries(prev => {
            const next = { ...prev };
            unsummarized.forEach(v => {
              if (shortMap[v.videoId]) {
                next[v.videoId] = { ...next[v.videoId], status: 'idle', shortSummary: shortMap[v.videoId] };
              } else {
                next[v.videoId] = { ...next[v.videoId], status: 'error' };
              }
            });
            return next;
          });
        })
        .catch(batchErr => {
          console.error("Batch summary failed:", batchErr);
          setSummaries(prev => {
             const next = { ...prev };
             unsummarized.forEach(v => { next[v.videoId] = { ...next[v.videoId], status: 'error' }; });
             return next;
          });
        })
        .finally(() => {
          setIsBatchingSummaries(false);
        });
    }
  }, [sortedAllVideos, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
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
                  <span className="results-count">Total: {sortedAllVideos.length} videos (Page {currentPage} of {totalPages})</span>
                  <div className="sort-control">
                    <label htmlFor="sort">Sort by:</label>
                    <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
                
                <div className="bento-grid">
                  {playlistVideos.map((video) => (
                    <SummaryCard 
                      key={video.videoId} 
                      video={video} 
                      summaryData={summaries[video.videoId] || {}}
                      onSummarize={() => handleSummarizeVideo(video)}
                    />
                  ))}
                </div>
                
                <div className="pagination-controls">
                  <button 
                    className="submit-btn" 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1 || isBatchingSummaries}
                  >
                    Previous
                  </button>
                  <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                  <button 
                    className="submit-btn" 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages || isBatchingSummaries}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
