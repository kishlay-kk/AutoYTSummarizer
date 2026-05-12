import React, { useState } from 'react';
import { PlayCircle, Calendar, X } from 'lucide-react';

export default function SummaryCard({ video, summary, status, onSummarize }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formattedDate = video.publishedAt 
    ? new Date(video.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown Date';

  const handleCardClick = () => {
    if (status === 'success' && summary?.longSummary) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div 
        className={`bento-card ${status === 'success' ? 'clickable' : ''}`} 
        onClick={handleCardClick}
      >
        <div className="card-header">
          <div className="thumbnail-container">
            {video.thumbnail ? (
              <img src={video.thumbnail} alt={video.title} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                <PlayCircle color="var(--yt-red)" />
              </div>
            )}
          </div>
          <div className="video-info">
            <h3 className="video-title" title={video.title}>{video.title}</h3>
            <div className="video-meta">
              <Calendar size={12} /> <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        
        <div className="summary-content">
          {status === 'loading' ? (
            <div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          ) : status === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--yt-red)' }}>Failed to load summary.</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onSummarize(); }} 
                className="submit-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
              >
                Retry
              </button>
            </div>
          ) : status === 'idle' ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onSummarize(); }} 
              className="submit-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', marginTop: '0.5rem' }}
            >
              Generate Summary
            </button>
          ) : (
            summary?.shortSummary || "Summary will appear here..."
          )}
        </div>
        
        {status === 'success' && summary?.longSummary && (
          <div className="read-more-hint">Click to read full summary</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <div className="modal-header">
              <div className="thumbnail-container modal-thumb">
                {video.thumbnail ? <img src={video.thumbnail} alt={video.title} /> : <PlayCircle color="var(--yt-red)" />}
              </div>
              <div>
                <h2 className="modal-title">{video.title}</h2>
                <div className="video-meta">
                  <Calendar size={14} /> <span>{formattedDate}</span>
                </div>
              </div>
            </div>
            <div className="modal-body">
              <div className="short-summary-highlight">
                <strong>TL;DR:</strong> {summary.shortSummary}
              </div>
              <div className="long-summary-text">
                {summary.longSummary.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
