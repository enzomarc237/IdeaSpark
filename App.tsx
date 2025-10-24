import React, { useState, useEffect } from 'react';
import { Note, View, ChatMessage } from './types';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { WireframeGenerator } from './components/WireframeGenerator';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { ChatBot } from './components/ChatBot';
import { ChatIcon } from './components/icons';
import { generateDocuments } from './services/geminiService';
import { downloadFile } from './utils/fileUtils';

const App: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>(() => {
        const savedNotes = localStorage.getItem('notes');
        return savedNotes ? JSON.parse(savedNotes) : [];
    });
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [view, setView] = useState<View>('editor');
    const [isChatOpen, setChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        localStorage.setItem('notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        if (notes.length > 0 && activeNoteId === null) {
            setActiveNoteId(notes[0].id);
        }
        if (notes.length === 0) {
            setActiveNoteId(null);
        }
    }, [notes, activeNoteId]);

    const addNote = (title: string, content: string) => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: title.substring(0, 30) || 'Untitled Note',
            content,
            createdAt: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
        setView('editor');
    };

    const createNote = () => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: 'New Note',
            content: '',
            createdAt: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
        setView('editor');
    };

    const updateNote = (id: string, content: string) => {
        setNotes(notes.map(note =>
            note.id === id ? { ...note, content, title: content.split('\n')[0].substring(0, 30) || 'New Note' } : note
        ));
    };

    const deleteNote = (id: string) => {
        setNotes(notes.filter(note => note.id !== id));
        if (activeNoteId === id) {
            setActiveNoteId(notes.length > 1 ? notes.find(n => n.id !== id)!.id : null);
        }
    };

    const handleGenerateDocs = async () => {
        const activeNote = notes.find(n => n.id === activeNoteId);
        if (!activeNote || !activeNote.content.trim()) {
            alert("Please select a note with content to generate documents.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Generating PRD & Dev Plan with Gemini Pro...');
        try {
            const { prd, devPlan, sources } = await generateDocuments(activeNote.content);
            const prdNote: Note = {
                id: crypto.randomUUID(),
                title: `PRD for ${activeNote.title}`,
                content: prd,
                createdAt: new Date().toISOString(),
            };
            const devPlanNote: Note = {
                id: crypto.randomUUID(),
                title: `Dev Plan for ${activeNote.title}`,
                content: devPlan,
                createdAt: new Date().toISOString(),
            };
            setNotes(prev => [prdNote, devPlanNote, ...prev]);
            setActiveNoteId(prdNote.id);
            console.log("Sources:", sources);
            alert("Documents generated successfully from idea: '" + activeNote.title + "'!");
        } catch (error) {
            console.error("Failed to generate documents:", error);
            alert("An error occurred while generating documents.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleExport = (format: 'md' | 'txt') => {
        const activeNote = notes.find(n => n.id === activeNoteId);
        if (activeNote) {
            const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
            const filename = `${activeNote.title.replace(/ /g, '_')}.${format}`;
            downloadFile(activeNote.content, filename, mimeType);
        }
    };

    const handleImportFromFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt,text/markdown,text/plain';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (readEvent) => {
                const content = readEvent.target?.result as string;
                if (content) {
                    const title = file.name.replace(/\.(md|txt)$/, '');
                    addNote(title, content);
                }
            };
            reader.onerror = () => {
                console.error("Failed to read file");
                alert("An error occurred while reading the file.");
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleImportFromUrl = async () => {
        const url = prompt("Please enter the URL of the markdown or text file to import:");
        if (!url) return;

        setIsLoading(true);
        setLoadingMessage(`Importing from ${url}...`);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
            const content = await response.text();
            const pathParts = new URL(url).pathname.split('/');
            const lastPart = pathParts.pop() || 'imported-note';
            const title = lastPart.replace(/\.(md|txt)$/, '');
            
            addNote(title, content);

        } catch (error) {
            console.error("Failed to import from URL:", error);
            alert(`An error occurred while importing from the URL. This might be due to CORS policy restrictions. Check the console for more details.`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const activeNote = notes.find(note => note.id === activeNoteId);

    const renderView = () => {
        switch (view) {
            case 'editor':
                return activeNote ? (
                    <Editor
                        note={activeNote}
                        onChange={updateNote}
                        onGenerateDocs={handleGenerateDocs}
                        onExport={handleExport}
                        setLoading={setIsLoading}
                        setLoadingMessage={setLoadingMessage}
                    />
                ) : <div className="flex items-center justify-center h-full text-gray-500">Select a note or create a new one.</div>;
            case 'wireframe':
                return <WireframeGenerator setLoading={setIsLoading} setLoadingMessage={setLoadingMessage} addNote={(title, content) => {
                    const newNote: Note = { id: crypto.randomUUID(), title, content, createdAt: new Date().toISOString() };
                    setNotes(prev => [newNote, ...prev]);
                }} />;
            case 'analyzer':
                return <ImageAnalyzer setLoading={setIsLoading} setLoadingMessage={setLoadingMessage} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
            {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
                    <p className="mt-4 text-lg text-white">{loadingMessage}</p>
                </div>
            )}

            <Sidebar
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={setActiveNoteId}
                onCreateNote={createNote}
                onDeleteNote={deleteNote}
                activeView={view}
                onSetView={setView}
                onImportFromFile={handleImportFromFile}
                onImportFromUrl={handleImportFromUrl}
            />

            <main className="flex-1 flex flex-col overflow-hidden">
                {renderView()}
            </main>

            <div className="fixed bottom-6 right-6 z-30">
                 <button onClick={() => setChatOpen(!isChatOpen)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110">
                    <ChatIcon className="w-8 h-8" />
                </button>
            </div>
            {isChatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
        </div>
    );
};

export default App;