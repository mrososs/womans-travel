#!/usr/bin/env node
/**
 * Storyblok seed — pushes the Durrah content model + content into a space
 * via the Management API. Idempotent: components and stories are matched by
 * name/slug and updated in place, so it is safe to re-run.
 *
 * Usage:
 *   STORYBLOK_MANAGEMENT_TOKEN=... STORYBLOK_SPACE_ID=... node tools/storyblok/seed.mjs
 *   (or put both in .env and run `pnpm seed:storyblok`)
 *
 * Reads: tools/storyblok/components.json  (component schemas)
 *        tools/storyblok/content.json     (folders, stories, shared fragments)
 *
 * Field-level i18n: the space's default language is Arabic; English values use
 * the `<field>__i18n__en` key convention inside story content.
 */

import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// Load .env from the repo root when the vars aren't already exported.
const envFile = resolve(repoRoot, '.env');
if (existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch {
    /* already-set vars win; malformed .env is ignored */
  }
}

const TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;
if (!TOKEN || !SPACE_ID) {
  console.error('Missing STORYBLOK_MANAGEMENT_TOKEN and/or STORYBLOK_SPACE_ID (set in env or .env).');
  process.exit(1);
}

const BASE = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Management API call with 429 retry and a pacing delay (MAPI is rate-limited). */
async function mapi(method, path, body, attempt = 0) {
  await sleep(200);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429 && attempt < 5) {
    const wait = 1000 * 2 ** attempt;
    console.warn(`  429 rate-limited, retrying in ${wait}ms…`);
    await sleep(wait);
    return mapi(method, path, body, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

const componentsFile = JSON.parse(readFileSync(resolve(here, 'components.json'), 'utf8'));
const contentFile = JSON.parse(readFileSync(resolve(here, 'content.json'), 'utf8'));

/** Resolve "@fragment" string references and stamp a fresh _uid on every blok. */
function hydrate(value) {
  if (typeof value === 'string' && value.startsWith('@')) {
    const frag = contentFile.fragments?.[value.slice(1)];
    if (!frag) throw new Error(`Unknown content fragment: ${value}`);
    return hydrate(structuredClone(frag));
  }
  if (Array.isArray(value)) return value.map(hydrate);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = hydrate(v);
    if (out.component && !out._uid) out._uid = randomUUID();
    return out;
  }
  return value;
}

async function ensureEnglishLanguage() {
  const { space } = await mapi('GET', '');
  const languages = space.languages ?? [];
  if (languages.some((l) => l.code === 'en')) {
    console.log('✓ Language "en" already configured');
    return;
  }
  await mapi('PUT', '', { space: { languages: [...languages, { code: 'en', name: 'English' }] } });
  console.log('✓ Added language "en" to the space');
}

async function upsertComponents() {
  const existing = await mapi('GET', '/components');
  const byName = new Map(existing.components.map((c) => [c.name, c]));
  for (const def of componentsFile.components) {
    const found = byName.get(def.name);
    if (found) {
      await mapi('PUT', `/components/${found.id}`, { component: def });
      console.log(`✓ Updated component ${def.name}`);
    } else {
      await mapi('POST', '/components', { component: def });
      console.log(`✓ Created component ${def.name}`);
    }
  }
}

/** Find a story (or folder) by its full slug; returns null when absent. */
async function findStory(fullSlug) {
  const data = await mapi('GET', `/stories?with_slug=${encodeURIComponent(fullSlug)}`);
  return data.stories?.[0] ?? null;
}

async function upsertFolders() {
  const folderIds = {};
  for (const folder of contentFile.folders) {
    const found = await findStory(folder.slug);
    if (found) {
      folderIds[folder.slug] = found.id;
      console.log(`✓ Folder ${folder.slug} exists`);
    } else {
      const { story } = await mapi('POST', '/stories', {
        story: { name: folder.name, slug: folder.slug, is_folder: true, parent_id: 0 },
      });
      folderIds[folder.slug] = story.id;
      console.log(`✓ Created folder ${folder.slug}`);
    }
  }
  return folderIds;
}

async function upsertStories(folderIds) {
  for (const entry of contentFile.stories) {
    const fullSlug = entry.folder ? `${entry.folder}/${entry.slug}` : entry.slug;
    const payload = {
      story: {
        name: entry.name,
        slug: entry.slug,
        parent_id: entry.folder ? folderIds[entry.folder] : 0,
        position: entry.position ?? 0,
        content: hydrate(entry.content),
      },
      publish: 1,
    };
    const found = await findStory(fullSlug);
    if (found) {
      await mapi('PUT', `/stories/${found.id}`, payload);
      console.log(`✓ Updated story ${fullSlug}`);
    } else {
      await mapi('POST', '/stories', payload);
      console.log(`✓ Created story ${fullSlug}`);
    }
  }
}

console.log(`Seeding Storyblok space ${SPACE_ID}…`);
await ensureEnglishLanguage();
await upsertComponents();
const folderIds = await upsertFolders();
await upsertStories(folderIds);
console.log(`Done: ${contentFile.stories.length} stories across ${contentFile.folders.length} folders + site-settings.`);
