import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run tests with coverage
function runTests() {
    try {
        console.log('Running tests with coverage...');
        execSync('npm run test:coverage', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error running tests:', error.message);
        process.exit(1);
    }
}

// Function to generate test data
function generateTestData() {
    try {
        console.log('Generating test data...');
        execSync('node scripts/generateTestData.js', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error generating test data:', error.message);
        process.exit(1);
    }
}

// Main function
async function main() {
    try {
        // Generate test data first
        generateTestData();

        // Run tests
        runTests();
    } catch (error) {
        console.error('Error in test runner:', error.message);
        process.exit(1);
    }
}

// Run the main function
main(); 