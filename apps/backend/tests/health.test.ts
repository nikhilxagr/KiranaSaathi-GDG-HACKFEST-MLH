import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Phase 3: Backend API, Health Endpoints, and Middleware', () => {
  // Test 1: GET /api/health returns 200 and healthy JSON response
  it('1. GET /api/health returns 200 and consistent healthy status JSON', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'kiranasathi-backend');
    expect(res.body).toHaveProperty('appName', 'KiranaSathi');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  // Test 2: GET /api/health/ready returns 200 and readiness status
  it('2. GET /api/health/ready returns 200 and readiness confirmation', async () => {
    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('ready', true);
    expect(res.body).toHaveProperty('service', 'kiranasathi-backend');
    expect(res.body).toHaveProperty('timestamp');
  });

  // Test 2b: GET /api/health/db returns structured db connectivity without leaking secrets
  it('2b. GET /api/health/db returns structured connectivity without credentials', async () => {
    const res = await request(app).get('/api/health/db');

    // May be 200 (connected) or 503 (offline fallback during isolated unit tests)
    expect([200, 503]).toContain(res.status);
    expect(typeof res.body.connected).toBe('boolean');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('readyState');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('stack');
  });

  // Test 3: Root discovery endpoint
  it('3. GET / returns 200 with service discovery metadata', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('healthCheck', '/api/health');
    expect(res.body).toHaveProperty('dbHealthCheck', '/api/health/db');
    expect(res.body).toHaveProperty('readinessCheck', '/api/health/ready');
  });

  // Test 4: Unknown routes return 404 with consistent error format
  it('4. Unknown API routes return 404 with consistent error message', async () => {
    const res = await request(app).get('/api/non-existent-route-404');


    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toContain('Route not found');
  });

  // Test 5: Malformed JSON receives a safe 400 Bad Request error response
  it('5. Malformed JSON receives safe 400 error without leaking stack traces', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken_json": ');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toMatch(/Invalid JSON payload/i);
    expect(res.body).not.toHaveProperty('stack');
  });

  // Test 6: CORS allows configured origin
  it('6. CORS allows configured frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  // Test 7: CORS rejects unauthorized origin
  it('7. CORS blocks unauthorized external origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://unauthorized-attacker.example.com');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toContain('CORS blocked');
  });
});
