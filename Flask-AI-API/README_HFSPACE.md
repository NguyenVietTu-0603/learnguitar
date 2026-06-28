---
title: Guitar Tablature Detection API
emoji: 🎸
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 5001
pinned: false
license: mit
---

# Guitar Tablature Detection API

Flask + YOLOv8 service that detects fret numbers in guitar tablature images.

- **POST** `/api/tab/detect` — upload an image, get bounding boxes + class names
- **POST** `/api/tab/render` — render detected tablature back as ASCII
- **GET**  `/health` — health check
- **GET**  `/` — service info

See `Flask-AI-API/README.md` in the upstream repo for the full API.