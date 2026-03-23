import React, { useState } from 'react';

const CameraFeed = ({ robotId }) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const streamUrl = `/api/robot/${robotId}/video-stream`;

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className={`camera-feed glass-card ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="feed-header">
                <h4>📹 Camera Feed</h4>
                <div className="header-actions">
                    <button onClick={() => setIsStreaming(!isStreaming)}>
                        {isStreaming ? 'STOP' : 'START'}
                    </button>
                    <button onClick={toggleFullscreen}>
                        {isFullscreen ? 'Exit Full' : 'Full Screen'}
                    </button>
                </div>
            </div>

            <div className="feed-container">
                {isStreaming ? (
                    <img 
                        src={streamUrl} 
                        alt="Robot Stream" 
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/640x480?text=Stream+Unavailable';
                            console.error('Stream error');
                        }}
                    />
                ) : (
                    <div className="stream-placeholder">
                        <span>Stream Paused</span>
                    </div>
                )}
            </div>

            <style jsx>{`
                .camera-feed {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: all 0.3s ease;
                }
                .camera-feed.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    background: black;
                }
                .feed-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-actions {
                    display: flex;
                    gap: 8px;
                }
                .feed-container {
                    flex: 1;
                    background: #000;
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                }
                .feed-container img {
                    width: 100%;
                    height: auto;
                    max-height: 100%;
                    object-fit: contain;
                }
                .stream-placeholder {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
};

export default CameraFeed;
