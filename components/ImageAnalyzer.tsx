
import React, { useState, useRef } from 'react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { EyeIcon } from './icons';

interface ImageAnalyzerProps {
    setLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
}

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ setLoading, setLoadingMessage }) => {
    const [prompt, setPrompt] = useState('Describe this image in detail.');
    const [image, setImage] = useState<{data: string, url: string, mimeType: string} | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLoading(true);
            setLoadingMessage('Processing image...');
            try {
                const base64Data = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setImage({ data: base64Data, url, mimeType: file.type });
                setAnalysis(null);
            } catch (error) {
                 console.error("Failed to read file:", error);
                 alert("Could not read the selected file.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!image || !prompt.trim()) return;
        setLoading(true);
        setLoadingMessage('Analyzing image with Gemini...');
        try {
            const result = await analyzeImage(image.data, image.mimeType, prompt);
            setAnalysis(result);
        } catch (error) {
            console.error("Failed to analyze image:", error);
            alert("An error occurred while analyzing the image.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 flex flex-col h-full bg-gray-800 text-white overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Image Analyzer</h2>
            <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    ref={fileInputRef} 
                    className="mb-3 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {image && (
                     <>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ask something about the image..."
                            className="w-full h-20 bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        />
                        <button onClick={handleAnalyze} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                             <EyeIcon className="w-5 h-5"/> <span>Analyze Image</span>
                        </button>
                    </>
                )}
            </div>

            <div className="mt-6 flex gap-6">
                {image && (
                    <div className="w-1/2">
                        <h3 className="text-xl font-semibold mb-3">Your Image</h3>
                        <div className="p-2 bg-gray-700 rounded-lg">
                            <img src={image.url} alt="For analysis" className="w-full h-auto rounded-md shadow-md object-contain max-h-96" />
                        </div>
                    </div>
                )}
                {analysis && (
                    <div className="w-1/2">
                        <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
                        <div className="p-4 bg-gray-700 rounded-lg prose prose-invert max-w-none">
                           <p className="text-gray-200">{analysis}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
