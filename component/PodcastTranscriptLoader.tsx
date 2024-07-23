"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AlertCircle } from "lucide-react";
import axios from 'axios';


import TranscriptEditor from './TranscriptEditor';
import AudioPreview from './AudioPreview';

interface TranscriptItem {
  speaker: string;
  text: string;
  addPause: boolean;
}

interface AudioGenerationStatus {
    status: 'queued' | 'processing' | 'completed' | 'error';
    progress: number;
    audioUrl?: string;
    error?: string;
}





const PodcastTranscriptLoader: React.FC = () => {
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [parsedTranscript, setParsedTranscript] = useState<TranscriptItem[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [ssmlContent, setSSMLContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ssmlFileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [audioGenerationStatus, setAudioGenerationStatus] = useState<AudioGenerationStatus | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [voiceIds, setVoiceIds] = useState<Record<string, string>>({});
  const [isLoadingVoices, setIsLoadingVoices] = useState<boolean>(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [defaultPauseTime, setDefaultPauseTime] = useState<number>(1);

  useEffect(() => {
    fetchVoiceIds();
  }, []);

  // Use useEffect to set mounted to true after the component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // const generateSSML = useCallback((): string => {
  //   let ssml = '<speak>\n';
  //   parsedTranscript.forEach((item, index) => {
  //     ssml += '  <p>\n';
  //     ssml += `    <s>${item.speaker}: ${item.text}</s>\n`;
  //     if (item.addPause && index < parsedTranscript.length - 1) {
  //       ssml += `    <break time="${defaultPauseTime}s"/>\n`;
  //     }
  //     ssml += '  </p>\n';
  //   });
  //   ssml += '</speak>';
  //   return ssml;
  // }, [parsedTranscript, defaultPauseTime]);
  
  const generateSSML = useCallback((): string => {
    let ssml = '';
    parsedTranscript.forEach((item, index) => {
      let speakerText = item.text;
      
      // Remove the closing </speak> tag if it exists
      speakerText = speakerText.replace('</speak>', '');
      
      // Check if there's already a break tag at the end
      const hasExistingBreak = /<break[^>]*>\s*$/.test(speakerText);
      
      // Add the break tag if needed and it's not the last item
      if (item.addPause && index < parsedTranscript.length - 1 && !hasExistingBreak) {
        speakerText += `<break time="${defaultPauseTime}s"/>`;
      }
      
      // Close the speak tag
      speakerText += '</speak>';
      
      // Add the speaker's line with a newline character at the end
      ssml += `${item.speaker}: ${speakerText}\n\n`;
    });
  
    // Remove the last extra newline and trim any remaining whitespace
    return ssml.trim();
  }, [parsedTranscript, defaultPauseTime]);

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };


  const fetchVoiceIds = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
        }
      });

      const availableVoices = response.data.voices;
      const voiceMapping: Record<string, string> = {};

      availableVoices.forEach((voice: any) => {
        voiceMapping[voice.name] = voice.voice_id;
      });

      setVoiceIds(voiceMapping);
    } catch (error) {
      console.error('Error fetching voice IDs:', error);
      setError('Failed to fetch voice IDs from ElevenLabs');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Render placeholder or null while waiting for mounting
  if (!mounted) {
    return null; // or a loading placeholder
  }

  


  const parseTranscript = () => {
    const lines = rawTranscript.split('\n');
    const parsed: TranscriptItem[] = [];
    let currentSpeaker = '';
    let currentText = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') {
        // Empty line, add current speaker and text if they exist
        if (currentSpeaker && currentText) {
          parsed.push({
            speaker: currentSpeaker,
            text: currentText.trim(),
            addPause: true // default value 
          });
          currentSpeaker = '';
          currentText = '';
        }
      } else {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1) {
          // New speaker found
          if (currentSpeaker && currentText) {
            parsed.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              addPause: true
            });
          }
          currentSpeaker = trimmedLine.slice(0, colonIndex).trim();
          currentText = trimmedLine.slice(colonIndex + 1).trim();
        } else {
          // Continuation of previous speaker's text
          currentText += ' ' + trimmedLine;
        }
      }
    });

    // Add the last speaker and text if they exist
    if (currentSpeaker && currentText) {
      parsed.push({
        speaker: currentSpeaker,
        text: currentText.trim(),
        addPause: true
      });
    }

    setParsedTranscript(parsed);
    setIsEditing(true);
  };

  const handleRawTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawTranscript(e.target.value);
  };

  

  const handleExportSSML = () => {
    const ssml = generateSSML();
    setSSMLContent(ssml);
    setShowExportOptions(true);
  };

  const handleDownloadSSML = () => {
    const blob = new Blob([ssmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transcript.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const handleCopySSML = () => {
    navigator.clipboard.writeText(ssmlContent).then(() => {
      alert('SSML content copied to clipboard!');
      setShowExportOptions(false);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setRawTranscript(content);
      };
      reader.readAsText(file);
    }
  };

//   const handleSSMLFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const content = e.target?.result as string;
//         try {
//           parseSSMLContent(content);
//           setError(null); // Clear any previous errors
//         } catch (err) {
//           setError("Failed to parse SSML file. Please ensure it's a valid SSML format.");
//           console.error("SSML parsing error:", err);
//           setIsEditing(false);
//         }
//       };
//       reader.onerror = (e) => {
//         setError("Failed to read the file. Please try again.");
//         console.error("File reading error:", e);
//       };
//       reader.readAsText(file);
//     }
//   };

const handleSSMLFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const parsedTranscript = parseSSMLContent(content);
          console.log(parsedTranscript)
          setParsedTranscript(parsedTranscript);
          setIsEditing(true);
        } catch (err) {
          setError("Failed to parse SSML file. Please ensure it's a valid SSML format.");
          console.error("SSML parsing error:", err);
        }
      };
      reader.readAsText(file);
    }
  };

