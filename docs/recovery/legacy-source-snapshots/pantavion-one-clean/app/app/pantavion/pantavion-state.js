"use client";

/*
PANTAVION STATE — GLOBAL STATE ENGINE v1
Handles navigation, memory, projects, persistence
*/

import { useState, useEffect } from "react";

export function usePantavionState() {

  // =========================
  // 1. NAVIGATION STATE
  // =========================
  const [currentRoute, setCurrentRoute] = useState("home");
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  // =========================
  // 2. PROJECT MEMORY
  // =========================
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  // =========================
  // 3. UI STATE
  // =========================
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // =========================
  // 4. LOCAL STORAGE (PERSISTENCE)
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem("pantavion_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projects) setProjects(parsed.projects);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "pantavion_state",
      JSON.stringify({ projects })
    );
  }, [projects]);

  // =========================
  // 5. ACTIONS
  // =========================
  const openRoute = (route) => {
    setCurrentRoute(route);
  };

  const openWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
  };

  const createProject = (name) => {
    const newProject = {
      id: Date.now(),
      name,
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => [...prev, newProject]);
    setActiveProject(newProject);
  };

  // =========================
  // 6. PUBLIC API
  // =========================
  return {
    currentRoute,
    currentWorkspace,
    projects,
    activeProject,
    loading,
    panelOpen,

    openRoute,
    openWorkspace,
    createProject,

    setLoading,
    setPanelOpen,
  };
}
