import type { Medication } from '../types'

/**
 * Web Speech API Voice Utility for Elderly Patients
 * Speaks out loud in Hindi or Indian English with a calm, deliberate cadence (0.88x)
 * so seniors don't have to strain their eyes reading small packaging or mobile screens.
 */

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function speakText(text: string, lang: 'en' | 'hi' | 'mr' = 'hi') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.')
    return
  }

  stopSpeaking()

  let voiceLang = 'hi-IN'
  if (lang === 'en') voiceLang = 'en-IN'
  else if (lang === 'mr') voiceLang = 'mr-IN'

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voiceLang
  utterance.rate = 0.88 // Slightly slower, calm cadence for seniors
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()
  const matchedVoice = voices.find(
    (v) => v.lang.startsWith(voiceLang) || v.lang.startsWith('hi') || v.lang.includes('India')
  )
  if (matchedVoice) {
    utterance.voice = matchedVoice
  }

  window.speechSynthesis.speak(utterance)
}

export function speakReminder(medName: string, timing: string, foodRelation?: string, lang: 'en' | 'hi' | 'mr' = 'hi') {
  if (lang === 'hi') {
    const foodText = foodRelation === 'BEFORE_FOOD' || foodRelation?.toLowerCase().includes('before')
      ? 'Khane se pehle'
      : 'Khana khane ke baad'
    const text = `Ramesh ji, pranaam. Abhi aapki ${medName} lene ka samay ho gaya hai. Kripya ise ${foodText} paani ke saath lijiye.`
    speakText(text, 'hi')
  } else if (lang === 'mr') {
    const text = `Ramesh ji, tumchi ${medName} ghenyachi vel zhaali aahe. Krupaya velever aushadh ghya.`
    speakText(text, 'mr')
  } else {
    const foodText = foodRelation === 'BEFORE_FOOD' || foodRelation?.toLowerCase().includes('before')
      ? 'before food'
      : 'after your meal'
    const text = `Hello Ramesh ji, it is time to take your ${medName}. Please take it ${foodText} with water.`
    speakText(text, 'en')
  }
}

export function speakMedicationCard(med: Medication, lang: 'en' | 'hi' | 'mr' = 'hi') {
  if (lang === 'hi') {
    const food = med.food ? `Ise ${med.food.toLowerCase()} lijiye.` : ''
    const pill = med.pillAppearance ? `Goli ki pehchan: ${med.pillAppearance}.` : ''
    const packet = med.packetAppearance ? `Packet ka rang: ${med.packetAppearance}.` : ''
    const statusText = med.status === 'Paused' ? 'Dhyan dein, yeh dawai abhi ruki hui hai.' : med.status === 'Discontinued' ? 'Yeh dawai band ki gayi hai.' : ''
    
    const text = `Dawai ka naam: ${med.name}, ${med.strength}. Khurak: ${med.dose}, ${med.frequency}, samay: ${med.timing}. ${food} ${pill} ${packet} ${statusText}`
    speakText(text, 'hi')
  } else {
    const food = med.food ? `Take it ${med.food.toLowerCase()}.` : ''
    const pill = med.pillAppearance ? `Pill looks like: ${med.pillAppearance}.` : ''
    const packet = med.packetAppearance ? `Packet appearance: ${med.packetAppearance}.` : ''
    const statusText = med.status === 'Paused' ? 'Note: this medicine is currently paused.' : med.status === 'Discontinued' ? 'This medicine has been discontinued.' : ''
    
    const text = `Medication: ${med.name}, ${med.strength}. Dose: ${med.dose}, ${med.frequency}, scheduled at ${med.timing}. ${food} ${pill} ${packet} ${statusText}`
    speakText(text, 'en')
  }
}

export function speakFormGuide(mode: 'image' | 'upload' | 'text' | 'paste' | 'manual', lang: 'en' | 'hi' | 'mr' = 'hi') {
  if (mode === 'image' || mode === 'upload') {
    const text = lang === 'hi'
      ? 'Aap prescription ya dawai ke packet ki photo khinch kar yahan daal sakte hain. Hamari AI dawai ka naam aur khurak apne aap bhar degi.'
      : 'You can upload a photo of your prescription or medicine packet. Our AI will automatically fill in the medicine name and dosage details.'
    speakText(text, lang)
  } else if (mode === 'text' || mode === 'paste') {
    const text = lang === 'hi'
      ? 'Aap doctor ya chemist ka bheja hua WhatsApp message yahan paste kar sakte hain. Hum apne aap sabhi fields bhar denge.'
      : 'You can paste WhatsApp or SMS prescription text from your doctor here. We will parse all details into the form automatically.'
    speakText(text, lang)
  } else {
    const text = lang === 'hi'
      ? 'Kripya dawai ka naam, power, aur khane ka samay bharein. Aap goli ka rang aur packet ka aakaar bhi chun sakte hain.'
      : 'Please enter the medicine name, strength, and schedule. You can also specify what the pill and packet look like for easy recognition.'
    speakText(text, lang)
  }
}
