const { Meilisearch } = require('meilisearch');

const client = new Meilisearch({
  host: process.env.MEILISEARCH_HOST, // Your Meilisearch Cloud URL
  apiKey: process.env.MEILISEARCH_API_KEY // Your Meilisearch Admin Key
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const payload = req.body;
    const entry = payload.data.entry;
    const contentType = payload.content_type.uid;
    const event = payload.event; // "entry.publish", "entry.unpublish", "entry.delete"

    const index = client.index(contentType);

    if (event === 'entry.publish') {
      // Map Contentstack's nested fields to a clean Meilisearch document
      const document = {
        id: entry.uid, // Contentstack's unique identifier mapped to Meilisearch 'id'
        title: entry.title,
        url: entry.url,
        description: entry.description || '', 
        updated_at: entry.updated_at
      };

      await index.addDocuments([document]);
      return res.status(200).json({ message: 'Successfully indexed entry.' });
    } 
    
    if (event === 'entry.unpublish' || event === 'entry.delete') {
      await index.deleteDocument(entry.uid);
      return res.status(200).json({ message: 'Successfully deleted entry.' });
    }

    res.status(200).send('Event skipped.');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};