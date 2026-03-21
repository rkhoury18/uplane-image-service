export async function removeBackground(inputBuffer: Buffer): Promise<Buffer> {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      throw new Error('Missing REMOVE_BG_API_KEY');
    }
  
    const formData = new FormData();
    const bytes = new Uint8Array(inputBuffer);
    formData.append(
      'image_file',
      new Blob([bytes], { type: 'application/octet-stream' }),
      'upload.png'
    );
    formData.append('size', 'auto');
  
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`remove.bg failed: ${response.status} ${errorText}`);
    }
  
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }