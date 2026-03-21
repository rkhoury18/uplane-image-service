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
      if (response.status === 402) {
        throw new Error('Background removal is temporarily unavailable — the free remove.bg credits have been used up.');
      }
      let message = 'Could not remove the background from this image.';
      try {
        const body = await response.json();
        const title = body?.errors?.[0]?.title as string | undefined;
        if (title) message = title;
      } catch {
        // ignore parse errors, use default message
      }
      throw new Error(message);
    }
  
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }