import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Provider = 'openai' | 'claude'
type Action = 'generate' | 'refine' | 'hooks' | 'test'

interface RequestBody {
  action?: Action
  provider?: Provider
  model?: string
  systemPrompt?: string
  userPrompt?: string
  content?: string
  instruction?: string
  temperature?: number
  maxTokens?: number
}

const OPENAI_DEFAULT_MODEL = 'gpt-4.1-mini'
const CLAUDE_DEFAULT_MODEL = 'claude-sonnet-4-20250514'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function ensureEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function normalizeProvider(value: unknown): Provider {
  return value === 'claude' ? 'claude' : 'openai'
}

function normalizeAction(value: unknown): Action {
  if (value === 'refine' || value === 'hooks' || value === 'test') return value
  return 'generate'
}

function buildPrompts(body: RequestBody) {
  const action = normalizeAction(body.action)
  const systemPrompt = body.systemPrompt?.trim() || ''

  if (action === 'test') {
    return {
      systemPrompt: 'You are a health-check assistant. Reply with exactly: ok',
      userPrompt: 'Return exactly: ok',
    }
  }

  if (action === 'refine') {
    return {
      systemPrompt: systemPrompt || 'You are a helpful writing assistant.',
      userPrompt: [
        'Refine this content according to the instruction below.',
        '',
        'CONTENT:',
        body.content?.trim() || '',
        '',
        'INSTRUCTION:',
        body.instruction?.trim() || '',
      ].join('\n'),
    }
  }

  if (action === 'hooks') {
    return {
      systemPrompt: systemPrompt || 'You are a helpful writing assistant.',
      userPrompt: body.content?.trim() || body.userPrompt?.trim() || '',
    }
  }

  return {
    systemPrompt,
    userPrompt: body.userPrompt?.trim() || body.content?.trim() || '',
  }
}

async function getAuthenticatedUserId(req: Request): Promise<string> {
  const supabaseUrl = ensureEnv('SUPABASE_URL')
  const supabaseAnonKey = ensureEnv('SUPABASE_ANON_KEY')
  const authHeader = req.headers.get('Authorization') || ''

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user.id
}

async function getUserApiKey(userId: string, provider: Provider): Promise<string> {
  const supabaseUrl = ensureEnv('SUPABASE_URL')
  const serviceRoleKey = ensureEnv('SUPABASE_SERVICE_ROLE_KEY')
  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  const rpcName = provider === 'claude' ? 'decrypt_claude_api_key' : 'decrypt_api_key'
  const { data, error } = await serviceClient.rpc(rpcName as any, { user_id_param: userId })

  if (error) throw new Error(`Could not decrypt ${provider} API key`)
  if (!data) throw new Error(`No ${provider} API key found for this account`)
  return String(data)
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string, temperature: number, maxTokens: number) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || OPENAI_DEFAULT_MODEL,
      temperature,
      max_output_tokens: maxTokens,
      input: [
        ...(systemPrompt ? [{ role: 'system', content: [{ type: 'input_text', text: systemPrompt }] }] : []),
        { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || 'OpenAI request failed')
  }

  const outputText = data.output_text
    || data.output?.flatMap((item: any) => item.content ?? []).map((item: any) => item.text).join('\n').trim()

  if (!outputText) throw new Error('OpenAI returned an empty response')
  return outputText
}

async function callClaude(apiKey: string, model: string, systemPrompt: string, userPrompt: string, temperature: number, maxTokens: number) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || CLAUDE_DEFAULT_MODEL,
      system: systemPrompt || undefined,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Claude request failed')
  }

  const outputText = Array.isArray(data.content)
    ? data.content.filter((item: any) => item.type === 'text').map((item: any) => item.text).join('\n').trim()
    : ''

  if (!outputText) throw new Error('Claude returned an empty response')
  return outputText
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json() as RequestBody
    const provider = normalizeProvider(body.provider)
    const action = normalizeAction(body.action)
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7
    const maxTokens = typeof body.maxTokens === 'number' ? body.maxTokens : 1200
    const { systemPrompt, userPrompt } = buildPrompts(body)

    if (!userPrompt) {
      return json({ error: 'Missing prompt content' }, 400)
    }

    const userId = await getAuthenticatedUserId(req)
    const apiKey = await getUserApiKey(userId, provider)

    const content = provider === 'claude'
      ? await callClaude(apiKey, body.model || CLAUDE_DEFAULT_MODEL, systemPrompt, userPrompt, temperature, maxTokens)
      : await callOpenAI(apiKey, body.model || OPENAI_DEFAULT_MODEL, systemPrompt, userPrompt, temperature, maxTokens)

    if (action === 'test') {
      return json({ success: true, provider, model: body.model || (provider === 'claude' ? CLAUDE_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL) })
    }

    return json({
      success: true,
      provider,
      model: body.model || (provider === 'claude' ? CLAUDE_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL),
      content,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    return json({ success: false, error: message }, 500)
  }
})
