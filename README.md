# hapi-upload-api

Minimal Hapi server with a presigned S3 upload endpoint suitable for direct-to-S3 browser uploads (via HTML form or XHR/fetch).

## Endpoints
- `GET /healthz` → `{ ok: true }`
- `POST /uploads/presign` (JSON body)
  ```json
  { "filename": "photo.png", "contentType": "image/png" }