//   const parseSSMLContent = (ssmlContent: string) => {
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(ssmlContent, "text/xml");
    
//     // Check for parsing errors
//     const parseError = xmlDoc.getElementsByTagName("parsererror");
//     if (parseError.length > 0) {
//       throw new Error("Invalid XML format");
//     }

//     const speak = xmlDoc.getElementsByTagName("speak")[0];
//     if (!speak) {
//       throw new Error("Missing <speak> tag");
//     }

//     const paragraphs = speak.getElementsByTagName("p");
//     const parsed: TranscriptItem[] = [];

//     for (let i = 0; i < paragraphs.length; i++) {
//       const sentences = paragraphs[i].getElementsByTagName("s");
//       for (let j = 0; j < sentences.length; j++) {
//         const sentence = sentences[j];
//         const sentenceContent = new XMLSerializer().serializeToString(sentence);
//         const colonIndex = sentenceContent.indexOf(':');
        
//         if (colonIndex !== -1) {
//             const speaker = sentenceContent.slice(3, colonIndex).trim(); // Remove the opening <s> tag
//             const text = sentenceContent.slice(colonIndex + 1, -4).trim(); // Remove the closing </s> tag
//             parsed.push({
//               speaker: speaker,
//               text: text,
//               addPause: true
//             });
//           } else {
//             // If no colon is found, use the previous speaker or a generic one
//             const previousSpeaker = parsed.length > 0 ? parsed[parsed.length - 1].speaker : `Speaker ${i + 1}`;
//             parsed.push({
//               speaker: previousSpeaker,
//               text: sentenceContent.slice(3, -4).trim(), // Remove the opening <s> and closing </s> tags
//               addPause: true
//             });
//           }
//       }
//     }

//     if (parsed.length === 0) {
//       throw new Error("No valid transcript items found in the SSML");
//     }

//     setParsedTranscript(parsed);
//     setIsEditing(true);

//   };

//   const parseSSMLContent = (ssmlContent: string): TranscriptItem[] => {
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(ssmlContent, "text/xml");
    
//     // Check for parsing errors
//     const parseError = xmlDoc.getElementsByTagName("parsererror");
//     if (parseError.length > 0) {
//       throw new Error("Invalid XML format");
//     }
  
//     const speak = xmlDoc.getElementsByTagName("speak")[0];
//     if (!speak) {
//       throw new Error("Missing <speak> tag");
//     }
  
//     const paragraphs = speak.getElementsByTagName("p");
//     const parsed: TranscriptItem[] = [];
  
//     for (let i = 0; i < paragraphs.length; i++) {
//       const sentences = paragraphs[i].getElementsByTagName("s");
//       for (let j = 0; j < sentences.length; j++) {
//         const sentence = sentences[j];
//         const text = getTextContent(sentence);
//         const colonIndex = text.indexOf(':');
        
//         if (colonIndex !== -1) {
//           parsed.push({
//             speaker: text.slice(0, colonIndex).trim(),
//             text: text.slice(colonIndex + 1).trim(),
//             addPause: false // Initialize as false
//           });
//         } else {
//           const previousSpeaker = parsed.length > 0 ? parsed[parsed.length - 1].speaker : `Speaker ${i + 1}`;
//           parsed.push({
//             speaker: previousSpeaker,
//             text: text.trim(),
//             addPause: false // Initialize as false
//           });
//         }
//       }
      
//       // Check if there's a break tag directly under the paragraph, after all sentences
//       const breakAfterSentences = paragraphs[i].getElementsByTagName("break");
//       if (breakAfterSentences.length > 0 && breakAfterSentences[breakAfterSentences.length - 1].parentNode === paragraphs[i]) {
//         if (parsed.length > 0) {
//           parsed[parsed.length - 1].addPause = true;
//         }
//       }
//     }
  
//     return parsed;
//   };

// const parseSSMLContent = (ssmlContent: string): TranscriptItem[] => {
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(ssmlContent, "text/xml");
    
//     // Check for parsing errors
//     const parseError = xmlDoc.getElementsByTagName("parsererror");
//     if (parseError.length > 0) {
//       throw new Error("Invalid XML format");
//     }
  
//     const speak = xmlDoc.getElementsByTagName("speak")[0];
//     if (!speak) {
//       throw new Error("Missing <speak> tag");
//     }
  
//     const paragraphs = speak.getElementsByTagName("p");
//     const parsed: TranscriptItem[] = [];
  
//     for (let i = 0; i < paragraphs.length; i++) {
//       const sentences = paragraphs[i].getElementsByTagName("s");
//       for (let j = 0; j < sentences.length; j++) {
//         const sentence = sentences[j];
//         const text = getTextContent(sentence);
//         const colonIndex = text.indexOf(':');
        
//         if (colonIndex !== -1) {
//           parsed.push({
//             speaker: text.slice(0, colonIndex).trim(),
//             text: text.slice(colonIndex + 1).trim(),
//             addPause: false // Initialize as false
//           });
//         } else {
//           const previousSpeaker = parsed.length > 0 ? parsed[parsed.length - 1].speaker : `Speaker ${i + 1}`;
//           parsed.push({
//             speaker: previousSpeaker,
//             text: text.trim(),
//             addPause: false // Initialize as false
//           });
//         }
//       }
      
//       // Check if there's a break tag directly under the paragraph, after all sentences
//       const breakAfterSentences = paragraphs[i].getElementsByTagName("break");
//       if (breakAfterSentences.length > 0 && breakAfterSentences[breakAfterSentences.length - 1].parentNode === paragraphs[i]) {
//         if (parsed.length > 0) {
//           parsed[parsed.length - 1].addPause = true;
//         }
//       }
//     }
  
//     return parsed;
//   };

