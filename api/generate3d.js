export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { image } = req.body;
  const TOKEN = process.env.REPLICATE_TOKEN;

  if (!TOKEN) {
    return res.status(500).json({ error: 'REPLICATE_TOKEN not configured' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'e0d3fe8abce3ba86497ea3530d9eae59af7b2231b6c82bedfc32b0732d35ec3a',
        input: {
          image: image,
          do_remove_background: true,
          foreground_ratio: 0.85
        }
      })
    });

    const data = await response.json();
    console.log('Replicate raw response:', JSON.stringify(data));
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}