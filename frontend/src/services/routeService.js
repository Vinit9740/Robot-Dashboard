import { supabase } from './supabaseClient';

/**
 * Checks if a route with the same name already exists on this map.
 * @param {string} mapId - UUID of the parent map
 * @param {string} name  - Route name to check
 * @returns {Promise<Object|null>} Existing route row, or null
 */
const findExistingRoute = async (mapId, name) => {
    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('map_id', mapId)
        .eq('name', name)
        .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
};

/**
 * Saves a new route to the `routes` table, or returns the existing one
 * if a route with the same name already exists on this map.
 * @param {string} mapId - UUID of the parent map
 * @param {string} orgId - Organization UUID
 * @param {string} name - Route name
 * @param {Array<{x:number, y:number}>} path - Array of waypoint coordinates
 * @returns {Promise<{route: Object, alreadyExisted: boolean}>}
 */
export const createRoute = async (mapId, orgId, name, path) => {
    // Check for duplicate by name on this map
    const existing = await findExistingRoute(mapId, name);
    if (existing) {
        return { route: existing, alreadyExisted: true };
    }

    const { data, error } = await supabase
        .from('routes')
        .insert({
            map_id: mapId,
            org_id: orgId,
            name,
            path_json: path,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to save route: ${error.message}`);
    return { route: data, alreadyExisted: false };
};

/**
 * Fetches all routes for a specific map.
 * @param {string} mapId - UUID of the parent map
 * @returns {Promise<Array>} List of route rows
 */
export const getRoutesByMap = async (mapId) => {
    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('map_id', mapId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    return data || [];
};

/**
 * Deletes a route by its ID.
 * Also deletes any missions that reference this route (foreign key).
 * @param {string} routeId - UUID of the route to delete
 */
export const deleteRoute = async (routeId) => {
    // Delete missions referencing this route first (foreign key constraint)
    await supabase
        .from('missions')
        .delete()
        .eq('route_id', routeId);

    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

    if (error) throw new Error(`Failed to delete route: ${error.message}`);
};
