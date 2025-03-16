// This script generates SQL statements to be run in the Supabase SQL Editor

const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.resolve(__dirname, '../supabase/create-users.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('='.repeat(80));
console.log('SQL STATEMENTS TO RUN IN SUPABASE SQL EDITOR');
console.log('='.repeat(80));
console.log('\nCopy and paste ALL of the following SQL into the Supabase SQL Editor:');
console.log('\n');

// Print the entire SQL content
console.log(sqlContent);

console.log('\n');
console.log('='.repeat(80));
console.log('INSTRUCTIONS:');
console.log('1. Go to the Supabase dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Copy and paste ALL of the SQL above');
console.log('5. Run the query');
console.log('='.repeat(80)); 