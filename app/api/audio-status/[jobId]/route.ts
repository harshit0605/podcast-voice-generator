// app/api/audio-status/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import pino from 'pino';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Setup logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

interface ElevenLabsJobStatus {
  status: string;
  progress: {
    text_processing: number;
    text_to_speech: number;
    total_progress: number;
    duration: number;
  };
  output?: {
    url: string;
  };
}

interface AudioGenerationStatus {
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  audioUrl?: string;
  error?: string;
}

class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function getElevenLabsJobStatus(jobId: string): Promise<AudioGenerationStatus> {
  try {
    logger.info({ jobId }, 'Fetching job status from ElevenLabs');
    const response = await axios.get<ElevenLabsJobStatus>(`${ELEVENLABS_API_URL}/${jobId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    const elevenlabsStatus = response.data;
    logger.debug({ elevenlabsStatus }, 'Received status from ElevenLabs');

    // Map ElevenLabs status to our AudioGenerationStatus
    let status: AudioGenerationStatus['status'];
    switch (elevenlabsStatus.status) {
      case 'created':
      case 'started':
        status = 'processing';
        break;
      case 'completed':
        status = 'completed';
        break;
      case 'failed':
        status = 'error';
        break;
      default:
        status = 'queued';
    }

    const audioGenerationStatus: AudioGenerationStatus = {
      status,
      progress: elevenlabsStatus.progress.total_progress * 100, // Convert to percentage
      audioUrl: elevenlabsStatus.output?.url,
      error: elevenlabsStatus.status === 'failed' ? 'Job failed at ElevenLabs' : undefined,
    };

    logger.info({ audioGenerationStatus }, 'Mapped ElevenLabs status to AudioGenerationStatus');
    return audioGenerationStatus;
  } catch (error) {
    logger.error({ error, jobId }, 'Error fetching job status from ElevenLabs');
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new APIError(
          axiosError.response.status,
          `ElevenLabs API error: ${axiosError.response.status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new APIError(500, 'No response received from ElevenLabs API');
      }
    }
    throw new APIError(500, 'Failed to fetch job status from ElevenLabs');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;
  logger.info({ jobId, method: 'GET' }, 'Received request for job status');

  try {
    const jobStatus = await getElevenLabsJobStatus(jobId);
    logger.info({ jobId, jobStatus }, 'Successfully retrieved job status');
    return NextResponse.json(jobStatus);
  } catch (error) {
    if (error instanceof APIError) {
      logger.error({ error, jobId }, 'API error in GET request');
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    logger.error({ error, jobId }, 'Unexpected error in GET request');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// Error handling middleware
export function onError(error: Error) {
  logger.error({ error }, 'Unhandled error in API route');
  return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}