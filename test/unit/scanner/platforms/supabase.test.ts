import { describe, it, expect } from 'vitest'
import {
  parseTables,
  parsePolicies,
  parseBuckets,
  findSecurityDefinerFunctions,
} from '../../../../src/scanner/platforms/supabase/sql-parser.js'
import { parseAuthConfig } from '../../../../src/scanner/platforms/supabase/config-parser.js'

describe('Supabase SQL Parser', () => {
  describe('parseTables', () => {
    it('extracts table names from CREATE TABLE statements', () => {
      const sql = `
        CREATE TABLE users (
          id uuid PRIMARY KEY,
          email text NOT NULL
        );
        CREATE TABLE IF NOT EXISTS profiles (
          id uuid PRIMARY KEY
        );
      `
      const tables = parseTables(sql, 'test.sql')
      expect(tables).toHaveLength(2)
      expect(tables[0].name).toBe('users')
      expect(tables[1].name).toBe('profiles')
    })

    it('detects schema-qualified tables', () => {
      const sql = `CREATE TABLE public.users (id uuid);`
      const tables = parseTables(sql, 'test.sql')
      expect(tables[0].schema).toBe('public')
      expect(tables[0].name).toBe('users')
    })

    it('tracks RLS enablement', () => {
      const sql = `
        CREATE TABLE users (id uuid);
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        CREATE TABLE profiles (id uuid);
      `
      const tables = parseTables(sql, 'test.sql')
      expect(tables.find(t => t.name === 'users')?.rlsEnabled).toBe(true)
      expect(tables.find(t => t.name === 'profiles')?.rlsEnabled).toBe(false)
    })

    it('includes source file and line number', () => {
      const sql = `CREATE TABLE users (id uuid);`
      const tables = parseTables(sql, 'migrations/001.sql')
      expect(tables[0].sourceFile).toBe('migrations/001.sql')
      expect(tables[0].sourceLine).toBe(1)
    })
  })

  describe('parsePolicies', () => {
    it('extracts policy details', () => {
      const sql = `
        CREATE POLICY "user_select" ON users
        FOR SELECT
        USING (auth.uid() = user_id);
      `
      const policies = parsePolicies(sql, 'test.sql')
      expect(policies).toHaveLength(1)
      expect(policies[0].name).toBe('user_select')
      expect(policies[0].table).toBe('users')
      expect(policies[0].operation).toBe('SELECT')
      expect(policies[0].using).toContain('auth.uid()')
    })

    it('extracts WITH CHECK clause', () => {
      const sql = `
        CREATE POLICY "user_insert" ON users
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
      `
      const policies = parsePolicies(sql, 'test.sql')
      expect(policies[0].withCheck).toContain('auth.uid()')
    })

    it('handles policies with both USING and WITH CHECK', () => {
      const sql = `
        CREATE POLICY "user_update" ON users
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `
      const policies = parsePolicies(sql, 'test.sql')
      expect(policies[0].using).toBeDefined()
      expect(policies[0].withCheck).toBeDefined()
    })

    it('defaults operation to ALL when not specified', () => {
      const sql = `CREATE POLICY "allow_all" ON users USING (true);`
      const policies = parsePolicies(sql, 'test.sql')
      expect(policies[0].operation).toBe('ALL')
    })
  })

  describe('parseBuckets', () => {
    it('extracts bucket name and public status', () => {
      const sql = `
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
      `
      const buckets = parseBuckets(sql, 'test.sql')
      expect(buckets).toHaveLength(1)
      expect(buckets[0].name).toBe('avatars')
      expect(buckets[0].public).toBe(true)
    })

    it('detects private buckets', () => {
      const sql = `
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', false);
      `
      const buckets = parseBuckets(sql, 'test.sql')
      expect(buckets[0].public).toBe(false)
    })
  })

  describe('findSecurityDefinerFunctions', () => {
    it('finds SECURITY DEFINER functions', () => {
      const sql = `
        CREATE FUNCTION get_all_users()
        RETURNS SETOF users
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$ SELECT * FROM users; $$;
      `
      const funcs = findSecurityDefinerFunctions(sql, 'test.sql')
      expect(funcs).toHaveLength(1)
      expect(funcs[0].name).toBe('get_all_users')
    })

    it('handles CREATE OR REPLACE FUNCTION', () => {
      const sql = `
        CREATE OR REPLACE FUNCTION admin_action()
        RETURNS void
        SECURITY DEFINER
        AS $$ -- ... $$;
      `
      const funcs = findSecurityDefinerFunctions(sql, 'test.sql')
      expect(funcs).toHaveLength(1)
      expect(funcs[0].name).toBe('admin_action')
    })
  })
})

describe('Supabase Config Parser', () => {
  describe('parseAuthConfig', () => {
    it('parses auth section settings', () => {
      const toml = `
[auth]
enable_signup = true
enable_confirmations = false
otp_exp = 7200
      `
      const config = parseAuthConfig(toml, 'config.toml')
      expect(config).not.toBeNull()
      expect(config?.enableSignup).toBe(true)
      expect(config?.enableConfirmations).toBe(false)
      expect(config?.otpExpiry).toBe(7200)
    })

    it('detects SMTP configuration', () => {
      const toml = `
[auth]
enable_confirmations = true

[auth.smtp]
host = "smtp.sendgrid.net"
port = 587
      `
      const config = parseAuthConfig(toml, 'config.toml')
      expect(config?.smtpConfigured).toBe(true)
    })

    it('returns defaults when sections are missing', () => {
      const toml = `
[project]
name = "my-project"
      `
      const config = parseAuthConfig(toml, 'config.toml')
      expect(config?.enableSignup).toBe(true)
      expect(config?.enableConfirmations).toBe(true)
      expect(config?.smtpConfigured).toBe(false)
    })

    it('includes source file', () => {
      const toml = `[auth]\nenable_signup = true`
      const config = parseAuthConfig(toml, 'supabase/config.toml')
      expect(config?.sourceFile).toBe('supabase/config.toml')
    })
  })
})
