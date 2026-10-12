// 🪐 Tribbu'sVibe - Cofrinho de Mídias (Storage)
// Arquivo: firebase-storage.js

export async function redimensionarEComprimirImagem(arquivoOuDataUrl, maxDim = 1080, qualidade = 0.72) {
  if (typeof arquivoOuDataUrl === 'string' && (arquivoOuDataUrl.startsWith('http://') || arquivoOuDataUrl.startsWith('https://'))) {
    return arquivoOuDataUrl;
  }

  let srcDataUrl = '';
  if (typeof arquivoOuDataUrl === 'string') {
    srcDataUrl = arquivoOuDataUrl;
  } else {
    srcDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(arquivoOuDataUrl);
    });
  }

  if (srcDataUrl.length < 300000 && typeof arquivoOuDataUrl !== 'object') {
    return srcDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(srcDataUrl);
        return;
      }

      ctx.fillStyle = '#000000';
      ctx.drawImage(img, 0, 0, width, height);

      let resultado = canvas.toDataURL('image/jpeg', qualidade);

      if (resultado.length > 650000) {
        const canvasMenor = document.createElement('canvas');
        canvasMenor.width = Math.round(width * 0.75);
        canvasMenor.height = Math.round(height * 0.75);
        const ctxMenor = canvasMenor.getContext('2d');
        if (ctxMenor) {
          ctxMenor.drawImage(img, 0, 0, canvasMenor.width, canvasMenor.height);
          resultado = canvasMenor.toDataURL('image/jpeg', 0.6);
        }
      }

      resolve(resultado);
    };

    img.onerror = () => {
      console.warn('Erro ao carregar imagem para compressão, mantendo original.');
      resolve(srcDataUrl);
    };

    img.src = srcDataUrl;
  });
}

export async function fazerUploadDeFoto(arquivoOuUrl) {
  if (typeof arquivoOuUrl === 'string') {
    if (arquivoOuUrl.startsWith('data:image')) {
      return redimensionarEComprimirImagem(arquivoOuUrl);
    }
    return arquivoOuUrl;
  }
  return redimensionarEComprimirImagem(arquivoOuUrl);
}

export async function fazerUploadDeAudio(audioBlob) {
  if (typeof audioBlob === 'string') {
    return audioBlob;
  }
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Erro ao processar upload de áudio:', error);
      reject(error);
    }
  });
}
