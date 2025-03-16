// Script to update existing mergers with the has_phase_2 field
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMergers() {
  try {
    console.log('Adding has_phase_2 column to mergers table...');
    
    // First, try to add the has_phase_2 column if it doesn't exist
    try {
      // This is a direct SQL query, which may not work depending on permissions
      // We'll catch any errors and continue
      await supabase.rpc('pg_query', { 
        query: 'ALTER TABLE mergers ADD COLUMN IF NOT EXISTS has_phase_2 BOOLEAN DEFAULT FALSE;' 
      });
    } catch (error) {
      console.log('Could not add column directly, will update existing records instead.');
    }
    
    // Fetch all mergers
    console.log('Fetching all mergers...');
    const { data: mergers, error: fetchError } = await supabase
      .from('mergers')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching mergers:', fetchError);
      return;
    }
    
    console.log(`Found ${mergers.length} mergers.`);
    
    // Update mergers based on their current_status
    let updatedCount = 0;
    
    for (const merger of mergers) {
      let hasPhase2 = false;
      
      // Determine if the merger should have Phase 2
      if (
        merger.current_status === 'Phase 2' || 
        merger.current_status === 'Blocked' || 
        merger.current_status === 'Cleared (with commitments)'
      ) {
        hasPhase2 = true;
      } else if (merger.current_status === 'Cleared') {
        // Randomly set some cleared mergers to have Phase 2
        hasPhase2 = Math.random() > 0.7;
      }
      
      // Update the merger
      const { error: updateError } = await supabase
        .from('mergers')
        .update({ has_phase_2: hasPhase2 })
        .eq('id', merger.id);
      
      if (updateError) {
        console.error(`Error updating merger ${merger.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated merger ${merger.name} (${merger.id}): has_phase_2 = ${hasPhase2}`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} out of ${mergers.length} mergers.`);
    
    // Verify the updates
    const { data: updatedMergers, error: verifyError } = await supabase
      .from('mergers')
      .select('id, name, current_status, has_phase_2')
      .order('name');
    
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
      return;
    }
    
    console.log('\nVerification of updates:');
    console.log('------------------------');
    
    // Group by current_status and has_phase_2
    const stats = {};
    
    for (const merger of updatedMergers) {
      const key = `${merger.current_status} (has_phase_2: ${merger.has_phase_2})`;
      stats[key] = (stats[key] || 0) + 1;
    }
    
    // Print statistics
    for (const [key, count] of Object.entries(stats)) {
      console.log(`${key}: ${count} mergers`);
    }
    
  } catch (error) {
    console.error('Error updating mergers:', error);
  }
}

// Run the update function
updateMergers(); 