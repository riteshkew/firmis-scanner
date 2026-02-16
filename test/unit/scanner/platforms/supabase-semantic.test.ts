import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { SupabaseSemanticAnalyzer } from '../../../../src/scanner/platforms/supabase/semantic-analyzer.js'

describe('SupabaseSemanticAnalyzer', () => {
  const testDir = join(process.cwd(), 'test-fixtures-temp')
  let analyzer: SupabaseSemanticAnalyzer

  beforeEach(async () => {
    analyzer = new SupabaseSemanticAnalyzer()
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe('Table without RLS detection (supa-rls-001)', () => {
    it('detects table without RLS', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        CREATE TABLE users (id uuid PRIMARY KEY);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const rlsThreats = threats.filter(t => t.ruleId === 'supa-rls-001')

      expect(rlsThreats.length).toBe(1)
      expect(rlsThreats[0].severity).toBe('critical')
      expect(rlsThreats[0].message).toContain('users')
    })

    it('does not flag table with RLS enabled', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        CREATE TABLE users (id uuid PRIMARY KEY);
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "read" ON users FOR SELECT USING (true);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const rlsThreats = threats.filter(t => t.ruleId === 'supa-rls-001')

      expect(rlsThreats.length).toBe(0)
    })

    it('ignores system tables', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        CREATE TABLE schema_migrations (version text);
        CREATE TABLE buckets (id uuid);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const rlsThreats = threats.filter(t => t.ruleId === 'supa-rls-001')

      expect(rlsThreats.length).toBe(0)
    })
  })

  describe('RLS without policies detection (supa-rls-002)', () => {
    it('detects RLS enabled but no policies', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        CREATE TABLE users (id uuid PRIMARY KEY);
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      `)

      const threats = await analyzer.analyze([sqlFile])
      const policyThreats = threats.filter(t => t.ruleId === 'supa-rls-002')

      expect(policyThreats.length).toBe(1)
      expect(policyThreats[0].severity).toBe('critical')
    })

    it('does not flag table with RLS and policies', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        CREATE TABLE users (id uuid PRIMARY KEY);
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can read" ON users FOR SELECT USING (auth.uid() = id);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const policyThreats = threats.filter(t => t.ruleId === 'supa-rls-002')

      expect(policyThreats.length).toBe(0)
    })
  })

  describe('Bucket without policies detection (supa-storage-002)', () => {
    it('detects private bucket without policies', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', false);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const bucketThreats = threats.filter(t => t.ruleId === 'supa-storage-002')

      expect(bucketThreats.length).toBe(1)
      expect(bucketThreats[0].severity).toBe('medium')
    })

    it('does not flag bucket with storage.objects policies', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', false);
        CREATE POLICY "read" ON storage.objects FOR SELECT USING (true);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const bucketThreats = threats.filter(t => t.ruleId === 'supa-storage-002')

      expect(bucketThreats.length).toBe(0)
    })

    it('does not flag public bucket (detected by different rule)', async () => {
      const sqlFile = join(testDir, 'migration.sql')
      await writeFile(sqlFile, `
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
      `)

      const threats = await analyzer.analyze([sqlFile])
      const bucketThreats = threats.filter(t => t.ruleId === 'supa-storage-002')

      expect(bucketThreats.length).toBe(0)
    })
  })

  describe('SMTP configuration detection (supa-auth-003)', () => {
    it('detects missing SMTP in config', async () => {
      const configFile = join(testDir, 'config.toml')
      await writeFile(configFile, `
[auth]
enable_signup = true
enable_confirmations = true
      `)

      const threats = await analyzer.analyze([], configFile)
      const smtpThreats = threats.filter(t => t.ruleId === 'supa-auth-003')

      expect(smtpThreats.length).toBe(1)
      expect(smtpThreats[0].severity).toBe('low')
    })

    it('does not flag when SMTP is configured', async () => {
      const configFile = join(testDir, 'config.toml')
      await writeFile(configFile, `
[auth]
enable_signup = true

[auth.smtp]
host = "smtp.sendgrid.net"
      `)

      const threats = await analyzer.analyze([], configFile)
      const smtpThreats = threats.filter(t => t.ruleId === 'supa-auth-003')

      expect(smtpThreats.length).toBe(0)
    })
  })

  describe('Cross-file analysis', () => {
    it('correlates RLS across multiple files', async () => {
      const file1 = join(testDir, '001_tables.sql')
      const file2 = join(testDir, '002_rls.sql')

      await writeFile(file1, `
        CREATE TABLE users (id uuid PRIMARY KEY);
        CREATE TABLE posts (id uuid PRIMARY KEY);
      `)
      await writeFile(file2, `
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "read" ON users FOR SELECT USING (true);
      `)

      const threats = await analyzer.analyze([file1, file2])

      // users should have no RLS issues (has RLS + policy)
      const usersThreats = threats.filter(t =>
        t.message.includes('users') && (t.ruleId === 'supa-rls-001' || t.ruleId === 'supa-rls-002')
      )
      expect(usersThreats.length).toBe(0)

      // posts should have RLS not enabled issue
      const postsThreats = threats.filter(t =>
        t.message.includes('posts') && t.ruleId === 'supa-rls-001'
      )
      expect(postsThreats.length).toBe(1)
    })
  })
})
