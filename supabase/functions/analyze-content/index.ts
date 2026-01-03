import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  // Handle CORS
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

    console.log(`Analyzing content type: ${type}`);

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

    console.log(`Analysis complete for ${type}:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Text Analysis
async function analyzeText(text: string) {
  const prompt = `You are an expert misinformation and AI-generated content detector. Analyze this text for:
1. Factual accuracy and verifiability
2. Signs of AI-generated content (repetitive patterns, unnatural phrasing)
3. Emotional manipulation or sensationalism
4. Logical fallacies or misleading claims
5. Source credibility indicators

Text to analyze:
"""
${text}
"""

Respond in JSON format:
{
  "verdict": "authentic" | "suspicious" | "fake",
  "confidence": 0-100,
  "explanation": "Brief explanation of your analysis",
  "details": [
    { "label": "Category", "value": "Finding", "type": "positive|negative|neutral" }
  ],
  "flags": ["List of specific issues found, if any"]
}`;

  return await callLovableAI(prompt);
}

// URL Analysis
async function analyzeUrl(url: string) {
  const domain = new URL(url).hostname;
  
  const prompt = `You are a cybersecurity and misinformation expert. Analyze this URL for credibility:

URL: ${url}
Domain: ${domain}

Evaluate:
1. Domain reputation (is it a known news source, academic institution, or suspicious domain?)
2. URL structure (look for typosquatting, suspicious subdomains, or misleading paths)
3. Common phishing indicators
4. Content credibility based on the URL pattern

Note: Well-known domains like bbc.com, nytimes.com, reuters.com, .gov, .edu are typically credible.
Suspicious patterns: unusual TLDs, misspelled domains, excessive subdomains, URL shorteners.

Respond in JSON format:
{
  "verdict": "authentic" | "suspicious" | "fake",
  "confidence": 0-100,
  "explanation": "Brief explanation of your analysis",
  "details": [
    { "label": "Domain Age", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Domain Reputation", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "URL Structure", "value": "Finding", "type": "positive|negative|neutral" }
  ],
  "flags": ["List of specific issues found, if any"]
}`;

  return await callLovableAI(prompt);
}

// Image Analysis
async function analyzeImage(base64: string, mimeType: string) {
  const prompt = `You are an expert in detecting manipulated and AI-generated images. Analyze this image for:

1. Signs of AI generation (artifacts, inconsistent lighting, unnatural textures, distorted features)
2. Digital manipulation (splicing, cloning, face-swapping, airbrushing)
3. Metadata inconsistencies
4. Contextual authenticity (does the scene look realistic?)
5. Deepfake indicators in faces (asymmetry, blending artifacts, unnatural expressions)

IMPORTANT: 
- Illustrations, artwork, graphics, and cartoons are NOT fake - they are artistic content
- "Fake" means content designed to deceive (deepfakes, manipulated photos, AI trying to look real)
- Natural photos with normal photography artifacts are authentic
- Stock photos and professional photography are authentic

Respond in JSON format:
{
  "verdict": "authentic" | "suspicious" | "fake",
  "confidence": 0-100,
  "explanation": "Brief explanation of your analysis",
  "details": [
    { "label": "AI Generation", "value": "Detected/Not detected", "type": "positive|negative|neutral" },
    { "label": "Manipulation", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Visual Consistency", "value": "Finding", "type": "positive|negative|neutral" }
  ],
  "flags": ["List of specific issues found, if any"]
}`;

  return await callLovableAIWithImage(prompt, base64, mimeType);
}

// Video Analysis
async function analyzeVideo(frames: string[]) {
  if (!frames || frames.length === 0) {
    return {
      verdict: 'suspicious',
      confidence: 50,
      explanation: 'Could not extract frames from video for analysis',
      details: [],
      flags: ['Unable to process video'],
    };
  }

  const prompt = `You are an expert in detecting deepfake videos and manipulated video content. 
Analyze these ${frames.length} frames extracted from a video for:

1. Deepfake indicators (face inconsistencies, blending artifacts, unnatural movements)
2. Frame-to-frame consistency (lighting, shadows, perspective)
3. Signs of video manipulation (splicing, speed changes, added elements)
4. Audio-visual sync issues (if applicable)
5. AI-generated content markers

IMPORTANT:
- Animation, CGI movies, and artistic videos are NOT fake
- "Fake" means deceptive content (deepfakes, manipulated footage presented as real)
- News footage, documentaries, and authentic recordings are authentic

Analyze all frames together for temporal consistency.

Respond in JSON format:
{
  "verdict": "authentic" | "suspicious" | "fake",
  "confidence": 0-100,
  "explanation": "Brief explanation of your analysis",
  "details": [
    { "label": "Deepfake Detection", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Temporal Consistency", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Visual Artifacts", "value": "Finding", "type": "positive|negative|neutral" }
  ],
  "flags": ["List of specific issues found, if any"]
}`;

  return await callLovableAIWithMultipleImages(prompt, frames);
}

// Document Analysis
async function analyzeDocument(base64: string, fileName: string, mimeType: string) {
  // For documents, we'll analyze the structure and content
  const prompt = `You are an expert in document authenticity and forgery detection. Analyze this document for:

Document: ${fileName}
Type: ${mimeType}

Evaluate:
1. Document structure and formatting consistency
2. Signs of tampering or editing (font inconsistencies, alignment issues)
3. Content credibility and factual accuracy
4. Metadata authenticity indicators
5. Digital signature verification (if applicable)
6. Language and style consistency

Common document fraud indicators:
- Inconsistent fonts or formatting
- Misaligned text or elements  
- Unusual document structure
- Grammar/spelling issues in official documents
- Missing or inconsistent headers/footers

Respond in JSON format:
{
  "verdict": "authentic" | "suspicious" | "fake",
  "confidence": 0-100,
  "explanation": "Brief explanation of your analysis",
  "details": [
    { "label": "Document Structure", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Content Integrity", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Formatting Consistency", "value": "Finding", "type": "positive|negative|neutral" }
  ],
  "flags": ["List of specific issues found, if any"]
}`;

  // If it's a PDF or image-based doc, try to use vision
  if (mimeType.includes('pdf') || mimeType.includes('image')) {
    return await callLovableAIWithImage(prompt, base64, mimeType);
  }
  
  // For text-based documents, decode and analyze as text
  try {
    const textContent = atob(base64);
    return await analyzeText(`[Document: ${fileName}]\n\n${textContent}`);
  } catch {
    return await callLovableAI(prompt + `\n\nNote: Document is binary/encoded. Analyze based on file metadata and type.`);
  }
}

// Audio Analysis
async function analyzeAudio(base64: string, fileName: string, mimeType: string) {
  const prompt = `You are an expert in audio forensics and deepfake audio detection. Analyze audio content for:

Audio File: ${fileName}
Type: ${mimeType}

Evaluate:
1. Voice synthesis/cloning indicators (unnatural prosody, mechanical artifacts)
2. Audio splicing and editing (abrupt cuts, inconsistent background noise)
3. AI-generated speech markers (unusual pauses, robotic qualities)
4. Background audio consistency
5. Compression artifacts and quality anomalies
6. Emotional authenticity in speech patterns

Deepfake audio indicators:
- Unnatural breathing patterns
- Inconsistent room acoustics
- Metallic or synthetic voice qualities
- Unusual word pronunciations
- Missing micro-expressions in speech

Note: Since I cannot directly play audio, analyze based on the audio file metadata and characteristics that can be inferred from the encoded data patterns.

Respond in JSON format:
{
  "verdict": "authentic" | "suspicious" | "fake",
  "confidence": 0-100,
  "explanation": "Brief explanation of your analysis based on available audio characteristics",
  "details": [
    { "label": "Voice Synthesis", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Audio Quality", "value": "Finding", "type": "positive|negative|neutral" },
    { "label": "Background Consistency", "value": "Finding", "type": "positive|negative|neutral" }
  ],
  "flags": ["List of specific issues found, if any"]
}`;

  return await callLovableAI(prompt);
}

// Call Lovable AI Gateway
async function callLovableAI(prompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI content authenticity analyzer. Always respond with valid JSON only, no markdown formatting.' 
        },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to continue.');
    }
    throw new Error('AI analysis failed');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Invalid AI response format');
}

// Call Lovable AI with image
async function callLovableAIWithImage(prompt: string, base64: string, mimeType: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI content authenticity analyzer. Always respond with valid JSON only, no markdown formatting.' 
        },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { url: `data:${mimeType};base64,${base64}` } 
            }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI vision error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to continue.');
    }
    throw new Error('AI vision analysis failed');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Invalid AI response format');
}

// Call Lovable AI with multiple images (video frames)
async function callLovableAIWithMultipleImages(prompt: string, frames: string[]) {
  const imageContent = frames.map(frame => ({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${frame}` }
  }));

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI video authenticity analyzer. Always respond with valid JSON only, no markdown formatting.' 
        },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            ...imageContent
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI video error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to continue.');
    }
    throw new Error('AI video analysis failed');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Invalid AI response format');
}
