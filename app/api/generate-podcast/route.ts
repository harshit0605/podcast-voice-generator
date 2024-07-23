// // File: app/api/generate-podcast/route.ts

// import OpenAI from 'openai';
// import axios, { AxiosError } from 'axios';
// import fs from 'fs/promises';
// import path from 'path';
// import ffmpeg from 'fluent-ffmpeg';
// import { v4 as uuidv4 } from 'uuid';
// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';

// const RequestSchema = z.object({
//     transcript: z.string().min(1),
//     voiceIds: z.record(z.string().min(1))
// });


// // Custom error classes
// class ElevenLabsAPIError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = 'ElevenLabsAPIError';
//   }
// }

// class AudioCombiningError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = 'AudioCombiningError';
//   }
// }

// const configuration = {
//   apiKey: process.env.OPENAI_API_KEY,
// };
// const openai = new OpenAI(configuration);

// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// async function combineAudioSegments(audioSegments: Buffer[]): Promise<Buffer> {
//   const tempDir = path.join(process.cwd(), 'temp');
//   await fs.mkdir(tempDir, { recursive: true });

//   const inputFiles: string[] = [];
//   const outputFile = path.join(tempDir, `${uuidv4()}.mp3`);

//   try {
//     // Write each audio segment to a temporary file
//     for (let i = 0; i < audioSegments.length; i++) {
//       const tempFile = path.join(tempDir, `segment_${i}.mp3`);
//       await fs.writeFile(tempFile, audioSegments[i]);
//       inputFiles.push(tempFile);
//     }

//     // Combine audio files using ffmpeg
//     await new Promise<void>((resolve, reject) => {
//       const command = ffmpeg();
//       inputFiles.forEach(file => {
//         command.input(file);
//       });
//       command
//         .on('error', (err) => reject(new AudioCombiningError(`FFmpeg error: ${err.message}`)))
//         .on('end', () => resolve())
//         .mergeToFile(outputFile, tempDir);
//     });

//     // Read the combined file
//     const combinedAudio = await fs.readFile(outputFile);

//     // Clean up temporary files
//     await Promise.all(inputFiles.map(file => fs.unlink(file)));
//     await fs.unlink(outputFile);

//     return combinedAudio;
//   } catch (error) {
//     console.error('Error combining audio segments:', error);
//     // Clean up any remaining temporary files
//     await Promise.all([...inputFiles, outputFile].map(file => 
//       fs.access(file).then(() => fs.unlink(file)).catch(() => {})
//     ));
//     throw new AudioCombiningError(error instanceof Error ? error.message : 'Unknown error during audio combining');
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { transcript, voiceIds } = RequestSchema.parse(body);


//     // Split the transcript into segments for each speaker
//     const segments = transcript.split('\n\n');

//     let audioSegments: Buffer[] = [];

//     for (const segment of segments) {
//         const colonIndex = segment.indexOf(':');
//         if (colonIndex === -1) {
//           throw new Error(`Invalid segment format: ${segment}`);
//         }
  
//         const speaker = segment.slice(0, colonIndex).trim();
//         let text = segment.slice(colonIndex + 1).trim();
//         console.log(speaker, text)
  
//         if (!text) {
//           throw new Error(`Empty text for speaker: ${speaker}`);
//         }
  
//         const voiceId = voiceIds[speaker];
//         if (!voiceId) {
//           throw new Error(`No voice ID provided for speaker: ${speaker}`);
//         }

//         // Check for break tag at the end of the text
//         let breakDuration = 0;
//         const breakMatch = text.match(/<break\s+time="(\d+(?:\.\d+)?)s"\s*\/>\s*$/);
//         if (breakMatch) {
//             breakDuration = parseFloat(breakMatch[1]);
//             text = text.replace(/<break\s+time="\d+(?:\.\d+)?s"\s*\/>\s*$/, '').trim();
//         }

  

//       try {
//         // Generate audio for each segment using ElevenLabs API
//         const response = await axios.post<Buffer>(
//           `${ELEVENLABS_API_URL}/${voiceId}`,
//           { 
//             text: text,
//             model_id: "eleven_multilingual_v2",
//             voice_settings: {
//               stability: 0.65,
//               similarity_boost: 0.87 }
//           },
//           {
//             headers: {
//               'Content-Type': 'application/json',
//               'xi-api-key': ELEVENLABS_API_KEY,
//             },
//             responseType: 'arraybuffer',
//           }
//         );

