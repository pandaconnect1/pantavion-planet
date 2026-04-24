// scripts/run-voice-multilingual-policy.ts

import { runMultilingualVoicePolicy } from '../core/runtime/voice-multilingual-policy';

const output = runMultilingualVoicePolicy({
  explicitUserLocale: 'el-GR',
  conversationLocale: 'en-US',
  cityKey: 'athens-gr',
  countryCode: 'GR',
  globalFallbackLocale: 'en-US',
});

console.log(output.rendered);
