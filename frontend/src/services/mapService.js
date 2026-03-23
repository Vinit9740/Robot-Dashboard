import { supabase } from './supabaseClient';

const BUCKET = 'maps';

/**
 * Uploads a map image to Supabase Storage and saves metadata to the `maps` table.
 * @param {File} file - PNG/JPEG image file
 * @param {string|number} orgId - Organization ID (can be integer or string)
 * @param {string} name - Friendly map name
 * @returns {Promise<Object>} Inserted map row
 */
export const uploadMap = async (file, orgId, name) => {
    if (!orgId) throw new Error('No organization ID available. Ensure you are logged in.');

    const orgIdStr = String(orgId);
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${orgIdStr}/${Date.now()}.${ext}`;

    // 1. Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
        // Provide a more helpful error message based on the error code
        if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
            throw new Error(
                'Storage bucket "maps" not found. Create it in Supabase Dashboard → Storage → New Bucket → name: "maps", set Public ON.'
            );
        }
        if (uploadError.statusCode === '403' || uploadError.message?.includes('policy')) {
            throw new Error(
                'Storage permission denied. Make sure the "maps" bucket is set to Public in Supabase Storage settings.'
            );
        }
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get the public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const imageUrl = urlData.publicUrl;

    // 3. Get image dimensions by loading it in the browser
    const dimensions = await getImageDimensions(imageUrl);

    // 4. Insert map metadata into the database
    const { data, error: dbError } = await supabase
        .from('maps')
        .insert({
            org_id: orgIdStr,   // stored as text to match both integer and uuid org_ids
            name,
            image_url: imageUrl,
            width: dimensions.width,
            height: dimensions.height,
            scale: 1.0,
        })
        .select()
        .single();

    if (dbError) {
        if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
            throw new Error(
                'Table "maps" not found in database. Run the SQL setup script in Supabase SQL Editor:\ndatabase/supabase_mission_setup.sql'
            );
        }
        throw new Error(`Database error: ${dbError.message}`);
    }

    return data;
};

/**
 * Fetches all maps for an organization.
 * @param {string|number} orgId - Organization ID
 */
export const getMaps = async (orgId) => {
    if (!orgId) return [];

    const { data, error } = await supabase
        .from('maps')
        .select('*')
        .eq('org_id', String(orgId))
        .order('created_at', { ascending: false });

    // If table doesn't exist yet, return empty instead of crashing
    if (error) {
        console.warn('mapService.getMaps:', error.message);
        return [];
    }
    return data || [];
};

// Helper: load image to extract its natural dimensions
const getImageDimensions = (url) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 800, height: 600 }); // safe fallback
        img.src = url;
    });