const parseSSMLContent = (ssmlContent: string): TranscriptItem[] => {
    const lines = ssmlContent.split('\n');
    const parsed: TranscriptItem[] = [];
    let currentSpeaker = '';
    let currentText = '';
    let addPause = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') return;

      const speakerMatch = trimmedLine.match(/^(.*?):\s*(.*)$/);
      if (speakerMatch) {
        if (currentSpeaker && currentText) {
          parsed.push({ speaker: currentSpeaker, text: currentText, addPause });
        }
        currentSpeaker = speakerMatch[1].trim();
        currentText = speakerMatch[2].trim();
        addPause = false;
      } else {
        currentText += ' ' + trimmedLine;
      }

      if (trimmedLine.includes('<break')) {
        addPause = true;
      }
    });

    if (currentSpeaker && currentText) {
      parsed.push({ speaker: currentSpeaker, text: currentText, addPause });
    }

    return parsed;
  };
  
  // Helper function to get text content, preserving SSML tags
  const getTextContent = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'break') {
        return ''; // Ignore break tags when getting text content
      }
      
      const childContent = Array.from(node.childNodes)
        .map(child => getTextContent(child))
        .join('');
      
      if (tagName === 's') {
        return childContent; // Don't wrap 's' tags
      }
      
      return `<${tagName}${getAttributes(element)}>${childContent}</${tagName}>`;
    }
    
    return '';
  };
  
  // Helper function to get element attributes
  const getAttributes = (element: Element): string => {
    return Array.from(element.attributes)
      .map(attr => ` ${attr.name}="${attr.value}"`)
      .join('');
  };
  
  // Helper function to get text content, including nested tags
