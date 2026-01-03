import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Use the most powerful model for accurate multimodal analysis
const PRIMARY_MODEL = 'google/gemini-2.5-pro';

// Tool definition for structured output
const analysisToolDefinition = {
  type: "function",
  function: {
    name: "submit_analysis_result",
    description: "Submit the fake content analysis result with structured data",
    parameters: {
      type: "object",
      properties: {
        verdict: {
          type: "string",
          enum: ["authentic", "suspicious", "fake"],
          description: "The overall authenticity verdict"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Confidence level from 0 to 100"
        },
        explanation: {
          type: "string",
          description: "Brief explanation of the analysis findings"
        },
        details: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Category name" },
              value: { type: "string", description: "Finding description" },
              type: { type: "string", enum: ["positive", "negative", "neutral"] }
            },
            required: ["label", "value", "type"]
          },
          description: "Detailed analysis breakdown"
        },
        flags: {
          type: "array",
          items: { type: "string" },
          description: "List of specific issues or red flags found"
        }
      },
      required: ["verdict", "confidence", "explanation", "details", "flags"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      content, 
      imageBase64, 
      videoFrames, 
      documentBase64,
      audioBase64,
      fileName,
      mimeType 
    } = await req.json();

    console.log(`[TRUTHLENS] Starting ${type} analysis...`);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let result;

    switch (type) {
      case 'text':
        result = await analyzeText(content);
        break;
      case 'url':
        result = await analyzeUrl(content);
        break;
      case 'image':
        result = await analyzeImage(imageBase64, mimeType);
        break;
      case 'video':
        result = await analyzeVideo(videoFrames);
        break;
      case 'document':
        result = await analyzeDocument(documentBase64, fileName, mimeType);
        break;
      case 'audio':
        result = await analyzeAudio(audioBase64, fileName, mimeType);
        break;
      default:
        throw new Error(`Unknown content type: ${type}`);
    }

    console.log(`[TRUTHLENS] Analysis complete: ${result.verdict} (${result.confidence}%)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[TRUTHLENS] Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: error instanceof Error && error.message.includes('Rate limit') ? 429 : 
               error instanceof Error && error.message.includes('credits') ? 402 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// ============ ANALYSIS FUNCTIONS ============

async function analyzeText(text: string) {
  const systemPrompt = `You are TRUTHLENS, an expert misinformation and AI-generated content detector. 
You analyze text for authenticity with forensic precision. Your analysis covers:

1. FACTUAL ACCURACY: Cross-reference claims against known facts. Flag unverifiable or false claims.
2. AI GENERATION MARKERS: Detect patterns typical of LLMs (repetitive structures, generic language, lack of personal voice)
3. MANIPULATION TACTICS: Identify emotional manipulation, fear-mongering, urgency creation, or sensationalism
4. LOGICAL INTEGRITY: Spot logical fallacies, strawman arguments, false equivalences
5. SOURCE CREDIBILITY: Assess if claims cite verifiable sources

VERDICT CRITERIA:
- AUTHENTIC: Factual, well-sourced, human-written content with no manipulation
- SUSPICIOUS: Some red flags but not definitive (unverified claims, mild sensationalism)
- FAKE: Clear misinformation, AI-generated pretending to be human, or deliberate manipulation`;

  const userPrompt = `Analyze this text for authenticity and misinformation:

"""
${text}
"""

Provide a thorough forensic analysis.`;

  return await callAIWithStructuredOutput(systemPrompt, userPrompt);
}

async function analyzeUrl(url: string) {
  let domain = '';
  let path = '';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname;
    path = parsed.pathname;
  } catch {
    domain = url;
  }

  const systemPrompt = `You are TRUTHLENS, a cybersecurity and domain analysis expert.
You evaluate URLs and domains for credibility and potential threats.

ANALYSIS FRAMEWORK:
1. DOMAIN REPUTATION: Check against known credible sources (major news outlets, .gov, .edu, established organizations)
2. TYPOSQUATTING DETECTION: Look for misspelled versions of legitimate domains
3. PHISHING INDICATORS: Suspicious subdomains, unusual TLDs, login-stealing patterns
4. URL STRUCTURE: Excessive parameters, suspicious redirects, URL shorteners
5. CONTENT TYPE INFERENCE: What type of content this URL likely serves

KNOWN CREDIBLE DOMAINS (examples): bbc.com, nytimes.com, reuters.com, apnews.com, .gov, .edu
SUSPICIOUS PATTERNS: unusual TLDs (.xyz, .tk, .ml), many subdomains, IP addresses as domains, misspellings

VERDICT CRITERIA:
- AUTHENTIC: Well-known, reputable domain with clean URL structure
- SUSPICIOUS: Unknown domain, minor red flags, needs verification
- FAKE: Clear phishing attempt, known malicious domain, or deceptive URL`;

  const userPrompt = `Analyze this URL for credibility and safety:

URL: ${url}
Domain: ${domain}
Path: ${path}

Evaluate the domain reputation and URL safety.`;

  return await callAIWithStructuredOutput(systemPrompt, userPrompt);
}

async function analyzeImage(base64: string, mimeType: string) {
  const systemPrompt = `You are TRUTHLENS, an expert in detecting AI-generated and manipulated images.
You use advanced visual forensics to determine image authenticity.

DETECTION FRAMEWORK:
1. AI GENERATION ARTIFACTS:
   - Unnatural textures, especially in hair, skin, fabric
   - Distorted hands, fingers, or teeth
   - Inconsistent reflections in eyes or glasses
   - Warped or impossible geometry in backgrounds
   - Text that is blurry or nonsensical

2. MANIPULATION DETECTION:
   - Clone stamping (repeated patterns)
   - Face-swapping artifacts (skin tone mismatches, edge blending)
   - Perspective inconsistencies
   - Lighting/shadow direction conflicts
   - JPEG compression anomalies from editing

3. DEEPFAKE INDICATORS:
   - Facial asymmetry artifacts
   - Unnatural blinking or expressions
   - Boundary blurring around face edges
   - Skin texture inconsistencies

IMPORTANT DISTINCTIONS:
- Artwork, illustrations, graphics, memes, cartoons = NOT FAKE (artistic content)
- Stock photos, professional photography = AUTHENTIC
- "FAKE" = content designed to DECEIVE (deepfakes, manipulated photos passed as real)

VERDICT CRITERIA:
- AUTHENTIC: Natural photograph, no signs of manipulation or AI generation
- SUSPICIOUS: Some artifacts but not conclusive, could be compression or editing
- FAKE: Clear AI generation or deliberate manipulation to deceive`;

  const userPrompt = `Analyze this image for authenticity. Look for AI generation artifacts, manipulation, and deepfake indicators.`;

  return await callAIWithImage(systemPrompt, userPrompt, base64, mimeType);
}

async function analyzeVideo(frames: string[]) {
  if (!frames || frames.length === 0) {
    return {
      verdict: 'suspicious',
      confidence: 30,
      explanation: 'Could not extract frames from video for analysis',
      details: [{ label: 'Frame Extraction', value: 'Failed to extract video frames', type: 'negative' as const }],
      flags: ['Unable to process video frames'],
    };
  }

  const systemPrompt = `You are TRUTHLENS, an expert in deepfake video detection and video forensics.
You analyze video frames for signs of manipulation or AI generation.

TEMPORAL ANALYSIS (across frames):
1. CONSISTENCY CHECKS:
   - Lighting direction consistency across frames
   - Shadow behavior and movement
   - Background stability (no warping or shifting)
   - Object/person size consistency
   
2. DEEPFAKE DETECTION:
   - Face boundary flickering or blurring
   - Skin texture changes between frames
   - Eye reflection inconsistencies
   - Unnatural head/neck movements
   - Expression micro-transitions

3. MANIPULATION ARTIFACTS:
   - Frame splicing (abrupt scene changes)
   - Speed manipulation artifacts
   - Color grading inconsistencies
   - Resolution changes within video

IMPORTANT:
- Animation, CGI, movies, video games = NOT FAKE (entertainment content)
- "FAKE" = deceptive content (deepfakes, manipulated footage presented as real)

Analyze all ${frames.length} frames together for temporal patterns.`;

  const userPrompt = `Analyze these ${frames.length} video frames for deepfake indicators, manipulation, and authenticity. Check for consistency across frames.`;

  return await callAIWithMultipleImages(systemPrompt, userPrompt, frames);
}

async function analyzeDocument(base64: string, fileName: string, mimeType: string) {
  const systemPrompt = `You are TRUTHLENS, an expert in document forensics and authenticity verification.
You detect forged, tampered, and fraudulent documents.

DOCUMENT FORENSICS:
1. STRUCTURAL ANALYSIS:
   - Font consistency throughout document
   - Margin and alignment uniformity
   - Header/footer consistency
   - Page numbering sequence

2. CONTENT AUTHENTICITY:
   - Language consistency and formality
   - Date/timeline logic
   - Reference accuracy
   - Official terminology usage

3. TAMPERING INDICATORS:
   - Text insertion anomalies
   - White-out or redaction artifacts
   - Cut-and-paste evidence
   - Signature inconsistencies
   - Stamp/seal authenticity

4. METADATA CLUES:
   - Creation vs modification dates
   - Author information
   - Software used

VERDICT CRITERIA:
- AUTHENTIC: Consistent formatting, credible content, no tampering signs
- SUSPICIOUS: Some inconsistencies that warrant verification
- FAKE: Clear signs of forgery, tampering, or fraudulent content`;

  const userPrompt = `Analyze this document for authenticity:
File: ${fileName}
Type: ${mimeType}

Check for forgery, tampering, and content credibility.`;

  if (mimeType.includes('pdf') || mimeType.includes('image')) {
    return await callAIWithImage(systemPrompt, userPrompt, base64, mimeType);
  }
  
  try {
    const textContent = atob(base64);
    return await callAIWithStructuredOutput(systemPrompt, userPrompt + `\n\nDocument Content:\n"""\n${textContent.substring(0, 10000)}\n"""`);
  } catch {
    return await callAIWithStructuredOutput(systemPrompt, userPrompt + `\n\nNote: Binary document - analyze based on file metadata and type patterns.`);
  }
}

async function analyzeAudio(base64: string, fileName: string, mimeType: string) {
  const systemPrompt = `You are TRUTHLENS, an expert in audio forensics and voice deepfake detection.
You analyze audio for signs of synthetic voice, cloning, or manipulation.

AUDIO FORENSICS FRAMEWORK:
1. VOICE SYNTHESIS DETECTION:
   - Unnatural prosody patterns
   - Mechanical rhythm in speech
   - Robotic voice artifacts
   - Text-to-speech markers

2. VOICE CLONING INDICATORS:
   - Unusual pronunciation patterns
   - Missing natural voice variations
   - Lack of emotional authenticity
   - Breathing pattern abnormalities

3. AUDIO MANIPULATION:
   - Splice points (abrupt cuts)
   - Background noise inconsistencies
   - Room acoustics changes
   - Compression artifact patterns

4. CONTEXTUAL ANALYSIS:
   - Speaker consistency
   - Audio quality uniformity
   - Environmental sound logic

Note: Provide best assessment based on available audio characteristics.`;

  const userPrompt = `Analyze this audio file for authenticity:
File: ${fileName}
Type: ${mimeType}
Size: ${(base64.length * 0.75 / 1024).toFixed(1)}KB (encoded)

Evaluate for voice synthesis, cloning, and manipulation.`;

  // For audio, we provide metadata analysis since direct audio processing is limited
  return await callAIWithStructuredOutput(systemPrompt, userPrompt);
}

// ============ AI GATEWAY FUNCTIONS ============

async function callAIWithStructuredOutput(systemPrompt: string, userPrompt: string) {
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools: [analysisToolDefinition],
      tool_choice: { type: "function", function: { name: "submit_analysis_result" } }
    }),
  });

  return handleAIResponse(response);
}

async function callAIWithImage(systemPrompt: string, userPrompt: string, base64: string, mimeType: string) {
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
          ]
        }
      ],
      tools: [analysisToolDefinition],
      tool_choice: { type: "function", function: { name: "submit_analysis_result" } }
    }),
  });

  return handleAIResponse(response);
}

async function callAIWithMultipleImages(systemPrompt: string, userPrompt: string, frames: string[]) {
  const imageContent = frames.slice(0, 8).map(frame => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${frame}` }
  }));

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: userPrompt },
            ...imageContent
          ]
        }
      ],
      tools: [analysisToolDefinition],
      tool_choice: { type: "function", function: { name: "submit_analysis_result" } }
    }),
  });

  return handleAIResponse(response);
}

