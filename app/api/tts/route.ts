import { NextResponse } from 'next/server';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from '@/lib/utils2';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "oESd0nQBbi2O04iJOxNn";
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { text, language, gender } = await request.json();

    // Validate input
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const data = {
      "text": text,
      "model_id": "eleven_multilingual_v2",
      "voice_settings": {
          "stability": 0.65,
          "similarity_boost": 0.87
      }
  };

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/${VOICE_ID}`,
      data,
      // {
      //   text,
      //   voice_settings: {
      //     stability: 0.65,
      //     similarity_boost: 0.87
      //   },
      //   model_id: "eleven_multilingual_v2",
      // },
      {
        headers: {
          'Content-Type': 'application/json',
          "Accept": "audio/mpeg",
          // 'Authorization': `Bearer ${ELEVENLABS_API_KEY}`
          "xi-api-key": ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    
    const fileName = `${uuidv4()}.mp3`; 
    const filePath = `${process.cwd()}\\public\\audio\\${fileName}`
    await writeFile(filePath, response.data, 'binary');

    const fileUrl = `/audio/${fileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error(error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ error: error.response.data }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}