//         audioSegments.push(response.data);
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           const axiosError = error as AxiosError;
//           throw new ElevenLabsAPIError(`ElevenLabs API error: ${axiosError.message}. Status: ${axiosError.response?.status}`);
//         }
//         throw new ElevenLabsAPIError('Unknown error occurred while calling ElevenLabs API');
//       }
//     }

//     // Combine audio segments
//     const combinedAudio = await combineAudioSegments(audioSegments);

//     // Send the combined audio as a response
//     return new NextResponse(combinedAudio, {
//       status: 200,
//       headers: {
//         'Content-Type': 'audio/mpeg',
//         'Content-Disposition': 'attachment; filename="podcast.mp3"'
//       }
//     });
//   } catch (error) {
//     console.error('Error generating podcast:', error);

//     if (error instanceof z.ZodError) {
//         return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { 
//         status: 400 });
//     }
//     else if (error instanceof ElevenLabsAPIError) {
//       return NextResponse.json({ error: 'Error calling ElevenLabs API', details: error.message }, { status: 502 });
//     } else if (error instanceof AudioCombiningError) {
//       return NextResponse.json({ error: 'Error combining audio segments', details: error.message }, { status: 500 });
//     } else {
//       return NextResponse.json({ error: 'An unexpected error occurred', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
//     }
//   }
// }


import OpenAI from 'openai';
import axios, { AxiosError } from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

const RequestSchema = z.object({
    transcript: z.string().min(1),
    voiceIds: z.record(z.string().min(1))
});

// Custom error classes
class ElevenLabsAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsAPIError';
  }
}

class AudioCombiningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioCombiningError';
  }
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

async function combineAudioSegments(audioSegments: Buffer[]): Promise<Buffer> {
  try {
    // Concatenate all audio buffers
    const combinedBuffer = Buffer.concat(audioSegments);
    return combinedBuffer;
  } catch (error) {
    console.error('Error combining audio segments:', error);
    throw new AudioCombiningError(error instanceof Error ? error.message : 'Unknown error during audio combining');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, voiceIds } = RequestSchema.parse(body);

    // Split the transcript into segments for each speaker
    const segments = transcript.split('\n\n');

    
    let audioSegments: Buffer[] = [];
    
    for (const segment of segments) {
      // console.log(segment)
      const colonIndex = segment.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Invalid segment format: ${segment}`);
      }
      
      const speaker = segment.slice(0, colonIndex).trim();
      let text = segment.slice(colonIndex + 1).trim();
      console.log(speaker, text);
      console.log("---------------")
      
      if (!text) {
        throw new Error(`Empty text for speaker: ${speaker}`);
      }

      const voiceId = voiceIds[speaker];
      if (!voiceId) {
        throw new Error(`No voice ID provided for speaker: ${speaker}`);
      }

      // Check for break tag at the end of the text
      let breakDuration = 0;
      const breakMatch = text.match(/<break\s+time="(\d+(?:\.\d+)?)s"\s*\/>\s*$/);
      if (breakMatch) {
        breakDuration = parseFloat(breakMatch[1]);
        text = text.replace(/<break\s+time="\d+(?:\.\d+)?s"\s*\/>\s*$/, '').trim();
      }

      try {
        // Generate audio for each segment using ElevenLabs API
        const response = await axios.post<Buffer>(
          `${ELEVENLABS_API_URL}/${voiceId}`,
          { 
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.87
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            responseType: 'arraybuffer',
          }
        );

        audioSegments.push(response.data);

        // Add silence for break if needed
        if (breakDuration > 0) {
          const silenceBuffer = Buffer.alloc(Math.round(breakDuration * 44100) * 2); // 44.1 kHz, 16-bit
          audioSegments.push(silenceBuffer);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          throw new ElevenLabsAPIError(`ElevenLabs API error: ${axiosError.message}. Status: ${axiosError.response?.status}`);
        }
        throw new ElevenLabsAPIError('Unknown error occurred while calling ElevenLabs API');
      }
    }

    // Combine audio segments
    const combinedAudio = await combineAudioSegments(audioSegments);

    // Create a readable stream from the combined audio buffer
    const stream = new Readable();
    stream.push(combinedAudio);
    stream.push(null);

    // Return the audio as a streaming response
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="podcast.mp3"'
      }
    });
  } catch (error) {
    console.error('Error generating podcast:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    } else if (error instanceof ElevenLabsAPIError) {
      return NextResponse.json({ error: 'Error calling ElevenLabs API', details: error.message }, { status: 502 });
    } else if (error instanceof AudioCombiningError) {
      return NextResponse.json({ error: 'Error combining audio segments', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unexpected error occurred', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
  }
}