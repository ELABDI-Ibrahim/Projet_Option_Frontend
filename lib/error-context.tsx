"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";

interface ErrorContextType {
    showError: (message: string, title?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('Error');
    const [message, setMessage] = useState('');

    const showError = useCallback((msg: string, heading: string = 'Error') => {
        setMessage(msg);
        setTitle(heading);
        setIsOpen(true);
    }, []);

    const handleClose = () => setIsOpen(false);

    return (
        <ErrorContext.Provider value={{ showError }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-red-200 bg-red-50 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-red-600">
                            {message}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end mt-2">
                        <Button
                            variant="destructive"
                            onClick={handleClose}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Dismiss
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ErrorContext.Provider>
    );
}

export function useError() {
    const context = useContext(ErrorContext);
    if (context === undefined) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
}
