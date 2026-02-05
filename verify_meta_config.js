import { MetaConfig, getMetaUrl } from './config/meta.js';

console.log('--- Meta Config Verification ---');
console.log(`Configured Version: ${MetaConfig.VERSION}`);
console.log(`Base URL: ${MetaConfig.BASE_URL}`);
console.log(`Graph API URL: ${MetaConfig.GRAPH_API}`);
console.log('-------------------------------');
console.log('Test URL Generation:');
console.log(`getMetaUrl('me'): ${getMetaUrl('me')}`);
console.log(`getMetaUrl('/123/leads'): ${getMetaUrl('/123/leads')}`);

if (MetaConfig.VERSION === 'v24.0' || (process.env.META_GRAPH_VERSION && MetaConfig.VERSION === process.env.META_GRAPH_VERSION)) {
    console.log('SUCCESS: Version check passed.');
} else {
    console.warn(`WARNING: Configured version is ${MetaConfig.VERSION}, expected v24.0 or matching env var.`);
}
