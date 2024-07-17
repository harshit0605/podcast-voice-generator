"use client"

import React, { useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTheme } from "next-themes";
import { Moon, Sun, Upload, FileText, Edit, Download } from "lucide-react";


const HomePage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ssmlFileInputRef = useRef<HTMLInputElement>(null);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // router.push({
        //     pathname: '/editor',
        //     query: { transcriptData: content, inputType: 'upload' }
        //   });      
        };
      reader.readAsText(file);
    }
  };

  const handlePasteTranscript = () => {
    router.push('/paste');
  };

  const handleSSMLUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // router.push({
        //     pathname: '/editor',
        //     query: { transcriptData: content, inputType: 'ssml' }
        //   });
      };
      reader.readAsText(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerSSMLFileUpload = () => {
    ssmlFileInputRef.current?.click();
  };

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Podcast Transcript Assistant</h1>
        <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")} variant="outline" size="icon">
          {theme === "light" ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </header>
      
      <main className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Welcome to Podcast Transcript Assistant</h2>
          <p className="text-lg">Easily manage, edit, and enhance your podcast transcripts. Get started by choosing an option below:</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Transcript</CardTitle>
              <CardDescription>Start with a raw transcript file</CardDescription>
            </CardHeader>
            <CardContent>
              <Upload className="w-12 h-12 mx-auto" />
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={triggerFileUpload}>
                Upload Transcript
              </Button>
              <input
                id="fileUpload"
                ref={fileInputRef}
                type="file"
                accept=".txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paste Transcript</CardTitle>
              <CardDescription>Paste your transcript text directly</CardDescription>
            </CardHeader>
            <CardContent>
              <FileText className="w-12 h-12 mx-auto" />
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handlePasteTranscript}>Paste Transcript</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload SSML</CardTitle>
              <CardDescription>Start with an existing SSML file</CardDescription>
            </CardHeader>
            <CardContent>
              <Upload className="w-12 h-12 mx-auto" />
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={triggerSSMLFileUpload}>
                Upload SSML
              </Button>
              <input
                id="ssmlUpload"
                type="file"
                ref={ssmlFileInputRef}
                accept=".ssml,.xml"
                style={{ display: 'none' }}
                onChange={handleSSMLUpload}
              />
            </CardFooter>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Choose your input method: upload a transcript, paste text, or upload an SSML file.</li>
            <li>Edit and enhance your transcript with our intuitive editor.</li>
            <li>Add SSML tags to control speech synthesis.</li>
            <li>Export your enhanced transcript as an SSML file or copy to clipboard.</li>
          </ol>
        </section>
      </main>

      <footer className="mt-12 text-center">
        <p>&copy; 2024 Podcast Transcript Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;