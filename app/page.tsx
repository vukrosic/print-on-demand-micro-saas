"use client"

import React, { useState } from 'react';
import Image from 'next/image';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const generateImage = async (userPrompt: string, style: string, apiKey: string) => {
  const fullPrompt = `You will generate a print on demand design in the following style and based on the following prompt. It will be printed on shirts, hoodies, etc. Do not make it in the shape of the shirt and do not make a mockup. Just make a square image that will be primted onto the shirt. ${style}: ${userPrompt}`;
  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      apiKey: apiKey
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate image');
  }

  let prediction = await response.json();

  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed"
  ) {
    await sleep(1000);
    const response = await fetch("/api/predictions/" + prediction.id, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check prediction status');
    }

    prediction = await response.json();
  }

  if (prediction.status === "failed") {
    throw new Error('Image generation failed');
  }

  return prediction;
};

const SingleImageGenerator = () => {
  const [prompt, setPrompt] = useState('design of cartoon fox character');
  const [apiKey, setApiKey] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState('print on demand style');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please enter the API key');
      return;
    }
    setLoading(true);
    setError(null);
    setImage(null);

    try {
      const prediction = await generateImage(prompt, imageStyle, apiKey);
      setImage(prediction.output[prediction.output.length - 1]);
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-extrabold text-gray-900">Image Generator</h2>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="rounded-md shadow-sm -space-y-px space-y-4">
                    <div className="mb-4">
                      <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">API Key</label>
                      <input
                        id="apiKey"
                        type="password"
                        required
                        className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Enter API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="imageStyle" className="block text-sm font-medium text-gray-700">Image Style</label>
                      <input
                        id="imageStyle"
                        type="text"
                        className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Enter image style"
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Prompt</label>
                      <input
                        id="prompt"
                        type="text"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Enter your image prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {loading ? 'Generating...' : 'Generate Image'}
                    </button>
                  </div>
                </form>
              </div>
              {error && (
                <div className="py-4 text-red-600">{error}</div>
              )}
              {image && (
                <div className="py-8">
                  <h3 className="text-xl font-bold mb-4">Generated Image:</h3>
                  <Image
                    src={image}
                    alt="Generated image"
                    sizes="100vw"
                    height={768}
                    width={768}
                    className="w-full mb-4 rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleImageGenerator;