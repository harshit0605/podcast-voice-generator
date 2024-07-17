# Podcast Voice Generation App

This Next.js application allows users to create, edit, and generate audio for podcast transcripts using Speech Synthesis Markup Language (SSML) tags. It leverages the ElevenLabs API for high-quality voice synthesis.

## Features

- Load and parse podcast transcripts from text or SSML files
- Edit transcripts with an intuitive interface
- Add and customize SSML tags for enhanced voice control
- Support for multiple speakers
- Generate high-quality audio using ElevenLabs API
- Export edited transcripts as SSML
- Preview and download generated audio

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/podcast-voice-generation-app.git
   cd podcast-voice-generation-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your ElevenLabs API key:
   ```
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Load a transcript by pasting text, uploading a file, or importing SSML.
2. Edit the transcript and add SSML tags as needed.
3. Select voices for each speaker.
4. Generate audio using the "Generate Audio" button.
5. Preview and download the generated podcast.

## ElevenLabs API Key

This application requires an ElevenLabs API key to function. To obtain a key:

1. Sign up at [ElevenLabs](https://elevenlabs.io/).
2. Navigate to your profile settings.
3. Copy your API key.
4. Paste the key into your `.env.local` file.

**Note:** Keep your API key confidential and never share it publicly.

## SSML Tags and Their Effects

SSML (Speech Synthesis Markup Language) tags allow fine-tuned control over the generated voice. Here are the supported tags and their effects:

### `<prosody>`
Adjusts the pitch, rate, and volume of the speech.
- `rate`: Controls the speaking rate. Values: x-slow, slow, medium, fast, x-fast, or a percentage.
- `pitch`: Adjusts the pitch. Values: x-low, low, medium, high, x-high, or a semitone change (e.g., +2st).
- `volume`: Sets the volume. Values: silent, x-soft, soft, medium, loud, x-loud, or dB values.

Example: `<prosody rate="slow" pitch="low" volume="loud">This is important.</prosody>`

### `<emphasis>`
Emphasizes the enclosed text.
- `level`: Specifies the emphasis strength. Values: strong, moderate, reduced.

Example: `<emphasis level="strong">Warning!</emphasis>`

### `<break>`
Inserts a pause.
- `time`: Specifies the pause duration in seconds (s) or milliseconds (ms).
- `strength`: Indicates the break strength. Values: none, x-weak, weak, medium, strong, x-strong.

Example: `<break time="1s"/>` or `<break strength="strong"/>`

### `<say-as>`
Specifies how to interpret the enclosed text.
- `interpret-as`: Indicates the type of content. Common values: characters, spell-out, cardinal, ordinal, fraction, date, time.

Example: `<say-as interpret-as="date">01/01/2023</say-as>`

### `<sub>`
Substitutes the contained text with the specified alias.
- `alias`: The text to be spoken instead of the element content.

Example: `<sub alias="World Health Organization">WHO</sub>`

### `<phoneme>`
Provides a phonemic/phonetic pronunciation for the contained text.
- `alphabet`: Specifies the phonetic alphabet used. Values: ipa, x-sampa.
- `ph`: The phonemic/phonetic pronunciation to be used.

Example: `<phoneme alphabet="ipa" ph="təˈmeɪtoʊ">tomato</phoneme>`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).