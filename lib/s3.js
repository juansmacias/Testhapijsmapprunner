import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1'
  // Credentials:
  // - In production on App Runner, prefer an instance role.
  // - For local: use environment or AWS_PROFILE (~/.aws/credentials).
});

export async function presignUpload({ bucket, key, contentType, maxBytes, expiresSec = 600 }) {
  const keyPrefix = (process.env.UPLOAD_KEY_PREFIX || 'uploads') + '/';

  // Create a presigned POST with server-side-encryption enforced.
  // Conditions:
  //  - content-length-range up to maxBytes
  //  - exact Content-Type
  //  - key must start with the configured prefix
  //  - x-amz-server-side-encryption must be AES256
  const result = await createPresignedPost(client, {
    Bucket: bucket,
    Key: key,
    Expires: expiresSec,
    Fields: {
      'Content-Type': contentType,
      'x-amz-server-side-encryption': 'AES256'
    },
    Conditions: [
      ['content-length-range', 0, maxBytes],
      ['eq', '$Content-Type', contentType],
      ['starts-with', '$key', keyPrefix],
      ['eq', '$x-amz-server-side-encryption', 'AES256']
    ]
  });

  return result;
}
