require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMergersWithPhase2() {
  try {
    console.log('Fetching all mergers...');
    const { data: mergers, error: fetchError } = await supabase
      .from('mergers')
      .select('id, name, current_status');
    
    if (fetchError) {
      console.error('Error fetching mergers:', fetchError);
      return;
    }
    
    if (!mergers || mergers.length === 0) {
      console.log('No mergers found in the database.');
      return;
    }
    
    console.log(`Found ${mergers.length} mergers to update.`);
    
    // Now update each merger
    let successCount = 0;
    for (const merger of mergers) {
      const hasPhase2 = ['Phase 2', 'Remedies', 'Approved with Remedies', 'Blocked'].includes(merger.current_status);
      
      console.log(`Updating merger "${merger.name}" (${merger.id}) with has_phase_2=${hasPhase2}`);
      
      try {
        const { data, error: updateError } = await supabase
          .from('mergers')
          .update({ has_phase_2: hasPhase2 })
          .eq('id', merger.id)
          .select();
        
        if (updateError) {
          console.error(`Error updating merger ${merger.id}:`, updateError);
        } else {
          console.log(`Merger ${merger.id} updated successfully.`);
          successCount++;
        }
      } catch (err) {
        console.error(`Exception updating merger ${merger.id}:`, err);
      }
    }
    
    console.log(`Update completed. ${successCount} out of ${mergers.length} mergers updated successfully.`);
    
    // Verify the updates
    try {
      const { data: updatedMergers, error: verifyError } = await supabase
        .from('mergers')
        .select('id, name, current_status, has_phase_2');
      
      if (verifyError) {
        console.error('Error verifying updates:', verifyError);
      } else if (updatedMergers) {
        console.log('\nVerification results:');
        
        // Group by current_status and has_phase_2
        const stats = {};
        for (const merger of updatedMergers) {
          const status = merger.current_status || 'Unknown';
          const hasPhase2 = merger.has_phase_2 ? 'true' : 'false';
          
          if (!stats[status]) {
            stats[status] = { true: 0, false: 0 };
          }
          
          stats[status][hasPhase2]++;
        }
        
        // Print statistics
        console.log('Status breakdown:');
        for (const status in stats) {
          console.log(`  ${status}:`);
          console.log(`    has_phase_2=true: ${stats[status].true || 0}`);
          console.log(`    has_phase_2=false: ${stats[status].false || 0}`);
        }
      }
    } catch (err) {
      console.error('Exception verifying updates:', err);
    }
  } catch (error) {
    console.error('Error in updateMergersWithPhase2:', error);
  }
}

updateMergersWithPhase2(); 