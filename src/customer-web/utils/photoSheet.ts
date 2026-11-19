import { PhotoPreset, PhotoCropOptions } from '../types';

export const compositePhotoSheet = async (
  sourceBlob: Blob,
  preset: PhotoPreset,
  crop?: PhotoCropOptions,
  isBw = false,
): Promise<string> => {
  // For standard documents with no special preset or crop, directly read base64
  if (preset === 'standard' && (!crop || (crop.zoom === 1 && crop.panX === 0 && crop.panY === 0 && crop.rotation === 0)) && !isBw) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(sourceBlob);
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(sourceBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        if (preset === 'passport_8up') {
          // Standard 4x6 photo sheet at 300 DPI (1800 x 1200 px)
          canvas.width = 1800;
          canvas.height = 1200;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 8 passport photos in 4 columns x 2 rows
          // Standard Indian/International 35x45mm ratio
          const photoW = 390;
          const photoH = 500;
          const gapX = 35;
          const gapY = 40;
          const startX = Math.floor((canvas.width - (4 * photoW + 3 * gapX)) / 2);
          const startY = Math.floor((canvas.height - (2 * photoH + 1 * gapY)) / 2);

          const zoom = crop?.zoom || 1;
          const panX = ((crop?.panX || 0) / 100) * photoW;
          const panY = ((crop?.panY || 0) / 100) * photoH;
          const rotation = ((crop?.rotation || 0) * Math.PI) / 180;

          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              const x = startX + col * (photoW + gapX);
              const y = startY + row * (photoH + gapY);

              // Cutting guide border
              ctx.strokeStyle = '#cbd5e1';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([6, 6]);
              ctx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);
              ctx.setLineDash([]);

              ctx.save();
              ctx.beginPath();
              ctx.rect(x, y, photoW, photoH);
              ctx.clip();

              ctx.translate(x + photoW / 2 + panX, y + photoH / 2 + panY);
              if (rotation) ctx.rotate(rotation);
              ctx.scale(zoom, zoom);

              const imgAspect = img.width / img.height;
              const targetAspect = photoW / photoH;
              let drawW = photoW;
              let drawH = photoH;
              if (imgAspect > targetAspect) {
                drawH = photoH;
                drawW = photoH * imgAspect;
              } else {
                drawW = photoW;
                drawH = photoW / imgAspect;
              }

              ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
              ctx.restore();
            }
          }

          if (isBw) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              d[i] = gray;
              d[i + 1] = gray;
              d[i + 2] = gray;
            }
            ctx.putImageData(imgData, 0, 0);
          }

          resolve(canvas.toDataURL('image/jpeg', 0.94));
        } else if (preset === 'photo_4x6') {
          canvas.width = 1800;
          canvas.height = 1200;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const zoom = crop?.zoom || 1;
          const panX = ((crop?.panX || 0) / 100) * canvas.width;
          const panY = ((crop?.panY || 0) / 100) * canvas.height;
          const rotation = ((crop?.rotation || 0) * Math.PI) / 180;

          ctx.save();
          ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
          if (rotation) ctx.rotate(rotation);
          ctx.scale(zoom, zoom);

          const imgAspect = img.width / img.height;
          const targetAspect = canvas.width / canvas.height;
          let drawW = canvas.width;
          let drawH = canvas.height;
          if (imgAspect > targetAspect) {
            drawH = canvas.height;
            drawW = canvas.height * imgAspect;
          } else {
            drawW = canvas.width;
            drawH = canvas.width / imgAspect;
          }

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();

          if (isBw) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              d[i] = gray;
              d[i + 1] = gray;
              d[i + 2] = gray;
            }
            ctx.putImageData(imgData, 0, 0);
          }

          resolve(canvas.toDataURL('image/jpeg', 0.94));
        } else if (preset === 'id_card') {
          canvas.width = 1240;
          canvas.height = 1754;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const cardW = 600;
          const cardH = 380;
          const gapY = 70;
          const startX = (canvas.width - cardW) / 2;
          const startY = (canvas.height - (2 * cardH + gapY)) / 2;

          for (let i = 0; i < 2; i++) {
            const y = startY + i * (cardH + gapY);
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(startX - 2, y - 2, cardW + 4, cardH + 4);
            ctx.setLineDash([]);

            ctx.save();
            ctx.beginPath();
            ctx.rect(startX, y, cardW, cardH);
            ctx.clip();
            ctx.translate(startX + cardW / 2, y + cardH / 2);
            ctx.drawImage(img, -cardW / 2, -cardH / 2, cardW, cardH);
            ctx.restore();
          }

          if (isBw) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              d[i] = gray;
              d[i + 1] = gray;
              d[i + 2] = gray;
            }
            ctx.putImageData(imgData, 0, 0);
          }

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(sourceBlob);
        }
      } catch (err) {
        console.warn('Photo sheet rendering error:', err);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(sourceBlob);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });
};

