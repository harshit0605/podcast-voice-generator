"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui components are available
import { Input } from '@/components/ui/input'; // Assuming shadcn/ui components are available
import { Select,  SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import ContentEditable from 'react-contenteditable';
import { useTheme } from 'next-themes';
import { DOMParser } from 'xmldom';


interface TranscriptItem {
  speaker: string;
  text: string;
  addPause: boolean;
}

// type SSMLTag = 'prosody' | 'emphasis' | 'break';

interface SSMLTag {
  name: string;
  attributes: Record<string, string>;
}

// const TAG_COLORS = {
//   prosody: '#FFB3BA',
//   emphasis: '#BAFFC9',
//   break: '#BAE1FF',
//   'say-as': '#FFFFBA',
//   sub: '#FFD9BA',
//   phoneme: '#E0BAFF'
// };

// const TAG_COLORS = {
//   light: {
//     prosody: 'bg-pink-200 hover:bg-pink-300 border-pink-300 text-pink-800',
//     emphasis: 'bg-green-200 hover:bg-green-300 border-green-300 text-green-800',
//     break: 'bg-blue-200 hover:bg-blue-300 border-blue-300 text-blue-800',
//     'say-as': 'bg-yellow-200 hover:bg-yellow-300 border-yellow-300 text-yellow-800',
//     sub: 'bg-orange-200 hover:bg-orange-300 border-orange-300 text-orange-800',
//     phoneme: 'bg-purple-200 hover:bg-purple-300 border-purple-300 text-purple-800'
//   },
//   dark: {
//     prosody: 'bg-pink-900 hover:bg-pink-800 border-pink-700 text-pink-200',
//     emphasis: 'bg-green-900 hover:bg-green-800 border-green-700 text-green-200',
//     break: 'bg-blue-900 hover:bg-blue-800 border-blue-700 text-blue-200',
//     'say-as': 'bg-yellow-900 hover:bg-yellow-800 border-yellow-700 text-yellow-200',
//     sub: 'bg-orange-900 hover:bg-orange-800 border-orange-700 text-orange-200',
//     phoneme: 'bg-purple-900 hover:bg-purple-800 border-purple-700 text-purple-200'
//   }
// };

const TAG_COLORS = {
  light: {
    prosody: { bg: '#FFB3BA', text: '#000000' },
    emphasis: { bg: '#BAFFC9', text: '#000000' },
    break: { bg: '#BAE1FF', text: '#000000' },
    'say-as': { bg: '#FFFFBA', text: '#000000' },
    sub: { bg: '#FFD9BA', text: '#000000' },
    phoneme: { bg: '#E0BAFF', text: '#000000' }
  },
  dark: {
    prosody: { bg: '#800020', text: '#FFFFFF' },
    emphasis: { bg: '#006400', text: '#FFFFFF' },
    break: { bg: '#00008B', text: '#FFFFFF' },
    'say-as': { bg: '#808000', text: '#FFFFFF' },
    sub: { bg: '#8B4513', text: '#FFFFFF' },
    phoneme: { bg: '#4B0082', text: '#FFFFFF' }
  }
};

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
  'say-as': {
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
  voiceIds: Record<string, string>;
  defaultPauseTime: number;
  setDefaultPauseTime: (time: number) => void;
}


const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ initialTranscript =[], onTranscriptChange, voiceIds, defaultPauseTime, setDefaultPauseTime}) => {

  // const [transcript, setTranscript] = useState<TranscriptItem[]>([
  //   { speaker: 'Speaker 1', text: 'Hello, welcome to our podcast!' },
  //   { speaker: 'Speaker 2', text: 'Thanks for having me. It\'s great to be here.' },
  // ]);

  const [transcript, setTranscript] = useState<TranscriptItem[]>(initialTranscript);
  const [newSpeaker, setNewSpeaker] = useState<string>('');
  // const [defaultPauseTime, setDefaultPauseTime] = useState<number>(1);
  const contentEditableRefs = useRef<(HTMLElement | null)[]>([]);
  const [selectedTagsForRemoval, setSelectedTagsForRemoval] = useState<Record<number, Set<string>>>({});
  const { toast } = useToast();
  const { theme } = useTheme();

  // Use a ref to store the highlighted version of the transcript
  const highlightedTranscriptRef = useRef<string[]>([]);

  const highlightSSMLTags = useCallback((text: string): string => {
    const colorScheme = theme === 'dark' ? TAG_COLORS.dark : TAG_COLORS.light;
    let highlightedText = text;

    Object.entries(colorScheme).forEach(([tag, colors]) => {
      const regex = new RegExp(`<${tag}([^>]*)>(.*?)</${tag}>`, 'gi');
      highlightedText = highlightedText.replace(regex, (match, attributes, content) => {
        return `<span style="background-color: ${colors.bg}; color: ${colors.text};">${match}</span>`;
      });
    });

    return highlightedText;
  }, [theme]);

  const updateContentEditables = useCallback(() => {
    transcript.forEach((_, index) => {
      const contentEditable = contentEditableRefs.current[index];
      if (contentEditable) {
        contentEditable.innerHTML = highlightedTranscriptRef.current[index];
      }
    });
  }, [transcript]);

  // Initial highlighting
  useEffect(() => {
    highlightedTranscriptRef.current = transcript.map(item => highlightSSMLTags(item.text));
    updateContentEditables();
  }, [theme, transcript, highlightSSMLTags, updateContentEditables]);

  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);


  const handleTextChange = useCallback((index: number, newText: string): void => {
    const cleanText = removeAllSpans(newText);
    setTranscript(prevTranscript => {
      const newTranscript = [...prevTranscript];
      newTranscript[index] = { ...newTranscript[index], text: cleanText };
      return newTranscript;
    });

    highlightedTranscriptRef.current[index] = highlightSSMLTags(cleanText);
    const contentEditable = contentEditableRefs.current[index];
    if (contentEditable) {
      contentEditable.innerHTML = highlightedTranscriptRef.current[index];
    }
  }, [highlightSSMLTags]);

  const handlePauseToggle = (index: number) => {
    setTranscript(prevTranscript => {
      const newTranscript = [...prevTranscript];
      newTranscript[index] = {
        ...newTranscript[index],
        addPause: !newTranscript[index].addPause
      };
      return newTranscript;
    });
  };

  // const handleTextChange = (index: number, newText: string): void => {
  //   const cleanText = removeAllSpans(newText);
  //   const oldText = transcript[index].text;
  
  //   // Parse the old and new text as XML
  //   const parser = new DOMParser();
  //   const oldDoc = parser.parseFromString(`<root>${oldText}</root>`, 'text/xml');
  //   const newDoc = parser.parseFromString(`<root>${cleanText}</root>`, 'text/xml');
  
  //   // Function to get the text content of a node and its children
  //   const getTextContent = (node: Node): string => {
  //     return Array.from(node.childNodes).map(child => 
  //       child.nodeType === Node.ELEMENT_NODE ? getTextContent(child) : child.nodeValue
  //     ).join('');
  //   };
  
  //   // Function to find the last SSML tag in the document
  //   const findLastSSMLTag = (doc: Document): Element | null => {
  //     const allTags = Array.from(doc.getElementsByTagName('*'));
  //     return allTags[allTags.length - 1] as Element || null;
  //   };
  
  //   const oldLastTag = findLastSSMLTag(oldDoc);
  //   const newLastTag = findLastSSMLTag(newDoc);
  
  //   if (oldLastTag && newLastTag && oldLastTag.tagName === newLastTag.tagName) {
  //     const oldContent = getTextContent(oldLastTag);
  //     const newContent = getTextContent(newLastTag);
  
  //     if (newContent.startsWith(oldContent) && newContent !== oldContent) {
  //       // Text has been added after the last tag
  //       const addedText = newContent.slice(oldContent.length);
  //       const updatedContent = `<${oldLastTag.tagName}${oldLastTag.getAttribute('style') ? ` style="${oldLastTag.getAttribute('style')}"` : ''}>${oldContent}</${oldLastTag.tagName}> ${addedText}`;
  //       newDoc.documentElement.innerHTML = newDoc.documentElement.innerHTML.replace(newLastTag.outerHTML, updatedContent);
  //     }
  //   }
  
  //   const finalText = newDoc.documentElement.innerHTML;
  
  //   setTranscript(prevTranscript => {
  //     const newTranscript = [...prevTranscript];
  //     newTranscript[index].text = finalText;
  //     return newTranscript;
  //   });
  
  //   // Re-apply highlighting
  //   const contentEditable = contentEditableRefs.current[index];
  //   if (contentEditable) {
  //     contentEditable.innerHTML = highlightSSMLTags(finalText);
  //   }
  // };


  const removeHighlightSpans = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('span[style^="background-color:"]').forEach(span => {
      span.replaceWith(...Array.from(span.childNodes) as Node[]);
    });
    return div.innerHTML;
  };

  const removeAllSpans = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('span').forEach(span => {
      span.replaceWith(...Array.from(span.childNodes) as Node[]);
    });
    return div.innerHTML;
  };


  const handleSpeakerChange = (index: number, newSpeaker: string): void => {
    setTranscript(prevTranscript => {
      const newTranscript = [...prevTranscript];
      newTranscript[index].speaker = newSpeaker;
      return newTranscript;
    });
  };

  // const addOrUpdateSSMLTag = (index: number, tag: SSMLTag): void => {
  //   console.log("addOrUpdateSSMLTag called with:", { index, tag });
  //   const contentEditable = contentEditableRefs.current[index];

  //   if (!contentEditable ) {
  //     console.error("ContentEditable ref not found for index:", index);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add SSML tag. Textarea not found.",
  //       variant: "destructive",
  //     });
  //     return;
  //   };

  //   try{
  //     const selection = window.getSelection();
  //     const range = selection?.getRangeAt(0);

  //     if (!range || !contentEditable.contains(range.commonAncestorContainer)) {
  //       console.error("Invalid selection or range");
  //       toast({
  //         title: "Error",
  //         description: "Please select text within the editable area to apply the SSML tag.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     const attributeString = Object.entries(tag.attributes)
  //       .map(([key, val]) => `${key}="${val}"`)
  //       .join(' ');

  //     const selectedText = range.toString();
  //     console.log("Selected text:", selectedText);
  //     const taggedText = `<${tag.name} ${attributeString}>${selectedText}</${tag.name}>`;
  //     console.log("Tagged text:", taggedText);

  //     // Create a temporary element to hold our tagged text
  //     // const tempDiv = document.createElement('div');
  //     // tempDiv.innerHTML = taggedText;

  //     // // Extract the newly created element (our tagged span)
  //     // const newElement = tempDiv.firstChild as Node;
      
  //     // // Replace the selected content with our new element
  //     // range.deleteContents();
  //     // range.insertNode(newElement);

  //     // // Update the transcript state with the new content
  //     // const newText = contentEditable.innerHTML;
  //     // console.log("New content:", newText);
  //     // handleTextChange(index, newText);

  //     const newElement = document.createElement('span');
  //     newElement.innerHTML = taggedText;
  //     range.deleteContents();
  //     range.insertNode(newElement);

  //     const newText = contentEditable.innerHTML;
  //     handleTextChange(index, newText);

  //     // Re-apply highlighting
  //     contentEditable.innerHTML = highlightSSMLTags(newText);

  //     toast({
  //       title: "Success",
  //       description: `${tag.name} tag added successfully.`,
  //     });

  //   } catch (error) {
  //     console.error('Error adding SSML tag:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add SSML tag. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const highlightSSMLTags = (text: string): string => {
  //   const parts = text.split(/(<\/?[a-z_]+(?:\s+[a-z]+="[^"]*")*\s*>)/gi);
  //   return parts.map((part, index) => {
  //     if (part.match(/<\/?[a-z_]+(?:\s+[a-z]+="[^"]*")*\s*>/i)) {
  //       return <span key={index} className="bg-yellow-200 text-black">{part}</span>;
  //     }
  //     return part;
  //   }).join('');
  // };

  const addOrUpdateSSMLTag = (index: number, tag: SSMLTag): void => {
    console.log("addOrUpdateSSMLTag called with:", { index, tag });
    const contentEditable = contentEditableRefs.current[index];
  
    if (!contentEditable) {
      console.error("ContentEditable ref not found for index:", index);
      toast({
        title: "Error",
        description: "Failed to add SSML tag. ContentEditable not found.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
  
      if (!range || !contentEditable.contains(range.commonAncestorContainer)) {
        console.error("Invalid selection or range");
        toast({
          title: "Error",
          description: "Please select text within the editable area to apply the SSML tag.",
          variant: "destructive",
        });
        return;
      }
  
      const attributeString = Object.entries(tag.attributes)
        .map(([key, val]) => `${key}="${val}"`)
        .join(' ');
  
      const selectedText = range.toString();
      const taggedText = `<${tag.name} ${attributeString}>${selectedText}</${tag.name}>`;
  
      const newElement = document.createElement('span');
      newElement.innerHTML = taggedText;
      range.deleteContents();
      range.insertNode(newElement);
  
      // Update the transcript state with the new content
      const newText = contentEditable.innerHTML;
      handleTextChange(index, newText);
  
      // Re-apply highlighting
      contentEditable.innerHTML = highlightSSMLTags(newText);
  
      toast({
        title: "Success",
        description: `${tag.name} tag added successfully.`,
      });
  
    } catch (error) {
      console.error('Error adding SSML tag:', error);
      toast({
        title: "Error",
        description: "Failed to add SSML tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  // const addOrUpdateSSMLTag = (index: number, tag: SSMLTag): void => {
  //   console.log("addOrUpdateSSMLTag called with:", { index, tag });
  //   const contentEditable = contentEditableRefs.current[index];
  
  //   if (!contentEditable) {
  //     console.error("ContentEditable ref not found for index:", index);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add SSML tag. ContentEditable not found.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  
  //   try {
  //     const selection = window.getSelection();
  //     const range = selection?.getRangeAt(0);
  
  //     if (!range || !contentEditable.contains(range.commonAncestorContainer)) {
  //       console.error("Invalid selection or range");
  //       toast({
  //         title: "Error",
  //         description: "Please select text within the editable area to apply the SSML tag.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }
  
  //     const attributeString = Object.entries(tag.attributes)
  //       .map(([key, val]) => `${key}="${val}"`)
  //       .join(' ');
  
  //     const selectedText = range.toString();
  //     const taggedText = `<${tag.name} ${attributeString}>${selectedText}</${tag.name}>`;
  
  //     // Create a temporary element to hold our new content
  //     const tempDiv = document.createElement('div');
  //     tempDiv.innerHTML = taggedText;
  //     const newElement = tempDiv.firstChild as Node;
  
  //     // Extract the contents of the range
  //     const fragment = range.extractContents();
  
  //     // Insert the new element
  //     range.insertNode(newElement);
  
  //     // Move the selection to the end of the new element
  //     range.setStartAfter(newElement);
  //     range.setEndAfter(newElement);
  
  //     // Collapse the range to the end
  //     range.collapse(false);
  
  //     // Update the transcript state with the new content
  //     const newText = contentEditable.innerHTML;
  //     handleTextChange(index, newText);
  
  //     // Re-apply highlighting
  //     contentEditable.innerHTML = highlightSSMLTags(newText);
  
  //     toast({
  //       title: "Success",
  //       description: `${tag.name} tag added successfully.`,
  //     });
  
  //   } catch (error) {
  //     console.error('Error adding SSML tag:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add SSML tag. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };


  const removeSSMLTag = (index: number, tagName: string): void => {
    const contentEditable = contentEditableRefs.current[index];
    
    if (!contentEditable) {
      toast({
        title: "Error",
        description: "Failed to remove SSML tag. Contenteditable not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current HTML content
      let content = contentEditable.innerHTML;

      // Remove highlight spans first
      content = removeAllSpans(content);

      const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 'gi');
      const newContent = content.replace(regex, '$1');

      if (newContent === content) {
        toast({
          title: "Error",
          description: `No ${tagName} tag found to remove.`,
          variant: "destructive",
        });
        return;
      }

      // Update the transcript state
      handleTextChange(index, newContent);

      // Re-apply highlighting and update the ContentEditable
      contentEditable.innerHTML = highlightSSMLTags(newContent);

      toast({
        title: "Success",
        description: `${tagName} tag(s) removed successfully.`,
      });    
    } catch (error) {
      console.error('Error removing SSML tag:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while removing the SSML tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  // const SSMLTagEditor: React.FC<{ index: number }> = ({ index }) => {
  //   const [selectedTag, setSelectedTag] = useState<string>('');
  //   const [attributes, setAttributes] = useState<Record<string, string | number>>({});    
  //   const [isOpen, setIsOpen] = useState(false);
  //   const [inputTypes, setInputTypes] = useState<Record<string, 'select' | 'number'>>({});


  //   const handleTagSelection = (tagName: string) => {
  //     setSelectedTag(tagName);
  //     setAttributes({});
  //     setInputTypes({});
  //   };

  //   // const handleAttributeChange = (attr: string, value: string | number) => {
  //   //   setAttributes(prev => ({ ...prev, [attr]: value }));
  //   // };

  //   const handleAttributeChange = (attr: string, value: string | number, config: AttributeConfig) => {
  //     if (typeof value === 'string' && config.valueMap && value in config.valueMap) {
  //       setAttributes(prev => ({ ...prev, [attr]: config.valueMap![value] }));
  //     } else {
  //       setAttributes(prev => ({ ...prev, [attr]: value }));
  //     }
  //   };

  //   const handleInputTypeChange = (attr: string, type: 'select' | 'number') => {
  //     setInputTypes(prev => ({ ...prev, [attr]: type }));
  //     setAttributes(prev => ({ ...prev, [attr]: '' }));
  //   };

  //   const getDiscreteValue = (attr: string, value: number, config: AttributeConfig): string => {
  //     if (config.valueMap) {
  //       const closestMatch = Object.entries(config.valueMap).reduce((prev, [key, mapValue]) => {
  //         return Math.abs(mapValue - value) < Math.abs(prev[1] - value) ? [key, mapValue] : prev;
  //       });
  //       return closestMatch[0];
  //     }
  //     return value.toString();
  //   };

  //   const handleAddTag = () => {
  //     console.log("handleAddTag called with:", { selectedTag, attributes });
  //     if (selectedTag) {
  //       const stringAttributes = Object.entries(attributes).reduce((acc, [key, value]) => {
  //         const config = AVAILABLE_TAGS[selectedTag].attributes[key];
  //         if (typeof value === 'number' && config.type === 'select-or-slider') {
  //           acc[key] = getDiscreteValue(key, value, config);
  //         } else {
  //           acc[key] = value.toString();
  //         }
  //         return acc;
  //       }, {} as Record<string, string>);
  //       console.log("Calling addOrUpdateSSMLTag with:", { index, tag: { name: selectedTag, attributes: stringAttributes } });
  //       addOrUpdateSSMLTag(index, { name: selectedTag, attributes: stringAttributes });
  //       setIsOpen(false);
  //     } else {
  //       console.error("No tag selected");
  //       toast({
  //         title: "Error",
  //         description: "Please select an SSML tag before adding.",
  //         variant: "destructive",
  //       });
  //     }
  //   };

  //   const handleOpenChange = (open: boolean) => {
  //     setIsOpen(open);
  //     if (!open) {
  //       setSelectedTag('');
  //       setAttributes({});
  //     }
  //   };

  //   const renderAttributeInput = (attr: string, config: AttributeConfig) => {
  //     switch (config.type) {
  //       // case 'select-or-number':
  //       //   return (
  //       //     <div key={attr} className="space-y-2">
  //       //       <RadioGroup 
  //       //         onValueChange={(value) => handleInputTypeChange(attr, value as 'select' | 'number')} 
  //       //         value={inputTypes[attr] || 'select'}
  //       //       >
  //       //         <div className="flex items-center space-x-2">
  //       //           <RadioGroupItem value="select" id={`${attr}-select`} />
  //       //           <Label htmlFor={`${attr}-select`}>Preset</Label>
  //       //         </div>
  //       //         <div className="flex items-center space-x-2">
  //       //           <RadioGroupItem value="number" id={`${attr}-number`} />
  //       //           <Label htmlFor={`${attr}-number`}>Custom</Label>
  //       //         </div>
  //       //       </RadioGroup>
  //       //       {inputTypes[attr] === 'number' ? (
  //       //         <Input
  //       //           type="number"
  //       //           placeholder={`${attr} (${config.unit})`}
  //       //           value={attributes[attr] || ''}
  //       //           onChange={(e) => handleAttributeChange(attr, e.target.value)}
  //       //         />
  //       //       ) : (
  //       //         <Select 
  //       //           onValueChange={(value) => handleAttributeChange(attr, value)}
  //       //           value={attributes[attr] || ''}
  //       //         >
  //       //           {/* Select options */}
  //       //         </Select>
  //       //       )}
  //       //     </div>
  //       //   );
  //       case 'select-or-slider':
  //         const sliderValue = typeof attributes[attr] === 'number' ? attributes[attr] : config.min || 0;
  //         const discreteValue = getDiscreteValue(attr, sliderValue as number, config);

  //         return (
  //           <div key={attr} className="space-y-2">
  //             <Label>{attr}</Label>
  //             <Select 
  //               onValueChange={(value) => handleAttributeChange(attr, value, config)}
  //               value={discreteValue}
  //             >
  //               <SelectTrigger>
  //                 <SelectValue placeholder={`${attr} (or use slider)`} />
  //               </SelectTrigger>
  //               <SelectContent>
  //                 {config.options?.map(option => (
  //                   <SelectItem key={option} value={option}>
  //                     {option}
  //                   </SelectItem>
  //                 ))}
  //               </SelectContent>
  //             </Select>
  //             <div className="flex items-center space-x-2">
  //               <Slider
  //                 min={config.min || 0}
  //                 max={config.max || 100}
  //                 step={config.step || 1}
  //                 value={[sliderValue as number]}
  //                 onValueChange={([value]) => handleAttributeChange(attr, value,config)}
  //               />
  //               <span>{sliderValue}{config.unit}</span>
  //             </div>
  //           </div>
  //         );    
          
  //       case 'select':
  //         return (
  //           <Select 
  //             key={attr}
  //             onValueChange={(value) => handleAttributeChange(attr, value, config)}
  //             value={attributes[attr]?.toString() || ''}
  //           >
  //             <SelectTrigger>
  //               <SelectValue placeholder={attr} />
  //             </SelectTrigger>
  //             <SelectContent>
  //               {config.options?.map(option => (
  //                 <SelectItem key={option} value={option}>
  //                   {option}
  //                 </SelectItem>
  //               ))}
  //             </SelectContent>
  //           </Select>
  //         );
  //       case 'number':
  //         return (
  //           <Input
  //             key={attr}
  //             type="number"
  //             placeholder={attr}
  //             value={attributes[attr] || ''}
  //             onChange={(e) => handleAttributeChange(attr, e.target.value,config)}
  //           />
  //         );
  //       case 'text':
  //       default:
  //         return (
  //           <Input
  //             key={attr}
  //             type="text"
  //             placeholder={attr}
  //             value={attributes[attr] || ''}
  //             onChange={(e) => handleAttributeChange(attr, e.target.value,config)}
  //           />
  //         );
  //     }
  //   };

  //   useEffect(() => {
  //     if (selectedTag && AVAILABLE_TAGS[selectedTag]) {
  //       const initialAttributes: Record<string, string | number> = {};
  //       Object.entries(AVAILABLE_TAGS[selectedTag].attributes).forEach(([attr, config]) => {
  //         if (config.type === 'select-or-slider') {
  //           initialAttributes[attr] = config.min || 0;
  //         }
  //       });
  //       setAttributes(initialAttributes);
  //     }
  //   }, [selectedTag]);

  //   return (
  //     <Popover open={isOpen} onOpenChange={handleOpenChange}>
  //       <PopoverTrigger asChild>
  //         <Button variant="outline">Manage SSML Tags</Button>
  //       </PopoverTrigger>
  //       <PopoverContent className="w-80">
  //         <div className="space-y-2">
  //           <Select onValueChange={handleTagSelection}>
  //             <SelectTrigger>
  //               <SelectValue placeholder="Select SSML Tag" />
  //             </SelectTrigger>
  //             <SelectContent>
  //               {Object.keys(AVAILABLE_TAGS).map(tag => (
  //                 <SelectItem key={tag} value={tag}>
  //                   {tag === 'say-as' ? 'say-as' : tag}
  //                 </SelectItem>
  //               ))}
  //             </SelectContent>
  //           </Select>
  //           {selectedTag && Object.entries(AVAILABLE_TAGS[selectedTag].attributes).map(([attr, config]) => 
  //             renderAttributeInput(attr, config)
  //           )}
  //           <Button onClick={handleAddTag}>Add/Update Tag</Button>
  //           {selectedTag && (
  //             <Button onClick={() => {
  //               removeSSMLTag(index, selectedTag);
  //               setIsOpen(false);
  //             }} variant="outline">
  //               Remove Tag
  //             </Button>
  //           )}
  //         </div>
  //       </PopoverContent>
  //     </Popover>
  //   );
  // };

  const SSMLTagEditor: React.FC<{ index: number }> = ({ index }) => {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [attributes, setAttributes] = useState<Record<string, string | number>>({});
    const [isOpen, setIsOpen] = useState(false);

    const handleTagSelection = (tagName: string) => {
      setSelectedTag(tagName);
      setAttributes({});
    };

    const handleAttributeChange = (attr: string, value: string | number, config: AttributeConfig) => {
      if (typeof value === 'string' && config.valueMap && value in config.valueMap) {
        setAttributes(prev => ({ ...prev, [attr]: config.valueMap![value] }));
      } else {
        setAttributes(prev => ({ ...prev, [attr]: value }));
      }
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
        setSelectedTag(null);
        setAttributes({});
      } else {
        toast({
          title: "Error",
          description: "Please select an SSML tag before adding.",
          variant: "destructive",
        });
      }
    };

    const renderAttributeInput = (attr: string, config: AttributeConfig) => {
      switch (config.type) {
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
                  onValueChange={([value]) => handleAttributeChange(attr, value, config)}
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
              onChange={(e) => handleAttributeChange(attr, e.target.value, config)}
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
              onChange={(e) => handleAttributeChange(attr, e.target.value, config)}
            />
          );
      }
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">Manage SSML Tags</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.keys(AVAILABLE_TAGS).map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "secondary" : "outline"}
                  onClick={() => handleTagSelection(tag)}
                  size="sm"
                >
                  {tag}
                </Button>
              ))}
            </div>
            {selectedTag && (
              <>
                {Object.entries(AVAILABLE_TAGS[selectedTag].attributes).map(([attr, config]) => 
                  renderAttributeInput(attr, config)
                )}
                <Button onClick={handleAddTag} className="w-full">Add Tag</Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };
  
  const TagRemovalSelector: React.FC<{ index: number }> = ({ index }) => {
    
    const colorScheme = theme === 'dark' ? TAG_COLORS.dark : TAG_COLORS.light;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {Object.entries(colorScheme).map(([tag, colors]) => {
          const isSelected = selectedTagsForRemoval[index]?.has(tag);
          return (
            <Button
              key={tag}
              variant="outline"
              // variant={isSelected ? "secondary" : "outline"}
              onClick={() => {
                setSelectedTagsForRemoval((prev) => {
                  const newSet = new Set(prev[index] || []);
                  if (newSet.has(tag)) {
                    newSet.delete(tag);
                  } else {
                    newSet.add(tag);
                  }
                  return { ...prev, [index]: newSet };
                });
              }}
              style={{
                backgroundColor: isSelected ? colors.bg : 'transparent',
                borderColor: colors.bg,
                color: isSelected ? colors.text : theme === 'dark' ? '#FFFFFF' : '#000000',
              }}
              className="transition-colors duration-200 hover:opacity-80"
            >
              {tag}
            </Button>
          )
        })}
      </div>
    );
  };

  const removeSelectedTags = (index: number) => {
    const contentEditable = contentEditableRefs.current[index];
    if (!contentEditable) {
      toast({
        title: "Error",
        description: "Failed to remove SSML tags. ContentEditable not found.",
        variant: "destructive",
      });
      return;
    }
    try {
      let content = contentEditable.innerHTML;
      content = removeAllSpans(content);
      const tagsToRemove = selectedTagsForRemoval[index];
      if (tagsToRemove) {
        tagsToRemove.forEach((tag) => {
          const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gi');
          content = content.replace(regex, '$1');
        });
      }
    
      // Update the transcript state
      handleTextChange(index, content);
    
      // Re-apply highlighting
      contentEditable.innerHTML = highlightSSMLTags(content);
    
      toast({
        title: "Success",
        description: `Selected SSML tag(s) removed successfully.`,
      });
    
      // Clear the selection  for this index
      setSelectedTagsForRemoval((prev) => ({ ...prev, [index]: new Set() }));
    } catch (error) {
      console.error('Error removing SSML tags:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while removing the SSML tags. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addNewSpeakerBlock = (): void => {
    if (newSpeaker.trim() !== '') {
      setTranscript([...transcript, { speaker: newSpeaker, text: '', addPause: true }]);
      setNewSpeaker('');
    }
  };

  const removeSpeakerBlock = (index: number): void => {
    const newTranscript = transcript.filter((_, i) => i !== index);
    setTranscript(newTranscript);
  };


  // return (
    
  //   <div className="p-4">
  //     <h1 className="text-2xl font-bold mb-4">Podcast Transcript Editor</h1>
  //     {transcript.map((item, index) => (
  //       <div key={index} className="mb-4 p-4 border rounded">
  //         {/* <h2 className="font-semibold">{item.speaker}</h2> */}

  //         <Select
  //           value={item.speaker}
  //           onValueChange={(value) => handleSpeakerChange(index, value)}
  //         >
  //           <SelectTrigger className="w-[200px]">
  //             <SelectValue placeholder="Select speaker" defaultValue={item.speaker} />
  //           </SelectTrigger>
  //           <SelectContent>
  //             {Object.keys(voiceIds).map((voiceName) => (
  //               <SelectItem key={voiceName} value={voiceName}>
  //                 {voiceName}
  //               </SelectItem>
  //             ))}
  //           </SelectContent>
  //         </Select>

  //         <ContentEditable
  //           innerRef={(el: HTMLElement | null) => {contentEditableRefs.current[index] = el}}
  //           html={highlightSSMLTags(item.text)}
  //           disabled={false}
  //           onChange={(evt) => handleTextChange(index, evt.target.value)}
  //           className="w-full p-2 border rounded mt-2 font-mono min-h-[100px] focus:outline-none"
  //         />
  //         <div className="flex  items-center mt-2">
  //           <SSMLTagEditor index={index} />
  //           <Button onClick={() => removeSpeakerBlock(index)} variant="destructive">
  //             Remove Block
  //           </Button>
  //           <Button 
  //             onClick={() => removeSelectedTags(index)} 
  //             variant="destructive" 
  //             disabled={!selectedTagsForRemoval[index] || selectedTagsForRemoval[index].size === 0}
  //             className='ml-4'
  //           >
  //             Remove Selected Tags
  //           </Button>
  //         </div>

  //         <TagRemovalSelector index={index} />

  //         {/* <div className="flex space-x-2 mt-4">
  //           <SSMLTagEditor index={index} />
  //           <Button onClick={() => removeSpeakerBlock(index)} variant="destructive">
  //             Remove Block
  //           </Button>
  //         </div>

  //         <TagRemovalSelector index={index} />

  //         <div className="flex space-x-2 mt-2">
  //           <Button 
  //             onClick={() => removeSelectedTags(index)} 
  //             variant="destructive" 
  //             disabled={!selectedTagsForRemoval[index] || selectedTagsForRemoval[index].size === 0}
  //           >
  //             Remove Selected Tags
  //           </Button>
  //         </div> */}


  //       </div>
  //     ))}

  //     <div className="mt-4 flex space-x-2 mb-4">
  //       <Select
  //           value={newSpeaker}
  //           onValueChange={setNewSpeaker}
  //         >
  //         <SelectTrigger className="w-[200px]">
  //           <SelectValue placeholder="Select new speaker" />
  //         </SelectTrigger>
  //         <SelectContent>
  //           {Object.keys(voiceIds).map((voiceName) => (
  //             <SelectItem key={voiceName} value={voiceName}>
  //               {voiceName}
  //             </SelectItem>
  //           ))}
  //         </SelectContent>
  //       </Select>
        
  //       <Button onClick={addNewSpeakerBlock}>Add Speaker</Button>
  //     </div>
  //   </div>
  // );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Podcast Transcript Editor</h1>
      <div className="mb-4">
        <Label htmlFor="defaultPauseTime">Default Pause Time (seconds)</Label>
        <Input
          id="defaultPauseTime"
          type="number"
          value={defaultPauseTime}
          onChange={(e) => setDefaultPauseTime(Number(e.target.value))}
          min={0}
          step={0.1}
          className="w-32"
        />
      </div>
      {transcript.map((item, index) => (
        <div key={index} className="mb-4 p-4 border rounded shadow-sm">
          <div className="flex items-center mb-2 space-x-2">
            <Select
              value={item.speaker}
              onValueChange={(value) => handleSpeakerChange(index, value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select speaker" defaultValue={item.speaker} />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(voiceIds).map((voiceName) => (
                  <SelectItem key={voiceName} value={voiceName}>
                    {voiceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => removeSpeakerBlock(index)} variant="destructive" size="sm">
              Remove Block
            </Button>
          </div>
  
          <ContentEditable
            innerRef={(el: HTMLElement | null) => {contentEditableRefs.current[index] = el}}
            html={highlightedTranscriptRef.current[index] || item.text}
            disabled={false}
            onChange={(evt) => handleTextChange(index, evt.target.value)}
            className="w-full p-2 border rounded mt-2 font-mono min-h-[100px] focus:outline-none"
          />
  
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <SSMLTagEditor index={index} />
              <Button 
                onClick={() => removeSelectedTags(index)} 
                variant="outline"
                size="sm"
                disabled={!selectedTagsForRemoval[index] || selectedTagsForRemoval[index].size === 0}
              >
                Remove Selected Tags
              </Button>
            </div>
            <TagRemovalSelector index={index} />
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`pause-${index}`}
                checked={item.addPause}
                onCheckedChange={() => handlePauseToggle(index)}
              />
              <Label htmlFor={`pause-${index}`}>Add pause after this section</Label>
            </div>
          </div>
        </div>
      ))}
  
      <div className="mt-4 flex items-center space-x-2">
        <Select
          value={newSpeaker}
          onValueChange={setNewSpeaker}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select new speaker" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(voiceIds).map((voiceName) => (
              <SelectItem key={voiceName} value={voiceName}>
                {voiceName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addNewSpeakerBlock}>Add Speaker</Button>
      </div>
    </div>
  );
};

export default TranscriptEditor;