/**
 * Web Speech API Voice Reminder Utility
 * Speaks out loud in Hindi or English so elderly patients don't have to squint at a screen.
 */
export function speakReminder(medName: string, timing: string, foodRelation?: string, lang: 'en' | 'hi' | 'mr' = 'hi') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.')
    return
  }

  window.speechSynthesis.cancel() // Stop any ongoing speech

  let text = ''
  let voiceLang = 'en-IN'

  if (lang === 'hi') {
    voiceLang = 'hi-IN'
    const foodText = foodRelation === 'BEFORE_FOOD' ? 'Khane se pehle' : 'Khana khane ke baad'
    text = `Ramesh ji, pranaam. Abhi aapki ${medName} lene ka samay ho gaya hai. Kripya ise ${foodText} paani ke saath lijiye.`
  } else if (lang === 'mr') {
    voiceLang = 'mr-IN'
    text = `Ramesh ji, tumchi ${medName} ghenyachi vel zhaali aahe. Krupaya velever aushadh ghya.`
  } else {
    voiceLang = 'en-IN'
    const foodText = foodRelation === 'BEFORE_FOOD' ? 'before food' : 'after your meal'
    text = `Hello Ramesh ji, it is time to take your ${medName}. Please take it ${foodText} with water.`
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voiceLang
  utterance.rate = 0.9 // Slightly slower for elderly comprehension
  utterance.pitch = 1.0

  // Select Indian English / Hindi voice if available
  const voices = window.speechSynthesis.getVoices()
  const matchedVoice = voices.find((v) => v.lang.startsWith(voiceLang) || v.lang.startsWith('hi') || v.lang.includes('India'))
  if (matchedVoice) {
    utterance.voice = matchedVoice
  }

  window.speechSynthesis.speak(utterance)
}
