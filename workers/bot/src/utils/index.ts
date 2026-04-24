export { irodoriClient } from './client'
export { deleteGuildSettings, getGuildSettings, setGuildSettings, updateGuildSettings } from './guild-settings'
export { notifyError } from './notifier'
export {
  deleteUserSettings,
  getCurrentSpeakerConfig,
  getCurrentSpeakerId,
  getSpeakerConfig,
  getUserSettings,
  pingRedis,
  redis,
  setCurrentSpeakerId,
  setUserSettings,
  updateCurrentSpeakerConfig,
  updateSpeakerConfig
} from './redis'
export { preprocessForTts, preprocessMessageForTts } from './text-preprocess'
export { getSpeakers, type PcmAudio, synthesize, textToSpeech, textToSpeechWithSettings } from './tts'
