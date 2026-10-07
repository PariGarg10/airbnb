"use client";

import { createContext, useContext } from "react";

export interface EditorUiValue {
  openRemove: () => void;
  hostName: string;
  joinedYear: number;
  avatarUrl: string | null;
}

const EditorUiContext = createContext<EditorUiValue>({
  openRemove: () => {},
  hostName: "",
  joinedYear: new Date().getFullYear(),
  avatarUrl: null,
});

export function EditorUiProvider({ value, children }: { value: EditorUiValue; children: React.ReactNode }) {
  return <EditorUiContext.Provider value={value}>{children}</EditorUiContext.Provider>;
}

export function useEditorUi() {
  return useContext(EditorUiContext);
}
