'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Edit2, CheckCircle } from "lucide-react";
import type { Round } from '@/lib/types';

interface RoundsEditorProps {
  rounds: Round[];
  jobTitle: string;
  onSaveRounds: (rounds: Round[]) => void;
}

export function RoundsEditor({ rounds, jobTitle, onSaveRounds }: RoundsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedRounds, setEditedRounds] = useState<Round[]>(rounds);
  const [newRoundName, setNewRoundName] = useState('');
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [editingRoundName, setEditingRoundName] = useState('');

  const handleAddRound = () => {
    if (newRoundName.trim()) {
      const newRound: Round = {
        id: `round-${Date.now()}`,
        name: newRoundName.trim(),
        order: editedRounds.length + 1
      };
      setEditedRounds([...editedRounds, newRound]);
      setNewRoundName('');
    }
  };

  const handleRemoveRound = (id: string) => {
    const filtered = editedRounds.filter(r => r.id !== id);
    setEditedRounds(filtered.map((r, idx) => ({ ...r, order: idx + 1 })));
  };

  const handleEditRound = (id: string, currentName: string) => {
    setEditingRoundId(id);
    setEditingRoundName(currentName);
  };

  const handleSaveRoundEdit = (id: string) => {
    if (editingRoundName.trim()) {
      setEditedRounds(editedRounds.map(r => 
        r.id === id ? { ...r, name: editingRoundName.trim() } : r
      ));
      setEditingRoundId(null);
      setEditingRoundName('');
    }
  };

  const handleSave = () => {
    onSaveRounds(editedRounds);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditedRounds(rounds);
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-slate-700 border-slate-300 hover:bg-slate-100"
      >
        <Edit2 className="w-4 h-4" />
        Edit Rounds
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Customize Interview Rounds</DialogTitle>
            <p className="text-xs text-slate-500 mt-1">{jobTitle}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Rounds */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">Current Rounds</p>
              <div className="space-y-2">
                {editedRounds.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No rounds configured</p>
                ) : (
                  editedRounds.map((round, idx) => (
                    <div key={round.id} className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-slate-50 p-3 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
                      <Badge className="bg-blue-600 text-white font-bold text-xs shrink-0">{idx + 1}</Badge>
                      {editingRoundId === round.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={editingRoundName}
                            onChange={(e) => setEditingRoundName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveRoundEdit(round.id);
                              }
                            }}
                            className="text-sm h-7 border-blue-300"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveRoundEdit(round.id)}
                            className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRoundId(null)}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-900 flex-1 cursor-pointer" onClick={() => handleEditRound(round.id, round.name)}>
                            {round.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRound(round.id, round.name)}
                            className="h-6 w-6 p-0 hover:bg-blue-200 hover:text-blue-600"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRound(round.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Round */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">Add New Round</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Technical Assessment"
                  value={newRoundName}
                  onChange={(e) => setNewRoundName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRound();
                    }
                  }}
                  className="text-sm border-slate-300"
                />
                <Button
                  size="sm"
                  onClick={handleAddRound}
                  className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Save Rounds
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
