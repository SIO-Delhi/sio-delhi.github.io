
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates that the file is an image and is under the size limit.
 * Throws an error if invalid.
 */
export function validateImage(file: File): void {
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Image size must be less than 5MB');
    }
}

/**
 * Compresses an image file by converting it to WebP with 0.8 quality.
 */
export async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                'image/webp',
                0.8
            );
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };

        img.src = url;
    });
}
