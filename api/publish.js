// Vercel Serverless Function: /api/publish
// Performs REAL Meta Instagram Graph API publication for @formula1.bd

const FALLBACK_SUPABASE_URL = "https://bnhbebhffosechglrlhf.supabase.co";
const FALLBACK_B64_KEY = "c2Jfc2VjcmV0XzY3bXJTSkRhSjRSVmxzS0NYZjdDbFFfR01fNGE0OFI=";
const FALLBACK_B64_META = "RUFBVTJ6c0tLNmVjQlNrSlpDbGRLRWlQVEhsNXhCWkFMb2llV1RhZlBIRzh2YWlvd3RJZjlSNERaQmJTR3V5bDlJaU1MbG9tS2Z5SlBBMk9lYkVVMEExdzBuSjgwOWdFMWk0bWhQWW52UU9TR2ZUamxISlpDZ3VaQUFVZzZwMVRjWkFUeTBaQkhIWVBiTEdHYnlaQThHQnpzQVVHeDZaQm1lRlNQUng2NHRJaDZEY1JFNFNVamhFRjl6SEJOU1cxdW9PUlpDSWVoQ1pCOW9QYUdleVlaQnVaQ1FQRlJGdlhKS1JteENVbEdWRk1XNHNzWFpBcmIydVpBUkM4cFRjM2luWkF4V3djWkJVUzRaQlpDZ1dkbVE3U1pDVFhGVThBVFpDU1hnRXRROVVhSVpE";
const FALLBACK_IG_USER_ID = "17841463802855850";

function getMetaToken() {
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;
  try {
    return Buffer.from(FALLBACK_B64_META, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function getSupabaseKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    return Buffer.from(FALLBACK_B64_KEY, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const logs = [];
  const log = (msg) => {
    logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  try {
    const {
      title,
      caption,
      imageDataUrl,
      imagePublicUrl,
      userToken,
      igUserId
    } = req.body || {};

    const token = userToken || getMetaToken();
    const targetIgId = igUserId || process.env.IG_USER_ID || FALLBACK_IG_USER_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseKey = getSupabaseKey();

    if (!token) {
      return res.status(400).json({ error: 'Missing Meta Access Token' });
    }

    log(`Initializing live publishing for @formula1.bd (IG User ID: ${targetIgId})`);

    // STEP 1: Ensure image is hosted on a public HTTPS URL accessible to Meta
    let publicUrl = imagePublicUrl;

    if (!publicUrl || !publicUrl.startsWith('http')) {
      if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Missing image data or public image URL' });
      }

      log('Uploading master graphic to Supabase Storage public bucket (graphics)...');
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const fileName = `f1bd_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/graphics/${fileName}`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'image/jpeg'
        },
        body: imageBuffer
      });

      if (!uploadRes.ok) {
        const upErr = await uploadRes.text();
        throw new Error(`Failed to upload image to Supabase: ${upErr}`);
      }

      publicUrl = `${supabaseUrl}/storage/v1/object/public/graphics/${fileName}`;
      log(`Image publicly available for Meta crawler: ${publicUrl}`);
    } else {
      log(`Using verified public image URL: ${publicUrl}`);
    }

    // STEP 2: Create Media Container via Meta Graph API v21.0
    log(`Calling Graph API: POST https://graph.facebook.com/v21.0/${targetIgId}/media`);
    const containerParams = new URLSearchParams({
      image_url: publicUrl,
      caption: caption || title || 'Formula 1 BD Update',
      access_token: token
    });

    const containerRes = await fetch(`https://graph.facebook.com/v21.0/${targetIgId}/media`, {
      method: 'POST',
      body: containerParams
    });

    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      throw new Error(
        `Meta Container Creation Failed: ${containerData?.error?.message || JSON.stringify(containerData)}`
      );
    }

    const containerId = containerData.id;
    log(`Media container created successfully. Container ID: ${containerId}`);

    // STEP 3: Poll Container Status until FINISHED
    log(`Polling container ${containerId} status...`);
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 12;

    while (attempts < maxAttempts && status !== 'FINISHED') {
      attempts++;
      await new Promise((r) => setTimeout(r, 1500));

      const statusRes = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${token}`
      );
      const statusData = await statusRes.json();
      status = statusData.status_code || 'UNKNOWN';
      log(`[Poll #${attempts}] Container status: ${status}`);

      if (status === 'ERROR') {
        throw new Error(`Meta media container processing failed with status ERROR: ${JSON.stringify(statusData)}`);
      }
      if (status === 'FINISHED') break;
    }

    if (status !== 'FINISHED') {
      throw new Error(`Container processing timed out after ${maxAttempts} attempts.`);
    }

    // STEP 4: Publish Container to Instagram Feed
    log(`Publishing container to @formula1.bd feed: POST /v21.0/${targetIgId}/media_publish`);
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: token
    });

    const publishRes = await fetch(`https://graph.facebook.com/v21.0/${targetIgId}/media_publish`, {
      method: 'POST',
      body: publishParams
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      throw new Error(
        `Meta Media Publish Failed: ${publishData?.error?.message || JSON.stringify(publishData)}`
      );
    }

    const mediaId = publishData.id;
    log(`🎉 Successfully published live to Instagram! Media ID: ${mediaId}`);

    // STEP 5: Retrieve Post Permalink
    let permalink = `https://instagram.com/formula1.bd`;
    try {
      const mediaInfoRes = await fetch(
        `https://graph.facebook.com/v21.0/${mediaId}?fields=permalink,timestamp&access_token=${token}`
      );
      if (mediaInfoRes.ok) {
        const mediaInfo = await mediaInfoRes.json();
        if (mediaInfo.permalink) {
          permalink = mediaInfo.permalink;
          log(`Instagram Live Post URL: ${permalink}`);
        }
      }
    } catch (e) {
      console.warn('Permalink fetch error:', e);
    }

    return res.status(200).json({
      success: true,
      mediaId: mediaId,
      permalink: permalink,
      containerId: containerId,
      publicImageUrl: publicUrl,
      logs: logs
    });
  } catch (err) {
    log(`[ERROR] ${err.message}`);
    return res.status(500).json({
      success: false,
      error: err.message,
      logs: logs
    });
  }
}
