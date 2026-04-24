import type { CharacterFormValues } from '../schemas/character.dto'
import type { SpeakerImportValues } from '../schemas/speaker.dto'

// 空文字ではない文字列だけを取り込み値として採用する
const mergeImportedString = (currentValue: string, importedValue: string) => {
  return importedValue.trim().length > 0 ? importedValue : currentValue
}

// null ではない文字列だけを取り込み値として採用する
const mergeImportedNullableString = (currentValue: string | null, importedValue: string | null) => {
  if (importedValue === null) {
    return currentValue
  }

  return importedValue.trim().length > 0 ? importedValue : currentValue
}

// 空配列ではないタグ配列だけを取り込み値として採用する
const mergeImportedArray = (currentValue: readonly string[], importedValue: readonly string[]) => {
  return importedValue.length > 0 ? [...importedValue] : [...currentValue]
}

// 取り込みテンプレートを現在のフォーム値へ安全にマージする
export const mergeImportedValues = (currentValues: CharacterFormValues, importedValues: SpeakerImportValues) => {
  return {
    name: currentValues.name,
    ageGroup: mergeImportedString(currentValues.ageGroup, importedValues.ageGroup),
    gender: mergeImportedString(currentValues.gender, importedValues.gender),
    occupation: mergeImportedString(currentValues.occupation, importedValues.occupation),
    personalityTags: mergeImportedArray(currentValues.personalityTags, importedValues.personalityTags),
    speechStyle: mergeImportedString(currentValues.speechStyle, importedValues.speechStyle),
    firstPerson: mergeImportedString(currentValues.firstPerson, importedValues.firstPerson),
    secondPerson: mergeImportedString(currentValues.secondPerson, importedValues.secondPerson),
    honorific: mergeImportedString(currentValues.honorific, importedValues.honorific),
    attributeTags: mergeImportedArray(currentValues.attributeTags, importedValues.attributeTags),
    backgroundTags: mergeImportedArray(currentValues.backgroundTags, importedValues.backgroundTags),
    sampleQuotes: mergeImportedArray(currentValues.sampleQuotes, importedValues.sampleQuotes),
    memo: mergeImportedString(currentValues.memo, importedValues.memo),
    caption: mergeImportedNullableString(currentValues.caption, importedValues.caption),
    speakerId: currentValues.speakerId
  }
}
