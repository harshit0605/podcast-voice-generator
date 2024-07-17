"use client"
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input'; 
import { Select,  SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes";
import { useRouter } from 'next/router';


import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TranscriptItem {
  speaker: string;
  text: string;
}

// type SSMLTag = 'prosody' | 'emphasis' | 'break';

interface SSMLTag {
  name: string;
  attributes: Record<string, string>;
}

type AttributeType = 'select' | 'slider' | 'text' |'number'| 'select-or-slider';

interface AttributeConfig {
  type: AttributeType;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  valueMap?: Record<string, number>;
}

// type SSMLValue = string | number;

const AVAILABLE_TAGS: Record<string, { attributes: Record<string, AttributeConfig> }> = {
  prosody: {
    attributes: {
      rate: { 
        type: 'select-or-slider', 
        options: ['x-slow', 'slow', 'medium', 'fast', 'x-fast'], 
        min: 50, 
        max: 200, 
        step: 10, 
        unit: '%',
        valueMap: {
          'x-slow': 50,
          'slow': 75,
          'medium': 100,
          'fast': 150,
          'x-fast': 200
        }
      },
      pitch: { 
        type: 'select-or-slider', 
        options: ['x-low', 'low', 'medium', 'high', 'x-high'], 
        min: -100, 
        max: 100, 
        step: 10, 
        unit: 'Hz',
        valueMap: {
          'x-low': -100,
          'low': -50,
          'medium': 0,
          'high': 50,
          'x-high': 100
        }
      },
      volume: { 
        type: 'select-or-slider', 
        options: ['silent', 'x-soft', 'soft', 'medium', 'loud', 'x-loud'], 
        min: -6, 
        max: 6, 
        step: 1, 
        unit: 'dB',
        valueMap: {
          'silent': -6,
          'x-soft': -3,
          'soft': -1,
          'medium': 0,
          'loud': 3,
          'x-loud': 6
        }
      },
    }
  },
  emphasis: {
    attributes: {
      level: { type: 'select', options: ['strong', 'moderate', 'reduced'] }
    }
  },
  break: {
    attributes: {
      time: { type: 'number', unit: 'ms' },
      strength: { type: 'select', options: ['none', 'x-weak', 'weak', 'medium', 'strong', 'x-strong'] }
    }
  },
  say_as: {
    attributes: {
      'interpret-as': { type: 'select', options: ['characters', 'spell-out', 'cardinal', 'ordinal', 'fraction', 'unit', 'date', 'time', 'telephone', 'address'] }
    }
  },
  sub: {
    attributes: {
      alias: { type: 'text' }
    }
  },
  phoneme: {
    attributes: {
      alphabet: { type: 'select', options: ['ipa', 'x-sampa'] },
      ph: { type: 'text' }
    }
  },
};

interface TranscriptEditorProps {
  initialTranscript?: TranscriptItem[];
  onTranscriptChange: (transcript: TranscriptItem[]) => void;
}


const TranscriptEditorPage: React.FC<TranscriptEditorProps> = ({ initialTranscript =[], onTranscriptChange }) => {
  // const [transcript, setTranscript] = useState<TranscriptItem[]>([
  //   { speaker: 'Speaker 1', text: 'Hello, welcome to our podcast!' },
  //   { speaker: 'Speaker 2', text: 'Thanks for having me. It\'s great to be here.' },
  // ]);

  const [transcript, setTranscript] = useState<TranscriptItem[]>(initialTranscript);

  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);


  const [newSpeaker, setNewSpeaker] = useState<string>('');


  const handleTextChange = (index: number, newText: string): void => {
    const newTranscript = [...transcript];
    newTranscript[index].text = newText;
    setTranscript(newTranscript);
  };

  const handleSpeakerChange = (index: number, newSpeaker: string): void => {
    const newTranscript = [...transcript];
    newTranscript[index].speaker = newSpeaker;
    setTranscript(newTranscript);
  };

  // const addSSMLTag = (index: number, tag: SSMLTag, value: SSMLValue): void => {
  //   const newTranscript = [...transcript];
  //   let text = newTranscript[index].text;

  //   const updateOrAddTag = (tagName: string, attributes: Record<string, string>, content: string) => {
  //     const regex = new RegExp(`<${tagName}\\s*([^>]*)>(.*?)</${tagName}>`, 'gs');
  //     const matches = Array.from(content.matchAll(regex)); // Updated line
    
  //     if (matches.length > 0) {
  //       // Tag exists, update it
  //       return content.replace(regex, (_, existingAttrs, innerContent) => {
  //         const updatedAttrs = { ...Object.fromEntries(existingAttrs.split(/\s+/).filter(Boolean).map((attr:string) => attr.split('='))), ...attributes };
  //         const attributeString = Object.entries(updatedAttrs)
  //           .map(([key, val]) => `${key}=${val}`)
  //           .join(' ');
  //         return `<${tagName} ${attributeString}>${innerContent}</${tagName}>`;
  //       });
  //     } else {
  //       // Tag doesn't exist, add it
  //       const attributeString = Object.entries(attributes)
  //         .map(([key, val]) => `${key}=${val}`)
  //         .join(' ');
  //       return `<${tagName} ${attributeString}>${content}</${tagName}>`;
  //     }
  //   };

  //   switch (tag) {
  //     case 'prosody':
  //       const [rateKey, rateValue] = (value as string).split('=');
  //       text = updateOrAddTag('prosody', { [rateKey]: rateValue.replace(/"/g, '') }, text);
  //       break;
  //     case 'emphasis':
  //       const [levelKey, levelValue] = (value as string).split('=');
  //       text = updateOrAddTag('emphasis', { [levelKey]: levelValue.replace(/"/g, '') }, text);
  //       break;
  //     case 'break':
  //       // For break, we'll just update or add it at the end
  //       const breakRegex = /<break\s+time="[^"]*"\s*\/>/;
  //       const breakTag = `<break time="${value}s"/>`;
  //       if (breakRegex.test(text)) {
  //         text = text.replace(breakRegex, breakTag);
  //       } else {
  //         text += breakTag;
  //       }
  //       break;
  //   }

  //   newTranscript[index].text = text;
  //   setTranscript(newTranscript);
  // };

  const addOrUpdateSSMLTag = (index: number, tag: SSMLTag): void => {
    const newTranscript = [...transcript];
    let text = newTranscript[index].text;

    const regex = new RegExp(`<${tag.name}\\s*([^>]*)>(.*?)</${tag.name}>`, 'gs');
    const matches  = Array.from(text.matchAll(regex));

    if (matches.length > 0) {
      // Update existing tag
      text = text.replace(regex, (_, existingAttrs, innerContent) => {
        const updatedAttrs = { ...Object.fromEntries(existingAttrs.split(/\s+/).filter(Boolean).map((attr:string) => attr.split('='))), ...tag.attributes };
        const attributeString = Object.entries(updatedAttrs)
          .map(([key, val]) => `${key}="${val}"`)
          .join(' ');
        return `<${tag.name} ${attributeString}>${innerContent}</${tag.name}>`;
      });
    } else {
      // Add new tag
      const attributeString = Object.entries(tag.attributes)
        .map(([key, val]) => `${key}="${val}"`)
        .join(' ');
      text = `<${tag.name} ${attributeString}>${text}</${tag.name}>`;
    }

    newTranscript[index].text = text;
    setTranscript(newTranscript);
  };

  // const removeSSMLTag = (index: number, tag: 'prosody' | 'emphasis'): void => {
  //   const newTranscript = [...transcript];
  //   let text = newTranscript[index].text;
  
  //   const regex = new RegExp(`<${tag}\\s*[^>]*>(.*?)</${tag}>`, 'gs');
  //   text = text.replace(regex, '$1');
  
  //   newTranscript[index].text = text;
  //   setTranscript(newTranscript);
  // };

  const removeSSMLTag = (index: number, tagName: string): void => {
    const newTranscript = [...transcript];
    let text = newTranscript[index].text;

    const regex = new RegExp(`<${tagName}\\s*[^>]*>(.*?)</${tagName}>`, 'gs');
    text = text.replace(regex, '$1');

    newTranscript[index].text = text;
    setTranscript(newTranscript);
  };

  const SSMLTagEditor: React.FC<{ index: number }> = ({ index }) => {
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [attributes, setAttributes] = useState<Record<string, string | number>>({});    
    const [isOpen, setIsOpen] = useState(false);
    const [inputTypes, setInputTypes] = useState<Record<string, 'select' | 'number'>>({});


    const handleTagSelection = (tagName: string) => {
      setSelectedTag(tagName);
      setAttributes({});
      setInputTypes({});
    };

    // const handleAttributeChange = (attr: string, value: string | number) => {
    //   setAttributes(prev => ({ ...prev, [attr]: value }));
    // };

    const handleAttributeChange = (attr: string, value: string | number, config: AttributeConfig) => {
      if (typeof value === 'string' && config.valueMap && value in config.valueMap) {
        setAttributes(prev => ({ ...prev, [attr]: config.valueMap![value] }));
      } else {
        setAttributes(prev => ({ ...prev, [attr]: value }));
      }
    };

    const handleInputTypeChange = (attr: string, type: 'select' | 'number') => {
      setInputTypes(prev => ({ ...prev, [attr]: type }));
      setAttributes(prev => ({ ...prev, [attr]: '' }));
    };

    const getDiscreteValue = (attr: string, value: number, config: AttributeConfig): string => {
      if (config.valueMap) {
        const closestMatch = Object.entries(config.valueMap).reduce((prev, [key, mapValue]) => {
          return Math.abs(mapValue - value) < Math.abs(prev[1] - value) ? [key, mapValue] : prev;
        });
        return closestMatch[0];
      }
      return value.toString();
    };

    const handleAddTag = () => {
      if (selectedTag) {
        const stringAttributes = Object.entries(attributes).reduce((acc, [key, value]) => {
          const config = AVAILABLE_TAGS[selectedTag].attributes[key];
          if (typeof value === 'number' && config.type === 'select-or-slider') {
            acc[key] = getDiscreteValue(key, value, config);
          } else {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>);
        addOrUpdateSSMLTag(index, { name: selectedTag, attributes: stringAttributes });
        setIsOpen(false);
      }
    };

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSelectedTag('');
        setAttributes({});
      }
    };

    const renderAttributeInput = (attr: string, config: AttributeConfig) => {
      switch (config.type) {
        // case 'select-or-number':
        //   return (
        //     <div key={attr} className="space-y-2">
        //       <RadioGroup 
        //         onValueChange={(value) => handleInputTypeChange(attr, value as 'select' | 'number')} 
        //         value={inputTypes[attr] || 'select'}
        //       >
        //         <div className="flex items-center space-x-2">
        //           <RadioGroupItem value="select" id={`${attr}-select`} />
        //           <Label htmlFor={`${attr}-select`}>Preset</Label>
        //         </div>
        //         <div className="flex items-center space-x-2">
        //           <RadioGroupItem value="number" id={`${attr}-number`} />
        //           <Label htmlFor={`${attr}-number`}>Custom</Label>
        //         </div>
        //       </RadioGroup>
        //       {inputTypes[attr] === 'number' ? (
        //         <Input
        //           type="number"
        //           placeholder={`${attr} (${config.unit})`}
        //           value={attributes[attr] || ''}
        //           onChange={(e) => handleAttributeChange(attr, e.target.value)}
        //         />
        //       ) : (
        //         <Select 
        //           onValueChange={(value) => handleAttributeChange(attr, value)}
        //           value={attributes[attr] || ''}
        //         >
        //           {/* Select options */}
        //         </Select>
        //       )}
        //     </div>
        //   );
        case 'select-or-slider':
          const sliderValue = typeof attributes[attr] === 'number' ? attributes[attr] : config.min || 0;
          const discreteValue = getDiscreteValue(attr, sliderValue as number, config);

          return (
            <div key={attr} className="space-y-2">
              <Label>{attr}</Label>
              <Select 
                onValueChange={(value) => handleAttributeChange(attr, value, config)}
                value={discreteValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`${attr} (or use slider)`} />
                </SelectTrigger>
                <SelectContent>
                  {config.options?.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Slider
                  min={config.min || 0}
                  max={config.max || 100}
                  step={config.step || 1}
                  value={[sliderValue as number]}
                  onValueChange={([value]) => handleAttributeChange(attr, value,config)}
                />
                <span>{sliderValue}{config.unit}</span>
              </div>
            </div>
          );    
          
        case 'select':
          return (
            <Select 
              key={attr}
              onValueChange={(value) => handleAttributeChange(attr, value, config)}
              value={attributes[attr]?.toString() || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder={attr} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'number':
          return (
            <Input
              key={attr}
              type="number"
              placeholder={attr}
              value={attributes[attr] || ''}
              onChange={(e) => handleAttributeChange(attr, e.target.value,config)}
            />
          );
        case 'text':
        default:
          return (
            <Input
              key={attr}
              type="text"
              placeholder={attr}
              value={attributes[attr] || ''}
              onChange={(e) => handleAttributeChange(attr, e.target.value,config)}
            />
          );
      }
    };

    useEffect(() => {
      if (selectedTag && AVAILABLE_TAGS[selectedTag]) {
        const initialAttributes: Record<string, string | number> = {};
        Object.entries(AVAILABLE_TAGS[selectedTag].attributes).forEach(([attr, config]) => {
          if (config.type === 'select-or-slider') {
            initialAttributes[attr] = config.min || 0;
          }
        });
        setAttributes(initialAttributes);
      }
    }, [selectedTag]);

    return (
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline">Manage SSML Tags</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <Select onValueChange={handleTagSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select SSML Tag" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AVAILABLE_TAGS).map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTag && Object.entries(AVAILABLE_TAGS[selectedTag].attributes).map(([attr, config]) => 
              renderAttributeInput(attr, config)
            )}
            <Button onClick={handleAddTag}>Add/Update Tag</Button>
            {selectedTag && (
              <Button onClick={() => {
                removeSSMLTag(index, selectedTag);
                setIsOpen(false);
              }} variant="outline">
                Remove Tag
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const addNewSpeakerBlock = (): void => {
    if (newSpeaker.trim() !== '') {
      setTranscript([...transcript, { speaker: newSpeaker, text: '' }]);
      setNewSpeaker('');
    }
  };

  const removeSpeakerBlock = (index: number): void => {
    const newTranscript = transcript.filter((_, i) => i !== index);
    setTranscript(newTranscript);
  };


  return (
    
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Podcast Transcript Editor</h1>
      {transcript.map((item, index) => (
        <div key={index} className="mb-4 p-4 border rounded">
          <h2 className="font-semibold">{item.speaker}</h2>

          <Input
            value={item.speaker}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpeakerChange(index, e.target.value)}
            className="mb-2"
            placeholder="Speaker Name"
          />

          <textarea
            value={item.text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextChange(index, e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
          {/* <div className="mt-2 flex space-x-2">
            <Select 
              onValueChange={(value: string) => addSSMLTag(index, 'prosody', `rate="${value}"`)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Speech Rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => removeSSMLTag(index, 'prosody')} variant="outline">
              Remove Prosody
            </Button>

            <Select
              onValueChange={(value: string) => addSSMLTag(index, 'emphasis', `level="${value}"`)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Emphasis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strong">Strong</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="reduced">Reduced</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => removeSSMLTag(index, 'emphasis')} variant="outline">
              Remove Emphasis
            </Button>
            <Slider
              min={0}
              max={5}
              step={0.5}
              onValueChange={(value: number[]) => addSSMLTag(index, 'break', value[0])}
              className="w-32"
            />
            <Button onClick={() => removeSpeakerBlock(index)} variant="destructive">
              Remove
            </Button>
          </div> */}
          <div className="flex space-x-2">
            <SSMLTagEditor index={index} />
            <Button onClick={() => removeSpeakerBlock(index)} variant="destructive">
              Remove Block
            </Button>
          </div>
        </div>
      ))}

      <div className="mt-4 flex space-x-2">
        <Input
          value={newSpeaker}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSpeaker(e.target.value)}
          placeholder="New Speaker Name"
          className="flex-grow"
        />
        <Button onClick={addNewSpeakerBlock}>Add Speaker</Button>
      </div>
    </div>
  );
};

export default TranscriptEditorPage;