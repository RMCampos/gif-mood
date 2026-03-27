import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePostDto } from '../dtos/post.dto';

async function hasValidationErrors(payload: unknown): Promise<boolean> {
  const dto = plainToInstance(CreatePostDto, payload);
  const errors = await validate(dto);
  return errors.length > 0;
}

test('CreatePostDto accepts expected media URLs and upload paths', async () => {
  const validPayloads = [
    { gifUrl: 'https://media.giphy.com/media/abc123/giphy.gif', source: 'SEARCH' },
    { gifUrl: 'https://cdn.example.com/clip.webp?size=large#view', source: 'URL' },
    { gifUrl: 'https://images.example.com/photo.jpeg', source: 'URL' },
    { gifUrl: '/uploads/user-uuid-file.png', source: 'UPLOAD' },
  ];

  for (const payload of validPayloads) {
    const hasErrors = await hasValidationErrors(payload);
    assert.equal(hasErrors, false, `Expected payload to be valid: ${JSON.stringify(payload)}`);
  }
});

test('CreatePostDto rejects unsupported media URLs and malformed upload paths', async () => {
  const invalidPayloads = [
    { gifUrl: 'https://example.com/file.mp4', source: 'URL' },
    { gifUrl: 'https://example.com/no-extension', source: 'URL' },
    { gifUrl: '/uploads/user-uuid-file', source: 'UPLOAD' },
    { gifUrl: '/static/user-uuid-file.gif', source: 'UPLOAD' },
  ];

  for (const payload of invalidPayloads) {
    const hasErrors = await hasValidationErrors(payload);
    assert.equal(hasErrors, true, `Expected payload to be invalid: ${JSON.stringify(payload)}`);
  }
});
