# MinIO Storage Layout

## Buckets
- `raw-uploads`: original user uploads
- `generated`: AI output images

## Object key format
```
user/{user_id}/generations/{generation_id}/input.jpg
user/{user_id}/generations/{generation_id}/output.jpg
```

## Metadata to store in Postgres
- `bucket`, `object_key`, `mime`, `size_bytes`, `width`, `height`
- `generation_id`, `kind` (input/output)

## Access pattern
- Backend issues presigned URLs for upload/download.
- Frontend never accesses MinIO directly without a presigned URL.
- URLs should expire quickly (5 to 15 minutes).