async function handleAIResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TRUTHLENS] AI Gateway error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to continue.');
    }
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Handle tool call response (structured output)
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      const result = JSON.parse(toolCall.function.arguments);
      return validateAndNormalizeResult(result);
    } catch (e) {
      console.error('[TRUTHLENS] Failed to parse tool response:', e);
    }
  }
  
  // Fallback: Try to extract JSON from content
  const content = data.choices?.[0]?.message?.content;
  if (content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return validateAndNormalizeResult(result);
      } catch (e) {
        console.error('[TRUTHLENS] Failed to parse content JSON:', e);
      }
    }
  }
  
  // Ultimate fallback
  return {
    verdict: 'suspicious',
    confidence: 50,
    explanation: 'Analysis completed with limited data. Manual review recommended.',
    details: [{ label: 'Analysis', value: 'Partial results available', type: 'neutral' as const }],
    flags: ['Automated analysis inconclusive']
  };
}

function validateAndNormalizeResult(result: Record<string, unknown>) {
  return {
    verdict: ['authentic', 'suspicious', 'fake'].includes(result.verdict as string) 
      ? result.verdict as string 
      : 'suspicious',
    confidence: typeof result.confidence === 'number' 
      ? Math.max(0, Math.min(100, result.confidence)) 
      : 50,
    explanation: typeof result.explanation === 'string' 
      ? result.explanation 
      : 'Analysis completed.',
    details: Array.isArray(result.details) 
      ? result.details.map((d: Record<string, unknown>) => ({
          label: String(d.label || 'Finding'),
          value: String(d.value || 'N/A'),
          type: ['positive', 'negative', 'neutral'].includes(d.type as string) 
            ? d.type as string 
            : 'neutral'
        }))
      : [],
    flags: Array.isArray(result.flags) 
      ? result.flags.filter((f: unknown): f is string => typeof f === 'string')
      : []
  };
}
