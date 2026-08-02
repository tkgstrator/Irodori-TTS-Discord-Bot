export { irodoriClient } from './client'
export { getGuildSettings } from './guild-settings'
export { notifyError } from './notifier'
export {
  getCurrentSpeakerConfig,
  getCurrentSpeakerContext,
  getCurrentSpeakerId,
  getSpeakerConfig,
  getUserSettings,
  pingRedis,
  redis
} from './redis'
export { preprocessForTts, preprocessMessageForTts } from './text-preprocess'
export { type PcmAudio, synthesize, textToSpeechWithSettings } from './tts'
