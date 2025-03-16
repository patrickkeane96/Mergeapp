// This script outputs the SQL file content directly

const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.resolve(__dirname, '../supabase/create-users.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('================================================================================');
console.log('SQL TO RUN IN SUPABASE SQL EDITOR');
console.log('================================================================================');
console.log();
console.log(sqlContent);
console.log();
console.log('================================================================================');
console.log('INSTRUCTIONS:');
console.log('1. Go to the Supabase dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Copy and paste ALL of the SQL above');
console.log('5. Run the query');
console.log('================================================================================'); 