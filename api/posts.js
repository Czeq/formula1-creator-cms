// Vercel Serverless Function: /api/posts
// Handles Post History persistence and image asset upload to Supabase Storage & Database

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bnhbebhffosechglrlhf.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, apikey'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured on server' });
  }

  try {
    // GET: Retrieve all post history from Supabase
    if (req.method === 'GET') {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const posts = await response.json();
      return res.status(200).json({ posts });
    }

    // POST: Upload image to Supabase Storage and insert post record into database
    if (req.method === 'POST') {
      const {
        title,
        caption,
        imageDataUrl,
        scheduled_at,
        status = 'scheduled',
        target_platforms = ['instagram']
      } = req.body || {};

      let publicUrl = '';
      let storagePath = `ready/f1bd_${Date.now()}.jpg`;

      // 1. If high-res data URL is supplied, upload directly to Supabase Storage 'graphics' bucket
      if (imageDataUrl && imageDataUrl.startsWith('data:image/')) {
        const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `f1bd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/graphics/${fileName}`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'image/jpeg'
          },
          body: imageBuffer
        });

        if (uploadRes.ok) {
          storagePath = `graphics/${fileName}`;
          publicUrl = `${SUPABASE_URL}/storage/v1/object/public/graphics/${fileName}`;
        } else {
          const uploadErr = await uploadRes.text();
          console.warn('Storage upload error (fallback to local dataUrl):', uploadErr);
        }
      }

      // 2. Insert into Supabase table 'posts'
      const postPayload = {
        title: title || 'UNTITLED FORMULA 1 BD GRAPHIC',
        caption: caption || '',
        image_storage_path: storagePath,
        image_public_url: publicUrl || (imageDataUrl ? imageDataUrl.substring(0, 300) : ''),
        scheduled_at: scheduled_at || new Date().toISOString(),
        status: status,
        target_platforms: target_platforms
      };

      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(postPayload)
      });

      if (!dbRes.ok) {
        const dbErr = await dbRes.text();
        return res.status(500).json({ error: dbErr, savedPublicUrl: publicUrl });
      }

      const inserted = await dbRes.json();
      return res.status(201).json({
        success: true,
        post: inserted[0] || inserted,
        publicUrl: publicUrl
      });
    }

    // DELETE: Delete a post from Supabase
    if (req.method === 'DELETE') {
      const id = req.query.id || (req.body && req.body.id);
      if (!id) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });

      if (!delRes.ok) {
        const delErr = await delRes.text();
        return res.status(500).json({ error: delErr });
      }

      return res.status(200).json({ success: true, message: `Post ${id} removed` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
