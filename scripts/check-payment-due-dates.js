#!/usr/bin/env node

/**
 * This script checks for transactions with payment due dates in the next 7 days
 * and creates notifications for them. It should be run daily using a cron job
 * or a scheduled task.
 * 
 * Example cron job (runs daily at midnight):
 * 0 0 * * * node /path/to/check-payment-due-dates.js
 */

import https from 'https';
import http from 'http';

// Configuration
const API_URL = 'http://localhost:3000/api/notifications/payment-due-check';
const TIMEOUT = 30000; // 30 seconds

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
  console.log('Checking for payment due dates...');
  
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
    console.error('Failed to check payment due dates:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
