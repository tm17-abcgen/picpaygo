# MinIO Storage

## Access Pattern

Images are served through the API proxy endpoint at `/api/images/{bucket}/{key}`.

**How it works:**
1. Frontend requests image via proxy URL (e.g., `/api/images/raw-uploads/raw%2Fabc123%2Finput.jpg`)
2. API verifies the user owns the generation
3. API fetches from MinIO internally (using `minio:9000`)
4. API streams the image to the browser with correct content-type

**Benefits:**
- No `/etc/hosts` configuration required
- Works the same on macOS, Linux, and Windows
- Ownership is enforced server-side
- No presigned URL signature issues

---

## Storage Layout

### Buckets
- `raw-uploads`: original user uploads
- `generated`: AI output images

### Object key format
```
raw/{generation_id}/input.jpg
generated/{generation_id}/output.png
```

### Metadata to store in Postgres
- `bucket`, `object_key`, `content_type`, `bytes`
- `generation_id`, `kind` (input/output)
