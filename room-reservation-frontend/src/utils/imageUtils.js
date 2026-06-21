const API_URL = 'https://team3.verstack.ru';

/**
 * Получить полный URL изображения
 * @param {string} imageUrl - URL изображения (может быть с /uploads/ или полный)
 * @returns {string} - Полный URL
 */
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // Если это data:image (base64) — возвращаем как есть
  if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Если это уже полный URL (http:// или https://) — возвращаем как есть
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return imageUrl;
  }
  
  // Если это уже начинается с /uploads/ — добавляем API_URL
  if (typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/')) {
    return `${API_URL}${imageUrl}`;
  }
  
  // Иначе — добавляем API_URL и /uploads/
  if (typeof imageUrl === 'string') {
    return `${API_URL}/uploads/${imageUrl}`;
  }
  
  return null;
};

/**
 * Получить главное изображение помещения
 * @param {Array} images - Массив изображений
 * @returns {string|null} - URL главного изображения или null
 */
export const getMainImage = (images) => {
  if (!images || images.length === 0) return null;
  
  // Ищем изображение с position = 0
  const main = images.find(img => img.position === 0);
  if (main) {
    return getFullImageUrl(main.image_data);
  }
  
  // Или берем первое
  return getFullImageUrl(images[0].image_data);
};