import { Injectable } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  async uploadSlip(base64Image: string, bucCode: string): Promise<string> {
    const dataUri = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`

    const result = await cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'winwin/slips',
        public_id: `slip_${bucCode}_${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      }
    )
    return result.secure_url
  }
}
