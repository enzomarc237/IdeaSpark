import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import { generateIdeasFromNote, generateIdeasFromQuery, refineNote } from '../services/geminiService';
import { WandIcon, DocumentIcon, DownloadIcon, BrainIcon, EyeIcon, PencilIcon } from './icons';

declare var marked: any;
declare var DOMPurify: any;

interface EditorProps {
    note: Note;
    onChange: (id: string, content: string) => void;
    onGenerateDocs: () => void;
    onExport: (format: 'md' | 'txt') => void;
    setLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ note, onChange, onGenerateDocs, onExport, setLoading, setLoadingMessage }) => {
    const [ideaQuery, setIdeaQuery] = useState('');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    const handleIdeaFromQuery = async () => {
        if (!ideaQuery.trim()) return;
        setLoading(true);
        setLoadingMessage('Generating ideas from your query...');
        try {
            const ideas = await generateIdeasFromQuery(ideaQuery);
            onChange(note.id, `${note.content}\n\n## Ideas based on "${ideaQuery}":\n\n${ideas}`);
            setIdeaQuery('');
        } catch (error) {
            console.error("Failed to generate ideas from query:", error);
            alert("An error occurred while generating ideas.");
        } finally {
            setLoading(false);
        }
    };

    const handleIdeaFromNote = async () => {
        if (!note.content.trim()) return;
        setLoading(true);
        setLoadingMessage('Generating ideas from your note...');
        try {
            const ideas = await generateIdeasFromNote(note.content);
            onChange(note.id, `${note.content}\n\n## Ideas based on this note:\n\n${ideas}`);
        } catch (error) {
            console.error("Failed to generate ideas from note:", error);
            alert("An error occurred while generating ideas.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefineNote = async () => {
        if (!note.content.trim()) return;
        setLoading(true);
        setLoadingMessage('Refining your note with Gemini...');
        try {
            const refinedContent = await refineNote(note.content);
            onChange(note.id, refinedContent);
        } catch (error) {
            console.error("Failed to refine note:", error);
            alert("An error occurred while refining the note.");
        } finally {
            setLoading(false);
        }
    };

    const processedMarkdown = useMemo(() => {
        if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
            return '<p>Markdown preview libraries are not loaded. Please check your internet connection.</p>';
        }
        const rawMarkup = marked.parse(note.content || '', { breaks: true });
        return DOMPurify.sanitize(rawMarkup);
    }, [note.content]);

    return (
        <div className="flex flex-col h-full bg-gray-800">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-white truncate">{note.title}</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                        className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {viewMode === 'edit' ? <EyeIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
                        <span>{viewMode === 'edit' ? 'Preview' : 'Edit'}</span>
                    </button>
                    <button onClick={handleRefineNote} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <WandIcon className="w-5 h-5" />
                        <span>Refine</span>
                    </button>
                     <button onClick={onGenerateDocs} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <DocumentIcon className="w-5 h-5" />
                        <span>Gen Docs</span>
                    </button>
                     <button onClick={() => onExport('md')} className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                        <span>.md</span>
                    </button>
                    <button onClick={() => onExport('txt')} className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                         <DownloadIcon className="w-5 h-5" />
                        <span>.txt</span>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {viewMode === 'edit' ? (
                    <>
                        <textarea
                            key={note.id}
                            value={note.content}
                            onChange={(e) => onChange(note.id, e.target.value)}
                            className="flex-1 h-full p-6 bg-gray-800 text-gray-200 resize-none focus:outline-none text-lg leading-relaxed"
                            placeholder="Start writing your note..."
                        />
                        <div className="w-1/3 max-w-sm border-l border-gray-700 p-4 flex flex-col space-y-4 bg-gray-800/50">
                            <h3 className="text-lg font-semibold text-white">AI Idea Generator</h3>
                            <div className="flex flex-col space-y-2">
                                <input
                                    type="text"
                                    value={ideaQuery}
                                    onChange={(e) => setIdeaQuery(e.target.value)}
                                    placeholder="Enter a query for ideas..."
                                    className="bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button onClick={handleIdeaFromQuery} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                   <BrainIcon className="w-5 h-5"/> <span>Generate from Query</span>
                                </button>
                            </div>
                            <button onClick={handleIdeaFromNote} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                <BrainIcon className="w-5 h-5"/><span>Generate from Note</span>
                            </button>
                        </div>
                    </>
                ) : (
                     <div
                        className="prose prose-invert max-w-none w-full p-6 bg-gray-800 text-gray-200 focus:outline-none overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: processedMarkdown }}
                    />
                )}
            </div>
        </div>
    );
};