import { supabase } from './supabaseClient';

/**
 * Creates a new mission record in `pending` state.
 * @param {string} robotId - UUID of the target robot
 * @param {string} routeId - UUID of the assigned route
 * @returns {Promise<Object>} Inserted mission row
 */
export const createMission = async (robotId, routeId) => {
    const { data, error } = await supabase
        .from('missions')
        .insert({
            robot_id: robotId,
            route_id: routeId,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create mission: ${error.message}`);
    return data;
};

/**
 * Transitions a mission to `active` state and records the start time.
 * @param {string} missionId - UUID of the mission to start
 * @returns {Promise<Object>} Updated mission row
 */
export const startMission = async (missionId) => {
    const { data, error } = await supabase
        .from('missions')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', missionId)
        .select()
        .single();

    if (error) throw new Error(`Failed to start mission: ${error.message}`);
    return data;
};

/**
 * Cancels an active or pending mission.
 * @param {string} missionId - UUID of the mission to cancel
 * @returns {Promise<Object>} Updated mission row
 */
export const cancelMission = async (missionId) => {
    const { data, error } = await supabase
        .from('missions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', missionId)
        .select()
        .single();

    if (error) throw new Error(`Failed to cancel mission: ${error.message}`);
    return data;
};
