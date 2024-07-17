import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, PauseCircle, Download, Volume2 } from 'lucide-react';

interface AudioPreviewProps {
  audioUrl: string;
  handleDownloadAudio: () => void;
}

const AudioPreview: React.FC<AudioPreviewProps> = ({ audioUrl, handleDownloadAudio }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayPause = (): void => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Volume2 className="mr-2" /> Audio Preview
        </h3>
        <div className="flex items-center space-x-4 mb-4">
          <Button
            onClick={togglePlayPause}
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
          >
            {isPlaying ? (
              <PauseCircle className="h-8 w-8" />
            ) : (
              <PlayCircle className="h-8 w-8" />
            )}
          </Button>
          <div className="flex-grow">
            <audio
              ref={audioRef}
              src={audioUrl}
              className="w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleDownloadAudio} className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Download Audio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioPreview;