// core/kernel/kernel-bootstrap-command-pack.ts

import type { PantavionKernelCommandKey } from './kernel-command-surface';
import type { PantavionKernelScriptKey } from './kernel-script-surface';

export interface PantavionKernelBootstrapCommandEntry {
  key: string;
  title: string;
  commandKind: 'command-surface' | 'script-surface' | 'saved-export';
  command:
    | PantavionKernelCommandKey
    | PantavionKernelScriptKey
    | 'save:json'
    | 'save:summary'
    | 'save:combined';
  description: string;
}

export interface PantavionKernelBootstrapCommandPack {
  generatedAt: string;
  entries: PantavionKernelBootstrapCommandEntry[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildKernelBootstrapCommandPack(): PantavionKernelBootstrapCommandPack {
  const entries: PantavionKernelBootstrapCommandEntry[] = [
    {
      key: 'cmd.readiness',
      title: 'Run readiness command',
      commandKind: 'command-surface',
      command: 'run:readiness',
      description: 'Returns readiness-focused rendered output.',
    },
    {
      key: 'cmd.ops',
      title: 'Run ops command',
      commandKind: 'command-surface',
      command: 'run:ops',
      description: 'Returns ops-focused rendered output.',
    },
    {
      key: 'cmd.entrypoint',
      title: 'Run entrypoint command',
      commandKind: 'command-surface',
      command: 'run:entrypoint',
      description: 'Runs the full entrypoint surface and returns terminal-style output.',
    },
    {
      key: 'script.entrypoint',
      title: 'Run entrypoint render script',
      commandKind: 'script-surface',
      command: 'entrypoint-render',
      description: 'Executes the entrypoint-render script surface.',
    },
    {
      key: 'script.export',
      title: 'Run export json script',
      commandKind: 'script-surface',
      command: 'export-json',
      description: 'Executes exported JSON script surface.',
    },
    {
      key: 'save.json',
      title: 'Create saved JSON export',
      commandKind: 'saved-export',
      command: 'save:json',
      description: 'Builds a JSON export payload suitable for saving.',
    },
    {
      key: 'save.summary',
      title: 'Create saved summary export',
      commandKind: 'saved-export',
      command: 'save:summary',
      description: 'Builds a text summary artifact suitable for saving.',
    },
    {
      key: 'save.combined',
      title: 'Create combined saved export',
      commandKind: 'saved-export',
      command: 'save:combined',
      description: 'Builds a combined text artifact containing summary + JSON.',
    },
  ];

  const rendered = [
    'PANTAVION KERNEL BOOTSTRAP COMMAND PACK',
    ...entries.flatMap((entry) => [
      '',
      `${entry.key}`,
      `title=${entry.title}`,
      `kind=${entry.commandKind}`,
      `command=${entry.command}`,
      `description=${entry.description}`,
    ]),
  ].join('\n');

  return {
    generatedAt: nowIso(),
    entries,
    rendered,
  };
}

export function renderKernelBootstrapCommandPack(): string {
  return buildKernelBootstrapCommandPack().rendered;
}

export default buildKernelBootstrapCommandPack;
