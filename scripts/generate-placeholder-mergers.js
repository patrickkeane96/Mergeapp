require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Using Supabase key: ${supabaseKey.substring(0, 5)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Real companies and their industries
const companies = [
  { name: "Microsoft", industry: "Technology" },
  { name: "Apple", industry: "Technology" },
  { name: "Amazon", industry: "E-commerce" },
  { name: "Google", industry: "Technology" },
  { name: "Meta", industry: "Technology" },
  { name: "Tesla", industry: "Automotive" },
  { name: "Walmart", industry: "Retail" },
  { name: "ExxonMobil", industry: "Energy" },
  { name: "JPMorgan Chase", industry: "Financial Services" },
  { name: "Johnson & Johnson", industry: "Healthcare" },
  { name: "Pfizer", industry: "Pharmaceuticals" },
  { name: "Procter & Gamble", industry: "Consumer Goods" },
  { name: "Coca-Cola", industry: "Beverages" },
  { name: "PepsiCo", industry: "Beverages" },
  { name: "Netflix", industry: "Entertainment" },
  { name: "Disney", industry: "Entertainment" },
  { name: "AT&T", industry: "Telecommunications" },
  { name: "Verizon", industry: "Telecommunications" },
  { name: "Boeing", industry: "Aerospace" },
  { name: "General Electric", industry: "Conglomerate" },
  { name: "IBM", industry: "Technology" },
  { name: "Intel", industry: "Technology" },
  { name: "Cisco", industry: "Technology" },
  { name: "Oracle", industry: "Technology" },
  { name: "Salesforce", industry: "Technology" },
  { name: "Adobe", industry: "Technology" },
  { name: "Nvidia", industry: "Technology" },
  { name: "AMD", industry: "Technology" },
  { name: "Qualcomm", industry: "Technology" },
  { name: "PayPal", industry: "Financial Services" },
  { name: "Visa", industry: "Financial Services" },
  { name: "Mastercard", industry: "Financial Services" },
  { name: "American Express", industry: "Financial Services" },
  { name: "Goldman Sachs", industry: "Financial Services" },
  { name: "Morgan Stanley", industry: "Financial Services" },
  { name: "Bank of America", industry: "Financial Services" },
  { name: "Citigroup", industry: "Financial Services" },
  { name: "Wells Fargo", industry: "Financial Services" },
  { name: "UnitedHealth Group", industry: "Healthcare" },
  { name: "CVS Health", industry: "Healthcare" },
  { name: "Anthem", industry: "Healthcare" },
  { name: "Cigna", industry: "Healthcare" },
  { name: "Humana", industry: "Healthcare" },
  { name: "Merck", industry: "Pharmaceuticals" },
  { name: "AbbVie", industry: "Pharmaceuticals" },
  { name: "Bristol Myers Squibb", industry: "Pharmaceuticals" },
  { name: "Eli Lilly", industry: "Pharmaceuticals" },
  { name: "Amgen", industry: "Pharmaceuticals" },
  { name: "Gilead Sciences", industry: "Pharmaceuticals" },
  { name: "Biogen", industry: "Pharmaceuticals" }
];

// Generate a random date within the last 2 years
function randomDate() {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 2);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate a random outcome
function randomOutcome() {
  const outcomes = ['under_review', 'cleared', 'blocked', 'cleared_with_commitments'];
  const weights = [0.5, 0.3, 0.1, 0.1]; // 50% under review, 30% cleared, 10% blocked, 10% cleared with commitments
  
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < outcomes.length; i++) {
    sum += weights[i];
    if (random < sum) {
      return outcomes[i];
    }
  }
  return outcomes[0];
}

// Generate a random end date based on outcome
function randomEndDate(startDate, outcome) {
  if (outcome === 'under_review') {
    return null; // Still ongoing
  }
  
  const minDays = 30;
  const maxDays = 180;
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + randomDays);
  
  return endDate;
}

// Generate a random merger description
function generateDescription(acquirer, target, industry) {
  const descriptions = [
    `${acquirer} plans to acquire ${target} to strengthen its position in the ${industry} market.`,
    `${acquirer}'s proposed acquisition of ${target} aims to expand its ${industry} offerings.`,
    `The merger between ${acquirer} and ${target} would create a leading player in the ${industry} sector.`,
    `${acquirer} seeks to purchase ${target} to diversify its ${industry} portfolio.`,
    `${acquirer}'s bid to acquire ${target} would consolidate its presence in the ${industry} industry.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Generate a random value between min and max
function randomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate placeholder mergers
async function generatePlaceholderMergers() {
  const mergers = [];
  
  // Create 25 mergers
  for (let i = 0; i < 25; i++) {
    // Select two random companies
    const acquirerIndex = Math.floor(Math.random() * companies.length);
    let targetIndex;
    do {
      targetIndex = Math.floor(Math.random() * companies.length);
    } while (targetIndex === acquirerIndex);
    
    const acquirer = companies[acquirerIndex];
    const target = companies[targetIndex];
    
    // Determine which industry to use (50% chance of using acquirer's industry)
    const industry = Math.random() < 0.5 ? acquirer.industry : target.industry;
    
    // Generate random dates and outcome
    const startDate = randomDate();
    const outcome = randomOutcome();
    const endDate = randomEndDate(startDate, outcome);
    
    // Generate random values
    const value = randomValue(100, 10000); // $100M to $10B
    const hasPhase2 = outcome === 'under_review' ? Math.random() < 0.3 : Math.random() < 0.5;
    
    // Create merger object
    const merger = {
      name: `${acquirer.name} / ${target.name} Merger`,
      description: generateDescription(acquirer.name, target.name, industry),
      industry,
      start_date: startDate.toISOString(),
      end_date: endDate ? endDate.toISOString() : null,
      current_status: outcome,
      value_million_usd: value,
      has_phase_2: hasPhase2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mergers.push(merger);
  }
  
  // Insert mergers into the database
  const { data, error } = await supabase
    .from('mergers')
    .insert(mergers)
    .select();
  
  if (error) {
    console.error('Error inserting mergers:', error);
    return;
  }
  
  console.log(`Successfully inserted ${data.length} mergers`);
  
  // Get total count of mergers
  const { count, error: countError } = await supabase
    .from('mergers')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error getting merger count:', countError);
    return;
  }
  
  console.log(`Total mergers in the database: ${count}`);
}

// Run the function
generatePlaceholderMergers()
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 