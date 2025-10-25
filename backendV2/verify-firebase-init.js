import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

console.log('🔍 Firebase Admin SDK Initialization Verification\n');

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to load from the root directory first (production deployment)
let serviceAccountPath = join(__dirname, '../jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');

console.log('📍 Checking location 1 (root directory):', serviceAccountPath);
if (existsSync(serviceAccountPath)) {
  console.log('✅ Found!\n');
} else {
  console.log('❌ Not found\n');
  
  // If not found in root, try in backendV2 directory
  serviceAccountPath = join(__dirname, 'jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');
  console.log('📍 Checking location 2 (backendV2 directory):', serviceAccountPath);
  if (existsSync(serviceAccountPath)) {
    console.log('✅ Found!\n');
  } else {
    console.log('❌ Not found\n');
  }
}

// Check if file exists before trying to initialize
if (existsSync(serviceAccountPath)) {
  try {
    console.log('📖 Reading credentials file...');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    console.log('✅ Credentials file parsed successfully');
    console.log('📋 Project ID:', serviceAccount.project_id);
    console.log('📧 Client Email:', serviceAccount.client_email);
    
    console.log('\n🔄 Initializing Firebase Admin SDK...');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'jjtextiles-ecom'
      });
      console.log('✅ Firebase Admin SDK initialized successfully!\n');
    } else {
      console.log('✅ Firebase Admin SDK already initialized\n');
    }
    
    console.log('🎉 SUCCESS! Backend is ready for user authentication.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Solution: Ensure the credentials file is valid JSON');
    process.exit(1);
  }
} else {
  console.error('❌ Firebase credentials file not found!');
  console.error('\n📍 Expected locations:');
  console.error('   1. JJTEX FullStack/jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');
  console.error('   2. JJTEX FullStack/backendV2/jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');
  console.error('\n💡 Solution: Move the credentials file to one of these locations\n');
  process.exit(1);
}
