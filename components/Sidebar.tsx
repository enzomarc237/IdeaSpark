import React, { useState } from 'react';
import { Note, View } from '../types';
import { PlusIcon, NoteIcon, ImageIcon, EyeIcon, UploadIcon, LinkIcon, ClipboardIcon, CheckIcon } from './icons';

interface SidebarProps {
    notes: Note[];
    activeNoteId: string | null;
    onSelectNote: (id: string) => void;
    onCreateNote: () => void;
    onDeleteNote: (id: string) => void;
    activeView: View;
    onSetView: (view: View) => void;
    onImportFromFile: () => void;
    onImportFromUrl: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    notes,
    activeNoteId,
    onSelectNote,
    onCreateNote,
    onDeleteNote,
    activeView,
    onSetView,
    onImportFromFile,
    onImportFromUrl
}) => {
    const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

    const handleCopyToClipboard = (e: React.MouseEvent, content: string, noteId: string) => {
        e.stopPropagation(); // Prevent selecting the note
        navigator.clipboard.writeText(content).then(() => {
            setCopiedNoteId(noteId);
            setTimeout(() => setCopiedNoteId(null), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy content to clipboard.');
        });
    };

    return (
        <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold text-white">IdeaSpark Suite</h1>
            </div>

            <div className="p-4 flex space-x-2">
                 <button
                    onClick={() => onSetView('editor')}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${activeView === 'editor' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <NoteIcon className="w-5 h-5 mr-2" /> Editor
                </button>
                 <button
                    onClick={() => onSetView('wireframe')}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${activeView === 'wireframe' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <ImageIcon className="w-5 h-5 mr-2" /> UI Gen
                </button>
                 <button
                    onClick={() => onSetView('analyzer')}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${activeView === 'analyzer' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <EyeIcon className="w-5 h-5 mr-2" /> Analyze
                </button>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-700">
                <h2 className="text-lg font-semibold">Notes</h2>
                <div className="flex items-center space-x-1">
                    <button onClick={onImportFromFile} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Import from file">
                        <UploadIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onImportFromUrl} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Import from URL">
                        <LinkIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onCreateNote} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Create new note">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {notes.map(note => (
                    <div
                        key={note.id}
                        onClick={() => onSelectNote(note.id)}
                        className={`px-4 py-3 cursor-pointer border-l-4 flex justify-between items-center ${activeNoteId === note.id ? 'border-blue-500 bg-gray-800' : 'border-transparent hover:bg-gray-800'}`}
                    >
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate text-white">{note.title}</h3>
                            <p className="text-sm text-gray-400 truncate">{note.content.substring(0, 50)}</p>
                        </div>
                        {note.isGenerated && (
                            <button
                                onClick={(e) => handleCopyToClipboard(e, note.content, note.id)}
                                className="ml-2 p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                                title="Copy content to clipboard"
                            >
                                {copiedNoteId === note.id ? (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <ClipboardIcon className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};