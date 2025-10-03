# Changelog

## 1.0.0 (2025-10-03)


### Features

* Add Stripe Customer Portal and automatic plan switching with proration ([270bd1e](https://github.com/haider063-hub/ai-therapist/commit/270bd1ebb7d487005d610848f25c13b6a36601f6))
* Add therapist selection system for multilingual voice therapy ([36ef85b](https://github.com/haider063-hub/ai-therapist/commit/36ef85be84031a054f00536747ff145d2aad16d5))
* Add therapist selection system with multilingual support ([60a9a94](https://github.com/haider063-hub/ai-therapist/commit/60a9a9443ee96b2bc5c7fd7f02f491e583827d70))
* Add time to transaction history and prevent duplicate subscription purchases ([e7bb94d](https://github.com/haider063-hub/ai-therapist/commit/e7bb94ddce5c36f08a545093300ed1630df0e901))
* Implement subscription system with Stripe integration ([b6e25f4](https://github.com/haider063-hub/ai-therapist/commit/b6e25f4d93a2001e0d6e3b34c1e91458f2a6fbff))
* implement voice session improvements and dictate feature - Voice Session button with text and tooltip at top right - Add dictate feature to chat input with speech-to-text - Change voice credit system to 50 credits per session (not per message) - End Conversation button deducts credits at session end ([f55ad67](https://github.com/haider063-hub/ai-therapist/commit/f55ad678414c9101dfa97dae3001a7a56576ce1c))
* Improve avatar display and mood tracking ([b3d5a6e](https://github.com/haider063-hub/ai-therapist/commit/b3d5a6e5a815c3f170f500aedc03264f94894aec))
* Improve credits display based on subscription plan type ([285a2a2](https://github.com/haider063-hub/ai-therapist/commit/285a2a2b4b4bf079f8b699c63977bb8ceaab464e))
* Major improvements to chat, voice, and mood tracking ([904f688](https://github.com/haider063-hub/ai-therapist/commit/904f688863e46e2531872b0883e19eefbd523ddf))
* major UI/UX improvements and voice chat enhancements - Convert voice drawer to dedicated /voice-chat page - Rename /select-therapist to /therapists - Add therapist profile images (8 therapists) - Implement AI-generated dynamic greetings with therapist context - Session-based voice credits (50 per session, not per message) - Enhanced dictate feature with visual recording indicators - Add back button to voice chat (disabled during active session) - Auto-end session on browser close/navigate - Remove archive functionality from UI - Move User Settings to Dashboard in main sidebar - Fix subscription button styling and alignment - Add individual language filters (All, English, Spanish, etc.) - Improve mobile responsiveness for voice chat header - Add 'Go Back' tooltips to all back buttons - Clean up README formatting ([47772ef](https://github.com/haider063-hub/ai-therapist/commit/47772efa53608ac258020ad369225509c32baa3a))
* Remove token usage display and implement image upload ([7bbd6c1](https://github.com/haider063-hub/ai-therapist/commit/7bbd6c1559a9d0b588dc84c3900cdd4e761b1dc0))
* Remove token usage display and three dots menu from chat ([9754338](https://github.com/haider063-hub/ai-therapist/commit/9754338c120382b3fb4a4b6e8fcc54b233611eea))
* Remove unimplemented + button from chat input ([8631c54](https://github.com/haider063-hub/ai-therapist/commit/8631c544c1134f8ea21037e10ba710a70f32bc66))
* Show actual plan name in transaction history instead of generic 'Subscription' ([c755ddc](https://github.com/haider063-hub/ai-therapist/commit/c755ddcfb8c792e2e0ead7f911cb36ee57e3dc3d))
* UI improvements and mood tracking enhancements ([d0e8e42](https://github.com/haider063-hub/ai-therapist/commit/d0e8e42a82ebf862a4342b90946afb2d4881e359))
* update chat placeholder to be more therapeutic - Changed from 'Ask anything or [@mention](https://github.com/mention)' to 'Tell me what's on your mind...' ([335c60a](https://github.com/haider063-hub/ai-therapist/commit/335c60ad27679e47bf14bf147a137a54b9c9508f))
* update Voice Session button to show 'Voice Chat' with 'Speak to Therapist' subtitle ([43978f5](https://github.com/haider063-hub/ai-therapist/commit/43978f5cd0708c72590fe5f92bf41bc3d6db5506))


### Bug Fixes

* Add image rendering support in chat messages ([a8ae76c](https://github.com/haider063-hub/ai-therapist/commit/a8ae76cd2e47240a4ed81fe1d4ad6327ddca2cd7))
* Add null checks for Stripe in all API routes to resolve TypeScript errors ([7246f3f](https://github.com/haider063-hub/ai-therapist/commit/7246f3f6fec2f261ae2fe0876622570607507eb7))
* Allow unauthenticated access to forgot-password and reset-password routes ([2b48fce](https://github.com/haider063-hub/ai-therapist/commit/2b48fcef833bacee0b9743b6caada35f9d92584e))
* change Voice Chat button to show tooltip 'Speak to Therapist' on hover instead of subtitle ([3c38255](https://github.com/haider063-hub/ai-therapist/commit/3c3825520c826456a381b8d7239a23198ba06565))
* Detect cancel_at_period_end in subscription updates to show canceled status correctly ([f593f52](https://github.com/haider063-hub/ai-therapist/commit/f593f52c50c4b01f1ce7b2fd1fcbf01321c52f7d))
* Disable problematic UUID migration to allow clean deployment ([fa7e190](https://github.com/haider063-hub/ai-therapist/commit/fa7e19015a7eaab579f3965f2216468d38dae1d3))
* Exclude Stripe API routes from auth middleware to prevent webhook redirects ([b7e2ce0](https://github.com/haider063-hub/ai-therapist/commit/b7e2ce0fe3fb7f1c6ae181c63234e97eaace0e6b))
* Include metadata in transaction API response to show plan names ([dbcdc89](https://github.com/haider063-hub/ai-therapist/commit/dbcdc89015bbbb7c61370be2025aa37cb22f53b4))
* Properly revert to free trial with 500 credits when subscription is deleted ([ecfcade](https://github.com/haider063-hub/ai-therapist/commit/ecfcade08fec942dfd0c70e76560890dfe7cb96d))
* Remove unused imports in user-quick-mood-card ([9ae426a](https://github.com/haider063-hub/ai-therapist/commit/9ae426a52d40e67747353f56d96c9f13a0d63122))
* remove unused Mic import from app-header ([f43e0ec](https://github.com/haider063-hub/ai-therapist/commit/f43e0ec98971d16feaf727acc6bc8e7d17cbf056))
* Remove unused X icon import ([713109a](https://github.com/haider063-hub/ai-therapist/commit/713109ad31895400443914be9cab8bdf014d4e33))
* Resolve Vercel build errors - escape apostrophe and fix Stripe import ([93d04e2](https://github.com/haider063-hub/ai-therapist/commit/93d04e2349b875fa8cb4fe515c9e930522abb401))
* Update migration journal to reference correct migration files ([b7e1a59](https://github.com/haider063-hub/ai-therapist/commit/b7e1a59ec5ba4cde03bd6ec5a3d22e0b79566c31))
* Update Stripe API version to 2025-02-24.acacia ([83c5e6e](https://github.com/haider063-hub/ai-therapist/commit/83c5e6e29f4da665050606876d78cec5982881aa))
* Use actual request domain for Stripe redirect URLs instead of hardcoded localhost ([ca7895f](https://github.com/haider063-hub/ai-therapist/commit/ca7895f383997952f4bd2cd7cb87b3031f74af3a))
