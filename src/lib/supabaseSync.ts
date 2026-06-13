import { supabase } from './supabase';
import { useStore } from '../store';

let isSyncing = false;

// Simple fire-and-forget sync function for matches
export async function syncMatchesToCloud() {
  if (isSyncing) return;
  isSyncing = true;
  
  try {
    const { matches } = useStore.getState();
    if (!matches || matches.length === 0) return;

    // Convert to a format suitable for Supabase (store complex objects as JSON)
    const matchesData = matches.map(m => ({
      id: m.id,
      team_a: m.teamA,
      team_b: m.teamB,
      status: m.status,
      winner: m.winner,
      data: m // Assuming a JSONB column `data` in Supabase
    }));

    // In a real scenario, you'd upsert this into a 'matches' table
    // For now, we perform the call. This assumes the table `matches` exists with an `id` primary key.
    const { error } = await supabase
      .from('matches')
      .upsert(matchesData, { onConflict: 'id' });

    if (error) {
      console.error('Supabase Sync Error:', error.message);
    } else {
      console.log('Successfully synced matches to Supabase');
    }
  } catch (err) {
    console.error('Failed to sync to cloud:', err);
  } finally {
    isSyncing = false;
  }
}
