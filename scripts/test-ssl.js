#!/usr/bin/env node

/**
 * SSL Configuration Test Script
 * Tests your website's SSL configuration to identify mobile SSL warning issues
 */

const https = require('https');
const http = require('http');
const { exec } = require('child_process');

const DOMAIN = 'instakeysupply.com';

console.log('🔒 SSL Configuration Test for', DOMAIN);
console.log('=====================================\n');

// Test 1: Check HTTPS response headers
function testHTTPSHeaders() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false
    }, (res) => {
      console.log('✅ HTTPS Response Headers:');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Strict-Transport-Security: ${res.headers['strict-transport-security'] || '❌ Missing'}`);
      console.log(`   X-Content-Type-Options: ${res.headers['x-content-type-options'] || '❌ Missing'}`);
      console.log(`   X-Frame-Options: ${res.headers['x-frame-options'] || '❌ Missing'}`);
      console.log(`   X-XSS-Protection: ${res.headers['x-xss-protection'] || '❌ Missing'}`);
      console.log(`   Content-Security-Policy: ${res.headers['content-security-policy'] ? '✅ Present' : '❌ Missing'}`);
      console.log('');
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ HTTPS Test Failed:', err.message);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('❌ HTTPS Test Timeout');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Test 2: Check HTTP to HTTPS redirect
function testHTTPRedirect() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: DOMAIN,
      port: 80,
      path: '/',
      method: 'GET'
    }, (res) => {
      console.log('✅ HTTP to HTTPS Redirect:');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Location: ${res.headers.location || '❌ No redirect'}`);
      
      if (res.headers.location && res.headers.location.startsWith('https://')) {
        console.log('   ✅ Proper HTTPS redirect configured');
      } else {
        console.log('   ❌ HTTPS redirect not properly configured');
      }
      console.log('');
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ HTTP Test Failed:', err.message);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('❌ HTTP Test Timeout');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Test 3: Check SSL certificate
function testSSLCertificate() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false
    }, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      console.log('✅ SSL Certificate Information:');
      
      if (cert && cert.subject) {
        console.log(`   Subject: ${cert.subject.CN || cert.subject.commonName || 'Unknown'}`);
        console.log(`   Issuer: ${cert.issuer.CN || cert.issuer.commonName || 'Unknown'}`);
        console.log(`   Valid From: ${cert.valid_from || 'Unknown'}`);
        console.log(`   Valid To: ${cert.valid_to || 'Unknown'}`);
        console.log(`   Serial Number: ${cert.serialNumber || 'Unknown'}`);
        
        // Check if certificate is expired
        if (cert.valid_to) {
          const now = new Date();
          const validTo = new Date(cert.valid_to);
          if (validTo > now) {
            console.log('   ✅ Certificate is valid');
          } else {
            console.log('   ❌ Certificate is expired!');
          }
        }
        
        // Check certificate chain
        if (cert.raw) {
          console.log('   ✅ Certificate chain present');
        } else {
          console.log('   ❌ Certificate chain incomplete');
        }
      } else {
        console.log('   ❌ Could not retrieve certificate information');
      }
      console.log('');
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ SSL Certificate Test Failed:', err.message);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('❌ SSL Certificate Test Timeout');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Test 4: Check for mixed content
function checkForMixedContent() {
  console.log('🔍 Mixed Content Check:');
  console.log('   This requires manual browser inspection:');
  console.log('   1. Open https://' + DOMAIN + ' in your browser');
  console.log('   2. Open Developer Tools (F12)');
  console.log('   3. Check Console tab for any HTTP resource warnings');
  console.log('   4. Look for "Mixed Content" or "Insecure Content" warnings');
  console.log('');
}

// Test 5: Check SSL Labs grade (if curl is available)
function checkSSLLabsGrade() {
  return new Promise((resolve) => {
    exec('curl --version', (error) => {
      if (error) {
        console.log('ℹ️  SSL Labs Test:');
        console.log('   Install curl to test automatically, or visit:');
        console.log('   https://www.ssllabs.com/ssltest/');
        console.log('   Enter your domain: ' + DOMAIN);
        console.log('');
        resolve();
        return;
      }

      console.log('🔍 SSL Labs Test:');
      console.log('   Testing SSL configuration...');
      
      // Note: SSL Labs doesn't have a public API, so we just provide the link
      console.log('   Visit: https://www.ssllabs.com/ssltest/');
      console.log('   Enter your domain: ' + DOMAIN);
      console.log('   Look for "A" grade and no certificate chain issues');
      console.log('');
      resolve();
    });
  });
}

// Main test function
async function runTests() {
  try {
    await testHTTPSHeaders();
    await testHTTPRedirect();
    await testSSLCertificate();
    checkForMixedContent();
    await checkSSLLabsGrade();
    
    console.log('📋 Summary of SSL Issues:');
    console.log('=====================================');
    console.log('Common causes of mobile SSL warnings:');
    console.log('1. ❌ Missing HSTS header (Strict-Transport-Security)');
    console.log('2. ❌ Incomplete SSL certificate chain');
    console.log('3. ❌ Mixed content (HTTP resources on HTTPS page)');
    console.log('4. ❌ Missing security headers');
    console.log('5. ❌ HTTP to HTTPS redirect not configured');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Check the SSL-SETUP-GUIDE.md file for detailed instructions');
    console.log('2. Configure your hosting provider to use full SSL certificate chain');
    console.log('3. Enable "Force HTTPS" in your hosting control panel');
    console.log('4. Test on mobile devices after making server changes');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the tests
runTests();
