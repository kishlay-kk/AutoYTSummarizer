import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function PlaylistInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="input-section">
      <form onSubmit={handleSubmit} className="input-wrapper">
        <input
          type="text"
          className="url-input"
          placeholder="Paste YouTube playlist URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="submit-btn"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? (
            <>Processing <Loader2 className="loader-pulse" size={16} /></>
          ) : (
            <>Summarize <ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  );
}
