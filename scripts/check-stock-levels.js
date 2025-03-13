#!/usr/bin/env node

/**
 * This script checks for products with stock levels below their minimum quantity
 * and creates notifications for them. It should be run daily using a cron job
 * or a scheduled task.
 * 
 * Example cron job (runs daily at midnight):
 * 0 0 * * * node /path/to/check-stock-levels.js
 * 
 * To force creation of test notifications:
 * node check-stock-levels.js --force
 */

import https from 'https';
import http from 'http';

// Parse command line arguments
const args = process.argv.slice(2);
const forceCreate = args.includes('--force');

// Configuration
const BASE_URL = 'http://localhost:3000/api/notifications/stock-alerts';
const API_URL = forceCreate ? `${BASE_URL}?force=true` : BASE_URL;
const TIMEOUT = 30000; // 30 seconds

console.log(`Using API URL: ${API_URL}`);
console.log(`Force create: ${forceCreate}`);

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      // A chunk of data has been received
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // The whole response has been received
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (e) {
          console.error('Error parsing JSON response:', e);
          reject(e);
        }
      });
    }).on('error', (err) => {
      console.error('Error making request:', err.message);
      reject(err);
    });
    
    // Set timeout
    req.setTimeout(TIMEOUT, () => {
      req.abort();
      reject(new Error(`Request timed out after ${TIMEOUT}ms`));
    });
  });
}

// Main function
async function main() {
  console.log('Checking for low stock products...');
  
  try {
    const result = await makeRequest(API_URL);
    
    if (result.success) {
      console.log(`Success: ${result.message}`);
      if (result.data && result.data.length > 0) {
        console.log('Created notifications:');
        result.data.forEach((notification, index) => {
          console.log(`${index + 1}. ${notification.title}: ${notification.message}`);
        });
      } else {
        console.log('No new notifications created.');
      }
    } else {
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Failed to check stock levels:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
