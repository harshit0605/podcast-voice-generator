import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/*
<speak>
    नमस्ते! <prosody rate="slow" pitch="+20%">कैसे हैं आप?</prosody>
    <break time="1s"/>
    <emphasis level="strong">मुझे आपसे मिलकर बहुत खुशी हुई।</emphasis>
</speak>

<speak>
  <!-- Root element -->
  <speak>...</speak>

  <!-- Prosody control -->
  <prosody rate="slow/medium/fast/x%">...</prosody>
  <prosody pitch="low/medium/high/+x%/-x%">...</prosody>
  <prosody volume="silent/soft/medium/loud/+xdB/-xdB">...</prosody>

  <!-- Breaks and pauses -->
  <break time="x[s/ms]"/>
  <break strength="none/x-weak/weak/medium/strong/x-strong"/>

  <!-- Emphasis -->
  <emphasis level="strong/moderate/reduced">...</emphasis>

  <!-- Say-as (interpret-as) -->
  <say-as interpret-as="characters/spell-out/cardinal/ordinal/fraction/unit/date/time/telephone/address">...</say-as>

  <!-- Phoneme (for pronunciation control) -->
  <phoneme alphabet="ipa" ph="phonetic_transcription">...</phoneme>

  <!-- Sub (alias or pronunciation substitute) -->
  <sub alias="substitution">...</sub>

  <!-- Language -->
  <lang xml:lang="language_code">...</lang>

  <!-- Paragraph and sentence structure -->
  <p>...</p>
  <s>...</s>

  <!-- Audio insertion (not commonly used) -->
  <audio src="url_to_audio_file"/>
</speak>
*/