//   const getTextContent = (node: Node): string => {
//     let text = '';
//     for (let child of Array.from(node.childNodes)) {
//       if (child.nodeType === 3) { // Text node
//         text += child.textContent;
//       } else if (child.nodeType === 1) { // Element node
//         const tagName = (child as Element).tagName.toLowerCase();
//         if (tagName !== 'break') { // Ignore break tags when getting text content
//           text += `<${tagName}>${getTextContent(child)}</${tagName}>`;
//         }
//       }
//     }
//     return text;
//   };

  const triggerSSMLFileUpload = () => {
    ssmlFileInputRef.current?.click();
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };




  const handleGenerateAudio = async () => {
    if (isLoadingVoices) {
      setError('Voice IDs are still loading. Please wait.');
      return;
    }

    setIsGeneratingAudio(true);
    setError(null);
    setAudioGenerationStatus({ status: 'queued', progress: 0 });

    const speakers = Array.from(new Set(parsedTranscript.map(item => item.speaker)));
    const transcript = parsedTranscript.map(item => `${item.speaker}: ${item.text}`).join('\n\n');

    const speakerVoiceIds: Record<string, string> = {};
    speakers.forEach((speaker, index) => {
      const availableVoices = Object.keys(voiceIds);
      if (index < availableVoices.length) {
        speakerVoiceIds[speaker] = voiceIds[availableVoices[index]];
      } else {
        console.warn(`No voice available for speaker: ${speaker}`);
      }
    });

    try {
      const response = await axios.post('/api/generate-podcast', {
        transcript,
        voiceIds: speakerVoiceIds
      }, {
        responseType: 'blob'
      });

    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    setAudioGenerationStatus({
      status: 'completed',
      progress: 100,
      audioUrl: audioUrl
    });

    setError(null);

    } catch (err) {
      console.error('Error generating audio:', err);
      setError('Failed to generate audio. Please try again.');
      setAudioGenerationStatus({
        status: 'error',
        progress: 0,
        error: 'Failed to generate audio'
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

//   const handleManualPoll = async () => {
//     if (!jobId) {
//       setError('No active job to poll');
//       return;
//     }
//     await pollAudioStatus(jobId);
//   };

//   const pollAudioStatus = async (jobId: string) => {
//     try {
//       const response = await axios.get(`/api/audio-status/${jobId}`);
//       const status = response.data;

//       setAudioGenerationStatus(status);

//       if (status.status === 'completed') {
//         clearInterval(pollInterval!);
//         setPollInterval(null);
//         setIsGeneratingAudio(false);
//       } else if (status.status === 'error') {
//         clearInterval(pollInterval!);
//         setPollInterval(null);
//         setIsGeneratingAudio(false);
//         setError(status.error || 'An error occurred during audio generation');
//       }
//     } catch (err) {
//       console.error('Error polling audio status:', err);
//       clearInterval(pollInterval!);
//       setPollInterval(null);
//       setIsGeneratingAudio(false);
//       setError('Failed to get audio generation status');
//       setAudioGenerationStatus({ status: 'error', progress: 0, error: 'Failed to get status' });
//     }
//   };

  const handleDownloadAudio = () => {
    if (audioGenerationStatus?.audioUrl) {
      const link = document.createElement('a');
      link.href = audioGenerationStatus.audioUrl;
      link.download = 'generated_podcast.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };



//   return (
//       <div className="bg-background text-foreground min-h-screen p-4 space-y-4">
//         <div className="flex justify-between items-center">
//             <h1 className="text-3xl font-bold">Podcast Transcript Loader</h1>
//             <Button onClick={toggleTheme} variant="outline" size="icon">
//             {theme === "light" ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
//             </Button>
//         </div>
//         {error && (
//         <Alert variant="destructive">
//             <AlertTitle>Error</AlertTitle>
//             <AlertDescription>{error}</AlertDescription>
//         </Alert>
//         )}
//         {!isEditing ? (
//         <>
//           <h2 className="text-2xl font-bold">Load Podcast Transcript</h2>
//           <Textarea
//             value={rawTranscript}
//             onChange={handleRawTranscriptChange}
//             placeholder="Paste your transcript here..."
//             rows={10}
//             className="w-full p-2 border rounded bg-background text-foreground"
//             />
//           <div className="flex space-x-2">
//             <Button onClick={parseTranscript}>Load Transcript</Button>
//             <Button onClick={triggerFileUpload}>Upload Transcript File</Button>
//             <Button onClick={triggerSSMLFileUpload}>Upload SSML File</Button>
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               accept=".txt"
//               style={{ display: 'none' }}
//             />
//             <input
//             type="file"
//             ref={ssmlFileInputRef}
//             onChange={handleSSMLFileUpload}
//             accept=".ssml,.xml,.txt"
//             style={{ display: 'none' }}
//             />
//           </div>
//         </>
//       ) : (
//         <>
//           <h2 className="text-2xl font-bold">Edit Podcast Transcript</h2>
//           <TranscriptEditor initialTranscript={parsedTranscript} onTranscriptChange={setParsedTranscript} voiceIds={voiceIds}/>
//           <div className="flex space-x-2">
//             <Button onClick={() => setIsEditing(false)}>Back to Raw Transcript</Button>
//             <Popover open={showExportOptions} onOpenChange={setShowExportOptions}>
//               <PopoverTrigger asChild>
//                 <Button onClick={handleExportSSML}>Export SSML</Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-48">
//                 <div className="flex flex-col space-y-2">
//                   <Button onClick={handleDownloadSSML}>Download SSML</Button>
//                   <Button onClick={handleCopySSML}>Copy to Clipboard</Button>
//                 </div>
//               </PopoverContent>
//             </Popover>
//             <Button 
//               onClick={handleGenerateAudio} 
//               disabled={isGeneratingAudio || isLoadingVoices}
//             >
//               {isLoadingVoices ? 'Loading Voices...' : isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
//             </Button>
//             {jobId && (
//               <Button onClick={handleManualPoll} disabled={isGeneratingAudio}>
//                 Poll Audio Status
//               </Button>
//             )}
//           </div>
//           {audioGenerationStatus && (
//             <div className="mt-4">
//               <h3 className="text-xl font-semibold mb-2">Audio Generation Status</h3>
//               <Progress value={audioGenerationStatus.progress} className="w-full mb-2" />
//               <p className="mb-2">Status: {audioGenerationStatus.status}</p>
//               {audioGenerationStatus.status === 'completed' && (
//                 <Button onClick={handleDownloadAudio}>Download Generated Audio</Button>
//               )}
//               {audioGenerationStatus.status === 'error' && (
//                 <Alert variant="destructive">
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertTitle>Error</AlertTitle>
//                   <AlertDescription>{audioGenerationStatus.error}</AlertDescription>
//                 </Alert>
//               )}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );

return (
    <div className="bg-background text-foreground min-h-screen p-6 space-y-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Podcast Transcript Loader</h1>
        <Button onClick={toggleTheme} variant="outline" size="icon">
          {theme === "light" ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </header>
  
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
  
      <div className="bg-card rounded-lg shadow-md p-6">
        {!isEditing ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Load Podcast Transcript</h2>
            <Textarea
              value={rawTranscript}
              onChange={handleRawTranscriptChange}
              placeholder="Paste your transcript here..."
              rows={10}
              className="w-full p-2 border rounded bg-background text-foreground mb-4"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={parseTranscript}>Load Transcript</Button>
              <Button onClick={triggerFileUpload} variant="outline">Upload Transcript</Button>
              <Button onClick={triggerSSMLFileUpload} variant="outline">Upload SSML</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" style={{ display: 'none' }} />
              <input type="file" ref={ssmlFileInputRef} onChange={handleSSMLFileUpload} accept=".ssml,.xml,.txt" style={{ display: 'none' }} />
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Podcast Transcript</h2>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Back to Raw Transcript</Button>
            </div>
            <TranscriptEditor
                initialTranscript={parsedTranscript}
                onTranscriptChange={setParsedTranscript}
                voiceIds={voiceIds}
                defaultPauseTime={defaultPauseTime}
                setDefaultPauseTime={setDefaultPauseTime}
            />            
            {/* <TranscriptEditor
              initialTranscript={[
                { speaker: "Speaker 1", text: "Hello, world!" },
                { speaker: "Speaker 2", text: "Hi there!" }
              ]}
              onTranscriptChange={(updatedTranscript) => {
                console.log(updatedTranscript);
                // Handle the updated transcript
              }}
            /> */}
            <div className="mt-6 flex flex-wrap gap-2 items-center">
              <Popover open={showExportOptions} onOpenChange={setShowExportOptions}>
                <PopoverTrigger asChild>
                  <Button onClick={handleExportSSML} variant="outline">Export SSML</Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="flex flex-col space-y-2">
                    <Button onClick={handleDownloadSSML} variant="ghost">Download SSML</Button>
                    <Button onClick={handleCopySSML} variant="ghost">Copy to Clipboard</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={handleGenerateAudio} 
                disabled={isGeneratingAudio || isLoadingVoices}
              >
                {isLoadingVoices ? 'Loading Voices...' : isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
              </Button>
              {/* {jobId && (
                <Button onClick={handleManualPoll} disabled={isGeneratingAudio} variant="outline" size="sm">
                  Poll Audio Status
                </Button>
              )} */}
            </div>
            
            {audioGenerationStatus && (
              <div className="mt-8 bg-muted p-4 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Audio Generation Status</h3>
                {/* <Progress value={audioGenerationStatus.progress} className="w-full mb-2" /> */}
                <p className="mb-2">Status: {audioGenerationStatus.status}</p>
                {audioGenerationStatus.status === 'completed' && audioGenerationStatus.audioUrl &&(
                    <AudioPreview 
                    audioUrl={audioGenerationStatus.audioUrl} 
                    handleDownloadAudio={handleDownloadAudio}
                    />
                )}
                {audioGenerationStatus.status === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{audioGenerationStatus.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PodcastTranscriptLoader;
