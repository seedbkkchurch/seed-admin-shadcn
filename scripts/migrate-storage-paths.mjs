#!/usr/bin/env node
// One-off migration: copies files from the bucket's old flat layout to the
// new public/private layout, and updates the DB rows that reference them.
//
//   old:  profile/seedbkk/{name}.jpg      -> new: public/seedbkk/profile/{name}.jpg
//   old:  devotion/{uuid}.jpg             -> new: public/seedbkk/devotion/{uuid}.jpg   (is_public = true)
//                                          -> new: private/seedbkk/devotion/{uuid}.jpg  (is_public = false)
//
// Old files are COPIED, not moved — nothing is deleted from storage. Once
// you've confirmed the app looks right against the new paths, you can
// delete the old profile/seedbkk/ and devotion/ folders yourself from the
// Supabase dashboard.
//
// Run from the project root:
//   node scripts/migrate-storage-paths.mjs
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env (same file the
// app uses). lamb_info/lamb_devotion and bucket-seed's storage policies only
// allow the `authenticated` Postgres role (see grill-me follow-up
// 2026-08-11) — this app has no `anon`-level access, matching how every
// /lamb-info page requires a real Supabase Auth session. So this script
// prompts for a staff email/password and signs in first, the same way the
// app's own sign-in form does. Credentials are typed directly into this
// terminal and only ever sent to Supabase — never logged or written anywhere.

import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { createClient } from '@supabase/supabase-js'

async function promptCredentials() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const email = await rl.question('Staff email: ')
  // Hide password input isn't built into readline; note that clearly so
  // nobody is surprised it echoes to the terminal.
  const password = await rl.question('Staff password (will be visible as you type): ')
  rl.close()
  return { email: email.trim(), password }
}

const BUCKET = 'bucket-seed'
const OLD_AVATAR_PREFIX = 'profile/seedbkk'
const NEW_AVATAR_PREFIX = 'public/seedbkk/profile'
const OLD_DEVOTION_PREFIX = 'devotion'
const NEW_DEVOTION_PUBLIC_PREFIX = 'public/seedbkk/devotion'
const NEW_DEVOTION_PRIVATE_PREFIX = 'private/seedbkk/devotion'

function loadEnv() {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

function pathFromPublicUrl(url, bucket) {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const qIdx = rest.indexOf('?')
  return qIdx === -1 ? rest : rest.slice(0, qIdx)
}

async function copyIfNeeded(supabase, oldPath, newPath) {
  const { error } = await supabase.storage.from(BUCKET).copy(oldPath, newPath)
  // Supabase returns an error if the destination already exists — treat
  // that as "already migrated", not a failure.
  if (error && !/already exists/i.test(error.message ?? '')) {
    throw error
  }
}

async function migrateAvatars(supabase) {
  console.log('\n--- Migrating lamb_info.profile_picture ---')
  const { data: rows, error } = await supabase
    .from('lamb_info')
    .select('id, profile_picture')
    .not('profile_picture', 'is', null)

  if (error) throw error

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const url = row.profile_picture
    const oldPath = pathFromPublicUrl(url, BUCKET)
    if (!oldPath || !oldPath.startsWith(`${OLD_AVATAR_PREFIX}/`)) {
      skipped++
      continue
    }

    try {
      const filename = oldPath.slice(OLD_AVATAR_PREFIX.length + 1)
      const newPath = `${NEW_AVATAR_PREFIX}/${filename}`

      await copyIfNeeded(supabase, oldPath, newPath)

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(newPath)
      const newUrl = `${publicUrl}?v=${Date.now()}`

      const { error: updateError } = await supabase
        .from('lamb_info')
        .update({ profile_picture: newUrl })
        .eq('id', row.id)
      if (updateError) throw updateError

      migrated++
      console.log(`  ✓ lamb_info ${row.id}: ${oldPath} -> ${newPath}`)
    } catch (err) {
      failed++
      console.error(`  ✗ lamb_info ${row.id} (${oldPath}):`, err.message ?? err)
    }
  }

  console.log(`Avatars: ${migrated} migrated, ${skipped} skipped (already new path or external), ${failed} failed`)
}

async function migrateDevotions(supabase) {
  console.log('\n--- Migrating lamb_devotion.image_urls / content_html ---')
  const { data: rows, error } = await supabase
    .from('lamb_devotion')
    .select('id, image_urls, content_html, is_public')

  if (error) throw error

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    try {
      const newPrefix = row.is_public
        ? NEW_DEVOTION_PUBLIC_PREFIX
        : NEW_DEVOTION_PRIVATE_PREFIX

      const urlMap = new Map() // oldUrl -> newUrl
      const newImageUrls = []

      for (const url of row.image_urls ?? []) {
        const oldPath = pathFromPublicUrl(url, BUCKET)
        if (!oldPath || !oldPath.startsWith(`${OLD_DEVOTION_PREFIX}/`)) {
          // Already migrated or not a bucket URL we recognize — leave as-is.
          newImageUrls.push(url)
          continue
        }

        const filename = oldPath.slice(OLD_DEVOTION_PREFIX.length + 1)
        const newPath = `${newPrefix}/${filename}`
        await copyIfNeeded(supabase, oldPath, newPath)

        const {
          data: { publicUrl: newUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(newPath)

        urlMap.set(url, newUrl)
        newImageUrls.push(newUrl)
      }

      if (urlMap.size === 0) {
        skipped++
        continue
      }

      let newContentHtml = row.content_html ?? ''
      for (const [oldUrl, newUrl] of urlMap) {
        newContentHtml = newContentHtml.split(oldUrl).join(newUrl)
      }

      const { error: updateError } = await supabase
        .from('lamb_devotion')
        .update({ image_urls: newImageUrls, content_html: newContentHtml })
        .eq('id', row.id)
      if (updateError) throw updateError

      migrated++
      console.log(`  ✓ lamb_devotion ${row.id}: ${urlMap.size} image(s) -> ${newPrefix}/`)
    } catch (err) {
      failed++
      console.error(`  ✗ lamb_devotion ${row.id}:`, err.message ?? err)
    }
  }

  console.log(`Devotions: ${migrated} migrated, ${skipped} skipped (no old-path images), ${failed} failed`)
}

async function main() {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
  }

  const supabase = createClient(url, key)

  console.log('This project requires a logged-in staff session to migrate data (RLS).')
  const { email, password } = await promptCredentials()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) {
    throw new Error(`Sign-in failed: ${signInError.message}`)
  }
  console.log(`Signed in as ${email}.\n`)

  await migrateAvatars(supabase)
  await migrateDevotions(supabase)

  console.log('\nDone. Old files were copied, not deleted — verify the app, then')
  console.log('remove the old profile/seedbkk/ and devotion/ folders from Storage yourself.')
}

main().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})
