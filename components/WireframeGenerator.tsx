
import React, { useState, useRef } from 'react';
import { generateWireframe, editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { WandIcon, BrainIcon } from './icons';

interface WireframeGeneratorProps {
    setLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    addNote: (title: string, content: string) => void;
}

export const WireframeGenerator: React.FC<WireframeGeneratorProps> = ({ setLoading, setLoadingMessage, addNote }) => {
    const [prompt, setPrompt] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [originalImageForEdit, setOriginalImageForEdit] = useState<{data: string, mimeType: string} | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setLoadingMessage('Generating UI wireframe with Imagen...');
        try {
            const imageBytes = await generateWireframe(prompt);
            setGeneratedImage(`data:image/png;base64,${imageBytes}`);
            setOriginalImageForEdit({ data: imageBytes, mimeType: 'image/png' });
        } catch (error) {
            console.error("Failed to generate wireframe:", error);
            alert("An error occurred while generating wireframe.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLoading(true);
            setLoadingMessage('Preparing image for editing...');
            try {
                const base64Data = await fileToBase64(file);
                setGeneratedImage(`data:${file.type};base64,${base64Data}`);
                setOriginalImageForEdit({ data: base64Data, mimeType: file.type });
            } catch (error) {
                 console.error("Failed to read file:", error);
                 alert("Could not read the selected file.");
            } finally {
                setLoading(false);
            }
        }
    };
    
    const handleEdit = async () => {
        if (!originalImageForEdit || !editPrompt.trim()) return;
        setLoading(true);
        setLoadingMessage('Editing image with Gemini...');
        try {
            const editedImageBytes = await editImage(originalImageForEdit.data, originalImageForEdit.mimeType, editPrompt);
            setGeneratedImage(`data:image/png;base64,${editedImageBytes}`);
            setOriginalImageForEdit({ data: editedImageBytes, mimeType: 'image/png' });
        } catch (error) {
            console.error("Failed to edit image:", error);
            alert("An error occurred while editing the image.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 flex flex-col h-full bg-gray-800 text-white overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">UI Wireframe Generator & Editor</h2>
            <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the UI you want to create, e.g., 'a dashboard for a project management app'"
                    className="w-full h-24 bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <BrainIcon className="w-5 h-5" /> <span>Generate Wireframe</span>
                </button>
            </div>

            {generatedImage && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Result</h3>
                    <div className="p-4 bg-gray-700 rounded-lg">
                        <img src={generatedImage} alt="Generated wireframe" className="w-full h-auto rounded-md shadow-md" />
                    </div>

                    <div className="mt-6 bg-gray-700 p-4 rounded-lg shadow-lg">
                         <h3 className="text-xl font-semibold mb-3">Edit Image</h3>
                         <p className="text-sm text-gray-400 mb-3">Upload an image or edit the one generated above.</p>
                         <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="mb-3 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Describe your edits, e.g., 'add a retro filter' or 'remove the person in the background'"
                            className="w-full h-20 bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        />
                        <button onClick={handleEdit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                             <WandIcon className="w-5 h-5" /> <span>Apply Edits</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
