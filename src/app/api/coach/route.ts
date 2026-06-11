import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { coachRequestSchema } from '@/features/coach/schemas/coach.schemas';
import type { Message } from '@/features/coach/types/coach.types';

export const dynamic = 'force-dynamic';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/** In-memory rate limiting map */
const rateLimitMap = new Map<string, RateLimitEntry>();

/** Clean up rate limit map if it grows too large (prevent memory leaks) */
function pruneRateLimitMap() {
  const now = Date.now();
  if (rateLimitMap.size > 2000) {
    rateLimitMap.forEach((entry, userId) => {
      if (now > entry.resetTime) {
        rateLimitMap.delete(userId);
      }
    });
  }
}

/** Rate limits: max 20 requests per hour per user */
function isRateLimited(userId: string): { limited: boolean; resetTimeLeftMs: number } {
  pruneRateLimitMap();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const entry = rateLimitMap.get(userId);

  if (!entry) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + ONE_HOUR });
    return { limited: false, resetTimeLeftMs: ONE_HOUR };
  }

  if (now > entry.resetTime) {
    // Hour window has passed, reset counter
    rateLimitMap.set(userId, { count: 1, resetTime: now + ONE_HOUR });
    return { limited: false, resetTimeLeftMs: ONE_HOUR };
  }

  if (entry.count >= 20) {
    return { limited: true, resetTimeLeftMs: entry.resetTime - now };
  }

  entry.count += 1;
  return { limited: false, resetTimeLeftMs: entry.resetTime - now };
}

/**
 * POST /api/coach
 *
 * Streams personalized sustainability coaching responses.
 * Enforces authentication, rate limits (20/hr), and validates inputs.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    // Rate limiting check
    const { limited, resetTimeLeftMs } = isRateLimited(user.id);
    if (limited) {
      const minutesLeft = Math.ceil(resetTimeLeftMs / (60 * 1000));
      return NextResponse.json(
        { message: `Rate limit exceeded. Please try again in ${minutesLeft} minutes.` },
        { status: 429 },
      );
    }

    // Body validation
    const body = await request.json();
    const parseResult = coachRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Invalid request payload.', errors: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { message: latestMessage, conversationHistory } = parseResult.data;

    // Fetch user's latest carbon footprint assessment
    const { data: assessments, error: dbError } = await supabase
      .from('assessments')
      .select('transport_kg, diet_kg, energy_kg, shopping_kg, total_kg, compared_to_average, percentile')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    let footprint = {
      transport: 2000,
      diet: 2500,
      energy: 3000,
      shopping: 1200,
      total: 8700,
      comparedToAverage: 1.85,
      percentile: 65,
    };

    if (!dbError && assessments && assessments.length > 0) {
      const latest = assessments[0];
      if (latest) {
        footprint = {
          transport: latest.transport_kg,
          diet: latest.diet_kg,
          energy: latest.energy_kg,
          shopping: latest.shopping_kg,
          total: latest.total_kg,
          comparedToAverage: latest.compared_to_average,
          percentile: latest.percentile,
        };
      }
    }

    // Identify highest footprint category for specific focus
    const categories = [
      { name: 'Transport', value: footprint.transport },
      { name: 'Diet', value: footprint.diet },
      { name: 'Energy', value: footprint.energy },
      { name: 'Shopping', value: footprint.shopping },
    ];
    const highestCategory = categories.reduce((prev, current) =>
      current.value > prev.value ? current : prev,
    ).name;

    const systemPrompt = `You are EcoGuide, a sustainability coach. User's carbon data:
- Transport emissions: ${footprint.transport.toFixed(0)} kg CO₂/yr
- Diet emissions: ${footprint.diet.toFixed(0)} kg CO₂/yr
- Energy emissions: ${footprint.energy.toFixed(0)} kg CO₂/yr
- Shopping emissions: ${footprint.shopping.toFixed(0)} kg CO₂/yr
- Total annual emissions: ${footprint.total.toFixed(0)} kg CO₂/yr
- Ratio to global average: ${footprint.comparedToAverage.toFixed(2)}x
- Percentile ranking: ${footprint.percentile}/100 (lower is better)

The user's highest footprint category is ${highestCategory}. Give specific, actionable advice based on their highest-impact categories.
Be encouraging, not preachy. Max 200 words per response. Do not use markdown headers (no '#', '##', etc.).`;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Offline/unconfigured simulated stream to facilitate smooth local development testing
      const encoder = new TextEncoder();
      const mockReply = `Hello! I am EcoGuide, your sustainability coach. I see that your carbon footprint is ${footprint.total.toFixed(0)} kg CO₂/yr. Since your highest footprint category is ${highestCategory}, I'd suggest starting with small, practical steps there.

(Note: ANTHROPIC_API_KEY is not configured in your .env.local file, so this is a simulated response).

To tackle ${highestCategory.toLowerCase()}, you might consider:
1. Identifying one simple habit change this week.
2. Keeping track of daily choices in that category.

What specific goals or challenges do you face in reducing your ${highestCategory.toLowerCase()} footprint? I'm here to help!`;

      let charIndex = 0;
      const stream = new ReadableStream({
        async start(controller) {
          const interval = setInterval(() => {
            if (charIndex >= mockReply.length) {
              clearInterval(interval);
              controller.close();
              return;
            }
            // Stream chunks of text at a readable typing pace
            const chunk = mockReply.slice(charIndex, charIndex + 4);
            charIndex += 4;
            controller.enqueue(encoder.encode(chunk));
          }, 20);
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Format chat history into Anthropic messages structure
    // Anthropic API expects role to be 'user' or 'assistant'
    const formattedMessages = conversationHistory.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add the user's latest query
    formattedMessages.push({
      role: 'user',
      content: latestMessage,
    });

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      console.error('[API /api/coach] Anthropic API failed:', errBody);
      return NextResponse.json(
        { message: 'Coaching service is currently unavailable.' },
        { status: 502 },
      );
    }

    const reader = anthropicResponse.body?.getReader();
    if (!reader) {
      throw new Error('Anthropic response body is not readable.');
    }

    const decoder = new TextDecoder();
    let streamBuffer = '';

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          let isReading = true;
          while (isReading) {
            const { done, value } = await reader.read();
            if (done) {
              isReading = false;
              break;
            }

            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

              const dataPayload = trimmedLine.slice(5).trim();
              if (dataPayload === '[DONE]') continue;

              try {
                const event = JSON.parse(dataPayload);
                if (
                  event.type === 'content_block_delta' &&
                  event.delta?.type === 'text_delta' &&
                  event.delta?.text
                ) {
                  controller.enqueue(new TextEncoder().encode(event.delta.text));
                }
              } catch {
                // Ignore incomplete event payloads
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[POST /api/coach] Server error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
