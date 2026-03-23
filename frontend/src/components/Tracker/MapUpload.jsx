import React, { useState } from 'react';
import { uploadMap } from '../../services/mapService';
import './MissionPlanner.css';

/**
 * MapUpload component — renders a file picker + upload trigger.
 * Calls uploadMap() and notifies parent via onMapUploaded().
 */
const MapUpload = ({ orgId, onMapUploaded }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(file.type)) {
            setError('Only PNG/JPEG images are supported.');
            return;
        }

        const name = file.name.replace(/\.[^/.]+$/, ''); // strip extension
        setError(null);
        setUploading(true);

        try {
            const map = await uploadMap(file, orgId, name);
            onMapUploaded(map);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            // Reset the input so re-uploading same file triggers onChange again
            e.target.value = '';
        }
    };

    return (
        <div className="mp-upload-wrapper">
            <label className="mp-upload-btn" title="Upload facility map (PNG / JPEG)">
                <input
                    type="file"
                    accept="image/png,image/jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                {uploading ? (
                    <span className="mp-spinner" />
                ) : (
                    <span>🗺️ Upload Map</span>
                )}
            </label>
            {error && <span className="mp-error-msg">{error}</span>}
        </div>
    );
};

export default MapUpload;
